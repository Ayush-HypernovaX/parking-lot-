const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const db = require('./lib/db');
const parking = require('./routes/parking');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', parking);

// static frontend
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
