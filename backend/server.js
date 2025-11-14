const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

/**
 * --- UPDATED ALGORITHM ---
 * Calculates a priority score based on an "Outside-In" strategy.
 * Priority is based on distance from the middle of the bus.
 * Farthest seats (front and back) board first.
 */
function getSeatPriority(seatStr) {
    if (!seatStr) return 999;
    
    const rowMatch = seatStr.match(/(\d+)/);
    const colMatch = seatStr.match(/([A-Z])/i);

    if (!rowMatch || !colMatch) {
        console.warn(`Invalid seat format, skipping: ${seatStr}`);
        return 999;
    }

    const row = parseInt(rowMatch[1], 10);
    const col = colMatch[1].toUpperCase();
    
    // --- NEW LOGIC ---
    // Assuming 20 rows is the max, the middle is 10.5
    const MAX_ROWS = 20;
    const MIDDLE_ROW = MAX_ROWS / 2.0; 

    // Calculate distance from middle. Farthest seats (e.g., |20 - 10.5| = 9.5) get highest priority.
    // We multiply by -10 to give them the lowest score.
    const rowScore = -Math.abs(row - MIDDLE_ROW) * 10;
    // --- END NEW LOGIC ---

    let colScore = 0;
    // This (window/aisle) now acts as a tie-breaker
    if (['A', 'D'].includes(col)) colScore = 1;      // Window
    else if (['B', 'C'].includes(col)) colScore = 2; // Aisle
    else colScore = 3; // Other
    
    // Example:
    // Row 20 (A20): -|20 - 10.5|*10 + 1 = -94
    // Row 1  (A1):  -|1 - 10.5|*10 + 1 = -94
    // Row 2  (C2):  -|2 - 10.5|*10 + 2 = -83
    // Row 18 (C18): -|18 - 10.5|*10 + 2 = -73
    return rowScore + colScore;
}

// API endpoint to generate the boarding sequence
app.post('/api/generate', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            try {
                if (results.length === 0) {
                    return res.status(400).json({ error: "CSV file is empty or invalid." });
                }

                // --- DUPLICATE SEAT CHECK ---
                const claimedSeats = new Set();
                for (const row of results) {
                    if (!row['Booking_ID'] || !row['Seats']) {
                        throw new Error("CSV must have 'Booking_ID' and 'Seats' columns.");
                    }
                    
                    const seats = row['Seats'].split(',').map(s => s.trim()).filter(s => s);
                    
                    for (const seat of seats) {
                        // Normalize the seat string to handle 'A1' vs '1A'
                        const rowMatch = seat.match(/(\d+)/);
                        const colMatch = seat.match(/([A-Z])/i);
                        
                        if (!rowMatch || !colMatch) {
                            // This seat format is invalid, but we'll let the
                            // getSeatPriority function handle it later.
                            // We only care about valid, duplicate seats.
                            continue; 
                        }
                        
                        // Create a standard ID like "7-A"
                        const normalizedSeat = `${rowMatch[1]}-${colMatch[1].toUpperCase()}`; 

                        if (claimedSeats.has(normalizedSeat)) {
                            // Found a duplicate!
                            throw new Error(`Duplicate seat assignment found: Seat "${seat}" is assigned to multiple bookings.`);
                        }
                        claimedSeats.add(normalizedSeat);
                    }
                }
                // --- END OF NEW CHECK ---


                const bookingPriorities = {};
                results.forEach(row => {
                    // This check is repeated, but it's good practice.
                    if (!row['Booking_ID'] || !row['Seats']) {
                        throw new Error("CSV must have 'Booking_ID' and 'Seats' columns.");
                    }

                    const bookingId = row['Booking_ID'];
                    const seats = row['Seats'].split(',').map(s => s.trim()).filter(s => s);
                    
                    if(seats.length === 0) return; // Skip bookings with no seats

                    // The logic here remains the same: find the best priority seat in the booking
                    const bestPriority = Math.min(...seats.map(getSeatPriority));
                    
                    // This handles duplicate Booking_IDs (first one wins)
                    if (!bookingPriorities[bookingId]) {
                        bookingPriorities[bookingId] = {
                            priority: bestPriority,
                            seats: row['Seats']
                        };
                    }
                });
                
                // This sort function now uses the new priority scores
                const sortedBookings = Object.entries(bookingPriorities)
                    .sort(([, a], [, b]) => a.priority - b.priority);

                const finalSequence = sortedBookings.map(([booking_id, data]) => ({
                    booking_id,
                    seats: data.seats
                }));

                res.json(finalSequence);

            } catch (error) {
                console.error("Processing Error:", error.message);
                res.status(500).json({ error: error.message || "An internal server error occurred." });
            }
        });
});

// Start the server
app.listen(port, () => {
    console.log(` Node.js backend is running and listening at http://127.0.0.1:${port}`);
});
