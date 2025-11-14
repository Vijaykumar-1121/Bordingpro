document.addEventListener('DOMContentLoaded', () => {
    
    // --- Results Page Elements ---
    const downloadBtn = document.getElementById('download-csv-btn');
    const totalBookingsEl = document.getElementById('total-bookings');
    const farthestRowEl = document.getElementById('farthest-row');
    const bookingCountDisplayEl = document.getElementById('booking-count-display');
    const resultsListEl = document.getElementById('results-list');
    const busLayoutContainer = document.getElementById('bus-layout'); 

    let animationTimer = null; // Timer for animation
    let currentSequenceData = null; // Store data

    // --- Bus Configuration ---
    const BUS_CONFIG = {
        rows: 20, // Max rows for the layout
        layout: ['R', 'A', 'B', '_', 'C', 'D'] // R = Row Number
    };

    /**
     * Main function to initialize the results page
     */
    function initResultsPage() {
        // Retrieve the generated sequence from browser's sessionStorage
        const sequenceJSON = sessionStorage.getItem('boardingSequence');
        if (!sequenceJSON) {
            handleNoData();
            return;
        }
        
        currentSequenceData = JSON.parse(sequenceJSON);
        if (!currentSequenceData || currentSequenceData.length === 0) {
            handleNoData();
            return;
        }
        
        displayResultsPage(currentSequenceData);
    }
    
    function handleNoData() {
        document.getElementById('results-main').innerHTML = `
            <div class="results-header">
                <h1>No Data Found</h1>
                <p>Could not retrieve boarding sequence. Please go back to the homepage and try again.</p>
            </div>
        `;
    }

    /**
     * Draws the visual bus layout
     */
    function drawBusLayout() {
        busLayoutContainer.innerHTML = ''; // Clear previous layout
        const driverCab = document.createElement('div');
        driverCab.className = 'driver-cab-space';
        busLayoutContainer.appendChild(driverCab);

        for (let i = 1; i <= BUS_CONFIG.rows; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';
            BUS_CONFIG.layout.forEach(col => {
                if (col === '_') {
                    const aisle = document.createElement('div');
                    aisle.className = 'aisle-space';
                    rowDiv.appendChild(aisle);
                } else if (col === 'R') {
                    const rowNum = document.createElement('span');
                    rowNum.className = 'row-number';
                    rowNum.textContent = `${i}`; // Just show number
                    rowDiv.appendChild(rowNum);
                } else {
                    const seat = document.createElement('div');
                    const seatId = `${i}-${col}`; // ID format: 7-D
                    seat.id = `seat-${seatId}`;
                    seat.className = 'seat';
                    seat.textContent = `${col}`; // Show letter
                    rowDiv.appendChild(seat);
                }
            });
            busLayoutContainer.appendChild(rowDiv);
        }
    }

    /**
     * Populates all data and starts the animation
     * @param {Array} sequenceData - The sorted array of booking objects
     */
    function displayResultsPage(sequenceData) {
        // 1. Populate Stats Cards
        const totalBookings = sequenceData.length;
        totalBookingsEl.textContent = totalBookings;
        bookingCountDisplayEl.textContent = `${totalBookings} Bookings`;
        
        const farthestRow = Math.max(...sequenceData.map(item => {
            const seats = item.seats.split(',');
            const firstSeat = seats[0].trim();
            const rowNum = parseInt(firstSeat.match(/(\d+)/)?.[1] || '0');
            return isNaN(rowNum) ? 0 : rowNum;
        }));
        farthestRowEl.textContent = farthestRow;

        // 2. Populate the Boarding Order List
        resultsListEl.innerHTML = '';
        sequenceData.forEach((item, index) => {
            const seats = item.seats.split(',').map(s => s.trim());
            const seatCount = seats.length;
            const firstSeat = seats[0] || '';
            const row = parseInt(firstSeat.match(/(\d+)/)?.[1] || 'N/A');

            const listItem = document.createElement('li');
            listItem.id = `group-${index}`; // ID for highlighting
            listItem.innerHTML = `
                <div class="group-number"><span class="sequence-number">${index + 1}</span></div>
                <div class="booking-info">
                    <span class="booking-id">${item.booking_id}</span>
                    <span class="booking-seats">Seats: ${item.seats}</span>
                </div>
                <div class="booking-meta">
                    <span class="meta-tag row-tag">Row ${row}</span>
                    <span class="meta-tag seat-count-tag">${seatCount} seat${seatCount > 1 ? 's' : ''}</span>
                </div>
            `;
            resultsListEl.appendChild(listItem);
        });

        // 3. Draw Bus and Start Animation
        drawBusLayout();
        let step = 0;

        function highlightNextGroup() {
            // Clear all previous highlights
            document.querySelectorAll('.seat.boarding').forEach(s => s.classList.remove('boarding'));
            document.querySelectorAll('#results-list li.highlighting').forEach(li => li.classList.remove('highlighting'));

            if (step >= sequenceData.length) {
                clearTimeout(animationTimer);
                return; // Animation complete
            }

            const currentGroup = sequenceData[step];
            const seatsToHighlight = currentGroup.seats.split(',').map(s => s.trim());

            // Highlight seats on bus layout
            seatsToHighlight.forEach(seatStr => {
                const rowMatch = seatStr.match(/(\d+)/);
                const colMatch = seatStr.match(/([A-Z])/i);
                if(rowMatch && colMatch) {
                    const seatId = `${rowMatch[1]}-${colMatch[1].toUpperCase()}`;
                    const seatElement = document.getElementById(`seat-${seatId}`);
                    if (seatElement) seatElement.classList.add('boarding');
                }
            });
            
            // Highlight item in text list
            const listItemToHighlight = document.getElementById(`group-${step}`);
            if (listItemToHighlight) listItemToHighlight.classList.add('highlighting');

            step++;
            animationTimer = setTimeout(highlightNextGroup, 1500); // Wait 1.5s
        }
        
        highlightNextGroup(); // Start the animation
    }

    // --- Event Listeners ---
    downloadBtn.addEventListener('click', () => {
        if (!currentSequenceData) return;
        
        let csvContent = "data:text/csv;charset=utf-8,Boarding Order,Booking_ID,Seats\n";
        currentSequenceData.forEach((item, index) => {
            csvContent += `${index + 1},${item.booking_id},"${item.seats}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "boarding_sequence.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Stop animation when user clicks "Back"
    document.getElementById('back-btn').addEventListener('click', () => {
        if (animationTimer) clearTimeout(animationTimer);
    });

    // ---Initialize the page ---
    initResultsPage();
});