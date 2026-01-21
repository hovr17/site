// mobile_fullscreen.js - SPA-совместимый менеджер полноэкранного режима
console.log('📱 mobile_fullscreen.js загружен (SPA версия)');

class MobileFullscreenManager {
  constructor() {
    this.isFullscreen = false;
    this.isMobile = window.innerWidth <= 1080;
    this.fullscreenToggle = null;
    
    console.log('📱 Инициализация для SPA:', { 
      isMobile: this.isMobile, 
      width: window.innerWidth 
    });
    
    this.init();
  }
  
  init() {
    // Ждем, пока SPA полностью инициализируется
    this.waitForSPAReady().then(() => {
      console.log('✅ SPA готов, создаем кнопку');
      this.createOrUpdateButton();
      this.setupEventListeners();
    }).catch(err => {
      console.error('❌ Ошибка ожидания SPA:', err);
      // Пробуем создать кнопку сразу
      setTimeout(() => this.createOrUpdateButton(), 1000);
    });
  }
  
  waitForSPAReady() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkSPA = () => {
        attempts++;
        
        // Проверяем, инициализирован ли SPA роутер
        const isSPAReady = !!window.spaRouter && 
                          !!document.getElementById('frame') &&
                          !!window.pagesManager;
        
        console.log(`Проверка SPA #${attempts}:`, { 
          spaRouter: !!window.spaRouter,
          frame: !!document.getElementById('frame'),
          pagesManager: !!window.pagesManager,
          isSPAReady 
        });
        
        if (isSPAReady || attempts >= maxAttempts) {
          resolve();
        } else {
          setTimeout(checkSPA, 250);
        }
      };
      
      checkSPA();
    });
  }
  
  createOrUpdateButton() {
    // Проверяем существование кнопки
    this.fullscreenToggle = document.getElementById('fullscreenToggle');
    
    if (!this.fullscreenToggle) {
      console.warn('⚠️ Кнопка не найдена в DOM, создаем новую');
      this.createButton();
    } else {
      console.log('✅ Кнопка уже существует в DOM');
    }
    
    // Обновляем видимость кнопки
    this.updateButtonVisibility();
    
    // Принудительно применяем стили
    this.applyButtonStyles();
  }
  
  createButton() {
    // Создаем кнопку, если она не существует
    this.fullscreenToggle = document.createElement('button');
    this.fullscreenToggle.id = 'fullscreenToggle';
    this.fullscreenToggle.className = 'fullscreen-toggle';
    this.fullscreenToggle.innerHTML = '<div class="fullscreen-icon"></div>';
    
    // Вставляем кнопку в DOM (после back-button)
    const backButton = document.getElementById('backBtn');
    const frame = document.getElementById('frame');
    
    if (backButton && backButton.parentNode) {
      backButton.parentNode.insertBefore(this.fullscreenToggle, backButton.nextSibling);
      console.log('✅ Кнопка создана и вставлена после back-button');
    } else if (frame) {
      frame.appendChild(this.fullscreenToggle);
      console.log('✅ Кнопка создана и добавлена в frame');
    } else {
      console.error('❌ Не удалось найти место для вставки кнопки');
      return;
    }
  }
  
  applyButtonStyles() {
    if (!this.fullscreenToggle) return;
    
    // Принудительно применяем критичные стили
    Object.assign(this.fullscreenToggle.style, {
      position: 'absolute',
      top: '3vh',
      right: '3vw',
      width: 'min(60px, 9vmin)',
      height: 'min(60px, 9vmin)',
      zIndex: '1000',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      padding: '0',
      margin: '0',
      outline: 'none'
    });
    
    // Показываем/скрываем в зависимости от устройства
    this.updateButtonVisibility();
  }
  
  updateButtonVisibility() {
    if (!this.fullscreenToggle) return;
    
    const isMobileNow = window.innerWidth <= 1080;
    const isDetailsMode = document.getElementById('frame')?.classList.contains('mode-details');
    
    if (isMobileNow && !isDetailsMode) {
      this.fullscreenToggle.style.display = 'block';
      console.log('📱 Показываем кнопку (мобильный режим)');
    } else {
      this.fullscreenToggle.style.display = 'none';
      console.log('💻 Скрываем кнопку (не мобильный или режим details)');
    }
  }
  
  setupEventListeners() {
    if (!this.fullscreenToggle) return;
    
    // Обработчик клика
    this.fullscreenToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleFullscreen();
    });
    
    // События полноэкранного режима
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
    
    // Режим details меняет видимость
    this.observeModeChanges();
    
    // Ресайз окна
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('✅ Обработчики событий установлены');
  }
  
  observeModeChanges() {
    // Наблюдаем за изменениями класса mode в frame
    const frame = document.getElementById('frame');
    if (!frame) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setTimeout(() => this.updateButtonVisibility(), 50);
        }
      });
    });
    
    observer.observe(frame, { attributes: true });
    
    // Также отслеживаем навигацию SPA
    if (window.spaRouter) {
      const originalNavigate = window.spaRouter.navigateToPlace;
      if (originalNavigate) {
        window.spaRouter.navigateToPlace = function(...args) {
          const result = originalNavigate.apply(this, args);
          // После навигации обновляем кнопку
          setTimeout(() => {
            if (window.mobileFullscreenManager) {
              window.mobileFullscreenManager.updateButtonVisibility();
            }
          }, 100);
          return result;
        };
      }
    }
  }
  
  handleResize() {
    this.isMobile = window.innerWidth <= 1080;
    this.updateButtonVisibility();
  }
  
  toggleFullscreen() {
    console.log('🔄 Переключение полноэкранного режима, текущее состояние:', this.isFullscreen);
    
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }
  
  enterFullscreen() {
    const element = document.documentElement;
    
    const promise = element.requestFullscreen?.() ||
                   element.webkitRequestFullscreen?.() ||
                   element.mozRequestFullScreen?.() ||
                   element.msRequestFullscreen?.();
    
    if (promise) {
      promise.catch(err => {
        console.error('Ошибка входа в полноэкранный режим:', err);
      });
    }
  }
  
  exitFullscreen() {
    const exitPromise = document.exitFullscreen?.() ||
                       document.webkitExitFullscreen?.() ||
                       document.mozCancelFullScreen?.() ||
                       document.msExitFullscreen?.();
    
    if (exitPromise) {
      exitPromise.catch(err => {
        console.error('Ошибка выхода из полноэкранного режима:', err);
      });
    }
  }
  
  handleFullscreenChange() {
    const isFullscreen = !!(document.fullscreenElement ||
                           document.webkitFullscreenElement ||
                           document.mozFullScreenElement ||
                           document.msFullscreenElement);
    
    this.isFullscreen = isFullscreen;
    
    // Обновляем иконку
    if (this.fullscreenToggle) {
      const icon = this.fullscreenToggle.querySelector('.fullscreen-icon');
      if (icon) {
        if (isFullscreen) {
          icon.style.backgroundImage = "url('ui/expand_button_cancel.svg')";
          console.log('📱 Иконка изменена на "выход из полноэкранного режима"');
        } else {
          icon.style.backgroundImage = "url('ui/expand_button.svg')";
          console.log('📱 Иконка изменена на "вход в полноэкранный режим"');
        }
      }
    }
    
    // Обновляем классы
    if (isFullscreen) {
      document.body.classList.add('fullscreen-mode');
      this.fullscreenToggle?.classList.add('fullscreen-active');
      console.log('📱 Полноэкранный режим активирован');
    } else {
      document.body.classList.remove('fullscreen-mode');
      this.fullscreenToggle?.classList.remove('fullscreen-active');
      console.log('📱 Полноэкранный режим деактивирован');
    }
  }
  
  // Метод для обновления кнопки после навигации SPA
  refresh() {
    console.log('🔄 Обновление кнопки после навигации SPA');
    this.createOrUpdateButton();
  }
}

// Глобальная инициализация с учетом SPA
window.initializeFullscreen = function() {
  console.log('🔄 Инициализация полноэкранного режима (вызвано из SPA)');
  
  // Уничтожаем предыдущий экземпляр, если есть
  if (window.mobileFullscreenManager) {
    console.log('♻️ Переинициализация менеджера');
  }
  
  // Создаем новый экземпляр
  window.mobileFullscreenManager = new MobileFullscreenManager();
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOMContentLoaded - начинаем инициализацию');
  
  // Ждем немного, чтобы SPA скрипты успели загрузиться
  setTimeout(() => {
    window.initializeFullscreen();
  }, 500);
});

// Экспортируем для использования из других скриптов
window.MobileFullscreenManager = MobileFullscreenManager;