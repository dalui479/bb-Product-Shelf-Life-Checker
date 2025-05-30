document.addEventListener('DOMContentLoaded', () => {
    const manufacturingDateInput = document.getElementById('manufacturingDate');
    const expiryDateInput = document.getElementById('expiryDate');
    const checkButton = document.getElementById('checkButton');
    const statusOutput = document.getElementById('statusOutput');
    const removeDateOutput = document.getElementById('removeDateOutput');

    // Define shelf life removal norms in days
    // This is based on your image, converted to days for consistency
    const removalNormsDays = [
        { shelfLifeDays: 7, removeBeforeDays: 2 },
        { shelfLifeDays: 15, removeBeforeDays: 2 }, // 8 to 15 days
        { shelfLifeDays: 30, removeBeforeDays: 5 }, // 16 to 30 days
        { shelfLifeDays: 60, removeBeforeDays: 10 }, // 31 to 60 days
        { shelfLifeDays: 90, removeBeforeDays: 10 }, // 3 months
        { shelfLifeDays: 120, removeBeforeDays: 15 }, // 4 months
        { shelfId: '6_months', shelfLifeDays: 180, removeBeforeDays: 30 }, // 6 months
        { shelfId: '9_months', shelfLifeDays: 270, removeBeforeDays: 30 }, // 9 months
        { shelfId: '12_months', shelfLifeDays: 365, removeBeforeDays: 30 }, // 12 months
        { shelfId: '24_months', shelfLifeDays: 730, removeBeforeDays: 60 }, // 24 months
        { shelfId: '36_months', shelfLifeDays: 1095, removeBeforeDays: 90 }  // 36 months
    ];

    checkButton.addEventListener('click', () => {
        const manufacturingDateStr = manufacturingDateInput.value;
        const expiryDateStr = expiryDateInput.value;

        if (!manufacturingDateStr || !expiryDateStr) {
            statusOutput.textContent = 'Please enter both Manufacturing and Expiry Dates.';
            statusOutput.className = ''; // Reset class
            removeDateOutput.textContent = '';
            return;
        }

        const manufacturingDate = new Date(manufacturingDateStr);
        const expiryDate = new Date(expiryDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

        // Clear previous classes
        statusOutput.className = '';

        if (expiryDate < today) {
            statusOutput.textContent = 'Status: EXPIRED';
            statusOutput.classList.add('status-expired');
            removeDateOutput.textContent = 'This product is past its expiry date.';
            return;
        }

        const timeDiffExpiryMs = expiryDate.getTime() - today.getTime();
        const daysToExpiry = Math.ceil(timeDiffExpiryMs / (1000 * 60 * 60 * 24));

        const timeDiffTotalShelfLifeMs = expiryDate.getTime() - manufacturingDate.getTime();
        const totalShelfLifeDays = Math.ceil(timeDiffTotalShelfLifeMs / (1000 * 60 * 60 * 24));

        let removeBeforeDays = 0;

        // Find the appropriate removal norm
        for (let i = 0; i < removalNormsDays.length; i++) {
            const norm = removalNormsDays[i];
            if (totalShelfLifeDays <= norm.shelfLifeDays) {
                removeBeforeDays = norm.removeBeforeDays;
                break;
            }
            // For monthly values, handle edge cases where totalShelfLifeDays might be slightly above the exact month days
            // For example, 3 months is 90 days, but 91 days might still fall under 3 months product logic.
            // This is a simplified check, adjust if precise monthly calculations are needed.
            if (norm.shelfId === '3_months' && totalShelfLifeDays <= 92) { removeBeforeDays = norm.removeBeforeDays; break; }
            if (norm.shelfId === '4_months' && totalShelfLifeDays <= 122) { removeBeforeDays = norm.removeBeforeDays; break; }
            if (norm.shelfId === '6_months' && totalShelfLifeDays <= 183) { removeBeforeDays = norm.removeBeforeDays; break; }
            if (norm.shelfId === '9_months' && totalShelfLifeDays <= 274) { removeBeforeDays = norm.removeBeforeDays; break; }
            if (norm.shelfId === '12_months' && totalShelfLifeDays <= 366) { removeBeforeDays = norm.removeBeforeDays; break; }
            if (norm.shelfId === '24_months' && totalShelfLifeDays <= 731) { removeBeforeDays = norm.removeBeforeDays; break; }
            if (norm.shelfId === '36_months' && totalShelfLifeDays <= 1096) { removeBeforeDays = norm.removeBeforeDays; break; }
        }

        if (removeBeforeDays === 0 && totalShelfLifeDays > 1095) { // For products longer than 36 months, default to 3 months removal
            removeBeforeDays = 90;
        }

        const removeDate = new Date(expiryDate);
        removeDate.setDate(expiryDate.getDate() - removeBeforeDays);

        const timeDiffRemoveMs = removeDate.getTime() - today.getTime();
        const daysToRemove = Math.ceil(timeDiffRemoveMs / (1000 * 60 * 60 * 24));

        let statusText = '';
        let removeDateText = '';

        if (daysToExpiry <= 0) { // Should already be caught by expiryDate < today
            statusText = 'Status: EXPIRED';
            statusOutput.classList.add('status-expired');
            removeDateText = 'This product is past its expiry date.';
        } else if (daysToExpiry <= removeBeforeDays && daysToRemove > 0) {
            statusText = 'Status: NEAR EXPIRY - Needs Removal Soon!';
            statusOutput.classList.add('status-near-expiry');
            removeDateText = `Remove product by: ${removeDate.toDateString()} (in ${daysToRemove} days)`;
        } else if (daysToRemove <= 0) {
            statusText = 'Status: TO BE REMOVED';
            statusOutput.classList.add('status-remove');
            removeDateText = `This product should have been removed by: ${removeDate.toDateString()}`;
        }
        else {
            statusText = 'Status: OK';
            statusOutput.classList.add('status-ok');
            removeDateText = `Remove product by: ${removeDate.toDateString()} (in ${daysToRemove} days)`;
        }

        statusOutput.textContent = statusText;
        removeDateOutput.textContent = removeDateText;
    });
});