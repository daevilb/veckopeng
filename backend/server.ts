import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { requireFamilyKey } from './familyAuth.ts';

// -----------------------
// APP INITIALIZATION
// -----------------------
const app = express();
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = '/data';
const JSON_STATE_FILE = path.join(DATA_DIR, 'state.json');
const DB_FILE = path.join(DATA_DIR, 'veckopeng.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Basic middlewares
app.use(cors());
app.use(express.json());

// -----------------------
// DATABASE SETUP
// -----------------------
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

  // Ensure a default family exists (internal; frontend bryr sig inte om ID:t)
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

// -----------------------
// TYPES
// -----------------------

interface StoredUser {
  id: string;
  name: string;
  role: string; // 'parent' | 'child'
  pin: string;
  avatar?: string;
  phoneNumber?: string;
  paymentMethod?: string; // 'swish' | 'venmo' | 'cashapp'
  currency?: string; // 'SEK' | 'USD' etc
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
  status: string; // 'pending' | 'waiting_for_approval' | 'completed'
  createdAt: number;
  completedAt?: number | null;
  familyId: string;
}

interface AppStatePayload {
  users?: StoredUser[];
  tasks?: StoredTask[];
  theme?: 'light' | 'dark' | string;
}

interface AppStateResponse {
  users: StoredUser[];
  tasks: StoredTask[];
  theme: 'light' | 'dark';
}

// -----------------------
// STATE HELPERS
// -----------------------

const readStateFromDb = (): AppStateResponse => {
  const familyId = getDefaultFamilyId();

  const users = db
    .prepare(
      `
      SELECT
        id, name, role, pin, avatar, phoneNumber,
        paymentMethod, currency, balance, totalEarned,
        createdAt, updatedAt, familyId
      FROM users
      WHERE familyId = ?
      ORDER BY createdAt ASC
      `
    )
    .all(familyId) as StoredUser[];

  const tasks = db
    .prepare(
      `
      SELECT
        id, title, description, reward, assignedToId,
        status, createdAt, completedAt, familyId
      FROM tasks
      WHERE familyId = ?
      ORDER BY createdAt ASC
      `
    )
    .all(familyId) as StoredTask[];

  const themeRow = db
    .prepare('SELECT value FROM app_meta WHERE key = ?')
    .get('theme') as { value?: string } | undefined;

  const themeValue = themeRow?.value === 'dark' ? 'dark' : 'light';

  return {
    users,
    tasks,
    theme: themeValue,
  };
};

const saveStateToDb = (state: AppStatePayload) => {
  const familyId = getDefaultFamilyId();
  const users = state.users ?? [];
  const tasks = state.tasks ?? [];
  const theme = state.theme === 'dark' ? 'dark' : 'light';

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE familyId = ?').run(familyId);
    db.prepare('DELETE FROM users WHERE familyId = ?').run(familyId);

    const now = Math.floor(Date.now() / 1000);

    const insertUser = db.prepare(
      `
      INSERT INTO users (
        id, familyId, name, role, pin, avatar, phoneNumber,
        paymentMethod, currency, balance, totalEarned,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

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
        typeof u.createdAt === 'number' ? u.createdAt : now,
        typeof u.updatedAt === 'number' ? u.updatedAt : null
      );
    }

    const insertTask = db.prepare(
      `
      INSERT INTO tasks (
        id, familyId, title, description,
        reward, assignedToId, status,
        createdAt, completedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
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
        t.status ?? 'pending',
        createdAt,
        completedAt
      );
    }

    db.prepare(
      `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `
    ).run('theme', theme);
  });

  tx();
};

const migrateFromJsonIfNeeded = () => {
  if (!fs.existsSync(JSON_STATE_FILE)) {
    return;
  }

  try {
    const familyId = getDefaultFamilyId();

    const existingUser = db
      .prepare('SELECT id FROM users WHERE familyId = ? LIMIT 1')
      .get(familyId) as { id?: string } | undefined;

    const existingTask = db
      .prepare('SELECT id FROM tasks WHERE familyId = ? LIMIT 1')
      .get(familyId) as { id?: string } | undefined;

    if (existingUser || existingTask) {
      // DB already has data, don't overwrite it
      return;
    }

    const raw = fs.readFileSync(JSON_STATE_FILE, 'utf8');
    const json = JSON.parse(raw) as AppStatePayload;
    saveStateToDb(json);

    console.log('Migrated legacy JSON state into SQLite.');
    // Optionally rename old file so we don't re-migrera varje gång
    fs.renameSync(JSON_STATE_FILE, `${JSON_STATE_FILE}.migrated`);
  } catch (err) {
    console.error('Failed to migrate JSON state:', err);
  }
};

// Initialize DB + optional migration
initDb();
migrateFromJsonIfNeeded();

// -----------------------
// REST HELPERS
// -----------------------

const getUserById = (id: string): StoredUser | undefined => {
  const familyId = getDefaultFamilyId();
  const row = db
    .prepare(
      `
      SELECT
        id, name, role, pin, avatar, phoneNumber,
        paymentMethod, currency, balance, totalEarned,
        createdAt, updatedAt, familyId
      FROM users
      WHERE id = ? AND familyId = ?
      `
    )
    .get(id, familyId) as StoredUser | undefined;
  return row;
};

const getTaskById = (id: string): StoredTask | undefined => {
  const familyId = getDefaultFamilyId();
  const row = db
    .prepare(
      `
      SELECT
        id, title, description, reward, assignedToId,
        status, createdAt, completedAt, familyId
      FROM tasks
      WHERE id = ? AND familyId = ?
      `
    )
    .get(id, familyId) as StoredTask | undefined;
  return row;
};

// -----------------------
// PUBLIC HEALTH ENDPOINT (no auth)
// -----------------------

// This one is ONLY to check that the container is alive
app.get('/health', (_req, res) => res.send('OK'));

// -----------------------
// AUTHENTICATION MIDDLEWARE
// -----------------------
// Alla /api-rutter nedanför denna kräver en korrekt family key
app.use('/api', requireFamilyKey);

// -----------------------
// AUTHENTICATED ROUTES
// -----------------------

// Used by frontend (AuthContext) to validera family key
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Legacy-style state endpoints (kept for compatibility)
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
    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving state to DB:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// --- New REST-style APIs ---

// Get all users (for family)
app.get('/api/users', (req, res) => {
  try {
    const familyId = getDefaultFamilyId();
    const users = db
      .prepare(
        `
        SELECT
          id, name, role, pin, avatar, phoneNumber,
          paymentMethod, currency, balance, totalEarned,
          createdAt, updatedAt, familyId
        FROM users
        WHERE familyId = ?
        ORDER BY createdAt ASC
        `
      )
      .all(familyId);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all tasks (for family)
app.get('/api/tasks', (req, res) => {
  try {
    const familyId = getDefaultFamilyId();
    const tasks = db
      .prepare(
        `
        SELECT
          id, title, description, reward, assignedToId,
          status, createdAt, completedAt, familyId
        FROM tasks
        WHERE familyId = ?
        ORDER BY createdAt ASC
        `
      )
      .all(familyId);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a task
app.post('/api/tasks', (req, res) => {
  try {
    const body = req.body as {
      id: string;
      title: string;
      description?: string;
      reward: number;
      assignedToId: string;
      status?: string;
      createdAt?: number;
    };

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid body' });
    }

    const { id, title, description, reward, assignedToId } = body;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';

    if (!id || !trimmedTitle || !assignedToId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rewardNumber =
      typeof reward === 'number' ? reward : Number((reward as any) ?? NaN);
    const rewardInt = Number.isFinite(rewardNumber) ? Math.floor(rewardNumber) : 0;

    if (rewardInt <= 0) {
      return res.status(400).json({ error: 'Reward must be a positive number.' });
    }

    if (rewardInt > 1_000_000) {
      return res.status(400).json({ error: 'Reward is unreasonably large.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const createdAt = typeof body.createdAt === 'number' ? body.createdAt : now;
    const status = body.status ?? 'pending';
    const familyId = getDefaultFamilyId();

    // Basic sanity: referenced user must exist
    const user = getUserById(assignedToId);
    if (!user) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    db.prepare(
      `
      INSERT INTO tasks (
        id, familyId, title, description,
        reward, assignedToId, status,
        createdAt, completedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      id,
      familyId,
      trimmedTitle,
      description ?? null,
      rewardInt,
      assignedToId,
      status,
      createdAt,
      null
    );

    const created = getTaskById(id);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task (partial) - e.g. status change
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  try {
    const existing = getTaskById(taskId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const body = req.body as {
      status?: string;
      title?: string;
      description?: string;
      reward?: number;
    };

    const fields: string[] = [];
    const values: any[] = [];

    if (body.status && body.status !== existing.status) {
      fields.push('status = ?');
      values.push(body.status);
    }

    if (typeof body.title === 'string' && body.title.trim() && body.title !== existing.title) {
      fields.push('title = ?');
      values.push(body.title.trim());
    }

    if (typeof body.description === 'string' && body.description !== existing.description) {
      fields.push('description = ?');
      values.push(body.description);
    }

    if (typeof body.reward === 'number' && body.reward > 0 && body.reward !== existing.reward) {
      fields.push('reward = ?');
      values.push(Math.floor(body.reward));
    }

    if (fields.length === 0) {
      return res.json(existing);
    }

    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    values.push(taskId);

    db.prepare(sql).run(...values);

    const updated = getTaskById(taskId);
    res.json(updated);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Approve task: mark as completed + update child balance atomically
app.post('/api/tasks/:id/approve', (req, res) => {
  const taskId = req.params.id;

  try {
    const existing = getTaskById(taskId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (existing.status === 'completed') {
      return res.status(400).json({ error: 'Task is already completed' });
    }

    const user = getUserById(existing.assignedToId);
    if (!user) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    const now = Math.floor(Date.now() / 1000);
    const reward = existing.reward;

    const tx = db.transaction(() => {
      db.prepare(
        `
        UPDATE tasks
        SET status = ?, completedAt = ?
        WHERE id = ?
        `
      ).run('completed', now, taskId);

      db.prepare(
        `
        UPDATE users
        SET balance = balance + ?, totalEarned = totalEarned + ?, updatedAt = ?
        WHERE id = ?
        `
      ).run(reward, reward, now, user.id);
    });

    tx();

    const updatedTask = getTaskById(taskId);
    const updatedUser = getUserById(user.id);

    res.json({
      task: updatedTask,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error approving task:', err);
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
  console.log(`SQLite storage: ${DB_FILE}`);
});
