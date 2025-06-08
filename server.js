const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Railway-ready

const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Load users
function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// ✅ Create Account (only 2 max)
app.post('/create-account', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: 'Missing fields' });
  }

  const users = loadUsers();
  if (users[username]) {
    return res.json({ success: false, message: 'Username already exists' });
  }

  if (Object.keys(users).length >= 2) {
    return res.json({ success: false, message: 'Max 2 users allowed' });
  }

  users[username] = { password };
  saveUsers(users);
  console.log(`✅ Account created: ${username}`);
  res.json({ success: true });
});

// ✅ Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();

  if (users[username] && users[username].password === password) {
    console.log(`🔓 Login success: ${username}`);
    return res.json({ success: true });
  } else {
    console.log(`❌ Login failed: ${username}`);
    return res.json({ success: false, message: 'Wrong username or password' });
  }
});

// ✅ Serve content page after login
app.get('/cheetu-room.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cheetu-room.html'));
});

// ✅ Root route fallback (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cheetu Portal running on port ${PORT}`);
});
