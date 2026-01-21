// spa_transition_manager.js - ОБНОВЛЕННЫЙ
class PageTransitionManager {
    constructor() {
        this.isTransitioning = false;
        this.transitionDuration = 500;
        this.init();
    }
    
    init() {
        console.log('PageTransitionManager инициализирован');
        window.pageTransitionManager = this;
        
        // Устанавливаем базовые стили для контейнера
        if (!document.getElementById('spa-container')) {
            const container = document.createElement('div');
            container.id = 'spa-container';
            container.style.cssText = `
                position: relative;
                width: 100%;
                height: 100vh;
                overflow: hidden;
            `;
            
            // Перемещаем существующий контент в контейнер
            const frame = document.getElementById('frame');
            if (frame && frame.parentNode) {
                document.body.insertBefore(container, frame);
                container.appendChild(frame);
            }
        }
    }
    
    navigateToPage(pageName, direction = 'next') {
        if (this.isTransitioning) return;
        if (window.isBottomMenuOpen && window.isBottomMenuOpen()) return;
        
        this.isTransitioning = true;
        console.log(`🚀 SPA-переход на: ${pageName} (направление: ${direction})`);
        
        this.loadPage(pageName)
            .then(html => this.performTransition(html, pageName, direction))
            .catch(error => {
                console.error('Ошибка:', error);
                this.fallbackNavigation(pageName, direction);
            });
    }
    
    loadPage(pageName) {
        return new Promise((resolve, reject) => {
            fetch(pageName, {
                method: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.ok ? response.text() : reject())
            .then(resolve)
            .catch(reject);
        });
    }
    
    performTransition(newPageHtml, pageName, direction) {
        // Получаем контейнер
        const container = document.getElementById('spa-container') || document.body;
        const currentFrame = document.getElementById('frame');
        
        if (!currentFrame) {
            this.isTransitioning = false;
            return;
        }
        
        // Создаем временный контейнер для парсинга
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newPageHtml;
        const newFrameContent = tempDiv.querySelector('#frame');
        
        if (!newFrameContent) {
            this.isTransitioning = false;
            return;
        }
        
        // Создаем новую страницу
        const newFrame = document.createElement('div');
        newFrame.id = 'frame-new';
        newFrame.className = currentFrame.className;
        newFrame.innerHTML = newFrameContent.innerHTML;
        
        // Настраиваем стили для одновременной анимации
        this.setupAnimationStyles(currentFrame, newFrame, direction);
        
        // Добавляем новую страницу в контейнер
        container.appendChild(newFrame);
        
        // Блокируем взаимодействие
        document.body.classList.add('page-transition-active');
        
        // Запускаем одновременную анимацию
        requestAnimationFrame(() => {
            // ОБЕ страницы двигаются одновременно
            if (direction === 'next') {
                // Текущая уезжает влево, новая приезжает справа
                currentFrame.classList.add('page-exit-left');
                newFrame.classList.add('page-enter-left');
            } else {
                // Текущая уезжает вправо, новая приезжает слева
                currentFrame.classList.add('page-exit-right');
                newFrame.classList.add('page-enter-right');
            }
        });
        
        // После анимации
        setTimeout(() => {
            // Удаляем старую страницу
            if (currentFrame.parentNode) {
                currentFrame.parentNode.removeChild(currentFrame);
            }
            
            // Переименовываем новую страницу
            newFrame.id = 'frame';
            newFrame.classList.remove('page-enter-left', 'page-enter-right');
            
            // Обновляем URL
            window.history.pushState({}, '', pageName);
            
            // Переинициализируем
            this.reinitializeScripts();
            
            // Разблокируем
            document.body.classList.remove('page-transition-active');
            this.isTransitioning = false;
            
            console.log('✅ Переход завершен');
        }, this.transitionDuration);
    }
    
    setupAnimationStyles(currentFrame, newFrame, direction) {
        // Устанавливаем общие стили для обеих страниц
        const frameStyle = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transition: transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1; /* ОДИНАКОВЫЙ Z-INDEX! */
        `;
        
        currentFrame.style.cssText = frameStyle;
        newFrame.style.cssText = frameStyle;
        
        // Начальные позиции
        if (direction === 'next') {
            // Текущая на экране, новая справа за экраном
            currentFrame.style.transform = 'translateX(0)';
            newFrame.style.transform = 'translateX(100%)';
        } else {
            // Текущая на экране, новая слева за экраном
            currentFrame.style.transform = 'translateX(0)';
            newFrame.style.transform = 'translateX(-100%)';
        }
    }
    
    reinitializeScripts() {
        // Переинициализация видео
        const bgVideo = document.getElementById('bgVideo');
        if (bgVideo) {
            bgVideo.muted = true;
            setTimeout(() => {
                bgVideo.play().catch(() => {});
            }, 100);
        }
        
        // Обновление навигации
        if (window.navigationConfig?.updateNavArrows) {
            setTimeout(() => window.navigationConfig.updateNavArrows(), 50);
        }
        
        // Сброс скролла
        const scrollZone = document.getElementById('scrollZone');
        if (scrollZone) scrollZone.scrollTop = 0;
        
        // Сброс режима
        const frame = document.getElementById('frame');
        if (frame) {
            frame.classList.remove('mode-details');
            frame.classList.add('mode-intro');
        }
    }
    
    fallbackNavigation(pageName, direction) {
        console.log('🔄 Fallback навигация');
        sessionStorage.setItem('transitionDirection', direction);
        setTimeout(() => {
            window.location.href = pageName;
        }, 400);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    window.pageTransitionManager = new PageTransitionManager();
});