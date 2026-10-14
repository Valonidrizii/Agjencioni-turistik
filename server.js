const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const readJson = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

app.get('/api/bookings', (req, res) => {
  const bookings = readJson(BOOKINGS_FILE);
  res.json({ success: true, data: bookings });
});

app.get('/api/leads', (req, res) => {
  const leads = readJson(LEADS_FILE);
  res.json({ success: true, data: leads });
});

app.post('/api/bookings', (req, res) => {
  const payload = req.body || {};
  const bookings = readJson(BOOKINGS_FILE);
  const booking = {
    id: Date.now(),
    ...payload,
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  writeJson(BOOKINGS_FILE, bookings);

  res.status(201).json({ success: true, data: booking });
});

app.post('/api/leads', (req, res) => {
  const payload = req.body || {};
  const leads = readJson(LEADS_FILE);
  const lead = {
    id: Date.now(),
    ...payload,
    createdAt: new Date().toISOString()
  };

  leads.push(lead);
  writeJson(LEADS_FILE, leads);

  res.status(201).json({ success: true, data: lead });
});

app.delete('/api/bookings', (req, res) => {
  writeJson(BOOKINGS_FILE, []);
  res.json({ success: true, data: [] });
});

app.listen(PORT, () => {
  console.log(`SkyWay Travel server running on http://localhost:${PORT}`);
});
