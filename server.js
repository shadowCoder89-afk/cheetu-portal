require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const session = require('express-session');
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const PORT = process.env.PORT || 3000;

// PostgreSQL config
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD ,
  port:process.env.PGPORT 
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'cheetu_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle account creation
app.post('/create-account', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users');
    if (existing.rows.length >= 2) {
      return res.send('Account limit reached 💀');
    }

    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    res.send('Account created successfully 🎉');
  } catch (err) {
    if (err.code === '23505') {
      res.send('Username already exists 🤷');
    } else {
      console.error(err);
      res.status(500).send('Server error 🧨');
    }
  }
});

// Handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      req.session.user = username;
      res.redirect('/cheetu-room.html');
    } else {
      res.send('Invalid credentials 😑');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Login failed 😵');
  }
});

// Serve cheetu-room.html (after login)
app.get('/cheetu-room.html', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'cheetu-room.html'));
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server up on http://localhost:${PORT}`);
});
