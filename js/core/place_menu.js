console.log('place_menu.js загружен');

let mode = "intro";
let isAnimating = false;

// Переменные для обработки свайпов
let touchStartX = null;
let touchStartY = null;
let isHorizontalSwipe = false;
const SWIPE_THRESHOLD = 50;

// ===== УПРАВЛЕНИЕ ПОЛНОЭКРАННЫМ РЕЖИМОМ =====

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
  
  const icon = btn.querySelector('div');
  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
  
  if (isFullscreen) {
    icon.classList.remove('fullscreen-icon');
    icon.classList.add('fullscreen-exit-icon');
  } else {
    icon.classList.remove('fullscreen-exit-icon');
    icon.classList.add('fullscreen-icon');
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

// ===== ГЛОБАЛЬНЫЙ КЛИК ДЛЯ ПОЛНОЭКРАННОГО РЕЖИМА (ТОЛЬКО MOBILE) =====

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

// ===== СУЩЕСТВУЮЩИЙ КОД =====

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

window.initializeMenu = function() {
    console.log('🔄 Инициализация меню (после перехода)...');
    
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
        // Добавляем класс, который отключает transitions для всей страницы
        document.body.classList.add('no-transition');
        
        // Принудительно отключаем у ключевых элементов
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
        
        // Включаем анимации обратно через очень короткий таймаут
        setTimeout(() => {
            elementsToDisable.forEach(el => {
                el.style.transition = '';
                el.style.animation = '';
            });
            document.body.classList.remove('no-transition');
        }, 10);
    }
    
    // Применяем классы без анимации
    if (frame) {
        if (shouldOpenMenu) {
            frame.classList.remove('mode-intro');
            frame.classList.add('mode-details');
        } else {
            frame.classList.remove('mode-details');
            frame.classList.add('mode-intro');
        }
    }
    
    // ✅ УПРАВЛЕНИЕ ВИДЕО: пауза при открытом меню
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
    
    // Восстанавливаем состояние dropdown
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
    
    // Очищаем состояние
    setTimeout(() => {
        sessionStorage.removeItem('menuState');
        sessionStorage.removeItem('usefulDropdownState');
    }, 100);
    
    console.log('✅ Меню инициализировано', shouldOpenMenu ? '(с открытым меню, видео на паузе)' : '(с закрытым меню, видео играет)');
}



// === ДЕБАГ: ПРОВЕРКА ПОДРЕЗКИ ===

const checkCropOverlay = document.createElement('div');
checkCropOverlay.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 30px;
  border-radius: 20px;
  font-size: 28px;
  font-weight: bold;
  z-index: 999999;
  pointer-events: none;
  text-align: center;
  border: 4px solid white;
  font-family: sans-serif;
  line-height: 1.4;
`;

document.body.appendChild(checkCropOverlay);

function checkIfCropped() {
  // Получаем Safe Area Bottom (высота панели браузера / Home Indicator)
  const safeBottomRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('safe-area-inset-bottom');
  
  // Если браузер не умеет читать safe-area, считаем что 0
  let safeBottom = parseFloat(safeBottomRaw);
  if (isNaN(safeBottom)) safeBottom = 0;

  let statusText = "";
  let statusColor = "";
  let borderWidth = "0px";

  // ЛОГИКА ПРОВЕРКИ
  // Если safeBottom > 0, значит браузер говорит: "тут есть панель".
  // Если в браузере работает padding-bottom (env...), то текст приподнят.
  // Но если браузер НЕ поддерживает env(), то safeBottom будет равен 0 даже при наличии панели (на старых Android).
  // Поэтому мы проверяем визуальную высоту окна.
  
  const visualHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const totalHeight = window.innerHeight;

  if (safeBottom > 0) {
    // Случай 1: iOS или Современный Android
    // Браузер поддерживает env. Мы применили padding-bottom.
    // ВЕРДИКТ: Подрезки нет (если CSS подключился).
    statusText = "ПОДРЕЗКИ НЕТ<br>(iOS / New Android)";
    statusColor = "#00ff00"; // Зеленый
    borderWidth = "4px solid #00ff00";
  } else if (visualHeight < totalHeight) {
    // Случай 2: Старый Android (адресная строка съедает высоту)
    // Safe Area = 0, но высота окна меньше физической.
    // ВЕРДИКТ: Текст внизу, он перекрыт панелью при скролле.
    statusText = "ПОДРЕЗКА ЕСТЬ<br>(Old Android)";
    statusColor = "red"; // Красный
    borderWidth = "4px solid red";
  } else {
    // Случай 3: Десктоп или полный экран на мобильном
    statusText = "СТАНДАРТНЫЙ РЕЖИМ<br>(Desktop)";
    statusColor = "#cccccc"; // Серый
    borderWidth = "4px solid #cccccc";
  }

  checkCropOverlay.innerHTML = `
    <div style="color: ${statusColor}; margin-bottom: 15px; border-bottom: 1px solid #555; padding-bottom: 10px;">
      СТАТУС:
      <br>${statusText}
    </div>
    
    <div style="font-size: 18px; color: #ccc; text-align: left; margin-top: 15px;">
      Safe Area Bottom: <strong>${safeBottom}px</strong>
      <br><br>
      Visible Height: ${visualHeight}px
      <br>
      Total Height: ${totalHeight}px
    </div>
  `;
  
  checkCropOverlay.style.borderColor = statusColor;
}

// Запускаем проверку при загрузке и ресайзе
window.visualViewport.addEventListener('resize', checkIfCropped);
checkIfCropped();

// ================= КОНЕЦ ДЕБАГА =================

// === ФИКС ДЛЯ 100vh НА MOBILE ===

// 1. Функция обновления значения VH
function setVH() {
  // Получаем текущую видимую высоту окна
  let vh = window.innerHeight * 0.01;
  
  // Записываем значение в CSS-переменную --vh на теге html
  document.documentElement.style.setProperty('--vh', vh + 'px');
  
  // Для отладки (убрать потом)
  // console.log('VH обновлен:', vh * 100, 'px');
}

// 2. Запускаем при загрузке
setVH();

// 3. Слушаем события изменения размера окна и поворота экрана
window.addEventListener('resize', () => {
  setVH();
});

window.addEventListener('orientationchange', () => {
  setVH();
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('place_menu.js: DOMContentLoaded (первая загрузка)');
    initializeDropdownsAndButtons();
    window.initializeMenu();
});






