console.log('place_menu.js загружен');

let mode = "intro";
let isAnimating = false;

// Переменные для обработки свайпов
let touchStartX = null;
let touchStartY = null;
let isHorizontalSwipe = false;
const SWIPE_THRESHOLD = 50;

// =============================================================================
// СИСТЕМА ПРОВЕРКИ SAFE AREA И ПОДДЕРЖКИ env()
// =============================================================================

/**
 * Комплексная проверка поддержки env(safe-area-inset-bottom)
 * Возвращает объект с полной информацией о статусе и рекомендациях
 */
function checkSafeAreaSupport() {
  // === УРОВЕНЬ 1: Проверка CSS.supports() ===
  const supportsEnv = CSS.supports('padding-bottom', 'env(safe-area-inset-bottom, 0px)');
  
  // === УРОВЕНЬ 2: Реальный тест env() ===
  // Создаем элемент с fallback-значением, которое никогда не будет реальным
  const testEl = document.createElement('div');
  testEl.style.position = 'fixed';
  testEl.style.bottom = 'env(safe-area-inset-bottom, -9999px)';
  testEl.style.visibility = 'hidden';
  document.body.appendChild(testEl);
  const computedValue = getComputedStyle(testEl).bottom;
  document.body.removeChild(testEl);
  
  // Если env() не поддерживается, вернется -9999px
  const envReallyWorks = computedValue !== '-9999px';
  const safeAreaBottom = parseFloat(computedValue) || 0;
  
  // === УРОВЕНЬ 3: Специфичные браузеры ===
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroidChrome = /Android.*Chrome/i.test(navigator.userAgent);
  const isSamsungInternet = /SamsungBrowser/i.test(navigator.userAgent);
  const isFirefoxMobile = /Android.*Firefox/i.test(navigator.userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // === УРОВЕНЬ 4: Visual Viewport API (фолбек для Android) ===
  let visualViewportHeight = null;
  if (window.visualViewport) {
    visualViewportHeight = window.visualViewport.height;
  }
  
  // === ИТОГОВЫЙ СТАТУС ===
  let status, description, color, recommendation;
  
  if (!supportsEnv || !envReallyWorks) {
    // Браузер НЕ поддерживает env()
    if (isIOS) {
      status = "⚠️ ОГРАНИЧЕННАЯ ПОДДЕРЖКА";
      description = "iOS, но env() не работает (редкий случай)";
      color = "#ff9500";
      recommendation = "Проверьте мета-тег viewport и CSS";
    } else if (isAndroidChrome || isSamsungInternet || isFirefoxMobile) {
      status = "🔧 НУЖЕН ФОЛБЕК";
      description = "Android-браузер без поддержки env()";
      color = "#ff3b30";
      recommendation = "Включается JS-фолбек";
    } else {
      status = "❌ НЕТ ПОДДЕРЖКИ";
      description = "env() не поддерживается";
      color = "#ff3b30";
      recommendation = "Добавьте кнопку 'В полный экран'";
    }
  } else {
    // env() поддерживается
    if (safeAreaBottom > 0) {
      status = "✅ ОТСТУП РАБОТАЕТ";
      description = `Safe Area = ${safeAreaBottom}px`;
      color = "#34c759";
      recommendation = "Все отлично!";
    } else {
      status = "ℹ️ ПОДДЕРЖКА ЕСТЬ, НО ОТСТУП = 0";
      description = "Устройство без панели или десктоп";
      color = "#007aff";
      recommendation = "Нормально для этого устройства";
    }
  }
  
  return {
    supportsEnv,
    envReallyWorks,
    safeAreaBottom,
    isIOS,
    isAndroidChrome,
    isSamsungInternet,
    isMobile,
    visualViewportHeight,
    status,
    description,
    color,
    recommendation
  };
}

/**
 * Отображает отладочный оверлей с полной информацией
 * Автоматически скрывается через 5 секунд
 */
function showDebugOverlay() {
  const check = checkSafeAreaSupport();
  let overlay = document.getElementById('debug-overlay');
  
  // Создаем оверлей, если его еще нет
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 30px;
      border-radius: 20px;
      font-size: 24px;
      font-weight: bold;
      z-index: 999999;
      pointer-events: none;
      text-align: center;
      border: 4px solid white;
      box-shadow: 0 0 30px rgba(0,0,0,0.5);
      font-family: sans-serif;
      line-height: 1.4;
      max-width: 90vw;
      word-wrap: break-word;
    `;
    document.body.appendChild(overlay);
  }
  
  overlay.innerHTML = `
    <div style="margin-bottom: 15px; border-bottom: 2px solid ${check.color}; padding-bottom: 10px; color: ${check.color};">
      <strong>${check.status}</strong>
    </div>
    
    <div style="font-size: 18px; color: #fff; line-height: 1.5; margin-bottom: 15px;">
      ${check.description}
    </div>
    
    <div style="font-size: 16px; color: #999; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; line-height: 1.4;">
      <div><strong>Поддержка env():</strong> ${check.supportsEnv ? 'Да' : 'Нет'}</div>
      <div><strong>Работает env():</strong> ${check.envReallyWorks ? 'Да' : 'Нет'}</div>
      <div><strong>Safe Area:</strong> ${check.safeAreaBottom}px</div>
      <div><strong>iOS:</strong> ${check.isIOS ? 'Да' : 'Нет'}</div>
      <div><strong>Android Chrome:</strong> ${check.isAndroidChrome ? 'Да' : 'Нет'}</div>
      <div><strong>Mobile:</strong> ${check.isMobile ? 'Да' : 'Нет'}</div>
      <div><strong>Visual Viewport:</strong> ${check.visualViewportHeight ? check.visualViewportHeight + 'px' : 'Не поддерживается'}</div>
    </div>
    
    <div style="margin-top: 15px; font-size: 16px; color: #fff; background: ${check.color}22; padding: 10px; border-radius: 8px;">
      💡 ${check.recommendation}
    </div>
  `;
  
  overlay.style.borderColor = check.color;
  
  // Автоматически скрываем оверлей через 5 секунд
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 5000);
}

/**
 * Автоматический фолбек для Android-браузеров без env() поддержки
 */
function applyAndroidFallback() {
  const check = checkSafeAreaSupport();
  const screen = document.querySelector('.screen');
  const frame = document.getElementById('frame');
  
  if (!screen || !frame) return false;
  
  // Если env() не работает и это Android
  if (!check.envReallyWorks && (check.isAndroidChrome || check.isSamsungInternet)) {
    console.log('🔧 Применяется Android fallback');
    screen.classList.add('no-env-support');
    
    // Динамический расчет через Visual Viewport API
    if (window.visualViewport) {
      function updatePadding() {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const browserBarHeight = windowHeight - viewportHeight;
        
        if (browserBarHeight > 0) {
          const paddingValue = Math.max(60, browserBarHeight + 20); // Минимум 60px
          screen.style.paddingBottom = paddingValue + 'px';
          console.log(`🔧 Android fallback: padding-bottom = ${paddingValue}px`);
        } else {
          // Если не можем точно расчитать, ставим стандартный отступ
          screen.style.paddingBottom = '80px';
        }
      }
      
      window.visualViewport.addEventListener('resize', updatePadding);
      window.addEventListener('orientationchange', () => {
        setTimeout(updatePadding, 100); // Задержка для пересчета
      });
      
      updatePadding(); // Первоначальный вызов
    } else {
      // Если Visual Viewport не поддерживается, ставим фиксированный отступ
      screen.style.paddingBottom = '80px';
    }
    
    return true;
  }
  
  return false;
}

// =============================================================================
// СУЩЕСТВУЮЩИЙ КОД ИЗ ОРИГИНАЛЬНОГО ФАЙЛА (БЕЗ ИЗМЕНЕНИЙ)
// =============================================================================

/**
 * Переключение полноэкранного режима
 */
function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
}

/**
 * Вход в полноэкранный режим
 */
function enterFullscreen() {
  const elem = document.documentElement;
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
}

/**
 * Выход из полноэкранного режима
 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

/**
 * Обработчик изменения состояния полноэкранного режима
 */
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

/**
 * МГНОВЕННОЕ обновление видимости кнопки полноэкранного режима
 */
function updateFullscreenButtonVisibility() {
  const btn = document.getElementById('fullscreenBtn');
  if (!btn) return;
  
  const isMobile = window.innerWidth <= 1080;
  const isIntroMode = mode === 'intro';
  
  btn.style.display = (isMobile && isIntroMode) ? 'block' : 'none';
}

/**
 * Инициализация кнопки полноэкранного режима
 */
function initializeFullscreenButton() {
  const btn = document.getElementById('fullscreenBtn');
  if (!btn) return;
  
  btn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
}

/**
 * Настраивает переход в полноэкранный режим при любом клике на экране (в режиме intro)
 */
function setupGlobalFullscreenTrigger() {
  const frame = document.getElementById('frame');
  if (!frame) return;

  frame.addEventListener('click', (e) => {
    // 1. Если мы уже в полноэкранном режиме — ничего не делаем
    if (document.fullscreenElement || document.webkitFullscreenElement) return;

    // 2. Работаем только в режиме intro
    if (mode !== 'intro') return;

    // 3. Работаем только на мобильных устройствах (ширина <= 1080px)
    const isMobile = window.innerWidth <= 1080;
    if (!isMobile) return;

    // 4. Исключаем клики по интерактивным элементам, чтобы не ломать навигацию и кнопки
    const isInteractive = e.target.closest(
      'a, button, .dropdown, .entry-note, .temple-nav-arrow, .back-button, #fullscreenBtn, .small-btn'
    );

    if (isInteractive) return;

    // 5. Если клик пришелся на фон или видео -> открываем полноэкранный режим
    enterFullscreen();
    console.log('📱 Клик по экрану (Mobile): Вход в полноэкранный режим');
  });
}

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
            bgVideo.pause(); // ✅ СТАВИМ НА ПАУЗУ при открытии меню
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
            bgVideo.play(); // ✅ ВОЗОБНОВЛЯЕМ при закрытии меню
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

// Сохраняем оригинальную initializeMenu
const originalInitializeMenu = window.initializeMenu || function() {};

// Переопределяем с добавлением проверок Safe Area
window.initializeMenu = function() {
    console.log('🔄 Инициализация меню с проверкой Safe Area...');
    
    // Вызываем оригинальную функцию
    const savedMenuState = sessionStorage.getItem('menuState');
    const shouldOpenMenu = savedMenuState === 'open';
    
    mode = shouldOpenMenu ? "details" : "intro";
    isAnimating = false;
    
    const frame = document.getElementById('frame');
    const bgVideo = document.getElementById('bgVideo');
    const scrollZone = document.getElementById('scrollZone');
    const usefulDrop = document.getElementById('usefulDrop');
    const videoPoster = document.getElementById('videoPoster');
    
    // ✅ ОТКЛЮЧАЕМ АНИМАЦИИ для мгновенного отображения
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
    
    // Добавляем наши проверки
    setTimeout(() => {
        const fallbackApplied = applyAndroidFallback();
        showDebugOverlay();
        
        const check = checkSafeAreaSupport();
        console.log('📊 Результат проверки Safe Area:', check);
        console.log(`🔧 Android fallback применен: ${fallbackApplied ? 'Да' : 'Нет'}`);
    }, 100);
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('place_menu.js: DOMContentLoaded (первая загрузка)');
    
    // Запускаем инициализацию
    setTimeout(() => {
        window.initializeMenu();
    }, 50);
});

// =============================================================================
// ФИКС ДЛЯ 100VH НА MOBILE (ВАШ СУЩЕСТВУЮЩИЙ КОД)
// =============================================================================

function setVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
}

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);
