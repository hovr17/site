 // spa_router.js - FINAL VERSION (Robust Video + Network Retry)
console.log('spa_router.js загружен (Final Video Fix)');

class SPARouter {
    constructor() {
        this.currentPlaceId = null;
        this.currentCategory = null;
        this.PLACE_PARAM = 'id';
        this.CATEGORY_PARAM = 'cat';
        this.isAnimating = false;
        this.videoRetryCount = 0;
        this.maxVideoRetries = 2;
    }

    getParamsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const placeId = urlParams.get(this.PLACE_PARAM);
        const category = urlParams.get(this.CATEGORY_PARAM) || 'religious';
        
        if (!placeId && window.PAGE_ORDER_BY_CATEGORY?.[category]) {
            return {
                placeId: window.PAGE_ORDER_BY_CATEGORY[category][0],
                category: category
            };
        }
        
        return { placeId, category };
    }

    updateURL(placeId, category) {
        const newUrl = `${window.location.pathname}?${this.PLACE_PARAM}=${placeId}&${this.CATEGORY_PARAM}=${category}`;
        window.history.pushState({ placeId, category }, '', newUrl);
        document.title = window.pagesManager.config?.title || '';
    }

    setupPopStateHandler() {
        window.addEventListener('popstate', (event) => {
            console.log('🔄 Popstate:', event.state);
            this.isAnimating = false;
            
            if (event.state?.placeId && event.state?.category) {
                this.navigateToPlace(event.state.placeId, event.state.category, false, 'prev');
            }
        });
    }

    navigateToPlace(placeId, category, updateHistory = true, direction = 'next') {
        if (!placeId) {
            console.error('❌ ID места не указан');
            return false;
        }

        if (placeId === this.currentPlaceId && category === this.currentCategory) {
            console.log('⏳ Уже на этом месте:', placeId);
            return true;
        }

        if (this.isAnimating) {
            console.warn('⏳ Анимация уже выполняется, пропуск');
            return false;
        }

        console.log(`🚀 Навигация к: ${placeId} (категория: ${category}, направление: ${direction})`);

        const isMobile = window.innerWidth <= 1080;
        const useAnimation = isMobile && updateHistory;
        const frame = document.getElementById('frame');

        try {
            const config = getPlaceConfig(placeId, category);
            if (!config) {
                console.error(`❌ Конфиг для ${placeId}/${category} не найден`);
                return false;
            }

            const completeNavigation = () => {
                this.currentPlaceId = placeId;
                this.currentCategory = category;
                this.isAnimating = false;

                window.pagesManager.setPlaceId(placeId, category);
                window.pagesManager.applyConfig();

                // 📱 ЗАГРУЗКА ВИДЕО (Без fetch, с обработкой сетевых ошибок)
                this.loadVideoSafe();

                if (updateHistory) {
                    this.updateURL(placeId, category);
                }

                if (typeof window.initializeMenu === 'function') {
                    window.initializeMenu();
                }

                if (window.updateNavArrows) {
                    window.updateNavArrows();
                }

                console.log(`✅ Переход к ${placeId} завершен`);
            };

            if (useAnimation && frame) {
                this.isAnimating = true;
                console.log('📚 Запуск анимации Layered Parallax');
                
                frame.classList.remove(
                    'page-exit-parallax-left', 'page-exit-parallax-right', 
                    'page-enter-parallax-left', 'page-enter-parallax-right'
                );
                
                const exitClass = direction === 'next' ? 'page-exit-parallax-left' : 'page-exit-parallax-right';
                frame.classList.add(exitClass);
                
                setTimeout(() => {
                    completeNavigation();
                    
                    frame.classList.remove(exitClass);
                    const enterClass = direction === 'next' ? 'page-enter-parallax-left' : 'page-enter-parallax-right';
                    frame.classList.add(enterClass);
                    
                    setTimeout(() => {
                        frame.classList.remove(enterClass);
                    }, 800);
                }, 150);
            } else {
                completeNavigation();
            }

            return true;

        } catch (error) {
            console.error(`❌ Ошибка перехода к ${placeId}:`, error);
            this.isAnimating = false;
            return false;
        }
    }

    // 🆕 БЕЗОПАСНАЯ ЗАГРУЗКА ВИДЕО (С Retry для сетевых ошибок)
    loadVideoSafe() {
        const bgVideo = document.getElementById('bgVideo');
        const videoPoster = document.getElementById('videoPoster');
        
        if (!bgVideo) return;
        
        const videoSrc = window.pagesManager.config?.video?.src;
        const posterSrc = window.pagesManager.config?.video?.poster;
        
        console.log('🎬 Начало загрузки видео:', videoSrc);
        
        // 1. Если видео нет в конфиге -> показываем постер
        if (!videoSrc) {
            console.log('⚠️ Видео не указано в конфиге');
            this.showFallback(posterSrc);
            return;
        }

        let loadAttempts = 0;
        const maxLoadRetries = 3; // Количество попыток загрузки файла при сетевых ошибках

        const attemptLoad = () => {
            // Сбрасываем обработчики перед каждой попыткой, чтобы избежать дублей
            bgVideo.onloadeddata = null;
            bgVideo.onerror = null;
            
            // 2. Полный сброс предыдущего состояния
            bgVideo.pause();
            bgVideo.removeAttribute('src'); 
            bgVideo.load(); // Сбрасываем внутренний буфер

            // 3. Показываем постер на время загрузки
            if (posterSrc) {
                videoPoster.style.backgroundImage = `url('${posterSrc}')`;
                videoPoster.style.backgroundSize = 'cover';
                videoPoster.style.backgroundPosition = 'center';
                videoPoster.style.display = 'block';
            } else {
                videoPoster.style.display = 'none';
            }

            // 4. Устанавливаем параметры
            bgVideo.src = videoSrc;
            bgVideo.poster = posterSrc || '';
            
            bgVideo.muted = true;
            bgVideo.loop = true;
            bgVideo.playsInline = true;
            bgVideo.webkitPlaysInline = true;
            bgVideo.preload = 'auto';
            
            // 5. Обработчик удачной загрузки данных
            bgVideo.onloadeddata = () => {
                console.log('✅ Видео данные загружены (loadeddata)');
                if (videoPoster) videoPoster.style.display = 'none';
                this.playVideoWithRetry(bgVideo);
            };

            // 6. Обработчик ошибки С АВТОПОВТОРОМ
            bgVideo.onerror = (e) => {
                const error = bgVideo.error;
                const errorCode = error ? error.code : 0;
                
                // MEDIA_ERR_NETWORK = 2, MEDIA_ERR_DECODE = 3
                const isNetworkError = errorCode === 2 || errorCode === 3;

                if (isNetworkError && loadAttempts < maxLoadRetries) {
                    loadAttempts++;
                    console.warn(`⚠️ Ошибка загрузки (Code: ${errorCode}), попытка ${loadAttempts} из ${maxLoadRetries} через 500мс...`);
                    
                    // Ждем и пробуем снова
                    setTimeout(() => {
                        attemptLoad();
                    }, 500); // Задержка 500мс
                } else {
                    console.error('❌ Фатальная ошибка загрузки видео или превышен лимит попыток:', error);
                    this.showFallback(posterSrc);
                }
            };

            bgVideo.load();
        };

        // Запускаем первую попытку
        attemptLoad();
    }

    // Попытка воспроизведения с ретраем (для обработки блокировок автоплея)
    playVideoWithRetry(video) {
        const tryPlay = () => {
            video.play().then(() => {
                console.log('✅ Видео воспроизводится');
                this.videoRetryCount = 0;
            }).catch((err) => {
                console.warn('⚠️ Воспроизведение блокировано или ошибка:', err.name, err.message);
                
                if (this.videoRetryCount < this.maxVideoRetries) {
                    this.videoRetryCount++;
                    console.log(`🔄 Повторная попытка воспроизведения ${this.videoRetryCount}...`);
                    setTimeout(tryPlay, 200 * this.videoRetryCount);
                } else {
                    // Если все попытки провалились — показываем постер
                    console.error('❌ Не удалось воспроизвести видео после нескольких попыток');
                    this.showFallback(video.poster);
                }
            });
        };
        
        tryPlay();
    }

    // Показываем постер вместо видео
    showFallback(posterSrc) {
        const bgVideo = document.getElementById('bgVideo');
        const videoPoster = document.getElementById('videoPoster');
        
        if (!bgVideo || !videoPoster) return;
        
        console.log('🖼️ Показываем постер как fallback');
        
        // Скрываем видео
        bgVideo.pause();
        bgVideo.style.display = 'none';
        
        // Показываем постер
        if (posterSrc) {
            videoPoster.style.backgroundImage = `url('${posterSrc}')`;
            videoPoster.style.backgroundSize = 'cover';
            videoPoster.style.backgroundPosition = 'center';
            videoPoster.style.display = 'block';
        } else {
            // Если нет постера, можно показать черный фон
            videoPoster.style.backgroundColor = '#000';
            videoPoster.style.display = 'block';
        }
    }

    async init() {
        await new Promise(resolve => {
            const check = () => {
                if (window.CATEGORIES && window.PAGE_ORDER_BY_CATEGORY && window.pagesManager) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });

        const params = this.getParamsFromURL();
        await this.navigateToPlace(params.placeId, params.category, false);

        this.setupPopStateHandler();

        console.log('✅ SPA Router (Final Video Fix) готов');
    }
}

window.spaRouter = new SPARouter();

window.navigateToPrevPlace = function() {
    const frame = document.getElementById('frame');
    if (frame && frame.classList.contains('mode-details')) return;
    if (window.spaRouter?.isAnimating) return;
    
    const order = getCurrentPageOrder(window.spaRouter?.currentCategory);
    const currentIndex = order.indexOf(window.spaRouter?.currentPlaceId);
    
    // Если в категории только одна страница — ничего не делаем
    if (order.length <= 1) {
        console.log('🎯 В категории только одна страница');
        return;
    }
    
    // Бесконечная лента: если на первой странице, переходим к последней
    const targetIndex = currentIndex === 0 ? order.length - 1 : currentIndex - 1;
    const prevId = order[targetIndex];
    
    window.spaRouter.navigateToPlace(prevId, window.spaRouter.currentCategory, true, 'prev');
};

window.navigateToNextPlace = function() {
    const frame = document.getElementById('frame');
    if (frame && frame.classList.contains('mode-details')) return;
    if (window.spaRouter?.isAnimating) return;
    
    const order = getCurrentPageOrder(window.spaRouter?.currentCategory);
    const currentIndex = order.indexOf(window.spaRouter?.currentPlaceId);
    
    // Если в категории только одна страница — ничего не делаем
    if (order.length <= 1) {
        console.log('🎯 В категории только одна страница');
        return;
    }
    
    // Бесконечная лента: если на последней странице, переходим к первой
    const targetIndex = currentIndex === order.length - 1 ? 0 : currentIndex + 1;
    const nextId = order[targetIndex];
    
    window.spaRouter.navigateToPlace(nextId, window.spaRouter.currentCategory, true, 'next');
};

document.addEventListener('DOMContentLoaded', () => {
    window.spaRouter.init();
});