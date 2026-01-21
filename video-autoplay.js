/**
 * video-autoplay.js
 * Скрипт для гарантированного автозапуска видео на всех устройствах
 * Автор: MiniMax Agent
 * Дата: 2026-01-17
 */

(function(window, document) {
  'use strict';
  
  // Конфигурация
  var CONFIG = {
    videoId: 'bgVideo',
    posterId: 'videoPoster',
    retryDelay: 500,
    maxRetries: 10,
    debug: false
  };
  
  // Состояние
  var state = {
    isStarted: false,
    retryCount: 0,
    timeoutId: null
  };
  
  // Логирование для отладки
  function log(message) {
    if (CONFIG.debug && console) {
      console.log('[VideoAutoplay] ' + message);
    }
  }
  
  // Получение элементов
  function getElements() {
    return {
      video: document.getElementById(CONFIG.videoId),
      poster: document.getElementById(CONFIG.posterId)
    };
  }
  
  // Запуск видео
  function startVideo() {
    var elements = getElements();
    var video = elements.video;
    
    if (!video || state.isStarted) {
      return;
    }
    
    // Проверяем, не заблокирован ли autoplay
    if (video.paused) {
      var playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.then(function() {
          state.isStarted = true;
          log('Видео успешно запущено');
          
          // Скрываем постер
          if (elements.poster) {
            elements.poster.style.transition = 'opacity 0.3s ease';
            elements.poster.style.opacity = '0';
          }
          
          // Очищаем таймеры повторных попыток
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
          }
        }).catch(function(error) {
          log('Autoplay заблокирован: ' + error.message);
          scheduleRetry();
        });
      }
    } else {
      state.isStarted = true;
      log('Видео уже воспроизводится');
    }
  }
  
  // Планирование повторной попытки
  function scheduleRetry() {
    if (state.retryCount >= CONFIG.maxRetries) {
      log('Достигнуто максимальное количество попыток');
      return;
    }
    
    state.retryCount++;
    log('Попытка #' + state.retryCount + ' через ' + CONFIG.retryDelay + 'мс');
    
    state.timeoutId = setTimeout(function() {
      startVideo();
    }, CONFIG.retryDelay);
  }
  
  // Инициализация при загрузке страницы
  function init() {
    var elements = getElements();
    var video = elements.video;
    
    if (!video) {
      log('Видео элемент не найден');
      return;
    }
    
    log('Инициализация autoplay');
    
    // Скрываем постер при загрузке
    if (elements.poster) {
      elements.poster.style.transition = 'opacity 0.3s ease';
    }
    
    // Пытаемся запустить видео
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(startVideo, 50);
      });
    } else {
      setTimeout(startVideo, 50);
    }
    
    // Слушаем различные события для повторных попыток
    var events = [
      'focus',
      'visibilitychange',
      'touchstart',
      'click',
      'scroll',
      'mousemove',
      'keydown'
    ];
    
    var eventHandler = function() {
      if (!state.isStarted) {
        startVideo();
      }
    };
    
    events.forEach(function(eventName) {
      window.addEventListener(eventName, eventHandler, { passive: true });
    });
    
    // Если видео уже загружено
    if (video.readyState >= 3) {
      startVideo();
    }
    
    // Слушаем события готовности видео
    video.addEventListener('canplay', startVideo);
    video.addEventListener('canplaythrough', startVideo);
    
    // Обработка случая, когда видео было приостановлено
    video.addEventListener('pause', function() {
      if (!video.ended && !video.paused && !state.isStarted) {
        startVideo();
      }
    });
  }
  
  // Запускаем инициализацию
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
  
})(window, document);