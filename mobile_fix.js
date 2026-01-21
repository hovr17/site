// spa.js - Основной SPA контроллер
class SPAController {
    constructor() {
        this.routes = {
            'Spaso_Preobrazhensky.html': 'Spaso_Preobrazhensky',
            'Ilya_Prorok.html': 'Ilya_Prorok',
            'Ilya_Prorok2.html': 'Ilya_Prorok2',
            'Boris_Gleb.html': 'Boris_Gleb',
            'Nikola_Nadein.html': 'Nikola_Nadein',
            'Spasa_na_Gorodische.html': 'Spasa_na_Gorodische',
            'Petropavlovsky.html': 'Petropavlovsky',
            'Bogoyavlensky.html': 'Bogoyavlensky',
            'Spaso_Preobrazhensky_na_Torgu.html': 'Spaso_Preobrazhensky_na_Torgu'
        };

        this.templates = new Map();
        this.currentPage = null;
        this.isInitialized = false;
        
        console.log('🚀 SPA Controller инициализирован');
    }

    async init() {
        try {
            // Загружаем все шаблоны страниц
            await this.loadAllTemplates();
            
            // Определяем начальную страницу
            const initialPage = this.getInitialPage();
            
            // Отображаем начальную страницу
            await this.navigateTo(initialPage, false);
            
            // Настраиваем обработчики
            this.setupEventListeners();
            this.setupHistoryAPI();
            
            this.isInitialized = true;
            console.log('✅ SPA готов к работе');
        } catch (error) {
            console.error('❌ Ошибка инициализации SPA:', error);
        }
    }

    async loadAllTemplates() {
        console.log('📥 Загрузка шаблонов страниц...');
        
        const loadPromises = [];
        
        for (const [url, name] of Object.entries(this.routes)) {
            loadPromises.push(this.loadTemplate(url, name));
        }
        
        await Promise.allSettled(loadPromises);
        console.log(`✅ Загружено ${this.templates.size} шаблонов`);
    }

    async loadTemplate(url, name) {
        try {
            console.log(`📥 Загрузка шаблона: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                cache: 'force-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Извлекаем основной контент (элемент #frame и его содержимое)
            const frame = doc.querySelector('#frame');
            if (!frame) {
                throw new Error('Элемент #frame не найден');
            }
            
            // Сохраняем шаблон
            this.templates.set(name, {
                html: frame.outerHTML,
                title: doc.title || name,
                url: url
            });
            
            console.log(`✅ Шаблон загружен: ${name}`);
        } catch (error) {
            console.warn(`⚠️ Не удалось загрузить шаблон ${name}:`, error.message);
            
            // Создаем fallback шаблон
            this.templates.set(name, {
                html: `<div id="frame" class="container mode-intro">
                    <h1>Страница ${name}</h1>
                    <p>Не удалось загрузить контент</p>
                </div>`,
                title: name,
                url: url
            });
        }
    }

    getInitialPage() {
        // Извлекаем страницу из URL или используем первую
        const path = window.location.pathname;
        const fileName = path.split('/').pop();
        
        if (fileName && this.routes[fileName]) {
            return this.routes[fileName];
        }
        
        // Если URL пустой или не распознан, используем первую страницу
        return this.routes['Spaso_Preobrazhensky.html'];
    }

    async navigateTo(pageName, updateHistory = true, direction = 'next') {
        if (pageName === this.currentPage) return;
        
        console.log(`🚀 Навигация на: ${pageName}`);
        
        // Получаем шаблон
        const template = this.templates.get(pageName);
        if (!template) {
            console.error(`❌ Шаблон ${pageName} не найден`);
            return;
        }
        
        // Анимация перехода
        await this.performTransition(template, direction);
        
        // Обновляем текущую страницу
        this.currentPage = pageName;
        
        // Обновляем History API
        if (updateHistory) {
            window.history.pushState(
                { page: pageName, url: template.url },
                template.title,
                template.url
            );
        }
        
        // Обновляем заголовок
        document.title = template.title;
        
        // Инициализируем скрипты страницы
        await this.initializePageScripts();
        
        console.log(`✅ Навигация завершена: ${pageName}`);
    }

    async performTransition(template, direction) {
        const app = document.getElementById('app');
        if (!app) return;
        
        // Создаем новый элемент
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = template.html;
        const newFrame = tempDiv.firstElementChild;
        
        // Настраиваем стили для анимации
        newFrame.style.position = 'fixed';
        newFrame.style.top = '0';
        newFrame.style.left = '0';
        newFrame.style.width = '100%';
        newFrame.style.height = '100%';
        newFrame.style.zIndex = '1000';
        
        // Определяем анимацию в зависимости от направления
        const isMobile = window.innerWidth <= 1080;
        const shouldAnimate = isMobile;
        
        if (shouldAnimate) {
            const startPosition = direction === 'next' ? '100%' : '-100%';
            newFrame.style.transform = `translateX(${startPosition})`;
            newFrame.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        // Добавляем новый фрейм
        app.appendChild(newFrame);
        
        // Убираем старый фрейм
        const oldFrame = app.querySelector('#frame:not(:last-child)');
        
        if (shouldAnimate && oldFrame) {
            // Анимируем старый фрейм
            oldFrame.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            const exitPosition = direction === 'next' ? '-100%' : '100%';
            
            requestAnimationFrame(() => {
                oldFrame.style.transform = `translateX(${exitPosition})`;
                newFrame.style.transform = 'translateX(0)';
                
                // Удаляем старый фрейм после анимации
                setTimeout(() => {
                    if (oldFrame.parentNode) {
                        oldFrame.parentNode.removeChild(oldFrame);
                    }
                }, 400);
            });
        } else {
            // Без анимации
            if (oldFrame && oldFrame.parentNode) {
                oldFrame.parentNode.removeChild(oldFrame);
            }
        }
        
        // Убираем временные стили
        setTimeout(() => {
            newFrame.style.cssText = '';
        }, shouldAnimate ? 400 : 0);
    }

    async initializePageScripts() {
        console.log('🔄 Инициализация скриптов страницы...');
        
        // Инициализация меню
        if (window.initializeMenu && typeof window.initializeMenu === 'function') {
            window.initializeMenu();
        }
        
        // Обновление стрелок навигации
        if (window.navigationConfig && window.navigationConfig.updateNavArrows) {
            setTimeout(() => {
                window.navigationConfig.updateNavArrows();
            }, 50);
        }
        
        // Инициализация видео
        const video = document.querySelector('#bgVideo');
        if (video) {
            try {
                video.currentTime = 0;
                video.muted = true;
                await video.play();
                console.log('▶️ Видео запущено');
            } catch (error) {
                console.log('⏸️ Автовоспроизведение видео заблокировано');
            }
        }
        
        console.log('✅ Скрипты инициализированы');
    }

    setupEventListeners() {
        // Обработка кликов по ссылкам
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Пропускаем внешние ссылки и якоря
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) {
                return;
            }
            
            // Определяем, является ли ссылка навигацией между страницами SPA
            const fileName = href.split('/').pop();
            const pageName = this.routes[fileName];
            
            if (pageName) {
                e.preventDefault();
                this.navigateTo(pageName, true, 'next');
            }
        });
        
        // Обработка свайпов
        this.setupSwipeListeners();
        
        // Обработка клавиатуры
        this.setupKeyboardListeners();
    }

    setupSwipeListeners() {
        const app = document.getElementById('app');
        if (!app) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        const SWIPE_THRESHOLD = 50;
        
        app.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        app.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Проверяем, что свайп горизонтальный
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
                e.preventDefault();
                
                if (deltaX > 0) {
                    // Свайп вправо - предыдущая страница
                    this.navigateToPrev();
                } else {
                    // Свайп влево - следующая страница
                    this.navigateToNext();
                }
            }
        }, { passive: false });
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Пропускаем если фокус в поле ввода
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.isContentEditable) {
                return;
            }
            
            // Проверяем, открыт ли дропдаун
            const isDropdownOpen = document.querySelector('.dropdown.open');
            if (isDropdownOpen) return;
            
            // Обработка стрелок
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateToPrev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateToNext();
                    break;
                case 'Escape':
                    // Возврат в intro режим
                    if (window.setMode && typeof window.setMode === 'function') {
                        const frame = document.getElementById('frame');
                        if (frame && frame.classList.contains('mode-details')) {
                            window.setMode('intro');
                        }
                    }
                    break;
            }
        });
    }

    setupHistoryAPI() {
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                console.log('🔄 Popstate:', event.state.page);
                this.navigateTo(event.state.page, false);
            }
        });
        
        // Инициализируем начальное состояние истории
        if (window.history.state === null && this.currentPage) {
            const currentTemplate = this.templates.get(this.currentPage);
            if (currentTemplate) {
                window.history.replaceState(
                    { page: this.currentPage, url: currentTemplate.url },
                    currentTemplate.title,
                    currentTemplate.url
                );
            }
        }
    }

    navigateToNext() {
        const pageOrder = [
            'Spaso_Preobrazhensky',
            'Ilya_Prorok',
            'Ilya_Prorok2',
            'Boris_Gleb',
            'Nikola_Nadein',
            'Spasa_na_Gorodische',
            'Petropavlovsky',
            'Bogoyavlensky',
            'Spaso_Preobrazhensky_na_Torgu'
        ];
        
        const currentIndex = pageOrder.indexOf(this.currentPage);
        if (currentIndex < pageOrder.length - 1) {
            this.navigateTo(pageOrder[currentIndex + 1], true, 'next');
        }
    }

    navigateToPrev() {
        const pageOrder = [
            'Spaso_Preobrazhensky',
            'Ilya_Prorok',
            'Ilya_Prorok2',
            'Boris_Gleb',
            'Nikola_Nadein',
            'Spasa_na_Gorodische',
            'Petropavlovsky',
            'Bogoyavlensky',
            'Spaso_Preobrazhensky_na_Torgu'
        ];
        
        const currentIndex = pageOrder.indexOf(this.currentPage);
        if (currentIndex > 0) {
            this.navigateTo(pageOrder[currentIndex - 1], true, 'prev');
        }
    }

    // API для внешнего использования
    getCurrentPage() {
        return this.currentPage;
    }

    getPageUrl(pageName) {
        const template = this.templates.get(pageName);
        return template ? template.url : null;
    }
}

// Инициализация SPA при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    window.SPA = new SPAController();
    await window.SPA.init();
    
    console.log('✅ SPA приложение запущено');
    
    // Экспортируем глобальные функции для навигации
    window.navigateToNextPage = () => window.SPA.navigateToNext();
    window.navigateToPrevPage = () => window.SPA.navigateToPrev();
    
    // Обновляем конфиг навигации
    if (window.navigationConfig) {
        window.navigationConfig.navigateToNextPage = () => window.SPA.navigateToNext();
        window.navigationConfig.navigateToPrevPage = () => window.SPA.navigateToPrev();
        window.navigationConfig.navigateToPage = (pageName, direction) => {
            const pageOrder = [
                'Spaso_Preobrazhensky',
                'Ilya_Prorok',
                'Ilya_Prorok2',
                'Boris_Gleb',
                'Nikola_Nadein',
                'Spasa_na_Gorodische',
                'Petropavlovsky',
                'Bogoyavlensky',
                'Spaso_Preobrazhensky_na_Torgu'
            ];
            
            const pageNameNormalized = pageName.replace('.html', '')
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('_');
            
            if (pageOrder.includes(pageNameNormalized)) {
                window.SPA.navigateTo(pageNameNormalized, true, direction);
            }
        };
    }
});