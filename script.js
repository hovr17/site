document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('.footer');
    const container = document.querySelector('.container');
    const scrollZone = document.getElementById('scrollZone');
    let touchStartY = 0;
    let touchEndY = 0;
    let isFooterActive = false;
    const SWIPE_THRESHOLD = 50;
    
    console.log('Footer script loaded, scrollZone found:', !!scrollZone);
    
    // Проверяем, находится ли событие внутри scrollZone
    function isInsideScrollZone(e) {
        if (!scrollZone) return false;
        return e.target.closest('#scrollZone') !== null;
    }
    
    // Проверяем, достигли ли дна scrollZone
    function isScrollZoneAtBottom() {
        if (!scrollZone) return false;
        // Добавляем небольшой запас (5px) для точности
        return scrollZone.scrollTop + scrollZone.clientHeight >= scrollZone.scrollHeight - 5;
    }
    
    // Обработка колеса мыши: работает ВЕЗДЕ, в том числе в scrollZone
    document.addEventListener('wheel', function(e) {
        // Если футер активен - скрываем колесом вверх
        if (isFooterActive && e.deltaY < 0) {
            e.preventDefault();
            hideFooter();
            return;
        }
        
        // На Ilya_Prorok.html в режиме details при достижении дна - показываем футер
        if (scrollZone && isScrollZoneAtBottom() && !isFooterActive) {
            e.preventDefault();
            showFooter();
            return;
        }
        
        // Стандартное поведение: на index.html или вне scrollZone
        if (!scrollZone || !isInsideScrollZone(e)) {
            if (e.deltaY > 0 && !isFooterActive) {
                showFooter();
            } else if (e.deltaY < 0 && isFooterActive) {
                hideFooter();
            }
        }
    }, { passive: false });
    
    // Обработка свайпов: работает ВЕЗДЕ
    if (container) {
        container.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        container.addEventListener('touchmove', function(e) {
            if (isFooterActive) {
                e.preventDefault(); // Блокируем прокрутку при активном футере
            }
        }, { passive: false });
        
        container.addEventListener('touchend', function(e) {
            touchEndY = e.changedTouches[0].clientY;
            const distance = touchStartY - touchEndY;
            
            if (Math.abs(distance) > SWIPE_THRESHOLD) {
                // Свайп ВВЕРХ - показываем футер
                if (distance > 0 && !isFooterActive) {
                    e.preventDefault();
                    showFooter();
                } 
                // Свайп ВНИЗ - скрываем футер
                else if (distance < -SWIPE_THRESHOLD && isFooterActive) {
                    e.preventDefault();
                    hideFooter();
                }
            }
        }, { passive: false });
    }
    
    function showFooter() {
        footer.classList.add('active');
        document.body.classList.add('footer-open');
        isFooterActive = true;
        console.log('Footer shown');
    }
    
    function hideFooter() {
        footer.classList.remove('active');
        document.body.classList.remove('footer-open');
        isFooterActive = false;
        console.log('Footer hidden');
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isFooterActive) {
            hideFooter();
        }
    });
});