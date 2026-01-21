// convert_to_spa.js - Скрипт для конвертации HTML в SPA-шаблоны
async function convertHTMLToSPATemplate(htmlFile) {
    try {
        const response = await fetch(htmlFile);
        const html = await response.text();
        
        // Парсим HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Извлекаем основной контент
        const frame = doc.querySelector('#frame');
        if (!frame) {
            throw new Error('Элемент #frame не найден');
        }
        
        // Удаляем ненужные скрипты (они уже в SPA)
        const scripts = frame.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Возвращаем чистый HTML
        return {
            html: frame.outerHTML,
            title: doc.title,
            url: htmlFile
        };
    } catch (error) {
        console.error(`Ошибка конвертации ${htmlFile}:`, error);
        return null;
    }
}

// Использование:
// convertHTMLToSPATemplate('Ilya_Prorok.html').then(template => {
//     console.log(template.html);
// });