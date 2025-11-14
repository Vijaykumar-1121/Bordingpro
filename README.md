

# BoardingPro - Bus Boarding Sequence Generator

BoardingPro is a web application designed to optimize the bus boarding process. It takes a CSV file of passenger bookings and uses a smart sorting algorithm to generate an efficient boarding sequence that minimizes aisle congestion and reduces total boarding time.

***

## Key Features

- **Smart Sorting:** Implements an "Outside-In" algorithm to board passengers from the front and back of the bus first, efficiently reducing boarding time.
- **Visual Results Page:** Displays the generated boarding sequence as a clean list alongside a color-coded, animated visual layout of the bus.
- **Data Validation:** Automatically checks and reports errors such as:
  - Missing `Booking_ID` or `Seats` columns.
  - Duplicate seat assignments (e.g., seat "7A" assigned to multiple bookings).
- **Flexible Data Input:** Parses seat numbers in various formats (e.g., both `A20` and `20A` are interpreted the same).
- **Exportable Results:** Allows users to download the final generated boarding sequence as a CSV file.

***

## Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (Pure DOM manipulation, no frameworks)

### Backend
- Node.js
- Express.js (API and server)
- `multer` (for handling file uploads)
- `csv-parser` (for parsing CSV data)
- `cors` (to enable frontend-backend communication)

***

## The "Outside-In" Sorting Algorithm

### Goal
- Board passengers starting from the rows farthest from the middle of the bus (front and back rows first), moving inward to the middle rows last.
- This approach aims to minimize aisle congestion during boarding.

### How `getSeatPriority` Works
- **Bus setup:** 20 rows, middle defined as 10.5.
- **Priority calculation:**
  - Calculate absolute distance of each seat's row from the middle row.
  - Multiply the distance by -10 so that farthest rows have the highest priority (lowest score).
  - Add a tie-breaker:
    - Window seats (`A`, `D`) get a smaller score (higher priority) than aisle seats (`B`, `C`).
- **Example:**
  - Row 20 score: $$- |20 - 10.5| \times 10 = -95$$
  - Row 1 score: $$- |1 - 10.5| \times 10 = -95$$
  - Row 10 score: $$- |10 - 10.5| \times 10 = -5$$

***

## How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (includes npm)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/boardingpro-app.git
   cd boardingpro-app
   ```

2. **Set Up the Backend:**
   ```bash
   cd backend
   npm init -y
   npm install express cors multer csv-parser
   node server.js
   ```
   The backend server will run at [http://127.0.0.1:5000](http://127.0.0.1:5000).

3. **Run the Frontend:**
   - Navigate to the `frontend` folder.
   - Open `index.html` directly in your web browser.
  
     
<table>
  <tr>
    <td align="center">
      <img width="500" height="1500" alt="image" src="https://github.com/user-attachments/assets/032a4452-bf5b-448f-8b8f-f64e902ebc71" />
      <br><sub>Home Page</sub>
    </td>
    <td align="center">
      <img width="500" height="1000" alt="image" src="https://github.com/user-attachments/assets/3180f611-7a6b-4b0f-9e08-90afd5e9d7de" />
      <br><sub>Result Page</sub>
    </td>
  </tr>
</table>
  
    

You can now upload a CSV file and view the optimized boarding sequence in action.
