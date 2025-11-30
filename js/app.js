// ===== Konfiguration =====
const TEST_MODE = false; // Auf false setzen für Production!
const YEAR = 2025;
const STORAGE_KEY = 'jule-adventskalender-2025-opened';

// ===== Elemente =====
const calendarGrid = document.getElementById('calendar-grid');
const modal = document.getElementById('modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalDay = document.getElementById('modal-day');
const modalImage = document.getElementById('modal-image');
const modalText = document.getElementById('modal-text');
const snowflakesContainer = document.getElementById('snowflakes');
const starsContainer = document.getElementById('stars');
const lightsContainer = document.getElementById('lights');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const fullscreenImage = document.getElementById('fullscreen-image');
const modalSong = document.getElementById('modal-song');

// ===== Türchen-Farben =====
const doorColors = ['pink', 'mint', 'lavender', 'peach', 'sky', 'cream'];

// ===== Zufällige Anordnung der Türchen =====
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        // Feste Seed-basierte Zufälligkeit für konsistente Anordnung
        const j = Math.floor(seededRandom(i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Seed-basierter Zufallsgenerator für konsistente Anordnung
let seed = 2025;
function seededRandom(max) {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
}

// ===== LocalStorage Funktionen =====
function getOpenedDoors() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveDoorOpened(day) {
    const opened = getOpenedDoors();
    if (!opened.includes(day)) {
        opened.push(day);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(opened));
    }
}

function isDoorOpened(day) {
    return getOpenedDoors().includes(day);
}

// ===== Datumsprüfung =====
function isTestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return TEST_MODE || urlParams.get('test') === 'true';
}

function canOpenDoor(day) {
    if (isTestMode()) return true;

    const today = new Date();
    const doorDate = new Date(YEAR, 11, day); // Dezember = Monat 11

    // Türchen kann geöffnet werden wenn:
    // 1. Das Datum erreicht oder überschritten ist
    // 2. ODER das Türchen bereits geöffnet wurde
    return today >= doorDate || isDoorOpened(day);
}

// ===== Türchen generieren =====
function createDoors() {
    const days = Array.from({ length: 24 }, (_, i) => i + 1);
    const shuffledDays = shuffleArray(days);

    shuffledDays.forEach((day, index) => {
        const door = document.createElement('div');
        door.className = 'door';
        door.textContent = day;
        door.dataset.day = day;
        door.dataset.color = doorColors[Math.floor(Math.random() * doorColors.length)];

        // Bereits geöffnete Türchen markieren
        if (isDoorOpened(day)) {
            door.classList.add('opened');
        }

        // Gesperrte Türchen markieren
        if (!canOpenDoor(day)) {
            door.classList.add('locked');
        }

        door.addEventListener('click', () => handleDoorClick(day, door));
        calendarGrid.appendChild(door);
    });
}

// ===== Türchen-Klick Handler =====
async function handleDoorClick(day, doorElement) {
    if (!canOpenDoor(day)) {
        // Shake-Animation für gesperrte Türchen
        doorElement.classList.add('shake');
        setTimeout(() => doorElement.classList.remove('shake'), 300);
        return;
    }

    try {
        const data = await loadDayContent(day);
        showModal(day, data);
        saveDoorOpened(day);
        doorElement.classList.add('opened');
    } catch (error) {
        console.error(`Fehler beim Laden von Tag ${day}:`, error);
        showModal(day, {
            image: '',
            text: 'Inhalt konnte nicht geladen werden.'
        });
    }
}

// ===== JSON-Daten laden =====
let calendarData = null;

async function loadCalendarData() {
    if (calendarData) return calendarData;

    const response = await fetch('data/data.json');
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    calendarData = await response.json();
    return calendarData;
}

async function loadDayContent(day) {
    const data = await loadCalendarData();
    return data[day.toString()];
}

// ===== Modal anzeigen =====
function showModal(day, data) {
    modalDay.textContent = `${day}. Dezember`;
    modalImage.src = data.image || '';
    modalImage.alt = `Bild für Tag ${day}`;
    modalText.textContent = data.text || '';

    // Bild-Container ausblenden wenn kein Bild
    modalImage.parentElement.style.display = data.image ? 'flex' : 'none';

    // Apple Music Player einfügen
    if (data.song) {
        const songUrl = data.song.includes('?') ? `${data.song}&app=music` : `${data.song}?app=music`;
        modalSong.innerHTML = `
            <iframe
                allow="autoplay *; encrypted-media *; fullscreen *"
                frameborder="0"
                height="175"
                style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;"
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                src="${songUrl}">
            </iframe>
        `;
        modalSong.style.display = 'flex';
    } else {
        modalSong.innerHTML = '';
        modalSong.style.display = 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Song stoppen durch Entfernen des iframes
    modalSong.innerHTML = '';
}

// ===== Modal Event Listeners =====
modalClose.addEventListener('click', hideModal);
modalOverlay.addEventListener('click', hideModal);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        hideModal();
    }
});

// Touch-Swipe zum Schließen
let touchStartY = 0;
modal.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

modal.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY;

    if (diff > 100) { // Swipe nach unten
        hideModal();
    }
});

// ===== Fullscreen Bild =====
modalImage.addEventListener('click', () => {
    if (modalImage.src) {
        fullscreenImage.src = modalImage.src;
        fullscreenImage.alt = modalImage.alt;
        fullscreenOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

fullscreenOverlay.addEventListener('click', () => {
    fullscreenOverlay.classList.remove('active');
    if (!modal.classList.contains('active')) {
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenOverlay.classList.contains('active')) {
        fullscreenOverlay.classList.remove('active');
    }
});

// ===== Schneeflocken und Bärchen Animation =====
function createSnowflakes() {
    const snowflakes = ['❄', '❅', '❆', '✻', '✼'];
    const bears = ['🧸', '🐻', '🐻‍❄️'];

    // 45 Schneeflocken und 10 Bärchen erstellen (mehr als vorher!)
    for (let i = 0; i < 45; i++) {
        createFallingElement(snowflakes[i % snowflakes.length], 'snowflake');
    }

    for (let i = 0; i < 10; i++) {
        createFallingElement(bears[i % bears.length], 'bear');
    }
}

function createFallingElement(emoji, className) {
    const element = document.createElement('div');
    element.className = className;
    element.textContent = emoji;

    // Zufällige Position und Animation
    element.style.left = Math.random() * 100 + '%';
    element.style.fontSize = (Math.random() * 1.2 + 0.6) + 'em';
    element.style.animationDuration = (Math.random() * 12 + 8) + 's';
    element.style.animationDelay = (Math.random() * 20) + 's';
    element.style.opacity = Math.random() * 0.5 + 0.3;

    snowflakesContainer.appendChild(element);
}

// ===== Funkelnde Sterne =====
function createStars() {
    const starSymbols = ['✦', '✧', '⋆', '★', '☆'];

    // 25 funkelnde Sterne erstellen
    for (let i = 0; i < 25; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = starSymbols[i % starSymbols.length];

        // Zufällige Position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 60 + '%'; // Nur obere 60% des Bildschirms
        star.style.fontSize = (Math.random() * 1.5 + 0.5) + 'em';
        star.style.animationDuration = (Math.random() * 3 + 2) + 's';
        star.style.animationDelay = (Math.random() * 5) + 's';

        starsContainer.appendChild(star);
    }
}

// ===== Lichterkette =====
function createLights() {
    // 15 Lichter erstellen
    for (let i = 0; i < 15; i++) {
        const light = document.createElement('div');
        light.className = 'light';
        lightsContainer.appendChild(light);
    }
}

// ===== Initialisierung =====
function init() {
    createDoors();
    createSnowflakes();
    createStars();
    createLights();

    // Debug-Info im Test-Modus
    if (isTestMode()) {
        console.log('🎄 Adventskalender läuft im TEST-MODUS');
        console.log('Alle Türchen sind geöffnet!');
    }
}

// Los geht's!
init();
