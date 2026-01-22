console.log('place_menu.js загружен');

let mode = "intro";
let isAnimating = false;
let touchStartX = null;
let touchStartY = null;
let isHorizontalSwipe = false;
const SWIPE_THRESHOLD = 50;

// =============================================================================
// ОПРЕДЕЛЕНИЕ БРАУЗЕРА И SAFE AREA
// =============================================================================

function isYandexBrowser() {
    return /YaBrowser/i.test(navigator.userAgent);
}

function detectBrowser() {
    const ua = navigator.userAgent;
    const vendor = navigator.vendor || '';
    
    if (/YaBrowser/i.test(ua)) {
        return { name: 'Яндекс.Браузер', engine: 'Blink', flags: { isYandex: true, isMobile: /Mobile/.test(ua) }};
    } else if (/CriOS/i.test(ua)) {
        return { name: 'Chrome (iOS)', engine: 'WebKit', flags: { isChrome: true, isIOS: true, isMobile: true }};
    } else if(/Chrome|Chromium/i.test(ua)) {
        return { name: 'Chrome', engine: 'Blink', flags: { isChrome: true, isMobile: /Mobile/.test(ua), isAndroid: /Android/.test(ua) }};
    } else if (/FxiOS/i.test(ua)) {
        return { name: 'Firefox (iOS)', engine: 'WebKit', flags: { isFirefox: true, isIOS: true, isMobile: true }};
    } else if (/Firefox|FxiOS/i.test(ua)) {
        return { name: 'Firefox', engine: 'Gecko', flags: { isFirefox: true, isMobile: /Mobile/.test(ua) }};
    } else if (/Safari/i.test(ua) && vendor.includes('Apple') && !/Chrome|Chromium|CriOS/.test(ua)) {
        return { name: 'Safari', engine: 'WebKit', flags: { isSafari: true, isIOS: /iPhone|iPad|iPod/.test(ua), isMobile: /Mobile|iPhone|iPad|iPod/.test(ua) }};
    } else if (/SamsungBrowser/i.test(ua)) {
        return { name: 'Samsung Internet', engine: 'Blink', flags: { isSamsung: true, isAndroid: true, isMobile: true }};
    } else if (/Edg|EdgA|EdgiOS/i.test(ua)) {
        return { name: 'Microsoft Edge', engine: 'Blink', flags: { isEdge: true, isMobile: /Mobile/.test(ua) }};
    } else if (/Opera|OPR/i.test(ua)) {
        return { name: 'Opera', engine: 'Blink', flags: { isOpera: true, isMobile: /Mobile/.test(ua) }};
    } else {
        return { name: 'Неизвестный', engine: 'Неизвестно', flags: { isUnknown: true, isMobile: /Mobile|Android|iPhone|iPad|iPod/.test(ua) }};
    }
}

function estimateBrowserUIHeight() {
    let safeAreaBottom = 0, visualViewportHeight = null, estimatedUIHeight = 0, details = '';
    
    try {
        const testEl = document.createElement('div');
        testEl.style.position = 'fixed';
        testEl.style.bottom = 'env(safe-area-inset-bottom, 0px)';
        testEl.style.visibility = 'hidden';
        document.body.appendChild(testEl);
        const computedValue = getComputedStyle(testEl).bottom;
        document.body.removeChild(testEl);
        safeAreaBottom = parseFloat(computedValue) || 0;
        if(safeAreaBottom > 0) details = `env(safe-area-inset-bottom): ${safeAreaBottom}px`;
    } catch(e) { console.warn('Ошибка env():', e); }
    
    if(window.visualViewport) {
        visualViewportHeight = window.visualViewport.height;
        const layoutHeight = window.innerHeight;
        estimatedUIHeight = Math.max(0, layoutHeight - visualViewportHeight);
        if(estimatedUIHeight > 0) details += (details ? ' | ' : '') + `Visual Viewport: -${estimatedUIHeight}px`;
    }
    
    return { safeAreaBottom, visualViewportHeight, estimatedUIHeight, details: details || 'Нет данных' };
}

function checkSafeAreaSupport() {
    const browser = detectBrowser();
    const uiInfo = estimateBrowserUIHeight();
    let status, description, color, recommendation;
    
    if(browser.flags.isYandex) {
        status = "🔧 Яндекс.Браузер";
        description = uiInfo.estimatedUIHeight > 0 ? `UI высота: ${uiInfo.estimatedUIHeight}px` : 'Без UI панелей';
        color = "#ff0000";
        recommendation = "Применен подъем на 55px";
    } else if(browser.flags.isSafari || browser.flags.isIOS) {
        if(uiInfo.safeAreaBottom > 0) {
            status = "✅ Safari Safe Area";
            description = `Нижняя панель: ${uiInfo.safeAreaBottom}px`;
            color = "#34c759";
            recommendation = "Используется env()";
        } else {
            status = "ℹ️ Safari без Safe Area";
            description = "Десктоп или старый iOS";
            color = "#007aff";
            recommendation = "Отступ не требуется";
        }
    } else if(browser.flags.isChrome || browser.flags.isSamsung || browser.flags.isAndroid) {
        if(uiInfo.estimatedUIHeight > 0) {
            status = "🔧 Android UI обнаружена";
            description = `Общая высота UI: ${uiInfo.estimatedUIHeight}px`;
            color = "#ff9500";
            recommendation = "Используется JS-фолбек";
        } else {
            status = "ℹ️ Без панелей";
            description = "Весь экран доступен";
            color = "#007aff";
            recommendation = "Фолбек не нужен";
        }
    } else {
        status = "ℹ️ Другой браузер";
        description = browser.name;
        color = "#cccccc";
        recommendation = "Стандартное поведение";
    }
    
    return {
        browser: browser.name,
        engine: browser.engine,
        isMobile: browser.flags.isMobile,
        isYandex: browser.flags.isYandex,
        ...uiInfo,
        status,
        description,
        color,
        recommendation
    };
}

function showDebugOverlay() {
    const check = checkSafeAreaSupport();
    let overlay = document.getElementById('debug-overlay');
    
    if(!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.cssText = `
            position: fixed; top: 10px; left: 10px; right: 10px;
            background: rgba(0,0,0,0.95); color: white; padding: 15px;
            border-radius: 12px; font-family: sans-serif; font-size: 14px;
            z-index: 999999; pointer-events: none; border: 2px solid ${check.color};
            max-height: 90vh; overflow-y: auto;
        `;
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div style="display:flex;align-items:center;margin-bottom:10px">
            <div style="width:12px;height:12px;background:${check.color};border-radius:50%;margin-right:8px;"></div>
            <strong style="font-size:16px">${check.status}</strong>
        </div>
        <div style="margin-bottom:12px">
            <strong>Браузер:</strong> ${check.browser}<br>
            <strong>Движок:</strong> ${check.engine}<br>
            <strong>Устройство:</strong> ${check.isMobile ? 'Мобильное' : 'Десктоп'}
        </div>
        <div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:8px;margin-bottom:10px">
            <strong>Высота панелей:</strong><br>${check.details}
        </div>
        <div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:8px;font-size:12px;color:#ccc">${check.description}</div>
        <div style="margin-top:10px;font-size:13px;color:${check.color}">💡 ${check.recommendation}</div>
    `;
    
    setTimeout(() => overlay.style.display = 'none', 5000);
}

function applyBrowserFallback() {
    const check = checkSafeAreaSupport();
    const screen = document.querySelector('.screen');
    if(!screen || !check.isMobile || check.safeAreaBottom > 0) return false;
    
    if(!check.isYandex && (check.isMobile && check.estimatedUIHeight === 0)) {
        screen.classList.add('no-env-support');
        
        if(window.visualViewport) {
            function updatePadding() {
                const viewportHeight = window.visualViewport.height;
                const windowHeight = window.innerHeight;
                const uiHeight = Math.max(0, windowHeight - viewportHeight);
                
                if(uiHeight > 0) {
                    screen.style.paddingBottom = (uiHeight + 20) + 'px';
                    console.log(`🔧 Динамический фолбек: padding-bottom = ${uiHeight + 20}px`);
                }
            }
            
            window.visualViewport.addEventListener('resize', updatePadding);
            updatePadding();
            return true;
        }
    }
    return false;
}

// =============================================================================
// УПРАВЛЕНИЕ ПОЛНОЭКРАННЫМ РЕЖИМОМ
// =============================================================================

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

function handleFullscreenChange() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;
    
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    
    if (isFullscreen) {
        btn.classList.remove('fullscreen-icon');
        btn.classList.add('fullscreen-exit-icon');
    } else {
        btn.classList.remove('fullscreen-exit-icon');
        btn.classList.add('fullscreen-icon');
    }
}

function updateFullscreenButtonVisibility() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;
    
    const isMobile = window.innerWidth <= 1080;
    const isIntroMode = mode === 'intro';
    
    btn.style.display = (isMobile && isIntroMode) ? 'block' : 'none';
}

function initializeFullscreenButton() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;
    
    btn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
}

function setupGlobalFullscreenTrigger() {
    const frame = document.getElementById('frame');
    if (!frame) return;

    frame.addEventListener('click', (e) => {
        if (document.fullscreenElement || document.webkitFullscreenElement) return;
        if (mode !== 'intro') return;
        
        const isMobile = window.innerWidth <= 1080;
        if (!isMobile) return;

        const isInteractive = e.target.closest(
            'a, button, .dropdown, .entry-note, .temple-nav-arrow, .back-button, #fullscreenBtn, .small-btn'
        );

        if (isInteractive) return;

        enterFullscreen();
        console.log('📱 Клик по экрану (Mobile): Вход в полноэкранный режим');
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
    
    updateFullscreenButtonVisibility();
    
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
        
        smoothScrollTo(0, 700);
        if (addressDrop) addressDrop.classList.remove("open");
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

    scrollZone.addEventListener("wheel", (e) => {
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
    }, { passive: false });
}

function setupKeyboardHandlers() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                navigateToPrevPlace();
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigateToNextPlace();
                break;
            case 'Escape':
                if (mode === "details") {
                    e.preventDefault();
                    setMode("intro");
                }
                break;
        }
    });
}

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
                if (isAnimating) return;
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
                if (isAnimating) return;
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
// ИНИЦИАЛИЗАЦИЯ МЕНЮ
// =============================================================================

window.initializeMenu = function() {
    console.log('🔄 Инициализация меню...');
    
    // === ОПРЕДЕЛЕНИЕ ЯНДЕКС.БРАУЗЕРА ===
    if (isYandexBrowser()) {
        document.body.classList.add('yandex-browser');
        console.log('🔧 Обнаружен Яндекс.Браузер, применен подъем элементов на 55px');
    }
    
    const savedMenuState = sessionStorage.getItem('menuState');
    const shouldOpenMenu = savedMenuState === 'open';
    
    mode = shouldOpenMenu ? "details" : "intro";
    isAnimating = false;
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const scrollZone = document.getElementById('scrollZone');
    const usefulDrop = document.getElementById('usefulDrop');
    const videoPoster = document.getElementById('videoPoster');
    
    if (shouldOpenMenu) {
        document.body.classList.add('no-transition');
        
        const elementsToDisable = [
            frame, bgVideo, scrollZone,
            document.querySelector('.title-block'),
            document.querySelector('.hero-details'),
            document.getElementById('dropdownsContainer'),
            document.querySelector('.entry-note'),
            document.getElementById('paidBtn')
        ].filter(el => el);
        
        elementsToDisable.forEach(el => {
            el.style.transition = 'none !important';
            el.style.animation = 'none !important';
        });
        
        setTimeout(() => {
            elementsToDisable.forEach(el => {
                el.style.transition = '';
                el.style.animation = '';
            });
            document.body.classList.remove('no-transition');
        }, 10);
    }
    
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
            setTimeout(() => bgVideo.play().catch(() => {}), 100);
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
    
    const savedDropdownState = sessionStorage.getItem('usefulDropdownState');
    if (savedDropdownState === 'open' && usefulDrop) {
        usefulDrop.classList.add("open");
    } else {
        if (usefulDrop) usefulDrop.classList.remove("open");
    }
    
    initializeDropdownsAndButtons();
    initializeFullscreenButton();
    setupGlobalFullscreenTrigger();
    setupSwipeHandlers();
    setupKeyboardHandlers();
    
    setTimeout(() => {
        sessionStorage.removeItem('menuState');
        sessionStorage.removeItem('usefulDropdownState');
    }, 100);
    
    console.log('✅ Меню инициализировано', shouldOpenMenu ? '(с открытым меню, видео на паузе)' : '(с закрытым меню, видео играет)');
    
    // === ПРОВЕРКА SAFE AREA ===
    setTimeout(() => {
        const fallbackApplied = applyBrowserFallback();
        showDebugOverlay();
        
        const check = checkSafeAreaSupport();
        console.log('📊 Результат проверки Safe Area:', check);
        console.log(`🔧 Фолбек применен: ${fallbackApplied ? 'Да' : 'Нет'}`);
    }, 100);
}

// =============================================================================
// ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('place_menu.js: DOMContentLoaded (первая загрузка)');
    
    setTimeout(() => {
        window.initializeMenu();
    }, 50);
});

// =============================================================================
// ФИКС ДЛЯ 100VH НА MOBILE
// =============================================================================

function setVH() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
}

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
