# Parking Lot Management

Simple full-stack parking lot management demo.

Features:
- Hashing function maps car number -> preferred slot (with linear probing on collisions)
- AVL tree keeps cars sorted by entry time for quick ordered listing
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Frontend: static HTML/CSS/JS with a parking grid visualization

Run:
1. Install dependencies:
   npm install
2. Start server:
   npm start
3. Open http://localhost:3000 in your browser

API:
- POST /api/park { car_no }
- POST /api/leave { car_no }
- GET /api/list -> list sorted by entry time
- GET /api/slots -> slot occupancy

Notes:
- TOTAL_SLOTS set to 20 in `server/routes/parking.js` (changeable)
- DB file created at `server/data/parking.db`
