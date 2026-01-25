console.log('place_menu.js загружен');

let mode = "intro";
let isAnimating = false;
let touchStartX = null;
let touchStartY = null;
let isHorizontalSwipe = false;
const SWIPE_THRESHOLD = 50;

// =============================================================================
// СИСТЕМА ОЧИСТКИ (для SPA)
// =============================================================================

const cleanupRegistry = {
    handlers: [],
    observers: [],
    timeouts: [],
    
    add(handler) {
        this.handlers.push(handler);
    },
    
    clear() {
        this.handlers.forEach(fn => {
            try { fn(); } catch(e) { console.error('Cleanup error:', e); }
        });
        this.handlers = [];
        
        this.observers.forEach(obs => {
            try { obs.disconnect(); } catch(e) {}
        });
        this.observers = [];
        
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
        
        console.log('🧹 Cleanup выполнен');
    },
    
    setTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        this.timeouts.push(id);
        return id;
    },
    
    observe(observer) {
        this.observers.push(observer);
    }
};

// =============================================================================
// МИНИМАЛЬНАЯ ПРОВЕРКА БРАУЗЕРА
// =============================================================================

function isYandexBrowser() {
    return /YaBrowser/i.test(navigator.userAgent);
}

// =============================================================================
// АВТОМАТИЧЕСКАЯ КОРРЕКЦИЯ ОБРЕЗАНИЙ ДЛЯ МОБИЛЬНЫХ
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
        const updatePadding = () => {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const uiHeight = Math.max(0, windowHeight - viewportHeight);
            
            if (uiHeight > 0) {
                screen.style.paddingBottom = (uiHeight + 20) + 'px';
            } else {
                screen.style.paddingBottom = '0px';
            }
        };
        
        updatePadding();
        
        window.visualViewport.addEventListener('resize', updatePadding);
        cleanupRegistry.add(() => {
            window.visualViewport.removeEventListener('resize', updatePadding);
        });
        
        window.addEventListener('orientationchange', () => {
            const timeoutId = setTimeout(updatePadding, 100);
            cleanupRegistry.timeouts.push(timeoutId);
        });
        
        console.log('📱 Android: активен динамический фолбек');
        return true;
    }
    
    screen.style.paddingBottom = '60px';
    console.log('📱 Применен фиксированный padding-bottom = 60px');
    return true;
}

// =============================================================================
// УПРАВЛЕНИЕ ВИДИМОСТЬЮ КНОПОК НАВИГАЦИИ
// =============================================================================

function updateNavigationVisibility() {
    if (window.innerWidth <= 1080) return;

    const navArrows = document.querySelectorAll('.temple-nav-arrow, .nav-arrow, .arrow');
    const isMenuOpen = (mode === "details");

    navArrows.forEach(btn => {
        btn.style.transition = 'opacity 0.3s ease, visibility 0.3s';
        
        if (isMenuOpen) {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        } else {
            btn.style.opacity = '';
            btn.style.pointerEvents = 'auto';
        }
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
    
    if (newMode === 'details') {
        sessionStorage.setItem('menuState', 'open');
    } else if (newMode === 'intro') {
        sessionStorage.setItem('menuState', 'closed');
    }

    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const videoPoster = document.getElementById('videoPoster');
    const scrollZone = document.getElementById('scrollZone');
    const addressDrop = document.getElementById('addressDrop');
    const usefulDrop = document.getElementById('usefulDrop');
    
    // !!! ИСПРАВЛЕНИЕ: Применяем стили с !important для гарантии !!!
    if (videoPoster) {
        videoPoster.style.setProperty('background', (newMode === 'details') ? 'white' : 'transparent', 'important');
        videoPoster.style.setProperty('display', (newMode === 'details') ? 'block' : 'none', 'important');
    }
    
    if (bgVideo) {
        bgVideo.style.setProperty('filter', (newMode === 'details') ? 'blur(5px)' : 'none', 'important');
    }
    
    if (mode === "details") {
        frame?.classList.remove("mode-intro");
        frame?.classList.add("mode-details");
        
        scrollZone?.classList.add('animating');
        
        if (bgVideo) bgVideo.pause();
        
        if (expandUseful && usefulDrop) {
            cleanupRegistry.setTimeout(() => {
                usefulDrop.classList.add("open");
                sessionStorage.setItem('usefulDropdownState', 'open');
            }, 600);
        }
        
        cleanupRegistry.setTimeout(() => {
            scrollZone?.classList.remove('animating');
            isAnimating = false;
        }, 1000);
    } else {
        frame?.classList.remove("mode-details");
        frame?.classList.add("mode-intro");
        
        scrollZone?.classList.add('animating');
        
        if (bgVideo) {
            bgVideo.pause(); 
            requestAnimationFrame(() => {
                if (mode === 'intro') bgVideo.play().catch(() => {});
            });
        }
        
        smoothScrollTo(0, 700);
        if (addressDrop) addressDrop.classList.remove("open");
        if (usefulDrop) usefulDrop.classList.remove("open");
        sessionStorage.removeItem('usefulDropdownState');
        
        cleanupRegistry.setTimeout(() => {
            scrollZone?.classList.remove('animating');
            isAnimating = false;
        }, 500);
    }

    updateNavigationVisibility();
    
    cleanupRegistry.setTimeout(() => {
        if (window.updateNavArrows) {
            window.updateNavArrows();
        }
    }, 50);
}

function smoothScrollTo(targetY, duration = 700) {
    const scrollZone = document.getElementById('scrollZone');
    if (!scrollZone) return;
    
    const startY = scrollZone.scrollTop;
    const distance = targetY - startY;
    const startTime = performance.now();
    
    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeInOut(t);
        scrollZone.scrollTop = startY + distance * eased;
        if (t < 1) requestAnimationFrame(step);
    }
    
    requestAnimationFrame(step);
}

// =============================================================================
// НОВАЯ ФУНКЦИЯ: ОХРАНА ВИДЕО ОТ ЯНДЕКС БРАУЗЕРА
// =============================================================================

function setupVideoGuards() {
    const bgVideo = document.getElementById('bgVideo');
    if (!bgVideo) return;

    const guardPlay = () => {
        if (mode === 'details') {
            console.log('🛡️ Попытка автозапуска в режиме "details" -> ПАУЗА');
            bgVideo.pause();
        }
    };

    bgVideo.addEventListener('play', guardPlay);
    cleanupRegistry.add(() => bgVideo.removeEventListener('play', guardPlay));
}

// =============================================================================
// ОБРАБОТЧИКИ СВАЙПОВ И СКРОЛЛА (с возможностью очистки)
// =============================================================================

function setupSwipeHandlers() {
    const scrollZone = document.getElementById('scrollZone');
    if (!scrollZone) return;
    
    let isSwipeInProgress = false;
    let initialScrollTop = 0;
    
    function onTouchStart(e) {
        if (isAnimating || window.spaRouter?.isAnimating) return;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isHorizontalSwipe = false;
        isSwipeInProgress = false;
        initialScrollTop = scrollZone.scrollTop;
    }
    
    function onTouchMove(e) {
        if (!touchStartX || !touchStartY || isAnimating || window.spaRouter?.isAnimating) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - touchStartX;
        const deltaY = touchY - touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
            isHorizontalSwipe = true;
            isSwipeInProgress = true;
            
            if (e.cancelable) e.preventDefault();
        }
        
        if (mode === "details" && deltaY > 0 && !isHorizontalSwipe && initialScrollTop <= 0) {
            if (e.cancelable) e.preventDefault();
        }
    }
    
    function onTouchEnd(e) {
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
    }
    
    function onWheel(e) {
        if (isAnimating) {
            if (e.cancelable) e.preventDefault();
            return;
        }
        
        if (mode === "intro" && e.deltaY > 10) {
            if (e.cancelable) e.preventDefault();
            setMode("details");
        } else if (mode === "details" && scrollZone.scrollTop <= 0 && e.deltaY < -10) {
            if (e.cancelable) e.preventDefault();
            setMode("intro");
        }
    }
    
    scrollZone.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollZone.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollZone.addEventListener("touchend", onTouchEnd, { passive: false });
    scrollZone.addEventListener("wheel", onWheel, { passive: false });
    
    cleanupRegistry.add(() => {
        scrollZone.removeEventListener("touchstart", onTouchStart);
        scrollZone.removeEventListener("touchmove", onTouchMove);
        scrollZone.removeEventListener("touchend", onTouchEnd);
        scrollZone.removeEventListener("wheel", onWheel);
    });
}

// =============================================================================
// ДРОПДАУНЫ И КНОПКИ
// =============================================================================

function initializeDropdownsAndButtons() {
    console.log('📋 Инициализация дропдаунов и кнопок...');
    
    const paidBtn = document.getElementById('paidBtn');
    const addressDrop = document.getElementById('addressDrop');
    const usefulDrop = document.getElementById('usefulDrop');
    const entryNote = document.querySelector(".entry-note");
    
    function createDropdownHandler(dropdown) {
        return function(e) {
            e.stopPropagation();
            if (isAnimating) return;
            dropdown.classList.toggle("open");
            console.log('Дропдаун:', dropdown.id, dropdown.classList.contains('open') ? 'открыт' : 'закрыт');
        };
    }
    
    if (addressDrop) {
        const arrow = addressDrop.querySelector(".dropdown-arrow");
        if (arrow) {
            const handler = createDropdownHandler(addressDrop);
            arrow.addEventListener("click", handler);
            cleanupRegistry.add(() => arrow.removeEventListener("click", handler));
        }
    }
    
    if (usefulDrop) {
        const arrow = usefulDrop.querySelector(".dropdown-arrow");
        if (arrow) {
            const handler = createDropdownHandler(usefulDrop);
            arrow.addEventListener("click", handler);
            cleanupRegistry.add(() => arrow.removeEventListener("click", handler));
        }
    }
    
    const globalClickHandler = function(e) {
        if (!e.target.closest('.dropdown')) {
            if (addressDrop) addressDrop.classList.remove("open");
            if (usefulDrop) usefulDrop.classList.remove("open");
        }
    };
    
    document.addEventListener('click', globalClickHandler);
    cleanupRegistry.add(() => document.removeEventListener('click', globalClickHandler));
    
    if (paidBtn) {
        const paidHandler = () => {
            console.log('Клик на paidBtn');
            setMode("details", { expandUseful: true });
        };
        paidBtn.addEventListener('click', paidHandler);
        cleanupRegistry.add(() => paidBtn.removeEventListener('click', paidHandler));
    }
    
    if (entryNote) {
        const entryHandler = (e) => {
            if (!e.target.closest("#paidBtn")) {
                console.log('Клик на entryNote');
                setMode("details", { expandUseful: true });
            }
        };
        entryNote.addEventListener('click', entryHandler);
        cleanupRegistry.add(() => entryNote.removeEventListener('click', entryHandler));
    }
}

// =============================================================================
// КЛАВИАТУРА (для ПК)
// =============================================================================

function setupKeyboardHandlers() {
    function onKeyDown(e) {
        if (e.key === 'Escape' && mode === 'details') {
            setMode('intro');
        }
    }
    
    document.addEventListener('keydown', onKeyDown);
    cleanupRegistry.add(() => document.removeEventListener('keydown', onKeyDown));
}

// =============================================================================
// ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// =============================================================================

window.initializeMenu = function() {
    console.log('🔄 Инициализация меню...');
    
    cleanupRegistry.clear();
    isAnimating = false;
    
    if (isYandexBrowser()) {
        document.body.classList.add('yandex-browser');
        console.log('🔧 Обнаружен Яндекс.Браузер');
    }
    
    correctMobileUI();
    
    const savedMenuState = sessionStorage.getItem('menuState');
    const shouldOpenMenu = savedMenuState === 'open';
    mode = shouldOpenMenu ? "details" : "intro";
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const videoPoster = document.getElementById('videoPoster');
    const scrollZone = document.getElementById('scrollZone');
    const usefulDrop = document.getElementById('usefulDrop');
    
    // Применение начального состояния без анимации
    if (shouldOpenMenu) {
        document.body.classList.add('no-transition');
        
        const elementsToDisable = [
            frame, 
            bgVideo, 
            scrollZone,
            document.querySelector('.title-block'),
            document.querySelector('.hero-details'),
            document.getElementById('dropdownsContainer'),
            document.querySelector('.entry-note'),
            document.getElementById('paidBtn'),
            videoPoster  // Добавлен videoPoster
        ].filter(el => el);
        
        elementsToDisable.forEach(el => {
            el.style.setProperty('transition', 'none', 'important');
            el.style.setProperty('animation', 'none', 'important');
        });
        
        cleanupRegistry.setTimeout(() => {
            elementsToDisable.forEach(el => {
                el.style.removeProperty('transition');
                el.style.removeProperty('animation');
            });
            document.body.classList.remove('no-transition');
        }, 10);
    }
    
    // Применение классов и стилей
    if (frame) {
        if (shouldOpenMenu) {
            frame.classList.remove('mode-intro');
            frame.classList.add('mode-details');
        } else {
            frame.classList.remove('mode-details');
            frame.classList.add('mode-intro');
        }
    }
    
    if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.setAttribute('muted', '');
        bgVideo.setAttribute('playsinline', '');
        // !!! ИСПРАВЛЕНИЕ: Устанавливаем blur с !important !!!
        bgVideo.style.setProperty('filter', shouldOpenMenu ? 'blur(5px)' : 'none', 'important');
        
        if (shouldOpenMenu) {
            bgVideo.pause();
            if (isYandexBrowser()) {
                const currentTime = bgVideo.currentTime;
                bgVideo.currentTime = 0;
                bgVideo.currentTime = currentTime;
            }
            console.log('⏸️ Видео на паузе (меню открыто)');
        } else {
            cleanupRegistry.setTimeout(() => bgVideo.play().catch(() => {}), 100);
        }
    }
    
    // !!! КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Белый фон при открытом меню !!!
    if (videoPoster) {
        // Используем setProperty с !important для гарантированного применения
        videoPoster.style.setProperty('background', shouldOpenMenu ? 'white' : 'transparent', 'important');
        videoPoster.style.setProperty('display', shouldOpenMenu ? 'block' : 'none', 'important');
        
        // Принудительный reflow для мгновенного применения стилей
        void videoPoster.offsetHeight;
        
        console.log('🎨 VideoPoster:', shouldOpenMenu ? 'БЕЛЫЙ ФОН ВКЛЮЧЕН' : 'прозрачный');
    } else {
        console.error('❌ Элемент #videoPoster не найден!');
    }
    
    if (scrollZone) {
        scrollZone.scrollTop = 0;
        scrollZone.style.pointerEvents = "auto";
    }
    
    const savedDropdownState = sessionStorage.getItem('usefulDropdownState');
    if (savedDropdownState === 'open' && usefulDrop) {
        usefulDrop.classList.add("open");
    } else {
        if (usefulDrop) usefulDrop.classList.remove("open");
    }
    
    initializeDropdownsAndButtons();
    setupSwipeHandlers();
    setupKeyboardHandlers();
    setupVideoGuards();
    updateNavigationVisibility();
    
    console.log('✅ Меню инициализировано', shouldOpenMenu ? '(с открытым меню, белый фон активен)' : '(с закрытым меню)');
};

// =============================================================================
// SPA ИНТЕГРАЦИЯ
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('place_menu.js: DOMContentLoaded');
    cleanupRegistry.setTimeout(window.initializeMenu, 50);
});

const spaObserver = new MutationObserver((mutations) => {
    const frame = document.getElementById('frame');
    if (frame && !frame.dataset.menuInitialized) {
        frame.dataset.menuInitialized = 'true';
        console.log('🔄 Обнаружена смена контента (SPA), переинициализируем меню');
        window.initializeMenu();
    }
});

spaObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
});

cleanupRegistry.observe(spaObserver);

const originalPushState = history.pushState;
history.pushState = function(...args) {
    originalPushState.apply(this, args);
    console.log('🔄 History pushState detected');
    cleanupRegistry.setTimeout(window.initializeMenu, 100);
};

const originalReplaceState = history.replaceState;
history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    cleanupRegistry.setTimeout(window.initializeMenu, 100);
};

window.addEventListener('popstate', () => {
    console.log('🔄 Popstate event');
    cleanupRegistry.setTimeout(window.initializeMenu, 100);
});

if (window.spaRouter) {
    if (window.spaRouter.navigate) {
        const originalNavigate = window.spaRouter.navigate;
        window.spaRouter.navigate = function(...args) {
            const result = originalNavigate.apply(this, args);
            cleanupRegistry.setTimeout(window.initializeMenu, 150);
            return result;
        };
    }
    
    if (window.spaRouter.on) {
        window.spaRouter.on('pageChange', () => {
            cleanupRegistry.setTimeout(window.initializeMenu, 100);
        });
    }
}

window.reinitMenu = function() {
    console.log('🔄 Ручная переинициализация меню');
    window.initializeMenu();
};

console.log('✅ place_menu.js полностью загружен');
