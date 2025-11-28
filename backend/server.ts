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

// Schema + default data
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
      weeklyAllowance INTEGER NOT NULL DEFAULT 0,
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

  // NEW: lightweight migration to ensure weeklyAllowance exists on old DBs
  try {
    db.prepare(
      'ALTER TABLE users ADD COLUMN weeklyAllowance INTEGER NOT NULL DEFAULT 0'
    ).run();
    console.log('Added weeklyAllowance column to users table');
  } catch (err) {
    // Ignore "duplicate column name" – column already exists
    if (String(err).includes('duplicate column name') === false) {
      console.error('weeklyAllowance migration error:', err);
    }
  }

  const defaultId = 'family_default';
  const row = db
    .prepare('SELECT id FROM families WHERE id = ?')
    .get(defaultId) as { id?: string } | undefined;

  if (!row) {
    db.prepare('INSERT OR IGNORE INTO families (id, name) VALUES (?, ?)').run(
      defaultId,
      'Default Family'
    );
    console.log('Created default family in database');
  }
};

const getDefaultFamilyId = (): string => {
  return 'family_default';
};

// -----------------------
// HELPERS
// -----------------------
const generateId = () => Math.random().toString(36).substring(2, 10);

const getUserById = (id: string) => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
};

const getTaskById = (id: string) => {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
};

// Initialize DB
initDb();

// -----------------------
// ROUTES
// -----------------------
app.use('/api', requireFamilyKey);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Get full state (users + tasks)
app.get('/api/state', (req, res) => {
  const familyId = getDefaultFamilyId();
  const users = db
    .prepare('SELECT * FROM users WHERE familyId = ?')
    .all(familyId);
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE familyId = ?')
    .all(familyId);

  // Theme is still static here – frontend also has ThemeContext
  res.json({ users, tasks, theme: 'light' });
});

// CREATE USER
app.post('/api/users', (req, res) => {
  try {
    const body = req.body;
    if (!body.name || !body.role || !body.pin) {
      return res.status(400).json({ error: 'Missing name, role or pin' });
    }

    const id = generateId();
    const familyId = getDefaultFamilyId();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO users (id, familyId, name, role, pin, avatar, phoneNumber, paymentMethod, currency, balance, totalEarned, weeklyAllowance, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      familyId,
      body.name,
      body.role,
      body.pin,
      body.avatar || '👤',
      body.phoneNumber ?? null,
      body.paymentMethod ?? 'swish',
      body.currency || 'SEK',
      0,
      0,
      body.weeklyAllowance ?? 0,
      now,
      now
    );

    res.status(201).json(getUserById(id));
  } catch (err) {
    console.error('Create User Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE USER (PATCH)
app.patch('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  const existing = getUserById(userId);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  const body = req.body;
  const updates: string[] = [];
  const values: any[] = [];

  // Add fields allowed to be updated
  if (body.name !== undefined) {
    updates.push('name = ?');
    values.push(body.name);
  }
  if (body.pin !== undefined) {
    updates.push('pin = ?');
    values.push(body.pin);
  }
  if (body.avatar !== undefined) {
    updates.push('avatar = ?');
    values.push(body.avatar);
  }
  if (body.phoneNumber !== undefined) {
    updates.push('phoneNumber = ?');
    values.push(body.phoneNumber);
  }
  if (body.paymentMethod !== undefined) {
    updates.push('paymentMethod = ?');
    values.push(body.paymentMethod);
  }
  if (body.currency !== undefined) {
    updates.push('currency = ?');
    values.push(body.currency);
  }
  if (body.balance !== undefined) {
    updates.push('balance = ?');
    values.push(body.balance);
  }
  if (body.totalEarned !== undefined) {
    updates.push('totalEarned = ?');
    values.push(body.totalEarned);
  }
  if (body.weeklyAllowance !== undefined) {
    updates.push('weeklyAllowance = ?');
    values.push(body.weeklyAllowance);
  }

  if (updates.length > 0) {
    // Always update 'updatedAt'
    updates.push('updatedAt = ?');
    values.push(Math.floor(Date.now() / 1000));

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    values.push(userId);

    try {
      db.prepare(sql).run(...values);
      res.json(getUserById(userId));
    } catch (err) {
      console.error('Update User Error:', err);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else {
    res.json(existing);
  }
});

// CREATE TASK
app.post('/api/tasks', (req, res) => {
  try {
    const body = req.body;

    if (!body.title || !body.assignedToId) {
      console.log('Create Task Failed: Missing fields', body);
      return res
        .status(400)
        .json({ error: 'Missing title or assignedToId' });
    }

    const user = getUserById(body.assignedToId);
    if (!user) {
      console.log(`Create Task Failed: User ${body.assignedToId} not found`);
      return res.status(400).json({ error: 'User not found' });
    }

    const id = generateId();
    const familyId = getDefaultFamilyId();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO tasks (id, familyId, title, description, reward, assignedToId, status, createdAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      familyId,
      body.title.trim(),
      body.description,
      body.reward || 0,
      body.assignedToId,
      'pending',
      now,
      null
    );

    res.status(201).json(getTaskById(id));
  } catch (err) {
    console.error('Create Task Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// UPDATE TASK (PATCH)
app.patch('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const existing = getTaskById(taskId);

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const body = req.body;
  const updates: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    values.push(body.title);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    values.push(body.description);
  }
  if (body.reward !== undefined) {
    updates.push('reward = ?');
    values.push(body.reward);
  }
  if (body.assignedToId !== undefined) {
    updates.push('assignedToId = ?');
    values.push(body.assignedToId);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    values.push(body.status);
  }
  if (body.completedAt !== undefined) {
    updates.push('completedAt = ?');
    values.push(body.completedAt);
  }

  if (updates.length > 0) {
    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    values.push(taskId);

    try {
      db.prepare(sql).run(...values);
      res.json(getTaskById(taskId));
    } catch (err) {
      console.error('Update Task Error:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  } else {
    res.json(existing);
  }
});

// APPROVE TASK & UPDATE BALANCE
app.post('/api/tasks/:id/approve', (req, res) => {
  const taskId = req.params.id;
  const existing = getTaskById(taskId);

  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const user = getUserById(existing.assignedToId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (existing.status !== 'waiting_for_approval') {
    return res
      .status(400)
      .json({ error: 'Task is not waiting for approval' });
  }

  const now = Math.floor(Date.now() / 1000);

  const tx = db.transaction(() => {
    db.prepare(
      'UPDATE tasks SET status = ?, completedAt = ? WHERE id = ?'
    ).run('completed', now, taskId);
    db.prepare(
      'UPDATE users SET balance = balance + ?, totalEarned = totalEarned + ? WHERE id = ?'
    ).run(existing.reward, existing.reward, user.id);
  });

  tx();
  res.json({ task: getTaskById(taskId), user: getUserById(user.id) });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});