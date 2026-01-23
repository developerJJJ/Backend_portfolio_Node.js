const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'baseball-usa-secret-key'; // In prod, use ENV

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- Database Setup ---
const dbPath = path.resolve(__dirname, 'baseball.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    // Posts Table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      author TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0
    )`);
  });
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
    stmt.run(username, hashedPassword, function(err) {
      if (err) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      res.json({ message: 'User created' });
    });
    stmt.finalize();
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username: user.username }, SECRET_KEY);
      res.json({ token, user: { username: user.username } });
    } else {
      res.status(403).json({ message: 'Invalid password' });
    }
  });
});

// Get Posts (by category)
app.get('/api/posts', (req, res) => {
  const { category } = req.query;
  const sql = category 
    ? 'SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC' 
    : 'SELECT * FROM posts ORDER BY created_at DESC';
  const params = category ? [category] : [];

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Single Post
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  // Increment views
  db.run('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);
  
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Post not found' });
    res.json(row);
  });
});

// Create Post (Protected)
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, content, category } = req.body;
  const author = req.user.username;
  
  const stmt = db.prepare('INSERT INTO posts (title, content, author, category) VALUES (?, ?, ?, ?)');
  stmt.run(title, content, author, category, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, content, author, category });
  });
  stmt.finalize();
});

// Update Post (Protected)
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = req.user.username;

  // First check ownership
  db.get('SELECT author FROM posts WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Post not found' });
    if (row.author !== user) return res.status(403).json({ message: 'Not authorized' });

    db.run('UPDATE posts SET content = ? WHERE id = ?', [content, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    });
  });
});

// Delete Post (Protected)
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user = req.user.username;

  db.get('SELECT author FROM posts WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Post not found' });
    if (row.author !== user) return res.status(403).json({ message: 'Not authorized' });

    db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted' });
    });
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});