javascript:(function () {

    'use strict';

    const fortress = document.querySelector(
        '[id^="js_CityPosition"][id$="Link"][title^="Pirate Fortress"]'
    );

    if (!fortress) {
        alert('Pirate Fortress not found');
        return;
    }

    let url = fortress.href;

    if (!url.includes('buildingConstructionList')) {
        url += '&dialog=buildingConstructionList&templateView=buildingConstructionList';
    }

    // =========================
    // OPEN WINDOW IMMEDIATELY
    // =========================
    const win = window.open(url, '_blank');

    if (!win) {
        alert('Popup blocked');
        return;
    }

    alert('Pirate window opened. Waiting for load...');

    const CONCURRENT_REQUESTS = 3;
    const START_DELAY = 50;

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function getViewData(responseText) {
        try {
            const match = responseText.match(
                /\["updateBackgroundData",\s*([\s\S]*?)\]\s*,\s*\["updateTemplateData"/
            );
            if (match && match[1]) return JSON.parse(match[1]);
        } catch (e) {}
        return null;
    }

    async function fetchIslandData(cityId) {
        try {
            const response = await fetch(`/index.php?view=island&cityId=${cityId}`);
            const text = await response.text();
            const data = getViewData(text);

            if (!data) return { coords: '', alliance: '' };

            let coords = '';
            let alliance = '';

            if (data.xCoord && data.yCoord) {
                coords = `[${data.xCoord}:${data.yCoord}]`;
            }

            if (data.cities) {
                for (const city of data.cities) {
                    if (String(city.id) === String(cityId)) {
                        if (city.ownerAllyTag) {
                            alliance = `(${city.ownerAllyTag})`;
                        } else if (city.ownerAllyName) {
                            alliance = `(${city.ownerAllyName})`;
                        }
                        break;
                    }
                }
            }

            return { coords, alliance };

        } catch (err) {
            return { coords: '', alliance: '' };
        }
    }

    async function processPlayers(rows) {

        const results = [];

        async function processSingle(row, index) {

            const placeEl = row.querySelector('.place');
            const nameEl = row.querySelector('.userName');
            const bootyEl = row.querySelector('.pirateBooty');

            if (!nameEl) return;

            let position = placeEl
                ? placeEl.innerText.replace('.', '').trim()
                : String(index + 1);

            const name = nameEl.innerText.trim();
            const points = bootyEl ? bootyEl.innerText.trim() : '0';

            let cityId = 0;

            const link = row.querySelector('a.userName') || row.querySelector('a');

            if (link) {
                const str = link.getAttribute('onclick') || link.href || '';
                const match = str.match(/cityId=(\d+)/);
                if (match) cityId = match[1];
            }

            let coords = '';
            let alliance = '';

            let liveSpan = row.querySelector('.tm_live_info');

            if (!liveSpan) {
                liveSpan = document.createElement('span');
                liveSpan.className = 'tm_live_info';
                liveSpan.style.marginLeft = '10px';
                liveSpan.style.color = '#00aa00';
                liveSpan.style.fontWeight = 'bold';
                row.appendChild(liveSpan);
            }

            liveSpan.textContent = 'Loading...';

            if (cityId) {
                const data = await fetchIslandData(cityId);
                coords = data.coords;
                alliance = data.alliance;
            }

            liveSpan.textContent = (coords + ' ' + alliance).trim();

            let line = `${position} . ${points} Capture Points ${name}`;

            if (coords) line += ` ${coords}`;
            if (alliance) line += ` ${alliance}`;

            results[index] = line;
        }

        const wait = setInterval(async () => {

            try {

                const rows = win.document.querySelectorAll('#pirateHighscore li');

                if (!rows.length) return;

                clearInterval(wait);

                for (let i = 0; i < rows.length; i += CONCURRENT_REQUESTS) {

                    const batch = [];

                    for (
                        let j = i;
                        j < i + CONCURRENT_REQUESTS && j < rows.length;
                        j++
                    ) {
                        batch.push(processSingle(rows[j], j));
                        await sleep(START_DELAY);
                    }

                    await Promise.all(batch);
                }

                const finalText = results.join('\n');

                try {
                    await navigator.clipboard.writeText(finalText);
                } catch (err) {
                    prompt('Copy manually:', finalText);
                }

                alert('Piracy list copied to clipboard!');

            } catch (e) {}

        }, 500);

    }

})();
