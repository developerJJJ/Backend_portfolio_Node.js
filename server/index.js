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
console.log('__dirname:', __dirname);
console.log('NODE_PATH:', process.env.NODE_PATH || 'not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Check node_modules directory
const nodeModulesPath = path.join(__dirname, 'node_modules');
console.log('\n=== NODE_MODULES CHECK ===');
console.log('node_modules path:', nodeModulesPath);
console.log('node_modules exists:', fs.existsSync(nodeModulesPath));

if (fs.existsSync(nodeModulesPath)) {
  try {
    const nodeModulesContents = fs.readdirSync(nodeModulesPath);
    console.log('node_modules contents (first 20):', nodeModulesContents.slice(0, 20));
    console.log('Total packages in node_modules:', nodeModulesContents.length);
    
    // Check for specific problematic packages
    const checkPackages = ['npmlog', 'better-sqlite3', 'bcrypt', 'express', 'cors'];
    console.log('\n=== PACKAGE EXISTENCE CHECK ===');
    checkPackages.forEach(pkg => {
      const pkgPath = path.join(nodeModulesPath, pkg);
      const exists = fs.existsSync(pkgPath);
      console.log(`${pkg}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (exists) {
        try {
          const pkgJsonPath = path.join(pkgPath, 'package.json');
          if (fs.existsSync(pkgJsonPath)) {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            console.log(`  - Version: ${pkgJson.version}`);
            console.log(`  - Main: ${pkgJson.main || 'not specified'}`);
          }
        } catch (e) {
          console.log(`  - Error reading package.json: ${e.message}`);
        }
      }
    });
  } catch (e) {
    console.error('Error reading node_modules:', e.message);
  }
}

// Check package.json
const packageJsonPath = path.join(__dirname, 'package.json');
console.log('\n=== PACKAGE.JSON CHECK ===');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('Package name:', packageJson.name);
    console.log('Package version:', packageJson.version);
    console.log('Dependencies:', Object.keys(packageJson.dependencies || {}));
  } catch (e) {
    console.error('Error reading package.json:', e.message);
  }
}

console.log('\n=== ALL MODULES LOADED SUCCESSFULLY ===\n');
// ===== DEBUG LOGGING END =====

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'baseball-usa-secret-key'; // In prod, use ENV

app.use(cors());
app.use(express.json());

// --- Middleware ---
const dbPath = path.resolve(__dirname, 'baseball.db');
const clientDistPath = path.resolve(__dirname, '../client/dist');

// Health check endpoint
app.get('/health', (req, res) => res.send('Server is healthy'));

// Serve static files from the React app
app.use(express.static(clientDistPath));
console.log(`Serving static files from: ${clientDistPath}`);

// Debug: Check if client/dist exists and list files
if (fs.existsSync(clientDistPath)) {
  console.log('client/dist directory exists. Contents:', fs.readdirSync(clientDistPath));
} else {
  console.error('CRITICAL: client/dist directory does NOT exist. Frontend will not load.');
}

let db;
try {
  db = new Database(dbPath, { verbose: console.log });
  console.log('Connected to SQLite database.');
  initDb();
} catch (err) {
  console.error('Error opening database', err);
}

function initDb() {
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

// Get Single Post
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
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
    res.json({ id: info.lastInsertRowid, title, content, author, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update Post (Protected)
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
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
  const { id } = req.params;
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

// The "catchall" handler: for any request that doesn\'t
// match one above, send back React\'s index.html file.
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading frontend');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
