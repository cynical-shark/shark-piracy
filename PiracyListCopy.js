alert('Piracy List Copy loaded');
(function () {
    'use strict';

    // Prevent loading twice
    if (window.sharkPiracyLoaded) {
        console.log('Shark Piracy Script already loaded');
        return;
    }

    window.sharkPiracyLoaded = true;

    // =========================
    // SAFE SPEED SETTINGS
    // =========================
    const CONCURRENT_REQUESTS = 3;
    const START_DELAY = 50;

    // =========================
    // ADD BUTTON
    // =========================
    function addButton() {

        const toolbar = document.querySelector('#GF_toolbar ul');

        if (!toolbar) return;

        if (document.getElementById('tm_pirate_button')) return;

        const li = document.createElement('li');

        const btn = document.createElement('input');

        btn.id = 'tm_pirate_button';
        btn.type = 'submit';
        btn.value = 'Copy Piracy List';
        btn.className = 'button';

        btn.style.cursor = 'pointer';
        btn.style.marginTop = '4px';
        btn.style.marginLeft = '6px';

        btn.onclick = openPirateWindow;

        li.appendChild(btn);

        toolbar.appendChild(li);
    }

    // =========================
    // OPEN PIRATE WINDOW
    // =========================
    async function openPirateWindow() {

        const fortress = document.querySelector(
            '[id^="js_CityPosition"][id$="Link"][title^="Pirate Fortress"]'
        );

        if (!fortress) {
            alert('Pirate Fortress not found.');
            return;
        }

        let url = fortress.href;

        if (!url.includes('buildingConstructionList')) {

            url += '&dialog=buildingConstructionList&templateView=buildingConstructionList';
        }

        const pirateWin = window.open(url, '_blank');

        const waitForLoad = setInterval(async () => {

            try {

                const doc = pirateWin.document;

                const rows = doc.querySelectorAll('#pirateHighscore li');

                if (!rows.length) return;

                clearInterval(waitForLoad);

                await processPlayers(rows, pirateWin);

            } catch (e) {}

        }, 500);
    }

    // =========================
    // SLEEP
    // =========================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =========================
    // PARSE GAME JSON
    // =========================
    function getViewData(responseText) {

        try {

            const match = responseText.match(
                /\["updateBackgroundData",\s*([\s\S]*?)\]\s*,\s*\["updateTemplateData"/
            );

            if (match && match[1]) {

                return JSON.parse(match[1]);
            }

        } catch (e) {}

        return null;
    }

    // =========================
    // FETCH COORDS + ALLIANCE
    // =========================
    async function fetchIslandData(cityId) {

        try {

            const response = await fetch(
                `/index.php?view=island&cityId=${cityId}`
            );

            const text = await response.text();

            const data = getViewData(text);

            if (!data) {

                return {
                    coords: '',
                    alliance: ''
                };
            }

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
                        }
                        else if (city.ownerAllyName) {

                            alliance = `(${city.ownerAllyName})`;
                        }

                        break;
                    }
                }
            }

            return {
                coords,
                alliance
            };

        } catch (err) {

            return {
                coords: '',
                alliance: ''
            };
        }
    }

    // =========================
    // PROCESS PLAYERS
    // =========================
    async function processPlayers(rows, pirateWin) {

        const results = [];

        async function processSingle(row, index) {

            try {

                const placeEl = row.querySelector('.place');
                const nameEl = row.querySelector('.userName');
                const bootyEl = row.querySelector('.pirateBooty');

                if (!nameEl) return;

                let position = placeEl
                    ? placeEl.innerText.replace('.', '').trim()
                    : String(index + 1);

                const name = nameEl.innerText.trim();

                const points = bootyEl
                    ? bootyEl.innerText.trim()
                    : '0';

                let cityId = 0;

                const link =
                    row.querySelector('a.userName') ||
                    row.querySelector('a');

                if (link) {

                    const str =
                        link.getAttribute('onclick') ||
                        link.href ||
                        '';

                    const match = str.match(/cityId=(\d+)/);

                    if (match) {

                        cityId = match[1];
                    }
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

                liveSpan.textContent = ' Loading...';

                if (cityId) {

                    const data = await fetchIslandData(cityId);

                    coords = data.coords;
                    alliance = data.alliance;
                }

                liveSpan.textContent =
                    ` ${coords} ${alliance}`.trim();

                let line =
                    `${position} . ${points} Capture Points ${name}`;

                if (coords) {

                    line += ` ${coords}`;
                }

                if (alliance) {

                    line += ` ${alliance}`;
                }

                results[index] = line;

            } catch (err) {

                console.error(err);
            }
        }

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

            prompt(
                'Clipboard access was blocked. Copy manually:',
                finalText
            );
        }

        setTimeout(() => {

            if (pirateWin && !pirateWin.closed) {

                pirateWin.close();
            }

        }, 300);

        alert('Piracy list copied to clipboard!');
    }

    // =========================
    // WATCH PAGE CHANGES
    // =========================
    const observer = new MutationObserver(() => {

        addButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addButton();

})();
