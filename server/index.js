// ===== DEBUG LOGGING START =====
console.log('=== SERVER STARTUP DEBUG ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('NODE_PATH:', process.env.NODE_PATH || 'not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

const fs = require('fs');
const path = require('path');

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
    const checkPackages = ['npmlog', 'sqlite3', 'bcrypt', 'express', 'cors'];
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
    
    // Specifically check npmlog structure
    const npmlogPath = path.join(nodeModulesPath, 'npmlog');
    if (fs.existsSync(npmlogPath)) {
      console.log('\n=== NPMLOG DETAILED CHECK ===');
      try {
        const npmlogContents = fs.readdirSync(npmlogPath);
        console.log('npmlog directory contents:', npmlogContents);
        const logJsPath = path.join(npmlogPath, 'log.js');
        console.log('log.js exists:', fs.existsSync(logJsPath));
        const packageJsonPath = path.join(npmlogPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          console.log('npmlog package.json main:', pkgJson.main);
          console.log('npmlog package.json version:', pkgJson.version);
        }
      } catch (e) {
        console.log('Error checking npmlog:', e.message);
      }
    }
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

console.log('\n=== ATTEMPTING TO LOAD MODULES ===\n');
// ===== DEBUG LOGGING END =====

// Try to load modules with error handling
let express, cors, sqlite3, bcrypt, jwt;

try {
  console.log('Loading express...');
  express = require('express');
  console.log('✓ express loaded');
} catch (e) {
  console.error('✗ Failed to load express:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

try {
  console.log('Loading cors...');
  cors = require('cors');
  console.log('✓ cors loaded');
} catch (e) {
  console.error('✗ Failed to load cors:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

try {
  console.log('Loading sqlite3...');
  sqlite3 = require('sqlite3').verbose();
  console.log('✓ sqlite3 loaded');
} catch (e) {
  console.error('✗ Failed to load sqlite3:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

try {
  console.log('Loading bcrypt...');
  bcrypt = require('bcrypt');
  console.log('✓ bcrypt loaded');
} catch (e) {
  console.error('✗ Failed to load bcrypt:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

try {
  console.log('Loading jsonwebtoken...');
  jwt = require('jsonwebtoken');
  console.log('✓ jsonwebtoken loaded');
} catch (e) {
  console.error('✗ Failed to load jsonwebtoken:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

console.log('\n=== ALL MODULES LOADED SUCCESSFULLY ===\n');

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