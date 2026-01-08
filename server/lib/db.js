const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'parking.db'));

// initialize
db.exec(`
CREATE TABLE IF NOT EXISTS parked (
  id INTEGER PRIMARY KEY,
  car_no TEXT UNIQUE NOT NULL,
  slot INTEGER NOT NULL,
  entry_time INTEGER NOT NULL
);
`);

module.exports = db;
