async function fetchTOML(path) {
    const response = await fetch(path);
    const text = await response.text();
    return parseTOML(text);
}

function parseTOML(text) {
    const data = {};
    let currentKey = null;
    text.split('\n').forEach(line => {
        line = line.trim();
        if (line.startsWith('[') && line.endsWith(']')) {
            currentKey = line.slice(1, -1);
            data[currentKey] = {};
        } else if (currentKey && line.includes('=')) {
            let [key, value] = line.split('=').map(s => s.trim());
            value = value.replace(/^"|"$/g, ''); // Remove quotes
            data[currentKey][key] = value;
        }
    });
    return data;
}

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getRandomEntries(data, count) {
    const keys = Object.keys(data);
    const seed = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD as seed
    keys.sort((a, b) => seededRandom(parseInt(seed + a, 10)) - seededRandom(parseInt(seed + b, 10)));
    return keys.slice(0, count).map(key => data[key]);
}

async function displayRandomCards() {
    const data = await fetchTOML('/toml/homepage_grid.toml');
    const selectedCards = getRandomEntries(data, 3);
    
    const container = document.querySelector('.card_grid');
    container.innerHTML = '';
    
    selectedCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'grid-item';
        cardElement.innerHTML = `
            <a href="${card.url}" class="contact-card-link">
                <div class="contact-card-image-container">
                    <img src="${card.src}" alt="${card.title}" class="contact-card-image">
                </div>
                <div class="contact-card-content">
                    <h3 class="contact-card-title">${card.title}</h3>
                    <p class="contact-card-body">${card.text}</p>
                </div>
            </a>
        `;
        container.appendChild(cardElement);
    });
}

document.addEventListener('DOMContentLoaded', displayRandomCards);

