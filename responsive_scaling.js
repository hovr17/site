// ФАЙЛ: responsive_scaling.js
// ОТВЕЧАЕТ ЗА АДАПТИВНОЕ МАСШТАБИРОВАНИЕ ИНТЕРФЕЙСА

class ResponsiveScaler {
  constructor() {
    this.scalerContainer = document.querySelector('.scaler-container');
    this.baseWidth = 3840;  // Ширина макета
    this.baseHeight = 2160; // Высота макета
    this.currentScale = 1;
    this.init();
  }

  init() {
    if (!this.scalerContainer) {
      console.error('Контейнер масштабирования не найден!');
      return;
    }

    // Устанавливаем начальные размеры
    this.scalerContainer.style.width = `${this.baseWidth}px`;
    this.scalerContainer.style.height = `${this.baseHeight}px`;
    
    // Первоначальное масштабирование
    this.updateScale();
    
    // Обновление при изменении размера окна
    window.addEventListener('resize', this.updateScale.bind(this));
    
    // Обновление при изменении ориентации
    window.addEventListener('orientationchange', this.updateScale.bind(this));
  }

  updateScale() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Рассчитываем масштаб для сохранения пропорций
    const scaleX = windowWidth / this.baseWidth;
    const scaleY = windowHeight / this.baseHeight;
    
    // Используем минимальный масштаб, чтобы вписать в экран
    let scale = Math.min(scaleX, scaleY);
    
    // Для очень маленьких экранов ограничиваем минимальный масштаб
    if (windowWidth < 480) {
      scale = Math.max(scale, 0.2);
    }
    
    this.currentScale = scale;
    
    // Применяем трансформацию
    this.scalerContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
    
    console.log(`Масштабирование: ${scale.toFixed(3)} (${windowWidth}x${windowHeight})`);
  }

  getCurrentScale() {
    return this.currentScale;
  }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  window.responsiveScaler = new ResponsiveScaler();
  
  // Дополнительная проверка после полной загрузки
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.responsiveScaler.updateScale();
    }, 100);
  });
});

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveScaler;
}