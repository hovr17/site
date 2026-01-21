// init_spa.js - загружайте этот файл ПЕРВЫМ
(function() {
    console.log('SPA инициализация начата...');
    
    // Ждем загрузки всех скриптов
    function initSPA() {
        // Проверяем, что нужные скрипты загружены
        if (typeof PageTransitionManager === 'function') {
            // Создаем менеджер
            window.pageTransitionManager = new PageTransitionManager();
            console.log('PageTransitionManager создан');
            
            // Инициализируем навигацию
            if (window.navigationConfig) {
                setTimeout(() => {
                    window.navigationConfig.updateNavArrows();
                }, 100);
            }
            
            // Добавляем начальное состояние в историю
            const currentPage = window.location.pathname.split('/').pop();
            if (!window.history.state) {
                window.history.replaceState({ page: currentPage }, '', currentPage);
            }
        } else {
            // Пробуем еще раз через 100мс
            setTimeout(initSPA, 100);
        }
    }
    
    // Запускаем инициализацию после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSPA);
    } else {
        initSPA();
    }
})();