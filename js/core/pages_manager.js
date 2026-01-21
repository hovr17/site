// pages_manager.js - Добавлена мобильная инициализация видео
class PagesManager {
    constructor() {
        this.config = null;
        this.placeId = null;
        this.category = null;
        console.log('📦 PagesManager создан');
    }

    setPlaceId(placeId, category) {
        this.placeId = placeId;
        this.category = category;
        this.config = getPlaceConfig(placeId, category);
        console.log('📦 Загружен config для', placeId, this.config ? '✅' : '❌');
        return !!this.config;
    }

    applyConfig() {
        if (!this.config) {
            console.error('❌ Конфигурация не загружена');
            return;
        }

        // 1. Заголовок
        const titleBlock = document.querySelector('.title-block h1');
        if (titleBlock) {
            titleBlock.innerHTML = this.config.heading || this.config.title || '';
            console.log('✅ Заголовок установлен:', titleBlock.innerHTML);
        }

        // 2. Видео (МОБИЛЬНАЯ ИНИЦИАЛИЗАЦИЯ)
        const bgVideo = document.getElementById('bgVideo');
        if (bgVideo && this.config.video?.src) {
            // Сначала сбрасываем
            bgVideo.pause();
            bgVideo.src = '';
            bgVideo.load();
            
            // Теперь устанавливаем новый src
            bgVideo.src = this.config.video.src;
            bgVideo.poster = this.config.video.poster || '';
            
            // ВАЖНО: Устанавливаем мобильные атрибуты ДО воспроизведения
            bgVideo.muted = true;
            bgVideo.setAttribute('muted', '');
            bgVideo.setAttribute('playsinline', '');
            bgVideo.setAttribute('webkit-playsinline', '');
            bgVideo.setAttribute('preload', 'auto');
            bgVideo.setAttribute('autoplay', '');
            
            console.log('✅ Видео src и атрибуты установлены:', bgVideo.src);
        }

        // 3. "Вход платный"
        // 3. "Вход платный"
const entryNoteSpan = document.querySelector('.entry-note span');
const paidBtn = document.getElementById('paidBtn');
if (entryNoteSpan && paidBtn) {
    // Проверяем, что paidEntry существует и явно включено
    if (this.config.paidEntry && this.config.paidEntry.enabled) {
        entryNoteSpan.textContent = this.config.paidEntry.text || '';
        paidBtn.style.display = 'flex';
        console.log('✅ Платный вход:', entryNoteSpan.textContent);
    } else {
        // При null, undefined или false устанавливаем неразрывный пробел
        // и скрываем кнопку полностью
        entryNoteSpan.textContent = '\u00A0';
        paidBtn.style.display = 'none';
    }
}

        // 4. Фото-кнопки
        // 4. Фото-кнопки
// 4. Фото-кнопки
const photoWrapper = document.querySelector('.photo-wrapper');
if (photoWrapper) {
    photoWrapper.innerHTML = '';
    this.config.photoButtons?.forEach((btn, index) => {
        const card = document.createElement('a');
        card.className = 'photo-card';
        card.href = btn.link || '#';
        card.id = `photoCard${index + 1}`;
        
        // ✅ СОХРАНЕНИЕ СОСТОЯНИЯ МЕНЮ ПРИ КЛИКЕ НА ФОТО
        card.addEventListener('click', function(e) {
            // Проверяем, что это переход на stories.html
            if (this.href && this.href.includes('stories.html')) {
                // Сохраняем текущее состояние меню
                const frame = document.getElementById('frame');
                const isMenuOpen = frame && frame.classList.contains('mode-details');
                const usefulDrop = document.getElementById('usefulDrop');
                const isDropdownOpen = usefulDrop && usefulDrop.classList.contains('open');
                
                if (isMenuOpen) {
                    sessionStorage.setItem('menuState', 'open');
                    console.log('💾 Сохранено: меню открыто');
                } else {
                    sessionStorage.removeItem('menuState');
                }
                
                // Сохраняем состояние dropdown
                if (isDropdownOpen) {
                    sessionStorage.setItem('usefulDropdownState', 'open');
                    console.log('💾 Сохранено: dropdown открыт');
                } else {
                    sessionStorage.removeItem('usefulDropdownState');
                }
            }
        });
        
        if (btn.image) {
            card.style.backgroundImage = `url('${btn.image}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundPosition = 'center';
            card.style.backgroundRepeat = 'no-repeat';
        }
        
        const label = document.createElement('div');
        label.className = 'photo-label';
        label.textContent = btn.label || '';
        card.appendChild(label);
        photoWrapper.appendChild(card);
        
        console.log(`✅ Фото-кнопка ${index + 1}:`, btn.label);
    });
}

        // 5. Дропдауны
        this.createDropdowns();

        // 6. Title страницы
        document.title = this.config.title || '';
        
        // 7. Инициализируем меню (для дропдаунов и свайпов)
        if (typeof window.initializeMenu === 'function') {
            setTimeout(() => {
                window.initializeMenu();
            }, 100);
        }
        
        console.log('✅ Конфигурация применена полностью');
    }

    createDropdowns() {
        const container = document.getElementById('dropdownsContainer');
        if (!container || !this.config) return;

        container.innerHTML = '';

        // Адрес
        if (this.config.address?.text) {
            this.createAddressDropdown();
        }

        // Полезное
        if (this.config.usefulInfo?.enabled) {
            this.createUsefulDropdown();
        }
    }

    createAddressDropdown() {
        const container = document.getElementById('dropdownsContainer');
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.id = 'addressDrop';
        
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="dropdown-icon geo-icon"></div>
                <div class="dropdown-title">Aдрес</div>
                <div class="dropdown-arrow">
                    <div class="arrow-down-icon"></div>
                </div>
            </div>
            <div class="dropdown-body">
                <p><a href="${this.config.address.link}" class="address-link" target="_blank" rel="noopener noreferrer">${this.config.address.text}</a></p>
            </div>
        `;
        container.appendChild(dropdown);
        console.log('✅ Дропдаун Адрес создан');
    }

    createUsefulDropdown() {
        const container = document.getElementById('dropdownsContainer');
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.id = 'usefulDrop';
        
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <div class="dropdown-icon bulb-icon"></div>
                <div class="dropdown-title">Полезное</div>
                <div class="dropdown-arrow">
                    <div class="arrow-down-icon"></div>
                </div>
            </div>
            <div class="dropdown-body"></div>
        `;
        container.appendChild(dropdown);

        const body = dropdown.querySelector('.dropdown-body');
        if (body && this.config.usefulInfo.content) {
            this.config.usefulInfo.content.forEach(line => {
                const p = document.createElement('p');
                
                if (typeof line === 'object' && line.link) {
                    const linkText = line.text || line.link;
                    const prefixText = line.prefix ? line.prefix + ' ' : '';
                    p.innerHTML = `${prefixText}<a href="${line.link}" class="address-link" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
                } else if (typeof line === 'string') {
                    p.innerHTML = line.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="address-link" target="_blank" rel="noopener noreferrer">$1</a>');
                } else {
                    p.textContent = String(line);
                }
                
                body.appendChild(p);
                console.log('✅ Добавлен пункт:', line);
            });
        }
        console.log('✅ Дропдаун Полезное создан');
    }

    getPageConfig(placeId) {
        return PAGES_CONFIG[placeId];
    }
}

window.pagesManager = new PagesManager();