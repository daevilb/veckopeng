import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const app = express();
const PORT = 8080;
const DATA_DIR = '/data';
const JSON_STATE_FILE = path.join(DATA_DIR, 'state.json');
const DB_FILE = path.join(DATA_DIR, 'veckopeng.db');

// Middleware
app.use(cors() as any);
app.use(express.json() as any);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Creating data directory at ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -----------------------
// SQLite setup & helpers
// -----------------------

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      pin TEXT NOT NULL,
      avatar TEXT,
      phoneNumber TEXT,
      paymentMethod TEXT,
      currency TEXT,
      balance INTEGER NOT NULL DEFAULT 0,
      totalEarned INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER,
      FOREIGN KEY (familyId) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      familyId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reward INTEGER NOT NULL,
      assignedToId TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      completedAt INTEGER,
      FOREIGN KEY (familyId) REFERENCES families(id),
      FOREIGN KEY (assignedToId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Ensure a default family exists
  const row = db.prepare('SELECT id FROM families LIMIT 1').get() as { id?: string } | undefined;
  if (!row || !row.id) {
    const defaultId = 'family_default';
    db.prepare('INSERT INTO families (id, name) VALUES (?, ?)').run(defaultId, 'Default Family');
    console.log('Created default family in database');
  }
};

const getDefaultFamilyId = (): string => {
  const row = db.prepare('SELECT id FROM families LIMIT 1').get() as { id?: string } | undefined;
  return row && row.id ? row.id : 'family_default';
};

interface StoredUser {
  id: string;
  name: string;
  role: string;
  pin: string;
  avatar?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  currency?: string;
  balance: number;
  totalEarned: number;
  createdAt: number;
  updatedAt?: number | null;
  familyId: string;
}

interface StoredTask {
  id: string;
  title: string;
  description?: string;
  reward: number;
  assignedToId: string;
  status: string;
  createdAt: number;
  completedAt?: number | null;
  familyId: string;
}

interface AppStatePayload {
  users?: StoredUser[];
  tasks?: StoredTask[];
  theme?: 'light' | 'dark' | string;
}

// Read current state from DB and return in AppState shape
const readStateFromDb = () => {
  const familyId = getDefaultFamilyId();

  const users = db
    .prepare(
      'SELECT id, name, role, pin, avatar, phoneNumber, paymentMethod, currency, balance, totalEarned FROM users WHERE familyId = ? ORDER BY createdAt ASC'
    )
    .all(familyId) as StoredUser[];

  const tasks = db
    .prepare(
      'SELECT id, title, description, reward, assignedToId, status, createdAt, completedAt FROM tasks WHERE familyId = ? ORDER BY createdAt ASC'
    )
    .all(familyId) as StoredTask[];

  const themeRow = db
    .prepare('SELECT value FROM app_meta WHERE key = ?')
    .get('theme') as { value?: string } | undefined;

  const theme = themeRow && themeRow.value === 'dark' ? 'dark' : 'light';

  return {
    users,
    tasks,
    theme,
  };
};

// Replace DB content with incoming state (keeps same semantics as old JSON save)
const saveStateToDb = (state: AppStatePayload) => {
  const familyId = getDefaultFamilyId();
  const users = Array.isArray(state.users) ? state.users : [];
  const tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const theme = state.theme === 'dark' ? 'dark' : 'light';

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM users WHERE familyId = ?').run(familyId);
    db.prepare('DELETE FROM tasks WHERE familyId = ?').run(familyId);

    const insertUser = db.prepare(
      'INSERT INTO users (id, familyId, name, role, pin, avatar, phoneNumber, paymentMethod, currency, balance, totalEarned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const now = Math.floor(Date.now() / 1000);

    for (const u of users) {
      insertUser.run(
        u.id,
        familyId,
        u.name,
        u.role,
        u.pin,
        u.avatar ?? '👤',
        u.phoneNumber ?? null,
        u.paymentMethod ?? null,
        u.currency ?? null,
        typeof u.balance === 'number' ? u.balance : 0,
        typeof u.totalEarned === 'number' ? u.totalEarned : 0,
        now,
        null
      );
    }

    const insertTask = db.prepare(
      'INSERT INTO tasks (id, familyId, title, description, reward, assignedToId, status, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    for (const t of tasks) {
      const createdAt = typeof t.createdAt === 'number' ? t.createdAt : now;
      const completedAt =
        typeof t.completedAt === 'number' ? t.completedAt : null;

      insertTask.run(
        t.id,
        familyId,
        t.title,
        t.description ?? null,
        t.reward,
        t.assignedToId,
        t.status,
        createdAt,
        completedAt
      );
    }

    db.prepare(
      'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run('theme', theme);
  });

  tx();
};

// Optional migration from legacy JSON state file → SQLite
const migrateFromJsonIfNeeded = () => {
  const row = db
    .prepare('SELECT COUNT(*) as count FROM users')
    .get() as { count: number };

  if (row.count > 0) {
    return;
  }

  if (!fs.existsSync(JSON_STATE_FILE)) {
    return;
  }

  try {
    const raw = fs.readFileSync(JSON_STATE_FILE, 'utf-8');
    const json = JSON.parse(raw);
    console.log('Migrating existing JSON state into SQLite database...');
    saveStateToDb(json);
  } catch (err) {
    console.error('Failed to migrate JSON state:', err);
  }
};

// Initialize DB and migrate if needed
initDb();
migrateFromJsonIfNeeded();

// -----------------------
// Routes
// -----------------------

app.get('/api/state', (req, res) => {
  try {
    const state = readStateFromDb();
    res.json(state);
  } catch (err) {
    console.error('Error reading state from DB:', err);
    res.status(500).json({ error: 'Failed to read state' });
  }
});

app.post('/api/state', (req, res) => {
  const newState = req.body as AppStatePayload | undefined;

  if (!newState || typeof newState !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid body' });
  }

  try {
    saveStateToDb(newState);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving state to DB:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
  console.log(`SQLite storage: ${DB_FILE}`);
});
