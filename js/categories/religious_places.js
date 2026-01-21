// religious_places.js - Религиозные места
const RELIGIOUS_PLACES = {
    'Spaso_Preobrazhensky': {
        title: 'Спасо-Преображенский храм',
        heading: 'Спасо-Преображенский<br>храм',
        video: { src: 'videos/Spaso_Preobrazhensky_bg.mp4', poster: null },
        paidEntry: null,
        photoButtons: [
            { label: 'фото', image: 'stories_button_images/spaso_main.png', link: 'stories.html?place=Spaso_Preobrazhensky' }
        ],
        address: { text: 'площадь Кремлевская, д. 1', link: 'https://yandex.ru/maps/-/CLszzBKH' },
        usefulInfo: {
            enabled: true,
            content: [
                'оценка на картах 4,9',
                'часы работы: ежедневно 8:00–20:00'
            ]
        }
    },
    
    'Ilya_Prorok': {
        title: 'Храм Ильи Пророка',
        heading: 'Храм <br> Ильи Пророка',
        video: { src: 'videos/Ilya_Prorok_bg.mp4', poster: null },
        paidEntry: { text: 'вход платный', enabled: true },
        photoButtons: [
            { label: 'фото', image: 'stories_button_images/first_button.png', link: 'stories.html?place=Ilya_Prorok' },
            { label: 'фото', image: 'stories_button_images/second_button.png', link: 'stories.html?place=Ilya_Prorok2' }
        ],
        address: { text: 'кремлевская улица 20', link: 'https://yandex.ru/maps/-/CLszzBKH' },
        usefulInfo: {
            enabled: true,
            content: [
                'оценка на картах 4,8 <br> <br>',
                'часы работы: пн,вт,чт,пт 10:00–18:00; сб 10:00–19:00; вс 10:00–18:00',
              { prefix: 'Карта:', text: 'кремлевская улица 20', link: 'https://yandex.ru/maps/-/CLszzBKH' }
            ]
        }
    },
    
    'Kreml': { // ← БЕЗ .html!
        title: 'Кремль',
        heading: '<br class="title-break"> Кремль',
        video: { src: 'videos/kreml.mp4', poster: null  },
        paidEntry: null,
        photoButtons: [
            { label: 'фото кремля', image: 'stories_button_images/second_button.png', link: 'stories.html?place=Ilya_Prorok' }
            
        ],
        address: { text: 'площадь Кремлевская, д. 1', link: 'https://yandex.ru/maps/-/CLszzBKH' },
        usefulInfo: {
            enabled: true,
            content: [
                'оценка на картах 4,9',
                'часы работы: ежедневно 8:00–20:00'
            ]
        }
    }
    
};

console.log('📦 Загружена категория: religious (мест: ' + Object.keys(RELIGIOUS_PLACES).length + ')');