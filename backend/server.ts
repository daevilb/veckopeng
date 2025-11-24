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

// ---------- Legacy-style state helpers (for /api/state) ----------

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
// REST-style helpers
// -----------------------

const getUserById = (id: string): StoredUser | undefined => {
  const familyId = getDefaultFamilyId();
  const row = db
    .prepare(
      'SELECT id, name, role, pin, avatar, phoneNumber, paymentMethod, currency, balance, totalEarned, createdAt, updatedAt, familyId FROM users WHERE id = ? AND familyId = ?'
    )
    .get(id, familyId) as StoredUser | undefined;
  return row;
};

const getTaskById = (id: string): StoredTask | undefined => {
  const familyId = getDefaultFamilyId();
  const row = db
    .prepare(
      'SELECT id, title, description, reward, assignedToId, status, createdAt, completedAt, familyId FROM tasks WHERE id = ? AND familyId = ?'
    )
    .get(id, familyId) as StoredTask | undefined;
  return row;
};

// -----------------------
// Routes
// -----------------------

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
    res.json({ success: true });
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
        'SELECT id, name, role, pin, avatar, phoneNumber, paymentMethod, currency, balance, totalEarned, createdAt, updatedAt FROM users WHERE familyId = ? ORDER BY createdAt ASC'
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
        'SELECT id, title, description, reward, assignedToId, status, createdAt, completedAt FROM tasks WHERE familyId = ? ORDER BY createdAt ASC'
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

    if (!id || !title || !assignedToId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rewardInt = Number.isFinite(body.reward) ? Math.floor(body.reward) : 0;
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
      'INSERT INTO tasks (id, familyId, title, description, reward, assignedToId, status, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      familyId,
      title,
      description ?? null,
      rewardInt,
      assignedToId,
      status,
      createdAt,
      null
    );

    const task = getTaskById(id);
    res.status(201).json(task);
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
      completedAt?: number | null;
    };

    const updates: Partial<StoredTask> = {};

    if (typeof body.status === 'string') {
      updates.status = body.status;
    }
    if (typeof body.title === 'string') {
      updates.title = body.title;
    }
    if (typeof body.description === 'string') {
      updates.description = body.description;
    }
    if (typeof body.reward === 'number' && Number.isFinite(body.reward)) {
      updates.reward = Math.floor(body.reward);
    }
    if (typeof body.completedAt === 'number') {
      updates.completedAt = body.completedAt;
    }
    if (body.completedAt === null) {
      updates.completedAt = null;
    }

    const merged: StoredTask = {
      ...existing,
      ...updates,
    };

    db.prepare(
      'UPDATE tasks SET title = ?, description = ?, reward = ?, status = ?, completedAt = ? WHERE id = ? AND familyId = ?'
    ).run(
      merged.title,
      merged.description ?? null,
      merged.reward,
      merged.status,
      merged.completedAt ?? null,
      merged.id,
      merged.familyId
    );

    const updated = getTaskById(taskId);
    res.json(updated);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Approve task: mark as approved + update child balance atomically
app.post('/api/tasks/:id/approve', (req, res) => {
  const taskId = req.params.id;

  try {
    const existing = getTaskById(taskId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const user = getUserById(existing.assignedToId);
    if (!user) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    const now = Math.floor(Date.now() / 1000);

    const tx = db.transaction(() => {
      // Update task status + completedAt if not set
      db.prepare(
        'UPDATE tasks SET status = ?, completedAt = COALESCE(completedAt, ?) WHERE id = ? AND familyId = ?'
      ).run('approved', now, existing.id, existing.familyId);

      // Update user balance and totalEarned
      const newBalance = (user.balance ?? 0) + (existing.reward ?? 0);
      const newTotalEarned = (user.totalEarned ?? 0) + (existing.reward ?? 0);

      db.prepare(
        'UPDATE users SET balance = ?, totalEarned = ?, updatedAt = ? WHERE id = ? AND familyId = ?'
      ).run(newBalance, newTotalEarned, now, user.id, user.familyId);
    });

    tx();

    const updatedTask = getTaskById(taskId);
    const updatedUser = getUserById(existing.assignedToId);

    res.json({
      task: updatedTask,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error approving task:', err);
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

// Simple health check
app.get('/health', (req, res) => res.send('OK'));

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
  console.log(`SQLite storage: ${DB_FILE}`);
});
