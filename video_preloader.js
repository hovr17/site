// video_preloader.js - Умная предзагрузка видео (БЕЗ внешних зависимостей)
console.log('📦 VideoPreloader загружен');

class VideoPreloader {
    constructor() {
        this.preloadedVideos = new Map(); // URL -> Blob
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB лимит
        this.currentSize = 0;
        this.connectionType = this.getConnectionType();
    }

    getConnectionType() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                type: conn.type || 'unknown',
                effectiveType: conn.effectiveType || '4g',
                saveData: conn.saveData || false,
                downlink: conn.downlink || 10
            };
        }
        return { type: 'unknown', effectiveType: '4g', saveData: false, downlink: 10 };
    }

    shouldPreload() {
        const conn = this.connectionType;
        if (conn.saveData) return false;
        if (conn.type === 'wifi' || conn.effectiveType === '4g') return true;
        if (['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return false;
        return true;
    }

    async preloadVideo(url) {
        if (!url || this.preloadedVideos.has(url)) {
            console.log('✅ Видео уже в кэше:', url);
            return;
        }

        if (!this.shouldPreload()) {
            console.log('⚠️ Предзагрузка отключена (сеть/Data Saver)');
            return;
        }

        try {
            console.log('⬇️ Начинаем предзагрузку:', url);
            
            this.showLoadingIndicator();
            
            // ИСПРАВЛЕНО: Правильный fetch с учетом кэша
            const response = await fetch(url, { 
                method: 'GET',
                cache: 'force-cache',
                mode: 'cors' 
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const blob = await response.blob();
            const size = blob.size;
            
            if (this.currentSize + size > this.maxCacheSize) {
                this.clearOldest();
            }
            
            this.preloadedVideos.set(url, blob);
            this.currentSize += size;
            
            console.log(`✅ Видео предзагружено: ${url} (${(size/1024/1024).toFixed(2)}MB)`);
            
            return blob;
        } catch (error) {
            console.warn('❌ Ошибка предзагрузки:', error.message);
        } finally {
            this.hideLoadingIndicator();
        }
    }

    getPreloadedVideo(url) {
        return this.preloadedVideos.get(url);
    }

    clearOldest() {
        const entries = Array.from(this.preloadedVideos.entries());
        if (entries.length === 0) return;
        
        const toDelete = entries.slice(0, Math.floor(entries.length / 2));
        toDelete.forEach(([url, blob]) => {
            this.currentSize -= blob.size;
            this.preloadedVideos.delete(url);
            console.log('🗑️ Удалено из кэша:', url);
        });
    }

    showLoadingIndicator() {
        const indicator = document.querySelector('.video-loading-indicator');
        if (indicator) indicator.classList.add('active');
    }

    hideLoadingIndicator() {
        const indicator = document.querySelector('.video-loading-indicator');
        if (indicator) indicator.classList.remove('active');
    }

    // ИСПРАВЛЕНО: Прямой доступ к CATEGORIES, без промежуточных функций
    async preloadNext(nextIds, category) {
        if (!nextIds || nextIds.length === 0) return;
        
        console.log('🎯 Предзагрузка следующих:', nextIds);
        
        for (const id of nextIds) {
            // Проверяем, что данные доступны
            if (!window.CATEGORIES?.[category]?.[id]) {
                console.warn('⚠️ Конфиг не найден для:', id);
                continue;
            }
            
            const videoSrc = window.CATEGORIES[category][id].video?.src;
            if (videoSrc) {
                await new Promise(r => setTimeout(r, 200));
                this.preloadVideo(videoSrc);
            }
        }
    }

    getVideoUrl(url) {
        const preloaded = this.preloadedVideos.get(url);
        if (preloaded) {
            return URL.createObjectURL(preloaded);
        }
        return url;
    }
}

window.videoPreloader = new VideoPreloader();

if ('connection' in navigator) {
    navigator.connection.addEventListener('change', () => {
        console.log('📶 Тип соединения изменился:', navigator.connection.effectiveType);
        window.videoPreloader.connectionType = window.videoPreloader.getConnectionType();
    });
}