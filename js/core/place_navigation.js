// place_navigation.js - Порядок мест для SPA (без .html!)
const PAGE_ORDER = [
    'Ilya_Prorok',
    'Kreml',
    'Nikola_Nadein',
    'Spasa_na_Gorodische',
    'Petropavlovsky',
    'Bogoyavlensky',
    'Spaso_Preobrazhensky_na_Torgu'
];

// Экспортируем в глобальную область
window.PAGE_ORDER = PAGE_ORDER;

/**
 * Проверка, открыто ли меню details (блокирует навигацию)
 */
function isBottomMenuOpen() {
    const frame = document.getElementById('frame');
    return frame && frame.classList.contains('mode-details');
}

/**
 * Навигация к предыдущему месту
 */
function navigateToPrevPlace() {
    if (isBottomMenuOpen() || window.spaRouter?.isAnimating) return;
    
    const currentIndex = PAGE_ORDER.indexOf(window.spaRouter?.currentPlaceId);
    if (currentIndex > 0) {
        const prevId = PAGE_ORDER[currentIndex - 1];
        const isMobile = window.innerWidth <= 1080;
        
        if (isMobile) {
            // Для мобильных используем анимацию
            window.spaRouter?.navigateToPlace(prevId, window.spaRouter.currentCategory, true);
        } else {
            // Для десктопа - мгновенный переход
            window.spaRouter?.navigateToPlace(prevId, window.spaRouter.currentCategory);
        }
    } else {
        console.log('🎯 Это первое место');
    }
}

/**
 * Навигация к следующему месту
 */
function navigateToNextPlace() {
    if (isBottomMenuOpen() || window.spaRouter?.isAnimating) return;
    
    const currentIndex = PAGE_ORDER.indexOf(window.spaRouter?.currentPlaceId);
    if (currentIndex < PAGE_ORDER.length - 1) {
        const nextId = PAGE_ORDER[currentIndex + 1];
        const isMobile = window.innerWidth <= 1080;
        
        if (isMobile) {
            // Для мобильных используем анимацию
            window.spaRouter?.navigateToPlace(nextId, window.spaRouter.currentCategory, true);
        } else {
            // Для десктопа - мгновенный переход
            window.spaRouter?.navigateToPlace(nextId, window.spaRouter.currentCategory);
        }
    } else {
        console.log('🎯 Это последнее место');
    }
}

/**
 * Обновление видимости и состояния стрелок навигации
 */
function updateNavArrows() {
    const currentId = window.spaRouter?.currentPlaceId;
    const prevArrow = document.getElementById('templePrevArrow');
    const nextArrow = document.getElementById('templeNextArrow');
    const frame = document.getElementById('frame');

    if (!prevArrow || !nextArrow || !currentId) {
        console.warn('⚠️ Стрелки или currentPlaceId не найдены');
        return;
    }

    // На мобильных устройствах скрываем стрелки
    if (window.innerWidth <= 1080) {
        prevArrow.style.display = 'none';
        nextArrow.style.display = 'none';
        return;
    }

    const isDetailsMode = frame && frame.classList.contains('mode-details');
    const currentIndex = PAGE_ORDER.indexOf(currentId);

    if (isDetailsMode) {
        // В режиме details скрываем стрелки
        prevArrow.style.display = 'none';
        nextArrow.style.display = 'none';
        prevArrow.style.pointerEvents = 'none';
        nextArrow.style.pointerEvents = 'none';
    } else {
        // Показываем стрелки
        prevArrow.style.display = 'flex';
        nextArrow.style.display = 'flex';

        // Стрелка "назад"
        if (currentIndex > 0) {
            prevArrow.classList.remove('hidden');
            prevArrow.style.opacity = '0.7';
            prevArrow.style.pointerEvents = 'auto';
            prevArrow.style.cursor = 'pointer';
            prevArrow.onclick = navigateToPrevPlace;
        } else {
            prevArrow.classList.add('hidden');
            prevArrow.style.opacity = '0.3';
            prevArrow.style.pointerEvents = 'none';
            prevArrow.style.cursor = 'default';
            prevArrow.onclick = null;
        }

        // Стрелка "вперед"
        if (currentIndex < PAGE_ORDER.length - 1) {
            nextArrow.classList.remove('hidden');
            nextArrow.style.opacity = '0.7';
            nextArrow.style.pointerEvents = 'auto';
            nextArrow.style.cursor = 'pointer';
            nextArrow.onclick = navigateToNextPlace;
        } else {
            nextArrow.classList.add('hidden');
            nextArrow.style.opacity = '0.3';
            nextArrow.style.pointerEvents = 'none';
            nextArrow.style.cursor = 'default';
            nextArrow.onclick = null;
        }
    }
}

// Экспортируем функции в глобальную область
window.navigateToPrevPlace = navigateToPrevPlace;
window.navigateToNextPlace = navigateToNextPlace;
window.updateNavArrows = updateNavArrows;