import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ===== DEBUG LOGGING START =====
console.log('=== SERVER STARTUP DEBUG ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current working directory:', process.cwd());

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check node_modules directory
const nodeModulesPath = path.join(__dirname, 'node_modules');

if (fs.existsSync(nodeModulesPath)) {
  try {
     // Basic check
  } catch (e) {
    console.error('Error reading node_modules:', e.message);
  }
}

// Check package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('Package name:', packageJson.name);
  } catch (e) {
    console.error('Error reading package.json:', e.message);
  }
}
// ===== DEBUG LOGGING END =====

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'baseball-usa-secret-key'; // In prod, use ENV

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Middleware ---
const dbPath = path.resolve(__dirname, 'baseball.db');

// Health check endpoint
app.get('/health', (req, res) => res.send('Server is healthy'));

// Root endpoint (Keep this BEFORE static files if you want a custom HTML for /)
// Or comment it out to let the Next.js index.html take over.
/*
app.get('/', (req, res) => {
  res.send(`
    <h1>BaseballUSA API Server</h1>
    <p>This is the backend API server. If you are looking for the application, please visit the <a href="http://localhost:3000">Frontend Client</a>.</p>
  `);
});
*/

// --- Serve Static Files (Frontend) ---
const clientOutPath = path.resolve(__dirname, '../client/out');
const nextStaticPath = path.resolve(__dirname, '../client/.next/static');
const nextPublicPath = path.resolve(__dirname, '../client/public');

if (fs.existsSync(clientOutPath)) {
  // If static export was successful
  app.use(express.static(clientOutPath));
} else if (fs.existsSync(nextStaticPath)) {
  // Serve standard Next.js build assets
  app.use('/_next/static', express.static(nextStaticPath));
  app.use(express.static(nextPublicPath));
}

let db;
try {
  db = new Database(dbPath, { verbose: console.log });
  console.log('Connected to SQLite database.');
  await initDb();
} catch (err) {
  console.error('Error opening database', err);
}

async function initDb() {
  try {
    // Users Table
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`).run();

    // Posts Table
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      author TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )`).run();

    // Seed Data
    const count = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    if (count === 0) {
      console.log('Seeding database...');
      // Create admin user if not exists
      const hashedAdminPw = await bcrypt.hash('admin123', 10);
      db.prepare('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)').run('admin', hashedAdminPw);

      const insert = db.prepare('INSERT INTO posts (title, content, author, category) VALUES (?, ?, ?, ?)');
      insert.run('Welcome to BaseballUSA!', 'This is the first post on the platform. Feel free to discuss anything baseball!', 'admin', 'general');
      insert.run('Best bats for 2026', 'What are your recommendations for the new season?', 'admin', 'equipment');
      insert.run('2026 Tournament Schedule', 'The spring season schedule is now live!', 'admin', 'leagues');
      insert.run('Cooperstown Travel Guide', 'Top tips for visiting the Hall of Fame.', 'admin', 'life');
      console.log('Seed data inserted successfully.');
    }
    console.log('Database tables initialized.');
  } catch (err) {
    console.error('Error initializing tables:', err);
  }
}

// --- Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword);
    res.json({ message: 'User created' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username: user.username }, SECRET_KEY);
      res.json({ token, user: { username: user.username } });
    } else {
      res.status(403).json({ message: 'Invalid password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Posts (by category)
app.get('/api/posts', (req, res) => {
  const { category } = req.query;
  try {
    const sql = category 
      ? 'SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC' 
      : 'SELECT * FROM posts ORDER BY created_at DESC';
    const rows = category 
      ? db.prepare(sql).all(category)
      : db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Search Posts
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const searchTerm = `%${q}%`;
    const sql = 'SELECT * FROM posts WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(searchTerm, searchTerm);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Post
app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  try {
    // Increment views
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id);
    
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ message: 'Post not found' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create Post (Protected)
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, content, category } = req.body;
  const author = req.user.username;
  
  try {
    const stmt = db.prepare('INSERT INTO posts (title, content, author, category) VALUES (?, ?, ?, ?)');
    const info = stmt.run(title, content, author, category);
    res.json({ id: Number(info.lastInsertRowid), title, content, author, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update Post (Protected)
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const { content } = req.body;
  const user = req.user.username;

  try {
    // First check ownership
    const row = db.prepare('SELECT author FROM posts WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ message: 'Post not found' });
    if (row.author !== user) return res.status(403).json({ message: 'Not authorized' });

    db.prepare('UPDATE posts SET content = ? WHERE id = ?').run(content, id);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Post (Protected)
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const user = req.user.username;

  try {
    const row = db.prepare('SELECT author FROM posts WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ message: 'Post not found' });
    if (row.author !== user) return res.status(403).json({ message: 'Not authorized' });

    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Handle client-side routing: serve frontend for non-API routes
// This MUST come after all API routes to avoid intercepting API calls
app.use((req, res, next) => {
  const staticIndexPath = path.join(clientOutPath, 'index.html');
  if (fs.existsSync(staticIndexPath)) {
     return res.sendFile(staticIndexPath);
  }
  
  // Note: For full Next.js dynamic features, you usually run 'next start'.
  // This is a fallback for simple deployments.
  res.send(`
    <h1>BaseballUSA API</h1>
    <p>Backend is running. If you see this, the frontend build is not yet linked.</p>
    <a href="/health">Check Health</a>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});