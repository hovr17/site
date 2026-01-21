/**
 * Плавный переход между концом и началом видео
 * Использует два видео элемента для seamless loop
 */

class VideoLooper {
  constructor(primaryVideoId, secondaryVideoId) {
    this.primaryVideo = document.getElementById(primaryVideoId);
    this.secondaryVideo = document.getElementById(secondaryVideoId);
    
    if (!this.primaryVideo || !this.secondaryVideo) {
      console.error('Video elements not found');
      return;
    }

    this.isTransitioning = false;
    this.transitionDuration = 500; // ms
    this.transitionThreshold = 0.2; // 20% от конца видео
    
    this.init();
  }

  init() {
    // Добавляем класс для второго видео
    this.secondaryVideo.classList.add('secondary');
    
    // Убеждаемся, что видео готовы
    Promise.all([
      this.waitForVideoReady(this.primaryVideo),
      this.waitForVideoReady(this.secondaryVideo)
    ]).then(() => {
      this.setupEventListeners();
      this.startLoop();
    }).catch(error => {
      console.error('Failed to load videos:', error);
    });
  }

  waitForVideoReady(video) {
    return new Promise((resolve) => {
      if (video.readyState >= 3) { // HAVE_FUTURE_DATA
        resolve();
      } else {
        video.addEventListener('loadeddata', () => resolve(), { once: true });
        video.addEventListener('error', () => resolve()); // Разрешаем даже при ошибке
      }
    });
  }

  setupEventListeners() {
    // Слушаем время воспроизведения основного видео
    this.primaryVideo.addEventListener('timeupdate', () => {
      this.checkForTransition();
    });

    // Слушаем конец вторичного видео для обратного перехода
    this.secondaryVideo.addEventListener('timeupdate', () => {
      this.checkForReverseTransition();
    });

    // Перезапускаем loop при ошибках
    this.primaryVideo.addEventListener('error', () => this.restart());
    this.secondaryVideo.addEventListener('error', () => this.restart());
  }

  checkForTransition() {
    if (this.isTransitioning) return;

    const currentTime = this.primaryVideo.currentTime;
    const duration = this.primaryVideo.duration;
    
    if (duration > 0 && (duration - currentTime) < (duration * this.transitionThreshold)) {
      this.startTransition();
    }
  }

  checkForReverseTransition() {
    if (!this.isTransitioning) {
      const currentTime = this.secondaryVideo.currentTime;
      const duration = this.secondaryVideo.duration;
      
      if (duration > 0 && (duration - currentTime) < (duration * this.transitionThreshold)) {
        this.startReverseTransition();
      }
    }
  }

  startTransition() {
    this.isTransitioning = true;
    
    // Начинаем второе видео с начала
    this.secondaryVideo.currentTime = 0;
    
    // Плавное наложение
    this.fadeVideos(this.primaryVideo, this.secondaryVideo, () => {
      this.primaryVideo.pause();
      this.isTransitioning = false;
    });
  }

  startReverseTransition() {
    this.isTransitioning = true;
    
    // Начинаем первое видео с начала
    this.primaryVideo.currentTime = 0;
    this.primaryVideo.play();
    
    // Плавное наложение обратно
    this.fadeVideos(this.secondaryVideo, this.primaryVideo, () => {
      this.secondaryVideo.pause();
      this.isTransitioning = false;
    });
  }

  fadeVideos(fadeOutVideo, fadeInVideo, onComplete) {
    const duration = this.transitionDuration;
    const startTime = performance.now();
    
    // Убедимся, что оба видео воспроизводятся
    if (fadeInVideo.paused) {
      fadeInVideo.play();
    }
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Изменяем opacity
      fadeOutVideo.style.opacity = (1 - progress).toFixed(3);
      fadeInVideo.style.opacity = progress.toFixed(3);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Завершение
        fadeOutVideo.style.opacity = '0';
        fadeInVideo.style.opacity = '1';
        
        // Меняем z-index
        fadeOutVideo.style.zIndex = '0';
        fadeInVideo.style.zIndex = '1';
        
        if (onComplete) onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }

  startLoop() {
    // Начинаем воспроизведение обоих видео (второе на паузе с opacity 0)
    this.primaryVideo.play().catch(e => console.log('Primary video play failed:', e));
    this.secondaryVideo.play().then(() => {
      this.secondaryVideo.pause();
    }).catch(e => console.log('Secondary video play failed:', e));
    
    // Устанавливаем начальные значения
    this.primaryVideo.style.opacity = '1';
    this.primaryVideo.style.zIndex = '1';
    this.secondaryVideo.style.opacity = '0';
    this.secondaryVideo.style.zIndex = '0';
  }

  pause() {
    this.primaryVideo.pause();
    this.secondaryVideo.pause();
  }

  play() {
    if (this.primaryVideo.style.opacity === '1') {
      this.primaryVideo.play();
    } else {
      this.secondaryVideo.play();
    }
  }

  setFilter(filter) {
    this.primaryVideo.style.filter = filter;
    this.secondaryVideo.style.filter = filter;
  }

  restart() {
    this.pause();
    this.primaryVideo.currentTime = 0;
    this.secondaryVideo.currentTime = 0;
    this.startLoop();
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.videoLooper = new VideoLooper('bgVideo', 'bgVideo2');
  
  // Интеграция с существующим кодом
  if (window.videoLooper) {
    window.videoPendulum = {
      play: () => window.videoLooper.play(),
      pause: () => window.videoLooper.pause(),
      setFilter: (filter) => window.videoLooper.setFilter(filter)
    };
  }
});