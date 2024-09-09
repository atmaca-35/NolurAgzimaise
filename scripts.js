document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');
    const wordCountElement = document.getElementById('wordCount');

    let dictionaryData = {};
    let lastQuery = '';
    let hasError = false;

    // Select the search input element
    const searchInput = document.querySelector('#searchBox');

    function loadSearchFromHash() {
        const hash = decodeURIComponent(window.location.hash.substring(1)); // Çözümleme eklendi
        if (hash) {
            searchInput.value = hash; // Set the search box value to the hash
            updateSearch(hash); // Trigger the search logic
            updateSearchBoxPlaceholder(hash); // Ghost text'in yerleşimini güncelle
        }
    }



    async function loadDictionaryData() {
        try {
            const response = await fetch('vocabulary.json');
            if (!response.ok) {
                throw new Error('Yoksa bir yerlerde bir harf mi kayıp?');
            }
            dictionaryData = await response.json();

            const wordCount = Object.keys(dictionaryData).length;
            wordCountElement.innerHTML = `Portrait of Proto-Turkic in <span class="highlight">${wordCount}</span> Entries.`;
            return true;
        } catch (error) {
            console.error('Yoksa bir yerlerde bir harf mi kayıp?', error);
            hasError = true;
            wordCountElement.innerHTML = `<p class="error-message">Yoksa bir yerlerde bir harf mi kayıp?</p>`;
            searchContainer.classList.add('error');
            resultDiv.classList.add('hidden');
            ghostText.classList.add('hidden');
            return false;
        }
    }

    // Load search when the page loads
    window.addEventListener('load', async () => {
    const isLoaded = await loadDictionaryData();
    if (isLoaded) {
        loadSearchFromHash(); // Dictionary yüklendikten sonra aramayı yapın
    }
});

window.addEventListener('hashchange', () => {
    const hash = decodeURIComponent(window.location.hash.substring(1)); // Hash'i çözümleyin
    if (hash) {
        searchInput.value = hash; // Arama kutusunu güncelleyin
        updateSearch(hash); // Aramayı tetikleyin
        updateSearchBoxPlaceholder(hash); // Ghost text'in yerleşimini güncelleyin
    }
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    ghostText.textContent = ""; // Ghost text'i temizleyin

    if (query) {
        window.location.hash = encodeURIComponent(query); // Kodlamayı ekleyin
    } else {
        window.location.hash = '';  // Arama kutusu boşsa hash'i temizleyin
    }

    updateSearch(query); // Search ve ghostText logic
    updateSearchBoxPlaceholder(query);  // Ghost text güncelleniyor
});




    const clickableWords = {
        "*+ŕ": [["<span class='yellow'>intransitive</span> *ag-", "<span class='gray'>“to rise”</span>", "<span class='yellow'>noun</span> *agïŕ", "<span class='gray'>“mouth”</span>"], ["<span class='yellow'>transitive</span> *bog-", "<span class='gray'>“to choke”</span>", "<span class='yellow'>noun</span> *boguŕ", "<span class='gray'>“throat”</span>"]],
        "*+gAk": [["<span class='yellow'>intransitive</span> *dam-", "<span class='gray'>“to drip”</span>", "<span class='yellow'>noun</span> *damgak", "<span class='gray'>“throat”</span>"], ["<span class='yellow'>transitive</span> *or-", "<span class='gray'>“to mow, reap”</span>", "<span class='yellow'>noun</span> *orgak", "<span class='gray'>“sickle”</span>"]],
        "*+sA-": [["<span class='yellow'>noun</span> *yük", "<span class='gray'>“load”</span>", "<span class='yellow'>intransitive</span> *yükse-", "<span class='gray'>“to rise”</span>"], ["<span class='yellow'>noun</span> *kāp", "<span class='gray'>“vessel”</span>", "<span class='yellow'>transitive</span> *kapsa-", "<span class='gray'>“to include”</span>"]],
    };

    function updateSearch(query) {
        if (dictionaryData && Object.keys(dictionaryData).length > 0) {
            searchWord(query); // Call the searchWord function to handle the search
        } else {
            console.error('Dictionary data not loaded.');
        }
    }

    function searchWord(query) {
        if (query === lastQuery) {
            return;
        }
        lastQuery = query;

        resultDiv.innerHTML = '';

        if (query.startsWith(' ') || query.trim().length === 0) {
            if (query.length === 0) {
                searchContainer.classList.remove('error');
                ghostText.textContent = "";
                return;
            }
            searchContainer.classList.add('error');
            ghostText.textContent = "";
            return;
        } else {
            searchContainer.classList.remove('error');
        }

        const normalizedQuery = normalizeTurkish(query);

        const sortedWords = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word));

        const closestWord = sortedWords
            .find(({ word }) => word.startsWith(normalizedQuery));

        if (closestWord) {
            const wordDetails = dictionaryData[closestWord.original];
            const description = wordDetails.a.replace(/\n/g, "<br>");
            const descriptionElement = document.createElement('p');
            descriptionElement.classList.add('description');
            descriptionElement.innerHTML = highlightWords(sanitizeHTML(description));
            resultDiv.appendChild(descriptionElement);

            const descriptionHeight = descriptionElement.offsetHeight;
            descriptionElement.style.maxHeight = `${descriptionHeight}px`;

            // Fade-in animasyonu ekleniyor
            resultDiv.style.animation = 'fadeIn 1s ease-in-out';

            ghostText.textContent = closestWord.word.substring(query.length);
        } else {
            ghostText.textContent = "";
            searchContainer.classList.add('error');
        }

        resultDiv.style.animation = 'none';
        resultDiv.offsetHeight;
        resultDiv.style.animation = 'fadeIn 1s ease-in-out';

        createClickableWords();
    }

    function createClickableWords() {
        Object.keys(clickableWords).forEach(word => {
            const regex = new RegExp(`(${word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")})`, 'gi');
            resultDiv.innerHTML = resultDiv.innerHTML.replace(regex, `<span class="clickable-word" style="color: #e9d677; cursor: pointer;">$1</span>`);
        });

        // Tıklanabilir kelimeleri seçiyoruz
        const clickableElements = document.querySelectorAll('.clickable-word');

        clickableElements.forEach(element => {
            element.addEventListener('click', function () {
                const word = this.textContent;
                this.style.textDecoration = 'underline'; // Altı çizili yap
                showWordMeanings(word, this);
            });
        });
    }

    function showWordMeanings(word, element) {
        const meanings = clickableWords[word];

        // Remove any existing tooltips
        const existingTooltips = document.querySelectorAll('.tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());

        if (meanings && meanings.length > 0) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            const random = Math.floor(Math.random() * meanings.length);
            let meaning = "";
            meanings[random].forEach(tempMeaning => meaning += tempMeaning + "<br>");
            tooltip.innerHTML = meaning;

            document.body.appendChild(tooltip);

            const elementRect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.display = 'block';

            // Calculate tooltip position
            const tooltipRect = tooltip.getBoundingClientRect();
            let top = elementRect.top + window.scrollY - tooltipRect.height - 5;
            let left = elementRect.left + window.scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);

            if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - 5;
            }
            if (left < 0) {
                left = 5;
            }

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;

            // Fade-in animation for the tooltip
            tooltip.style.opacity = 0;
            tooltip.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                tooltip.style.opacity = 1;
            }, 50);

            // Remove the underline and tooltip when the mouse leaves the element
            element.addEventListener('mouseleave', function () {
                tooltip.style.opacity = 0;
                setTimeout(() => {
                    tooltip.remove();
                    element.style.textDecoration = 'none';  // Remove underline
                }, 300);
            });
        }
    }

    function normalizeTurkish(text) {
        return text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    }

    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br']
        });
    }

    function highlightWords(text) {
        return text.replace(/(\*[^*]*\*)/g, '<span class="highlight">$1</span>');
    }






    function highlightWords(text) {
        const specialWords = {
            'bgx': 'Balkan Gagauz Turkish',
            'kmz': 'Khorasani Turkish',
            'ota': 'Ottoman Turkish',
            'otk': 'Old Turkish',
            'tur': 'Turkish',
            'crh': 'Crimean Turkish',
            'sah': 'Yakut',
            'ybe': 'West Yugur',
            'tuk': 'Turkmen',
            'xng': 'Middle Mongolian',
            'mon': 'Mongolian',
            'cmg': 'Classical Mongolian',
            'ptr': 'Proto-Turkic',
        };

        let markedText = text;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            markedText = markedText.replace(regex, (match) => `[SPECIAL:${key}]`);
        }

        let resultText = markedText;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\[SPECIAL:${key}\\](\\s+)(\\S+)`, 'gi');
            resultText = resultText.replace(regex, (match, p1, p2) => `<b>${value}</b>${p1}<span class="pink">${p2}</span>`);
        }

        resultText = resultText.replace(/\[SPECIAL:\S+\]/g, '');

        return resultText;
    }

    function updateSearchBoxPlaceholder(query) {
        if (!query) {
            ghostText.textContent = ''; // Arama kutusu boşsa ghostText'i temizle
            return;
        }
        const queryLower = normalizeTurkish(query);
        const matchingWord = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word))
            .find(({ word }) => word.startsWith(queryLower));

        if (matchingWord) {
            const remainingPart = matchingWord.word.substring(query.length);
            ghostText.textContent = remainingPart;

            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }




    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Poppins', sans-serif`;
        return context.measureText(text).width;
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value;
        updateSearchBoxPlaceholder(query);
        searchWord(query);
    });


    document.querySelector('#result').addEventListener('click', (e) => {
        if (e.target.classList.contains('searchable')) {
            const searchbox = document.querySelector('#searchbox');
            searchBox.value = e.target.textContent;
            searchBox.dispatchEvent(new Event('input'));
        }
    })
});
