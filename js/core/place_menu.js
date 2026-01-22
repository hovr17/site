console.log('place_menu.js загружен');

let mode = "intro";
let isAnimating = false;
let touchStartX = null;
let touchStartY = null;
let isHorizontalSwipe = false;
const SWIPE_THRESHOLD = 50;

// =============================================================================
// МИНИМАЛЬНАЯ ПРОВЕРКА ЯНДЕКС.БРАУЗЕРА (ТОЛЬКО ДЛЯ МОБИЛЬНЫХ)
// =============================================================================

function isYandexBrowser() {
    return /YaBrowser/i.test(navigator.userAgent);
}

// =============================================================================
// ОСНОВНАЯ ЛОГИКА МЕНЮ
// =============================================================================

function setMode(newMode, { expandUseful = false } = {}) {
    if (mode === newMode || isAnimating) return;
    
    console.log('Смена режима с', mode, 'на', newMode);
    isAnimating = true;
    mode = newMode;
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const scrollZone = document.getElementById('scrollZone');
    const usefulDrop = document.getElementById('usefulDrop');
    
    if (bgVideo) {
        bgVideo.style.filter = (newMode === 'details') ? 'blur(5px)' : 'none';
    }
    
    if (mode === "details") {
        frame.classList.remove("mode-intro");
        frame.classList.add("mode-details");
        
        scrollZone.classList.add('animating');
        
        if (bgVideo) {
            bgVideo.pause();
        }
        
        if (expandUseful && usefulDrop) {
            setTimeout(() => {
                usefulDrop.classList.add("open");
                sessionStorage.setItem('usefulDropdownState', 'open');
            }, 600);
        }
        
        setTimeout(() => {
            scrollZone.classList.remove('animating');
            isAnimating = false;
        }, 1000);
    } else {
        frame.classList.remove("mode-details");
        frame.classList.add("mode-intro");
        
        scrollZone.classList.add('animating');
        
        if (bgVideo) {
            bgVideo.play();
        }
        
        scrollZone.scrollTop = 0;
        if (usefulDrop) usefulDrop.classList.remove("open");
        sessionStorage.removeItem('usefulDropdownState');
        
        setTimeout(() => {
            scrollZone.classList.remove('animating');
            isAnimating = false;
        }, 500);
    }
    
    setTimeout(() => {
        if (window.updateNavArrows) {
            window.updateNavArrows();
        }
    }, 50);
}

// =============================================================================
// ОБРАБОТКА СВАЙПОВ
// =============================================================================

function setupSwipeHandlers() {
    const scrollZone = document.getElementById('scrollZone');
    if (!scrollZone) return;
    
    let isSwipeInProgress = false;
    let initialScrollTop = 0;
    
    scrollZone.addEventListener("touchstart", (e) => {
        if (isAnimating || window.spaRouter?.isAnimating) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isHorizontalSwipe = false;
        isSwipeInProgress = false;
        initialScrollTop = scrollZone.scrollTop;
    }, { passive: true });

    scrollZone.addEventListener("touchmove", (e) => {
        if (!touchStartX || !touchStartY || isAnimating || window.spaRouter?.isAnimating) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
            isHorizontalSwipe = true;
            isSwipeInProgress = true;
            
            if (e.cancelable) {
                e.preventDefault();
            }
        }
        
        if (mode === "details" && deltaY > 0 && !isHorizontalSwipe && initialScrollTop <= 0) {
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    scrollZone.addEventListener("touchend", (e) => {
        if (!touchStartX || !touchStartY || isAnimating || window.spaRouter?.isAnimating) return;
        
        const touchX = e.changedTouches[0].clientX;
        const touchY = e.changedTouches[0].clientY;
        
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
        
        if (mode === "details" && deltaY > 30 && isVerticalSwipe && !isHorizontalSwipe) {
            const scrollTop = scrollZone.scrollTop;
            const swipeStartedAtTop = touchStartY < window.innerHeight * 0.25;
            
            if (scrollTop <= 0 || swipeStartedAtTop) {
                if (e.cancelable) e.preventDefault();
                setMode("intro");
                console.log('⬇️ Свайп вниз - закрытие меню');
            }
        } else if (mode === "intro" && deltaY < -30 && isVerticalSwipe && !isHorizontalSwipe) {
            if (e.cancelable) e.preventDefault();
            setMode("details");
            console.log('⬆️ Свайп вверх - открытие меню');
        } else if (isHorizontalSwipe && Math.abs(deltaX) > SWIPE_THRESHOLD && isSwipeInProgress) {
            e.preventDefault();
            
            const order = getCurrentPageOrder(window.spaRouter?.currentCategory);
            if (order.length <= 1) {
                console.log('🎯 В категории только одна страница, свайп не работает');
                touchStartX = null;
                touchStartY = null;
                isHorizontalSwipe = false;
                isSwipeInProgress = false;
                return;
            }
            
            if (deltaX > 0) {
                console.log('➡️ Свайп вправо, переход к предыдущей странице');
                navigateToPrevPlace();
            } else {
                console.log('⬅️ Свайп влево, переход к следующей странице');
                navigateToNextPlace();
            }
        }
        
        touchStartX = null;
        touchStartY = null;
        isHorizontalSwipe = false;
        isSwipeInProgress = false;
    }, { passive: false });
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('place_menu.js: DOMContentLoaded');
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    
    // === ПРОВЕРКА ЯНДЕКС.БРАУЗЕРА ТОЛЬКО ДЛЯ МОБИЛЬНЫХ ===
    if (isYandexBrowser() && window.innerWidth <= 767) {
        document.body.classList.add('yandex-browser');
        console.log('🔧 Обнаружен Яндекс.Браузер на мобильном, применен подъем элементов');
    }
    
    // Восстановление состояния
    const savedMenuState = sessionStorage.getItem('menuState');
    const shouldOpenMenu = savedMenuState === 'open';
    
    if (frame) {
        if (shouldOpenMenu) {
            frame.classList.add('mode-details');
        } else {
            frame.classList.add('mode-intro');
        }
    }
    
    if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.setAttribute('muted', '');
        bgVideo.setAttribute('playsinline', '');
        
        if (shouldOpenMenu) {
            bgVideo.pause();
        } else {
            setTimeout(() => bgVideo.play().catch(() => {}), 100);
        }
    }
    
    // Очистка sessionStorage
    sessionStorage.removeItem('menuState');
    sessionStorage.removeItem('usefulDropdownState');
    
    // Инициализация функционала
    initializeDropdownsAndButtons();
    setupSwipeHandlers();
    
    console.log('✅ Меню инициализировано', shouldOpenMenu ? '(с открытым меню)' : '(с закрытым меню)');
});

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ ДРОПДАУНОВ И КНОПОК
// =============================================================================

function initializeDropdownsAndButtons() {
    console.log('📋 Инициализация дропдаунов и кнопок...');
    
    const paidBtn = document.getElementById('paidBtn');
    const addressDrop = document.getElementById('addressDrop');
    const usefulDrop = document.getElementById('usefulDrop');
    const entryNote = document.querySelector(".entry-note");
    
    if (addressDrop) {
        const arrow = addressDrop.querySelector(".dropdown-arrow");
        if (arrow) {
            const newArrow = arrow.cloneNode(true);
            arrow.parentNode.replaceChild(newArrow, arrow);
            
            newArrow.addEventListener("click", (e) => {
                e.stopPropagation();
                addressDrop.classList.toggle("open");
                console.log('Дропдаун Адрес:', addressDrop.classList.contains('open') ? 'открыт' : 'закрыт');
            });
        }
    }
    
    if (usefulDrop) {
        const arrow = usefulDrop.querySelector(".dropdown-arrow");
        if (arrow) {
            const newArrow = arrow.cloneNode(true);
            arrow.parentNode.replaceChild(newArrow, arrow);
            
            newArrow.addEventListener("click", (e) => {
                e.stopPropagation();
                usefulDrop.classList.toggle("open");
                console.log('Дропдаун Полезное:', usefulDrop.classList.contains('open') ? 'открыт' : 'закрыт');
            });
        }
    }
    
    if (!window.dropdownClickHandlerAdded) {
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                if (addressDrop) addressDrop.classList.remove("open");
                if (usefulDrop) usefulDrop.classList.remove("open");
            }
        });
        window.dropdownClickHandlerAdded = true;
    }
    
    if (paidBtn) {
        paidBtn.onclick = () => {
            console.log('Клик на paidBtn, вызываем setMode с expandUseful: true');
            setMode("details", { expandUseful: true });
        };
    }
    
    if (entryNote) {
        entryNote.onclick = (e) => {
            if (!e.target.closest("#paidBtn")) {
                console.log('Клик на entryNote, вызываем setMode с expandUseful: true');
                setMode("details", { expandUseful: true });
            }
        };
    }
}

// =============================================================================
// ПУСТЫЕ ЗАГЛУШКИ ДЛЯ СОВМЕСТИМОСТИ
// =============================================================================

