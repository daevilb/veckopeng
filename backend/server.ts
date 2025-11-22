import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

const app = express();
const PORT = 8080;
const DATA_DIR = '/data';
const DB_FILE = path.join(DATA_DIR, 'state.json');

// Middleware
app.use(cors() as any);
app.use(express.json() as any);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Creating data directory at ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_STATE = {
  users: [],
  tasks: [],
  theme: 'light'
};

// Helpers
const readDb = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return DEFAULT_STATE;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error("Read Error", e);
    return DEFAULT_STATE;
  }
};

const writeDb = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Write Error", e);
    return false;
  }
};

// Routes
app.get('/api/state', (req, res) => {
  const data = readDb();
  res.json(data);
});

app.post('/api/state', (req, res) => {
  const newState = req.body;
  if (!newState) {
    return res.status(400).json({ error: "Missing body" });
  }
  if (writeDb(newState)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Failed to save" });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
  console.log(`Storage: ${DB_FILE}`);
});