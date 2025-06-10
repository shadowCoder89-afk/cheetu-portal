const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('users.db');

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Serve index.html ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Serve cheetu-room.html ===
app.get('/cheetu-room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cheetu-room.html'));
});

// === Create Account Route ===
app.post('/create-account', (req, res) => {
  const { username, password } = req.body;

  // Check how many users exist
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'DB error.' });
    }

    if (row.count >= 2) {
      return res.status(403).json({ success: false, message: 'Only 2 users allowed.' });
    }

    // Try inserting user
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ success: false, message: 'Username already exists.' });
        }
        return res.status(500).json({ success: false, message: 'Insert failed.' });
      }

      res.json({ success: true, message: 'Account created successfully!' });
    });
  });
});

// === Login Route ===
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'DB error during login.' });
    }

    if (row) {
      res.json({ success: true, message: 'Login successful.' });
    } else {
      res.status(401).json({ success: false, message: 'Wrong username or password.' });
    }
  });
});

// === Start Server ===
app.listen(port, () => {
  console.log(`Cheetu Portal running at http://localhost:${port}`);
});
