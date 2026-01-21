class PageTransitionManager {
    constructor() {
        this.currentPage = null;
        this.isTransitioning = false;
        this.pagesCache = new Map();
        this.mediaCache = new Map();
        this.swipeThreshold = 50;
        this.swipeRestraint = 100;
        this.isPreloading = false;
        this.preloadQueue = [];
        this.isProcessingQueue = false;

        console.log('🚀 PageTransitionManager инициализирован');
    }

    async init() {
        try {
            this.currentPage = {
                url: window.location.pathname.split('/').pop() || 'index.html',
                index: window.navigationConfig?.getCurrentPageIndex?.() || 0,
                title: document.title
            };

            console.log(`📄 Текущая страница: ${this.currentPage.url} (индекс: ${this.currentPage.index})`);

            await this.cacheCurrentPage();
            await this.preloadAdjacentPages();
            this.setupEventListeners();
            this.setupHistoryHandlers();
            this.setupArrowPreload();
            this.startMediaPreloadQueue();

            console.log('✅ PageTransitionManager готов к работе');

        } catch (error) {
            console.error('❌ Ошибка инициализации PageTransitionManager:', error);
        }
    }

    async cacheCurrentPage() {
        const pageUrl = this.currentPage.url;
        if (!this.pagesCache.has(pageUrl)) {
            const frame = document.getElementById('frame');
            if (frame) {
                this.pagesCache.set(pageUrl, {
                    html: frame.outerHTML,
                    title: document.title,
                    timestamp: Date.now()
                });
                console.log(`📦 Текущая страница закэширована: ${pageUrl}`);
            }
        }
    }

    async preloadAdjacentPages() {
        if (!window.navigationConfig?.PAGE_ORDER) return;

        const currentIndex = this.currentPage.index;
        const preloadUrls = [];

        if (currentIndex > 0) {
            preloadUrls.push(window.navigationConfig.PAGE_ORDER[currentIndex - 1]);
        }
        if (currentIndex < window.navigationConfig.PAGE_ORDER.length - 1) {
            preloadUrls.push(window.navigationConfig.PAGE_ORDER[currentIndex + 1]);
        }

        console.log(`🔍 Предзагрузка соседних страниц:`, preloadUrls);

        await Promise.allSettled(
            preloadUrls.map(url => this.loadAndCachePage(url))
        );
    }

    async loadAndCachePage(pageUrl) {
        if (this.pagesCache.has(pageUrl)) {
            this.scheduleMediaPreload(pageUrl);
            return;
        }

        try {
            console.log(`📥 Загрузка страницы в кэш: ${pageUrl}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(pageUrl, {
                method: 'GET',
                credentials: 'include',
                signal: controller.signal,
                cache: 'force-cache'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const frameElement = doc.getElementById('frame');
            if (!frameElement) {
                throw new Error('Элемент #frame не найден');
            }

            this.pagesCache.set(pageUrl, {
                html: frameElement.outerHTML,
                title: doc.title,
                timestamp: Date.now()
            });

            console.log(`✅ Страница закэширована: ${pageUrl}`);

            this.scheduleMediaPreload(pageUrl);

        } catch (error) {
            console.warn(`⚠️ Не удалось закэшировать ${pageUrl}:`, error.message);
        }
    }

    scheduleMediaPreload(pageUrl) {
        if (this.mediaCache.has(pageUrl)) return;

        const pageData = this.pagesCache.get(pageUrl);
        if (!pageData) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageData.html;

        const video = tempDiv.querySelector('#bgVideo');
        if (video) {
            const mediaItem = {
                type: 'video',
                url: video.getAttribute('src'),
                poster: video.getAttribute('poster'),
                pageUrl: pageUrl
            };

            if (mediaItem.url && !this.mediaCache.has(mediaItem.url)) {
                this.preloadQueue.push(mediaItem);
                console.log(`📹 Видео добавлено в очередь предзагрузки: ${mediaItem.url}`);
            }

            if (mediaItem.poster && !this.mediaCache.has(mediaItem.poster)) {
                this.preloadQueue.push({
                    type: 'image',
                    url: mediaItem.poster,
                    pageUrl: pageUrl
                });
                console.log(`🖼️ Постер добавлен в очередь предзагрузки: ${mediaItem.poster}`);
            }
        }
    }

    startMediaPreloadQueue() {
        setInterval(() => {
            this.processPreloadQueue();
        }, 500);
    }

    async processPreloadQueue() {
        if (this.isProcessingQueue || this.preloadQueue.length === 0) return;

        this.isProcessingQueue = true;

        while (this.preloadQueue.length > 0) {
            const item = this.preloadQueue.shift();

            if (this.mediaCache.has(item.url)) {
                continue;
            }

            try {
                console.log(`⬇️ Предзагрузка: ${item.url}`);

                if (item.type === 'video') {
                    await this.preloadVideo(item.url, item.poster);
                } else if (item.type === 'image') {
                    await this.preloadImage(item.url);
                }

                this.mediaCache.set(item.url, {
                    loaded: true,
                    timestamp: Date.now()
                });

                console.log(`✅ Загружено: ${item.url}`);

            } catch (error) {
                console.warn(`⚠️ Ошибка предзагрузки ${item.url}:`, error.message);
            }
        }

        this.isProcessingQueue = false;
    }

    async preloadVideo(videoUrl, posterUrl) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';

            video.addEventListener('canplaythrough', () => {
                resolve();
            }, { once: true });

            video.addEventListener('error', (e) => {
                if (posterUrl) {
                    this.preloadImage(posterUrl).then(() => resolve()).catch(reject);
                } else {
                    reject(new Error(`Ошибка загрузки видео: ${videoUrl}`));
                }
            }, { once: true });

            video.src = videoUrl;

            if (posterUrl) {
                video.poster = posterUrl;
            }
        });
    }

    async preloadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.addEventListener('load', () => {
                resolve();
            }, { once: true });

            img.addEventListener('error', () => {
                reject(new Error(`Ошибка загрузки изображения: ${imageUrl}`));
            }, { once: true });

            img.src = imageUrl;
        });
    }

    setupArrowPreload() {
        const prevArrow = document.getElementById('templePrevArrow');
        const nextArrow = document.getElementById('templeNextArrow');

        const preloadOnHover = (arrow) => {
            if (!arrow) return;

            arrow.addEventListener('mouseenter', () => {
                if (this.isPreloading || this.isTransitioning) return;

                const currentIndex = this.currentPage.index;
                let targetPage = null;

                if (arrow.id === 'templePrevArrow' && currentIndex > 0) {
                    targetPage = window.navigationConfig.PAGE_ORDER[currentIndex - 1];
                } else if (arrow.id === 'templeNextArrow' && currentIndex < window.navigationConfig.PAGE_ORDER.length - 1) {
                    targetPage = window.navigationConfig.PAGE_ORDER[currentIndex + 1];
                }

                if (targetPage) {
                    console.log(`🎯 Предзагрузка при наведении: ${targetPage}`);
                    this.loadAndCachePage(targetPage).catch(() => {});
                }
            }, { once: false });
        };

        preloadOnHover(prevArrow);
        preloadOnHover(nextArrow);
    }

    setupEventListeners() {
        console.log('🔄 Настройка обработчиков событий...');
        this.setupSwipeListeners();
        this.setupKeyboardListeners();
    }

    setupSwipeListeners() {
        const scrollZone = document.getElementById('scrollZone');
        if (!scrollZone) return;

        let isSwiping = false;
        let swipeStartX = 0;
        let swipeStartY = 0;
        let currentFrame = null;

        scrollZone.addEventListener('touchstart', (e) => {
            if (this.isTransitioning ||
                (window.placeMenu && window.placeMenu.isAnimating()) ||
                (window.isBottomMenuOpen && window.isBottomMenuOpen())) {
                return;
            }

            isSwiping = true;
            swipeStartX = e.touches[0].clientX;
            swipeStartY = e.touches[0].clientY;
            currentFrame = document.getElementById('frame');

        }, { passive: true });

        scrollZone.addEventListener('touchmove', (e) => {
            if (!isSwiping || !currentFrame) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - swipeStartX;
            const deltaY = touchY - swipeStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();

                const maxOffset = window.innerWidth * 0.3;
                const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX * 0.5));
                currentFrame.style.transform = `translateX(${offset}px)`;
                currentFrame.style.transition = 'none';
            }
        }, { passive: false });

        scrollZone.addEventListener('touchend', (e) => {
            if (!isSwiping || !currentFrame) return;

            isSwiping = false;
            const touchX = e.changedTouches[0].clientX;
            const touchY = e.changedTouches[0].clientY;

            const deltaX = touchX - swipeStartX;
            const deltaY = touchY - swipeStartY;

            currentFrame.style.transform = '';
            currentFrame.style.transition = '';

            const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
            const isSignificantSwipe = Math.abs(deltaX) > this.swipeThreshold;
            const isNotScrolling = Math.abs(deltaY) < this.swipeRestraint;

            if (isHorizontalSwipe && isSignificantSwipe && isNotScrolling) {
                e.preventDefault();

                if (deltaX > 0) {
                    console.log('👆 Свайп вправо → предыдущая');
                    this.navigate('prev');
                } else {
                    console.log('👆 Свайп влево → следующая');
                    this.navigate('next');
                }
            }

            swipeStartX = 0;
            swipeStartY = 0;
            currentFrame = null;

        }, { passive: false });
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable) {
                return;
            }

            const isDropdownOpen = document.querySelector('.dropdown.open');
            if (isDropdownOpen) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigate('prev');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigate('next');
            }
        });
    }

    setupHistoryHandlers() {
        window.addEventListener('popstate', (event) => {
            console.log('🔄 Popstate:', event.state);

            if (event.state && event.state.pageUrl) {
                const pageIndex = window.navigationConfig.PAGE_ORDER.indexOf(event.state.pageUrl);
                const direction = pageIndex > this.currentPage.index ? 'next' : 'prev';

                this.performTransition(event.state.pageUrl, direction, false)
                    .then(() => {
                        this.currentPage = {
                            url: event.state.pageUrl,
                            index: pageIndex,
                            title: event.state.title || document.title
                        };
                    })
                    .catch(error => {
                        console.error('Ошибка при обработке popstate:', error);
                        window.location.href = event.state.pageUrl;
                    });
            }
        });

        if (window.history.state === null) {
            window.history.replaceState({
                pageUrl: this.currentPage.url,
                index: this.currentPage.index,
                title: this.currentPage.title
            }, this.currentPage.title, this.currentPage.url);
        }
    }

    async navigate(direction) {
        if (this.isTransitioning) {
            console.log('⏳ Переход уже выполняется, пропускаем...');
            return;
        }

        if (!window.navigationConfig?.PAGE_ORDER) {
            console.error('❌ navigationConfig не найден');
            return;
        }

        const currentIndex = this.currentPage.index;
        let targetIndex, targetPage;

        if (direction === 'next' && currentIndex < window.navigationConfig.PAGE_ORDER.length - 1) {
            targetIndex = currentIndex + 1;
            targetPage = window.navigationConfig.PAGE_ORDER[targetIndex];
        } else if (direction === 'prev' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
            targetPage = window.navigationConfig.PAGE_ORDER[targetIndex];
        } else {
            console.log(`🎯 Невозможно перейти ${direction}: граница списка`);
            return;
        }

        console.log(`🚀 Начинаем переход ${direction} на: ${targetPage}`);

        try {
            this.isTransitioning = true;

            if (!this.pagesCache.has(targetPage)) {
                console.log(`📥 Страница не в кэше, загружаем: ${targetPage}`);
                await this.loadAndCachePage(targetPage);
            }

            await this.performTransition(targetPage, direction);

            this.currentPage = {
                url: targetPage,
                index: targetIndex,
                title: this.pagesCache.get(targetPage)?.title || targetPage
            };

            window.history.pushState({
                pageUrl: targetPage,
                index: targetIndex,
                title: this.currentPage.title
            }, this.currentPage.title, targetPage);

            document.title = this.currentPage.title;
            this.preloadAdjacentPages();

            console.log(`✅ Переход завершен: ${targetPage}`);

        } catch (error) {
            console.error(`❌ Ошибка перехода на ${targetPage}:`, error);

            if (window.navigationConfig.navigateToPage) {
                window.navigationConfig.navigateToPage(targetPage, direction);
            }

        } finally {
            this.isTransitioning = false;
        }
    }

    async navigateToPage(pageUrl, direction = 'next') {
        if (!window.navigationConfig?.PAGE_ORDER?.includes(pageUrl)) {
            console.error(`❌ Страница ${pageUrl} не найдена в PAGE_ORDER`);
            return;
        }

        const pageIndex = window.navigationConfig.PAGE_ORDER.indexOf(pageUrl);
        const calculatedDirection = pageIndex > this.currentPage.index ? 'next' : 'prev';

        await this.navigate(direction || calculatedDirection);
    }

    async performTransition(targetPage, direction, animate = true) {
        console.log(`🎬 Начинаем анимацию перехода ${direction} на ${targetPage}`);

        const isMobile = window.innerWidth <= 1080;
        const shouldAnimate = animate && isMobile;

        console.log(`📱 Устройство: ${isMobile ? 'Mobile' : 'Desktop'}, Анимация: ${shouldAnimate ? 'ON' : 'OFF'}`);

        const cachedData = this.pagesCache.get(targetPage);
        if (!cachedData) {
            throw new Error(`Страница ${targetPage} не найдена в кэше`);
        }

        const newFrame = this.createPageElement(cachedData.html);

        if (shouldAnimate) {
            const startPosition = direction === 'next' ? '100%' : '-100%';
            newFrame.style.transform = `translateX(${startPosition})`;
        } else {
            newFrame.style.transform = 'translateX(0)';
        }

        document.body.appendChild(newFrame);

        if (shouldAnimate) {
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        if (shouldAnimate) {
            await this.animateTransition(newFrame, direction);
        } else {
            const oldFrame = document.getElementById('frame');

            if (oldFrame && oldFrame.parentNode) {
                oldFrame.parentNode.removeChild(oldFrame);
            }

            newFrame.id = 'frame';
            newFrame.style.position = '';
            newFrame.style.zIndex = '';
            newFrame.style.pointerEvents = '';
            newFrame.style.transition = 'none';
            newFrame.style.transform = 'translateX(0)';

            newFrame.offsetHeight;
        }

        await this.initializePageScripts(newFrame);

        if (window.navigationConfig?.updateNavArrows) {
            setTimeout(() => {
                window.navigationConfig.updateNavArrows();
            }, 100);
        }

        console.log(`🎉 Переход завершен: ${targetPage}`);
    }

    createPageElement(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const newFrame = tempDiv.querySelector('#frame');
        if (!newFrame) {
            throw new Error('Не удалось извлечь элемент #frame из HTML');
        }

        newFrame.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            will-change: transform;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        `;

        return newFrame;
    }

    async animateTransition(newFrame, direction) {
        return new Promise((resolve) => {
            const oldFrame = document.getElementById('frame');

            if (oldFrame) {
                oldFrame.style.zIndex = '999';
                oldFrame.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                oldFrame.style.willChange = 'transform';
            }

            newFrame.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            newFrame.style.pointerEvents = 'none';

            requestAnimationFrame(() => {
                if (oldFrame) {
                    const exitPosition = direction === 'next' ? '-100%' : '100%';
                    oldFrame.style.transform = `translateX(${exitPosition})`;
                }

                newFrame.style.transform = 'translateX(0)';

                setTimeout(() => {
                    if (oldFrame && oldFrame.parentNode) {
                        oldFrame.parentNode.removeChild(oldFrame);
                    }

                    newFrame.id = 'frame';
                    newFrame.style.position = '';
                    newFrame.style.zIndex = '';
                    newFrame.style.pointerEvents = '';
                    newFrame.style.cssText = '';

                    resolve();
                }, 400);
            });
        });
    }

    async initializePageScripts(frameElement) {
        console.log('🔄 Инициализация скриптов новой страницы...');

        const video = frameElement.querySelector('#bgVideo');
        const poster = frameElement.querySelector('#videoPoster');

        if (video) {
            const posterSrc = video.getAttribute('poster');
            if (poster && posterSrc) {
                poster.style.backgroundImage = `url('${posterSrc}')`;
                console.log(`🖼️ Постер установлен: ${posterSrc}`);
            }

            try {
                // УБРАЛИ video.currentTime = 0;
                video.muted = true;
                
                // Проверяем, играет ли видео уже
                if (video.paused) {
                    // Если видео не играет, пробуем запустить
                    try {
                        await video.play();
                        console.log('▶️ Видео запущено');
                        
                        if (poster) {
                            poster.classList.add('hidden');
                            console.log('🖼️ Постер скрыт');
                        }
                    } catch (error) {
                        console.log('⏸️ Автовоспроизведение видео заблокировано');
                        if (poster) {
                            poster.style.opacity = '1';
                        }
                    }
                } else {
                    // Видео уже играет (благодаря autoplay), просто скрываем постер
                    console.log('▶️ Видео уже воспроизводится');
                    if (poster) {
                        poster.classList.add('hidden');
                        console.log('🖼️ Постер скрыт');
                    }
                }

            } catch (error) {
                console.log('⏸️ Ошибка инициализации видео:', error.message);
            }
        }

        const menuScript = document.createElement('script');
        menuScript.textContent = `
            if (typeof initializeMenu === 'function') {
                initializeMenu();
            }

            if (window.navigationConfig?.updateNavArrows) {
                setTimeout(() => {
                    window.navigationConfig.updateNavArrows();
                }, 50);
            }
        `;
        document.head.appendChild(menuScript);
        document.head.removeChild(menuScript);

        const dropdowns = frameElement.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const arrow = dropdown.querySelector('.dropdown-arrow');
            if (arrow) {
                const newArrow = arrow.cloneNode(true);
                arrow.parentNode.replaceChild(newArrow, arrow);

                newArrow.addEventListener('click', function(e) {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                });
            }
        });

        console.log('✅ Скрипты инициализированы');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => {
        const checkConfig = () => {
            if (window.navigationConfig) {
                resolve();
            } else {
                setTimeout(checkConfig, 100);
            }
        };
        checkConfig();
    });

    window.pageTransitionManager = new PageTransitionManager();
    await window.pageTransitionManager.init();

    console.log('✅ PageTransitionManager готов к работе');
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTransitionManager;
}