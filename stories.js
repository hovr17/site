class StoriesManager {
  constructor() {
    this.container = document.querySelector('.stories-container');
    this.slidesContainer = document.getElementById('slidesContainer');
    this.progressContainer = document.getElementById('progressContainer');
    this.closeBtn = document.getElementById('closeBtn');
    this.prevArrow = document.getElementById('prevArrow');
    this.nextArrow = document.getElementById('nextArrow');
    
    this.currentSlide = 0;
    this.totalSlides = 0;
    this.slides = [];
    this.placeId = '';
    this.placeData = null;
    this.isAnimating = false;
    this.visitedSlides = new Set();
    this.isOverlayOpen = false;
    this.isDesktop = window.innerWidth >= 1081;
    this.overlayJustClosed = false;
    
    this.init();
  }
  
  checkBrowserSpecifics() {
    // Упрощенная проверка отключена для универсального поведения
    document.documentElement.classList.add('no-lift');
    console.log('✅ Режим без отступов активирован для всех браузеров');
  }

  init() {
    this.checkBrowserSpecifics();

    const urlParams = new URLSearchParams(window.location.search);
    this.placeId = urlParams.get('place');
    
    this.placeData = storiesData[this.placeId];
    
    if (!this.placeData) {
      console.error(`Данные для места "${this.placeId}" не найдены`);
    }
    
    this.updateLabel();
    
    if (this.isDesktop && this.currentSlide === 0) {
      this.prevArrow.classList.add('hidden');
    }
    
    this.loadImages();
    this.setupEventListeners();
    this.updateArrowVisibility();
  }
  
  updateLabel() {
    const oldLabel = document.getElementById('storiesLabel');
    if (oldLabel) {
      oldLabel.textContent = `${this.placeData.name.toLowerCase()}`;
    }
  }
  
  loadImages() {
    this.slidesContainer.innerHTML = '';
    this.slides = [];
    
    this.totalSlides = this.placeData.images.length;
    
    this.placeData.images.forEach((imageData, index) => {
      const slide = document.createElement('div');
      slide.className = `story-slide ${index === 0 ? 'active' : ''}`;
      slide.dataset.index = index;
      
      slide.style.backgroundImage = `url(${imageData.src})`;
      
      const img = document.createElement('img');
      img.className = 'story-image';
      img.src = imageData.src;
      img.alt = `Фото ${index + 1} - ${this.placeData.name}`;
      img.onerror = () => {
        console.error(`Ошибка загрузки изображения: ${imageData.src}`);
        img.src = 'ui/placeholder.jpg';
        slide.style.backgroundImage = 'url(ui/placeholder.jpg)';
      };
      
      slide.appendChild(img);
      
      if (imageData.caption && imageData.caption.trim() !== '') {
        this.addCaptionToSlide(slide, index, imageData.caption);
      }
      
      this.slidesContainer.appendChild(slide);
      this.slides.push(slide);
    });
    
    this.visitedSlides.add(0);
    this.createProgressBars();
  }
  
  addCaptionToSlide(slide, index, captionText) {
    const isLongText = captionText.length > 135;
    
    // Создаем ВЕРХНЮЮ панель (вместо нижнего контейнера)
    const headerPanel = document.createElement('div');
    headerPanel.className = 'story-header-panel';
    
    // Текст (обрезанный для длинных подписей)
    const headerText = document.createElement('div');
    headerText.className = 'story-header-text';
    headerText.textContent = isLongText 
      ? captionText.substring(0, 135).replace(/\s+\S*$/, '...') 
      : captionText;
    
    headerPanel.appendChild(headerText);
    
    // Кнопка раскрытия (только для длинного текста)
    if (isLongText) {
      const expandBtn = document.createElement('button');
      expandBtn.className = 'header-caption-expand-btn';
      expandBtn.innerHTML = `<img src="ui/open_menu_button.svg" alt="Раскрыть" class="expand-icon">`;
      
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.showFullCaptionOverlay(captionText);
      });
      
      headerPanel.appendChild(expandBtn);
    }
    
    slide.appendChild(headerPanel);
    slide.classList.add('has-caption');
  }
  
  createProgressBars() {
    this.progressContainer.innerHTML = '';
    
    for (let i = 0; i < this.totalSlides; i++) {
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      
      progressBar.appendChild(progressFill);
      this.progressContainer.appendChild(progressBar);
    }
    
    this.updateProgressBars();
  }
  
  updateArrowVisibility() {
    if (this.isDesktop) {
      if (this.currentSlide === 0) {
        this.prevArrow.classList.add('hidden');
      } else {
        this.prevArrow.classList.remove('hidden');
      }
      this.nextArrow.classList.remove('hidden');
    } else {
      this.prevArrow.classList.add('hidden');
      this.nextArrow.classList.add('hidden');
    }
  }
  
  setupEventListeners() {
    this.closeBtn.addEventListener('click', () => this.closeStories());
    this.prevArrow.addEventListener('click', () => this.prevSlide());
    this.nextArrow.addEventListener('click', () => this.nextSlide());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
      if (e.key === 'Escape') {
        // Проверяем сначала новый оверлей
        const headerOverlay = document.querySelector('.header-caption-overlay.active');
        if (headerOverlay) {
          this.closeHeaderCaptionOverlay();
          return;
        }
        
        // Потом старый оверлей
        const oldOverlay = document.querySelector('.caption-overlay.active:not(.header-caption-overlay)');
        if (oldOverlay) {
          const slideIndex = oldOverlay.dataset.slideIndex;
          const slide = this.slides[slideIndex];
          const expandBtn = slide.querySelector('.caption-expand-btn');
          this.closeOverlay(oldOverlay, expandBtn);
          return;
        }
        
        // Если нет оверлеев - закрываем stories
        this.closeStories();
      }
    });
    
    window.addEventListener('resize', () => {
      this.isDesktop = window.innerWidth >= 1081;
      this.updateArrowVisibility();
    });
    
    this.setupTouchEvents();
    this.setupTouchZones();
    
    // Клик по чёрному фону на мобильных — закрываем оверлей
    this.container.addEventListener('click', (e) => {
      if (!this.isDesktop && this.isOverlayOpen) {
        const activeOverlay = document.querySelector('.caption-overlay.active');
        if (activeOverlay) {
          const slideIndex = activeOverlay.dataset.slideIndex;
          const slide = this.slides[slideIndex];
          const expandBtn = slide.querySelector('.caption-expand-btn.mobile-expand-btn');
          this.closeOverlay(activeOverlay, expandBtn);
          e.preventDefault();
          e.stopPropagation();
          
          this.overlayJustClosed = true;
          
          setTimeout(() => {
            this.overlayJustClosed = false;
          }, 300);
        }
      }
    });
  }
  
  setupTouchEvents() {
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    
    this.container.addEventListener('touchstart', (e) => {
      if (!this.isDesktop && this.isOverlayOpen) {
        return;
      }
      
      touchStartX = e.changedTouches[0].screenX;
      isSwiping = true;
    }, { passive: true });
    
    this.container.addEventListener('touchmove', (e) => {
      if (!isSwiping || (!this.isDesktop && this.isOverlayOpen)) return;
      
      if (this.currentSlide === 0) {
        const currentX = e.changedTouches[0].screenX;
        if (currentX > touchStartX) {
          e.preventDefault();
          return;
        }
      }
    }, { passive: false });
    
    this.container.addEventListener('touchend', (e) => {
      if ((!this.isDesktop && this.isOverlayOpen) || !isSwiping) return;
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
      isSwiping = false;
    }, { passive: true });
  }
  
  setupTouchZones() {
    const prevZone = document.createElement('div');
    prevZone.className = 'touch-zone prev-zone';
    
    prevZone.addEventListener('click', (e) => {
      if (!this.isDesktop) {
        if (this.isOverlayOpen) {
          const activeOverlay = document.querySelector('.caption-overlay.active');
          if (activeOverlay) {
            const slideIndex = activeOverlay.dataset.slideIndex;
            const slide = this.slides[slideIndex];
            const expandBtn = slide.querySelector('.caption-expand-btn.mobile-expand-btn');
            this.closeOverlay(activeOverlay, expandBtn);
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
        
        if (this.overlayJustClosed) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      
      if ((!this.isDesktop && this.isOverlayOpen) || this.currentSlide === 0) return;
      this.prevSlide();
    });
    
    const nextZone = document.createElement('div');
    nextZone.className = 'touch-zone next-zone';
    
    nextZone.addEventListener('click', (e) => {
      if (!this.isDesktop) {
        if (this.isOverlayOpen) {
          const activeOverlay = document.querySelector('.caption-overlay.active');
          if (activeOverlay) {
            const slideIndex = activeOverlay.dataset.slideIndex;
            const slide = this.slides[slideIndex];
            const expandBtn = slide.querySelector('.caption-expand-btn.mobile-expand-btn');
            this.closeOverlay(activeOverlay, expandBtn);
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
        
        if (this.overlayJustClosed) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      
      if (!this.isDesktop && this.isOverlayOpen) return;
      this.nextSlide();
    });
    
    this.container.appendChild(prevZone);
    this.container.appendChild(nextZone);
  }
  
  handleSwipe(startX, endX) {
    if (!this.isDesktop && this.isOverlayOpen) return;
    
    const swipeThreshold = 50;
    const diff = startX - endX;
    
    if (this.currentSlide === 0 && diff < 0) {
      return;
    }
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }
  
  prevSlide() {
    if (this.isAnimating || (!this.isDesktop && this.isOverlayOpen) || this.currentSlide === 0) return;
    
    const activeOverlay = document.querySelector('.caption-overlay.active');
    if (activeOverlay) {
      const slideIndex = activeOverlay.dataset.slideIndex;
      const slide = this.slides[slideIndex];
      const expandBtn = slide.querySelector('.caption-expand-btn');
      this.closeOverlay(activeOverlay, expandBtn);
    }
    
    this.goToSlide(this.currentSlide - 1, 'prev');
  }
  
  nextSlide() {
    if (this.isAnimating || (!this.isDesktop && this.isOverlayOpen)) return;
    
    const activeOverlay = document.querySelector('.caption-overlay.active');
    if (activeOverlay) {
      const slideIndex = activeOverlay.dataset.slideIndex;
      const slide = this.slides[slideIndex];
      const expandBtn = slide.querySelector('.caption-expand-btn');
      this.closeOverlay(activeOverlay, expandBtn);
    }
    
    if (this.currentSlide < this.totalSlides - 1) {
      this.goToSlide(this.currentSlide + 1, 'next');
    } else {
      this.closeStories();
    }
  }
  
  goToSlide(index, direction) {
    if (this.isAnimating || index < 0 || index >= this.totalSlides) return;
    
    const activeOverlay = document.querySelector('.caption-overlay.active');
    if (activeOverlay) {
      const slideIndex = activeOverlay.dataset.slideIndex;
      const slide = this.slides[slideIndex];
      const expandBtn = slide.querySelector('.caption-expand-btn');
      this.closeOverlay(activeOverlay, expandBtn);
    }
    
    this.isAnimating = true;
    
    const isGoingBack = direction === 'prev';
    
    if (isGoingBack) {
      for (let i = index + 1; i < this.totalSlides; i++) {
        this.visitedSlides.delete(i);
      }
    } else {
      this.visitedSlides.add(this.currentSlide);
    }
    
    const oldIndex = this.currentSlide;
    this.currentSlide = index;
    this.visitedSlides.add(index);
    
    if (this.slides[oldIndex]) {
      const prevImg = this.slides[oldIndex].querySelector('.story-image');
      if (prevImg) {
        this.slides[oldIndex].style.backgroundImage = `url(${prevImg.src})`;
      }
    }
    
    const currentImg = this.slides[index].querySelector('.story-image');
    if (currentImg) {
      this.slides[index].style.backgroundImage = `url(${currentImg.src})`;
    }
    
    this.slides[oldIndex].classList.remove('active');
    this.slides[oldIndex].classList.add(direction === 'next' ? 'prev' : 'next');
    
    this.slides[index].classList.remove('prev', 'next');
    this.slides[index].classList.add('active');
    
    this.updateProgressBars();
    this.updateArrowVisibility();
    
    setTimeout(() => {
      const captionContent = this.slides[index].querySelector('.story-caption-content');
      if (captionContent) {
        captionContent.scrollTop = 0;
      }
      
      const captionText = this.slides[index].querySelector('.story-caption-text');
      if (captionText) {
        captionText.scrollTop = 0;
      }
      
      this.isAnimating = false;
    }, 100);
  }
  
  closeOverlay(overlay, expandBtn) {
    const slideIndex = overlay.dataset.slideIndex;
    const slide = this.slides[slideIndex];
    
    overlay.classList.remove('active');
    
    if (!this.isDesktop) {
      const captionContainer = slide.querySelector('.story-caption-container');
      if (captionContainer) {
        captionContainer.classList.remove('hidden');
      }
      
      this.container.classList.remove('overlay-open');
    } else {
      const captionContent = slide.querySelector('.story-caption-content');
      if (captionContent) {
        captionContent.classList.remove('no-bg');
      }
      
      const captionContainer = slide.querySelector('.story-caption-container');
      if (captionContainer) {
        captionContainer.classList.remove('hidden');
      }
    }
    
    this.isOverlayOpen = false;
  }
  
  // ==================== НОВЫЙ МЕТОД: Показ полноэкранного оверлея ====================
  /**
   * Показывает полноэкранный оверлей с текстом подписи в верхней части экрана
   * @param {string} captionText - Полный текст подписи для отображения
   */
  showFullCaptionOverlay(captionText) {
    if (this.isOverlayOpen) return;
    
    // Ищем существующий оверлей или создаем новый
    let overlay = document.querySelector('.header-caption-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'caption-overlay mobile-overlay header-caption-overlay';
      
      const fullscreen = document.createElement('div');
      fullscreen.className = 'caption-fullscreen';
      
      const content = document.createElement('div');
      content.className = 'caption-fullscreen-content';
      
      fullscreen.appendChild(content);
      overlay.appendChild(fullscreen);
      
      this.container.appendChild(overlay);
      
      // Обработчик закрытия по клику на фон
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeHeaderCaptionOverlay();
        }
      });
    }
    
    // Заполняем текст
    overlay.querySelector('.caption-fullscreen-content').textContent = captionText;
    
    // Показываем оверлей
    overlay.classList.add('active');
    this.isOverlayOpen = true;
    this.container.classList.add('overlay-open');
    
    // Прокручиваем в начало
    setTimeout(() => {
      overlay.scrollTop = 0;
      overlay.querySelector('.caption-fullscreen-content').scrollTop = 0;
    }, 10);
    
    console.log('🎯 Оверлей с подписью открыт');
  }
  
  // ==================== НОВЫЙ МЕТОД: Закрытие оверлея ====================
  /**
   * Закрывает оверлей шапки (header overlay)
   */
  closeHeaderCaptionOverlay() {
    const overlay = document.querySelector('.header-caption-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    this.isOverlayOpen = false;
    this.container.classList.remove('overlay-open');
    
    // Восстанавливаем управление
    setTimeout(() => {
      this.isAnimating = false;
    }, 100);
    
    console.log('🎯 Оверлей с подписью закрыт');
  }
  
  updateProgressBars() {
    const bars = this.progressContainer.querySelectorAll('.progress-bar');
    
    bars.forEach((bar, index) => {
      const fill = bar.querySelector('.progress-fill');
      
      const isViewed = index < this.currentSlide || this.visitedSlides.has(index) || index === this.currentSlide;
      
      if (isViewed) {
        fill.style.width = '100%';
        fill.style.backgroundColor = 'rgba(255, 255, 255, 1)';
      } else {
        fill.style.width = '0%';
      }
    });
  }
  
  closeStories() {
    const referrer = document.referrer;
    
    if (referrer && referrer !== window.location.href) {
      window.location.replace(referrer);
    } else {
      window.location.replace(`${this.placeId}.html`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.storiesManager = new StoriesManager();
});
