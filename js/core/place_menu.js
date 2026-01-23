console.log('place_menu.js загружен');

let mode = "intro";
let isAnimating = false;
let touchStartX = null;
let touchStartY = null;
let isHorizontalSwipe = false;
const SWIPE_THRESHOLD = 50;

// =============================================================================
// МИНИМАЛЬНАЯ ПРОВЕРКА БРАУЗЕРА (ТОЛЬКО ДЛЯ ЯНДЕКСА)
// =============================================================================

function isYandexBrowser() {
    return /YaBrowser/i.test(navigator.userAgent);
}

// =============================================================================
// АВТОМАТИЧЕСКАЯ КОРРЕКЦИЯ ОБРЕЗАНИЙ ДЛЯ ВСЕХ МОБИЛЬНЫХ БРАУЗЕРОВ
// =============================================================================

function correctMobileUI() {
    if (window.innerWidth > 1080) return false;
    
    const screen = document.querySelector('.screen');
    if (!screen) return false;
    
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
        screen.style.paddingBottom = 'env(safe-area-inset-bottom, 20px)';
        console.log('📱 iOS: применен env() для коррекции Safe Area');
        return true;
    }
    
    if (window.visualViewport) {
        function updatePadding() {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const uiHeight = Math.max(0, windowHeight - viewportHeight);
            screen.style.paddingBottom = (uiHeight > 0 ? (uiHeight + 20) + 'px' : '0px');
        }
        
        updatePadding();
        window.visualViewport.addEventListener('resize', updatePadding);
        window.addEventListener('orientationchange', () => setTimeout(updatePadding, 100));
        console.log('📱 Android: активен динамический фолбек');
        return true;
    }
    
    screen.style.paddingBottom = '60px';
    console.log('📱 Применен фиксированный padding-bottom = 60px');
    return true;
}

// =============================================================================
// УПРАВЛЕНИЕ ВИДИМОСТЬЮ КНОПОК НАВИГАЦИИ (ПК)
// =============================================================================

function updateNavigationVisibility() {
    if (window.innerWidth <= 1080) return;
    const navArrows = document.querySelectorAll('.temple-nav-arrow, .nav-arrow, .arrow');
    const isMenuOpen = (mode === "details");

    navArrows.forEach(btn => {
        btn.style.transition = 'opacity 0.3s ease, visibility 0.3s';
        btn.style.opacity = isMenuOpen ? '0' : '';
        btn.style.pointerEvents = isMenuOpen ? 'none' : 'auto';
    });
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
    const videoPoster = document.getElementById('videoPoster');
    const scrollZone = document.getElementById('scrollZone');
    const addressDrop = document.getElementById('addressDrop');
    const usefulDrop = document.getElementById('usefulDrop');
    
    if (videoPoster) {
        videoPoster.style.background = (newMode === 'details') ? 'white' : 'transparent';
        videoPoster.style.display = (newMode === 'details') ? 'block' : 'none';
    }
    
    if (bgVideo) {
        bgVideo.style.filter = (newMode === 'details') ? 'blur(5px)' : 'none';
    }
    
    if (mode === "details") {
        frame.classList.remove("mode-intro");
        frame.classList.add("mode-details");
        scrollZone.classList.add('animating');
        if (bgVideo) bgVideo.pause();
        
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
            // При возврате в интро пытаемся запустить видео
            bgVideo.play().catch(e => console.log("⚠️ Play error on mode switch:", e));
        }
        
        smoothScrollTo(0, 700);
        if (addressDrop) addressDrop.classList.remove("open");
        if (usefulDrop) usefulDrop.classList.remove("open");
        sessionStorage.removeItem('usefulDropdownState');
        
        setTimeout(() => {
            scrollZone.classList.remove('animating');
            isAnimating = false;
        }, 500);
    }

    updateNavigationVisibility();
    setTimeout(() => {
        if (window.updateNavArrows) window.updateNavArrows();
    }, 50);
}

function smoothScrollTo(targetY, duration = 700) {
    const scrollZone = document.getElementById('scrollZone');
    if (!scrollZone) return;
    const startY = scrollZone.scrollTop;
    const distance = targetY - startY;
    const startTime = performance.now();
    
    function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        scrollZone.scrollTop = startY + distance * (t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

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
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
            isHorizontalSwipe = true;
            isSwipeInProgress = true;
            if (e.cancelable) e.preventDefault();
        }
        if (mode === "details" && deltaY > 0 && !isHorizontalSwipe && initialScrollTop <= 0) {
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    scrollZone.addEventListener("touchend", (e) => {
        if (!touchStartX || !touchStartY || isAnimating || window.spaRouter?.isAnimating) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
        
        if (mode === "details" && deltaY > 30 && isVerticalSwipe && !isHorizontalSwipe) {
            const scrollTop = scrollZone.scrollTop;
            if (scrollTop <= 0 || touchStartY < window.innerHeight * 0.25) {
                if (e.cancelable) e.preventDefault();
                setMode("intro");
            }
        } else if (mode === "intro" && deltaY < -30 && isVerticalSwipe && !isHorizontalSwipe) {
            if (e.cancelable) e.preventDefault();
            setMode("details");
        } else if (isHorizontalSwipe && Math.abs(deltaX) > SWIPE_THRESHOLD && isSwipeInProgress) {
            e.preventDefault();
            const order = getCurrentPageOrder(window.spaRouter?.currentCategory);
            if (order.length > 1) {
                deltaX > 0 ? navigateToPrevPlace() : navigateToNextPlace();
            }
        }
        touchStartX = null;
        touchStartY = null;
        isHorizontalSwipe = false;
        isSwipeInProgress = false;
    }, { passive: false });

    scrollZone.addEventListener("wheel", (e) => {
        if (isAnimating) { if (e.cancelable) e.preventDefault(); return; }
        if (mode === "intro" && e.deltaY > 10) {
            if (e.cancelable) e.preventDefault(); setMode("details");
        } else if (mode === "details" && scrollZone.scrollTop <= 0 && e.deltaY < -10) {
            if (e.cancelable) e.preventDefault(); setMode("intro");
        }
    }, { passive: false });
}

function setupKeyboardHandlers() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        switch(e.key) {
            case 'ArrowLeft': e.preventDefault(); navigateToPrevPlace(); break;
            case 'ArrowRight': e.preventDefault(); navigateToNextPlace(); break;
            case 'Escape': if (mode === "details") { e.preventDefault(); setMode("intro"); } break;
        }
    });
}

function initializeDropdownsAndButtons() {
    const paidBtn = document.getElementById('paidBtn');
    const addressDrop = document.getElementById('addressDrop');
    const usefulDrop = document.getElementById('usefulDrop');
    const entryNote = document.querySelector(".entry-note");
    
    [addressDrop, usefulDrop].forEach(drop => {
        if (!drop) return;
        const arrow = drop.querySelector(".dropdown-arrow");
        if (arrow) {
            const newArrow = arrow.cloneNode(true);
            arrow.parentNode.replaceChild(newArrow, arrow);
            newArrow.addEventListener("click", (e) => {
                e.stopPropagation();
                if (isAnimating) return;
                drop.classList.toggle("open");
            });
        }
    });
    
    if (!window.dropdownClickHandlerAdded) {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                if (addressDrop) addressDrop.classList.remove("open");
                if (usefulDrop) usefulDrop.classList.remove("open");
            }
        });
        window.dropdownClickHandlerAdded = true;
    }
    
    if (paidBtn) paidBtn.onclick = () => setMode("details", { expandUseful: true });
    if (entryNote) entryNote.onclick = (e) => {
        if (!e.target.closest("#paidBtn")) setMode("details", { expandUseful: true });
    };
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МЕНЮ
// =============================================================================

window.initializeMenu = function() {
    console.log('🔄 Инициализация меню...');
    
    if (isYandexBrowser()) document.body.classList.add('yandex-browser');
    correctMobileUI();
    
    const savedMenuState = sessionStorage.getItem('menuState');
    const shouldOpenMenu = savedMenuState === 'open';
    
    mode = shouldOpenMenu ? "details" : "intro";
    isAnimating = false;
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const scrollZone = document.getElementById('scrollZone');
    const usefulDrop = document.getElementById('usefulDrop');
    const videoPoster = document.getElementById('videoPoster');
    
    // Убираем анимации при первом рендере для плавности
    if (shouldOpenMenu) {
        document.body.classList.add('no-transition');
        const els = [frame, bgVideo, scrollZone, document.querySelector('.title-block'), document.querySelector('.hero-details'), document.getElementById('dropdownsContainer'), document.querySelector('.entry-note'), document.getElementById('paidBtn')].filter(Boolean);
        els.forEach(el => el.style.cssText = 'transition: none !important; animation: none !important;');
        setTimeout(() => { els.forEach(el => el.style.cssText = ''); document.body.classList.remove('no-transition'); }, 10);
    }
    
    if (frame) frame.className = `container mode-${mode}`;
    
    // === НОВАЯ УНИВЕРСАЛЬНАЯ ЛОГИКА ВИДЕО ===
    if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.setAttribute('muted', '');
        bgVideo.setAttribute('playsinline', '');
        bgVideo.setAttribute('webkit-playsinline', '');
        bgVideo.style.filter = shouldOpenMenu ? 'blur(5px)' : 'none';

        // Функция попытки запуска (используется и при инициализации, и при смене слайдов)
        const attemptPlay = () => {
            if (mode !== "intro") {
                // Если мы в режиме деталей (меню открыто), видео должно быть на паузе
                bgVideo.pause();
                return;
            }
            if (!bgVideo.currentSrc && !bgVideo.src) return; // Нет источника

            const playPromise = bgVideo.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => console.log('✅ Video autoplay started'))
                    .catch(err => console.warn('⚠️ Autoplay blocked:', err.name));
            }
        };

        // Глобальный слушатель загрузки данных (Срабатывает ПРИ КАЖДОМ смене src)
        // УБРАЛИ { once: true }, чтобы работало при навигации между местами
        bgVideo.addEventListener('loadeddata', () => {
            console.log('📦 Video data loaded, state:', mode);
            attemptPlay();
        });

        // Попытка запустить сразу, если видео уже было в кэше браузера
        if (bgVideo.readyState >= 2) attemptPlay();
    }
    
    if (videoPoster) {
        videoPoster.style.background = shouldOpenMenu ? 'white' : 'transparent';
        videoPoster.style.display = shouldOpenMenu ? 'block' : 'none';
    }
    
    if (scrollZone) {
        scrollZone.scrollTop = 0;
        scrollZone.style.pointerEvents = "auto";
    }
    
    if (sessionStorage.getItem('usefulDropdownState') === 'open' && usefulDrop) usefulDrop.classList.add("open");
    
    initializeDropdownsAndButtons();
    setupSwipeHandlers();
    setupKeyboardHandlers();
    updateNavigationVisibility();
    
    setTimeout(() => {
        sessionStorage.removeItem('menuState');
        sessionStorage.removeItem('usefulDropdownState');
    }, 100);
    
    console.log('✅ Меню инициализировано');
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { window.initializeMenu(); }, 50);
});
