const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC').all();
  res.json(rows);
});

// POST /api/users
router.post('/', requireAdmin, (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'username, password, full_name, role required' });
  }
  if (!['driver', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be driver or admin' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, hash, full_name, role);

    const user = db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' });
    throw err;
  }
});

// PATCH /api/users/:id
router.patch('/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { full_name, password, role, is_active } = req.body;
  const newFullName = full_name !== undefined ? full_name : user.full_name;
  const newRole = ['driver', 'admin'].includes(role) ? role : user.role;
  const newActive = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;
  const newHash = password ? bcrypt.hashSync(password, 10) : user.password_hash;

  db.prepare(`
    UPDATE users SET full_name = ?, role = ?, is_active = ?, password_hash = ?
    WHERE id = ?
  `).run(newFullName, newRole, newActive, newHash, user.id);

  const updated = db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = ?').get(user.id);
  res.json(updated);
});

// DELETE /api/users/:id — soft delete
router.delete('/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(user.id);
  res.json({ message: 'User deactivated' });
});

module.exports = router;
