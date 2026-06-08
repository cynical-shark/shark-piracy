(function () {
    'use strict';

    if (window.sharkPiracyDiagLoaded) {
        alert('Diag already loaded');
        return;
    }
    window.sharkPiracyDiagLoaded = true;

    // =========================
    // STEP 1: BOOKMARK FIRED?
    // =========================
    alert('STEP 1: Bookmark executed');

    setTimeout(() => {

        try {

            alert('STEP 2: Script running after delay');

            // =========================
            // STEP 3: FIND FORTRESS
            // =========================
            const fortress = document.querySelector(
                '[id^="js_CityPosition"][id$="Link"][title^="Pirate Fortress"]'
            );

            if (!fortress) {
                alert('STEP 3 FAILED: Pirate Fortress NOT FOUND on page');
                return;
            }

            alert('STEP 3 OK: Fortress found');

            let url = fortress.href;

            if (!url) {
                alert('STEP 3 FAILED: Fortress has no href');
                return;
            }

            alert('STEP 4: Opening pirate window');

            const pirateWin = window.open(url, '_blank');

            if (!pirateWin) {
                alert('STEP 4 FAILED: Popup blocked by browser');
                return;
            }

            alert('STEP 4 OK: Popup opened');

            // =========================
            // STEP 5: WAIT FOR LOAD
            // =========================
            let tries = 0;

            const wait = setInterval(() => {

                tries++;

                try {

                    if (tries > 20) {
                        clearInterval(wait);
                        alert('STEP 5 FAILED: Highscore did not load in time');
                        return;
                    }

                    const doc = pirateWin.document;

                    const rows = doc.querySelectorAll('#pirateHighscore li');

                    if (!rows.length) {
                        if (tries % 2 === 0) {
                            alert('STEP 5: waiting for highscore... attempt ' + tries);
                        }
                        return;
                    }

                    clearInterval(wait);

                    alert('STEP 5 OK: Found rows = ' + rows.length);

                    // =========================
                    // STEP 6: TEST ROW READ
                    // =========================
                    const first = rows[0];

                    if (!first) {
                        alert('STEP 6 FAILED: No rows found after load');
                        return;
                    }

                    alert('STEP 6 OK: Rows accessible');

                    // =========================
                    // STEP 7: DONE
                    // =========================
                    alert('DIAGNOSTIC COMPLETE: Core pipeline works');

                } catch (e) {
                    alert('ERROR: ' + e.message);
                    console.error(e);
                }

            }, 500);

        } catch (e) {
            alert('FATAL ERROR: ' + e.message);
            console.error(e);
        }

    }, 1500);

})();
