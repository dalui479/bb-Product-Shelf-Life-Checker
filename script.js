document.addEventListener('DOMContentLoaded', () => {
    const manufactureDateInput = document.getElementById('manufactureDate');
    const expiryDateInput = document.getElementById('expiryDate');
    const calculateBtn = document.getElementById('calculateBtn');
    const statusOutput = document.getElementById('status');
    const shelfRemovalDateOutput = document.getElementById('shelfRemovalDate');
    const shelfLifeOutput = document.getElementById('shelfLife');
    const errorMessage = document.getElementById('error-message');

    // Define shelf removal norms based on the provided image
    const shelfRemovalNorms = [
        { shelfLifeDays: 7, removeDaysBeforeExpiry: 2 },
        { shelfLifeDays: 15, removeDaysBeforeExpiry: 2 },
        { shelfLifeDays: 30, removeDaysBeforeExpiry: 5 },
        { shelfLifeDays: 60, removeDaysBeforeExpiry: 10 },
        // For months, we'll store months directly and handle calculation
        { shelfLifeMonths: 3, removeDaysBeforeExpiry: 10 }, // Corresponds to 90 days shelf life for simplicity in mapping
        { shelfLifeMonths: 4, removeDaysBeforeExpiry: 15 }, // Corresponds to 120 days shelf life
        { shelfLifeMonths: 6, removeMonthsBeforeExpiry: 1 },
        { shelfLifeMonths: 9, removeMonthsBeforeExpiry: 1 },
        { shelfLifeMonths: 12, removeMonthsBeforeExpiry: 1 },
        { shelfLifeMonths: 24, removeMonthsBeforeExpiry: 2 },
        { shelfLifeMonths: 36, removeMonthsBeforeExpiry: 3 }
    ];

    // Function to calculate difference in days between two dates
    const getDaysBetweenDates = (date1, date2) => {
        const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Function to calculate difference in months (approx)
    const getMonthsBetweenDates = (date1, date2) => {
        let months = (date2.getFullYear() - date1.getFullYear()) * 12;
        months -= date1.getMonth();
        months += date2.getMonth();
        // Adjust for day difference to be more precise for whole months
        if (date2.getDate() < date1.getDate()) {
            months--;
        }
        return months > 0 ? months : 0;
    };

    const clearResults = () => {
        statusOutput.textContent = '';
        shelfRemovalDateOutput.textContent = '';
        shelfLifeOutput.textContent = '';
        statusOutput.className = 'result-value'; // Reset class
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    };

    calculateBtn.addEventListener('click', () => {
        clearResults(); // Clear previous results

        const manufactureDate = new Date(manufactureDateInput.value);
        const expiryDate = new Date(expiryDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

        if (isNaN(manufactureDate.getTime()) || isNaN(expiryDate.getTime())) {
            errorMessage.textContent = 'Please enter valid Manufacture and Expiry Dates.';
            errorMessage.style.display = 'block';
            return;
        }

        if (expiryDate < manufactureDate) {
            errorMessage.textContent = 'Expiry Date cannot be before Manufacture Date.';
            errorMessage.style.display = 'block';
            return;
        }

        // --- Calculate Shelf Life in Days and Months ---
        const totalShelfLifeDays = getDaysBetweenDates(manufactureDate, expiryDate);
        let shelfLifeDescription = '';
        let shelfLifeInMonthsExact = (expiryDate.getFullYear() - manufactureDate.getFullYear()) * 12 + (expiryDate.getMonth() - manufactureDate.getMonth());
        if (expiryDate.getDate() < manufactureDate.getDate()) {
            shelfLifeInMonthsExact--;
        }

        if (totalShelfLifeDays <= 60) {
            shelfLifeDescription = `${totalShelfLifeDays} Days`;
        } else {
            // For shelf life > 60 days, prefer months display
            // Calculate a more accurate month difference for display
            let displayMonths = getMonthsBetweenDates(manufactureDate, expiryDate);
            let remainingDays = totalShelfLifeDays - (displayMonths * 30.4375); // Use average days for remainder
            if (remainingDays < 0) remainingDays = 0;

            if (remainingDays > 15) { // If significant days left, round up month
                displayMonths = Math.ceil(totalShelfLifeDays / 30.4375);
            } else { // Else, just use the floored month
                 displayMonths = Math.floor(totalShelfLifeDays / 30.4375);
            }

            if (displayMonths === 0 && totalShelfLifeDays > 0) { // If it's less than a month but more than 0 days
                 shelfLifeDescription = `${totalShelfLifeDays} Days`;
            } else if (displayMonths > 0) {
                shelfLifeDescription = `${displayMonths} Months`;
            } else {
                shelfLifeDescription = `${totalShelfLifeDays} Days`; // Fallback
            }
        }
        shelfLifeOutput.textContent = shelfLifeDescription;

        // --- Determine Shelf Removal Date ---
        let shelfRemovalDate = new Date(expiryDate);
        let foundNorm = false;

        // Prioritize month-based norms if shelf life is significant
        if (shelfLifeInMonthsExact >= 3) {
            // Check month-based norms
            for (let i = shelfRemovalNorms.length - 1; i >= 0; i--) {
                const norm = shelfRemovalNorms[i];
                if (norm.shelfLifeMonths !== undefined) {
                    if (shelfLifeInMonthsExact >= norm.shelfLifeMonths) { // Find the largest applicable month norm
                        if (norm.removeMonthsBeforeExpiry !== undefined) {
                            shelfRemovalDate.setMonth(expiryDate.getMonth() - norm.removeMonthsBeforeExpiry);
                            // Adjust day if it overshoots the month end (e.g., Jan 31 - 1 month = Feb 28/29)
                            const originalDay = expiryDate.getDate();
                            if (shelfRemovalDate.getDate() !== originalDay && shelfRemovalDate.getMonth() !== (expiryDate.getMonth() - norm.removeMonthsBeforeExpiry + 12) % 12) {
                                shelfRemovalDate.setDate(0); // Go to last day of previous month
                            }
                        } else if (norm.removeDaysBeforeExpiry !== undefined) {
                            shelfRemovalDate.setDate(expiryDate.getDate() - norm.removeDaysBeforeExpiry);
                        }
                        foundNorm = true;
                        break;
                    }
                }
            }
        }

        if (!foundNorm) { // If no month-based norm found or shelf life is too short, check day-based norms
            for (const norm of shelfRemovalNorms) {
                if (norm.shelfLifeDays !== undefined) {
                    if (totalShelfLifeDays <= norm.shelfLifeDays) {
                        shelfRemovalDate.setDate(expiryDate.getDate() - norm.removeDaysBeforeExpiry);
                        foundNorm = true;
                        break;
                    }
                }
            }
        }
        
        if (!foundNorm) {
             // Fallback for very long shelf lives not explicitly listed (e.g., >36 months)
             // Default to 3 months before for extreme cases, or handle as per your policy
             shelfRemovalDate.setMonth(expiryDate.getMonth() - 3);
             // Ensure day consistency as above
             const originalDay = expiryDate.getDate();
             if (shelfRemovalDate.getDate() !== originalDay && shelfRemovalDate.getMonth() !== (expiryDate.getMonth() - 3 + 12) % 12) {
                shelfRemovalDate.setDate(0);
             }
        }


        shelfRemovalDate.setHours(0, 0, 0, 0); // Normalize to start of day

        shelfRemovalDateOutput.textContent = shelfRemovalDate.toDateString();

        // --- Determine Product Status ---
        let statusText = '';
        let statusClass = '';

        const daysUntilExpiry = getDaysBetweenDates(today, expiryDate);
        const daysUntilShelfRemoval = getDaysBetweenDates(today, shelfRemovalDate);


        if (today > expiryDate) {
            statusText = 'EXPIRED';
            statusClass = 'expired';
        } else if (today >= shelfRemovalDate) { // If today is on or after the removal date, it's near expiry/should be removed
            statusText = 'NEAR EXPIRY (Remove from Shelf)';
            statusClass = 'near-expiry';
        } else {
            statusText = 'OK';
            statusClass = 'ok';
        }

        statusOutput.textContent = statusText;
        statusOutput.className = `result-value ${statusClass}`; // Apply status class for styling
    });
});