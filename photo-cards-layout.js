// photo-cards-layout.js
document.addEventListener('DOMContentLoaded', function() {
    function arrangePhotoCards() {
        const photoWrapper = document.querySelector('.photo-wrapper');
        if (!photoWrapper) return;
        
        const photoCards = Array.from(photoWrapper.querySelectorAll('.photo-card'));
        const cardCount = photoCards.length;
        
        // Сбрасываем существующие классы
        photoWrapper.className = 'photo-wrapper';
        photoCards.forEach(card => {
            card.classList.remove('single-card', 'middle-card');
        });
        
        // Определяем позиционирование в зависимости от количества карточек
        if (cardCount === 1) {
            // Для одной карточки - центрируем
            photoWrapper.style.justifyContent = 'center';
            photoCards[0].classList.add('single-card');
        } else if (cardCount === 2) {
            // Для двух карточек - располагаем в ряд
            photoWrapper.style.justifyContent = 'center';
            photoWrapper.style.flexDirection = 'row';
        } else if (cardCount % 2 === 0) {
            // Четное количество (4, 6, 8...)
            // Устанавливаем grid-разметку для равномерного распределения
            photoWrapper.style.display = 'grid';
            photoWrapper.style.gridTemplateColumns = 'repeat(2, 1fr)';
            photoWrapper.style.justifyContent = 'center';
            photoWrapper.style.gap = '20px';
        } else {
            // Нечетное количество (3, 5, 7...)
            // Две карточки в первом ряду, последняя по центру
            photoWrapper.style.display = 'flex';
            photoWrapper.style.flexWrap = 'wrap';
            photoWrapper.style.justifyContent = 'center';
            photoWrapper.style.gap = '20px';
            
            // Последнюю карточку помечаем для центрирования
            if (cardCount > 2) {
                const lastCard = photoCards[photoCards.length - 1];
                lastCard.classList.add('middle-card');
                
                // Добавляем CSS для центрирования последней карточки
                const style = document.createElement('style');
                style.textContent = `
                    .photo-wrapper .middle-card {
                        grid-column: 1 / -1;
                        justify-self: center;
                        margin: 0 auto;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        console.log(`Расположено ${cardCount} карточек: ${cardCount % 2 === 0 ? 'четное' : 'нечетное'} количество`);
    }
    
    // Вызываем при загрузке
    arrangePhotoCards();
    
    // Вызываем при изменении размера окна
    window.addEventListener('resize', function() {
        arrangePhotoCards();
    });
    
    // Если добавляете карточки динамически, можно вызвать функцию после их добавления
    // Пример: после AJAX-загрузки или динамического добавления
    window.arrangePhotoCards = arrangePhotoCards;
});