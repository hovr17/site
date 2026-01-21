// spa-config.js - Конфигурация SPA
window.SPA_CONFIG = {
    // Настройки анимации
    animation: {
        enabled: true,
        duration: 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        mobileOnly: true
    },
    
    // Настройки кэширования
    caching: {
        enabled: true,
        maxAge: 3600000, // 1 час
        preload: true
    },
    
    // Настройки навигации
    navigation: {
        swipeEnabled: true,
        keyboardEnabled: true,
        arrowsEnabled: true
    },
    
    // Список страниц
    pages: {
        'Spaso_Preobrazhensky': {
            file: 'Spaso_Preobrazhensky.html',
            title: 'Спасо-Преображенский монастырь',
            css: 'Spaso_Preobrazhensky.css'
        },
        'Ilya_Prorok': {
            file: 'Ilya_Prorok.html',
            title: 'Храм Ильи Пророка',
            css: 'Ilya_Prorok.css'
        },
        // ... остальные страницы
    }
};