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
        // Удаляем обработчики
        this.handlers.forEach(fn => {
            try { fn(); } catch(e) { console.error('Cleanup error:', e); }
        });
        this.handlers = [];
        
        // Отключаем наблюдатели
        this.observers.forEach(obs => {
            try { obs.disconnect(); } catch(e) {}
        });
        this.observers = [];
        
        // Очищаем таймауты
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
        
        if (bgVideo) bgVideo.play();
        
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
// ОБРАБОТЧИКИ СВАЙПОВ И СКРОЛЛА (с возможностью очистки)
// =============================================================================

function setupSwipeHandlers() {
    const scrollZone = document.getElementById('scrollZone');
    if (!scrollZone) return;
    
    let isSwipeInProgress = false;
    let initialScrollTop = 0;
    
    // Именованные функции для возможности удаления
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
    
    // Добавляем обработчики
    scrollZone.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollZone.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollZone.addEventListener("touchend", onTouchEnd, { passive: false });
    scrollZone.addEventListener("wheel", onWheel, { passive: false });
    
    // Регистрируем для очистки
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
    
    // Обработчики для дропдаунов
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
    
    // Глобальный обработчик клика для закрытия дропдаунов
    const globalClickHandler = function(e) {
        if (!e.target.closest('.dropdown')) {
            if (addressDrop) addressDrop.classList.remove("open");
            if (usefulDrop) usefulDrop.classList.remove("open");
        }
    };
    
    document.addEventListener('click', globalClickHandler);
    cleanupRegistry.add(() => document.removeEventListener('click', globalClickHandler));
    
    // Кнопки
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
    
    // Очищаем предыдущие обработчики (критично для SPA!)
    cleanupRegistry.clear();
    
    // Сбрасываем состояние
    isAnimating = false;
    
    // Проверка Яндекс.Браузера
    if (isYandexBrowser()) {
        document.body.classList.add('yandex-browser');
        console.log('🔧 Обнаружен Яндекс.Браузер');
    }
    
    // Коррекция UI для мобильных
    correctMobileUI();
    
    // Восстановление состояния из sessionStorage
    const savedMenuState = sessionStorage.getItem('menuState');
    const shouldOpenMenu = savedMenuState === 'open';
    
    mode = shouldOpenMenu ? "details" : "intro";
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const scrollZone = document.getElementById('scrollZone');
    const usefulDrop = document.getElementById('usefulDrop');
    const videoPoster = document.getElementById('videoPoster');
    
    // Применение начального состояния без анимации
    if (shouldOpenMenu) {
        document.body.classList.add('no-transition');
        
        const elementsToDisable = [
            frame, bgVideo, scrollZone,
            document.querySelector('.title-block'),
            document.querySelector('.hero-details'),
            document.getElementById('dropdownsContainer'),
            document.querySelector('.entry-note'),
            paidBtn
        ].filter(el => el);
        
        elementsToDisable.forEach(el => {
            el.style.transition = 'none !important';
            el.style.animation = 'none !important';
        });
        
        cleanupRegistry.setTimeout(() => {
            elementsToDisable.forEach(el => {
                el.style.transition = '';
                el.style.animation = '';
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
        bgVideo.style.filter = shouldOpenMenu ? 'blur(5px)' : 'none';
        
        if (shouldOpenMenu) {
            bgVideo.pause();
        } else {
            cleanupRegistry.setTimeout(() => bgVideo.play().catch(() => {}), 100);
        }
    }
    
    if (videoPoster) {
        videoPoster.style.background = shouldOpenMenu ? 'white' : 'transparent';
        videoPoster.style.display = shouldOpenMenu ? 'block' : 'none';
    }
    
    if (scrollZone) {
        scrollZone.scrollTop = 0;
        scrollZone.style.pointerEvents = "auto";
    }
    
    // Восстановление состояния дропдауна
    const savedDropdownState = sessionStorage.getItem('usefulDropdownState');
    if (savedDropdownState === 'open' && usefulDrop) {
        usefulDrop.classList.add("open");
    } else {
        if (usefulDrop) usefulDrop.classList.remove("open");
    }
    
    // Инициализация компонентов
    initializeDropdownsAndButtons();
    setupSwipeHandlers();
    setupKeyboardHandlers();
    updateNavigationVisibility();
    
    // Очистка sessionStorage после восстановления
    cleanupRegistry.setTimeout(() => {
        sessionStorage.removeItem('menuState');
        sessionStorage.removeItem('usefulDropdownState');
    }, 100);
    
    console.log('✅ Меню инициализировано', shouldOpenMenu ? '(с открытым меню)' : '(с закрытым меню)');
};

// =============================================================================
// SPA ИНТЕГРАЦИЯ (критично для работы переходов!)
// =============================================================================

// 1. Первоначальная загрузка
document.addEventListener('DOMContentLoaded', () => {
    console.log('place_menu.js: DOMContentLoaded');
    cleanupRegistry.setTimeout(window.initializeMenu, 50);
});

// 2. Наблюдатель за изменениями DOM (для SPA роутеров, которые заменяют контент)
const spaObserver = new MutationObserver((mutations) => {
    // Проверяем, появился ли новый frame (основной контейнер)
    const frame = document.getElementById('frame');
    if (frame && !frame.dataset.menuInitialized) {
        frame.dataset.menuInitialized = 'true';
        console.log('🔄 Обнаружена смена контента (SPA), переинициализируем меню');
        window.initializeMenu();
    }
});

// Запускаем наблюдение
spaObserver.observe(document.body, { 
    childList: true, 
    subtree: true 
});

// Сохраняем ссылку для возможной очистки
cleanupRegistry.observe(spaObserver);

// 3. Интеграция с History API (если роутер использует pushState)
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

// 4. Обработка popstate (кнопки назад/вперед)
window.addEventListener('popstate', () => {
    console.log('🔄 Popstate event');
    cleanupRegistry.setTimeout(window.initializeMenu, 100);
});

// 5. Интеграция с вашим роутером (если есть window.spaRouter)
if (window.spaRouter) {
    // Перехватываем метод navigate если он есть
    if (window.spaRouter.navigate) {
        const originalNavigate = window.spaRouter.navigate;
        window.spaRouter.navigate = function(...args) {
            const result = originalNavigate.apply(this, args);
            cleanupRegistry.setTimeout(window.initializeMenu, 150);
            return result;
        };
    }
    
    // Подписываемся на событие смены страницы если оно есть
    if (window.spaRouter.on) {
        window.spaRouter.on('pageChange', () => {
            cleanupRegistry.setTimeout(window.initializeMenu, 100);
        });
    }
}

// 6. Ручной триггер для отладки (доступен в консоли)
window.reinitMenu = function() {
    console.log('🔄 Ручная переинициализация меню');
    window.initializeMenu();
};

console.log('✅ place_menu.js полностью загружен с поддержкой SPA');

// =============================================================================
// НОВОЕ: ПАУЗА ВИДЕО ПРИ ВОЗВРАТЕ НА СТРАНИЦУ С ОТКРЫТЫМ МЕНЮ
// =============================================================================

// Обработчик для случая, когда страница восстанавливается из кэша (кнопка "назад")
window.addEventListener('pageshow', (event) => {
    // event.persisted = true, если страница восстановлена из bfcache (back-forward cache)
    if (event.persisted) {
        console.log('🔄 Страница восстановлена из кэша, проверяем видео...');
        
        const bgVideo = document.getElementById('bgVideo');
        const frame = document.getElementById('frame');
        
        // Если меню открыто (mode-details) - ставим видео на паузу
        if (bgVideo && frame?.classList.contains('mode-details')) {
            bgVideo.pause();
            bgVideo.style.filter = 'blur(5px)';
            console.log('⏸️ Видео поставлено на паузу (возврат из кэша)');
        }
    }
});

// Переопределяем initializeMenu для добавления дополнительной проверки
const originalInitializeMenu = window.initializeMenu;
window.initializeMenu = function() {
    // Вызываем оригинальную функцию
    originalInitializeMenu.apply(this, arguments);
    
    // Дополнительная проверка видео после инициализации
    cleanupRegistry.setTimeout(() => {
        const bgVideo = document.getElementById('bgVideo');
        const frame = document.getElementById('frame');
        
        if (bgVideo && frame?.classList.contains('mode-details')) {
            if (!bgVideo.paused) {
                bgVideo.pause();
                console.log('⏸️ Видео поставлено на паузу (проверка при инициализации)');
            }
            // Убедимся что блюр применен
            bgVideo.style.filter = 'blur(5px)';
        }
    }, 150);
};
