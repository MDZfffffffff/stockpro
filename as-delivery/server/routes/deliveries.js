const express = require('express');
const { db } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/deliveries
router.get('/', requireAuth, (req, res) => {
  const { date, driver_id, status } = req.query;
  let query = `
    SELECT d.*, u.full_name as driver_name
    FROM deliveries d
    LEFT JOIN users u ON d.driver_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'driver') {
    query += ' AND d.driver_id = ?';
    params.push(req.user.id);
  } else if (driver_id) {
    query += ' AND d.driver_id = ?';
    params.push(driver_id);
  }

  if (date) {
    query += ' AND d.delivery_date = ?';
    params.push(date);
  }
  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.delivery_date DESC, d.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// POST /api/deliveries
router.post('/', requireAuth, (req, res) => {
  const { invoice_no, customer_name, customer_address, delivery_date, driver_id, note, customer_id } = req.body;
  if (!invoice_no || !customer_name || !delivery_date) {
    return res.status(400).json({ error: 'invoice_no, customer_name, delivery_date required' });
  }

  const assignedDriver = req.user.role === 'driver' ? req.user.id : (driver_id || null);

  const result = db.prepare(`
    INSERT INTO deliveries (invoice_no, customer_name, customer_address, delivery_date, driver_id, note, customer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(invoice_no, customer_name, customer_address || null, delivery_date, assignedDriver, note || null, customer_id || null);

  const row = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

// GET /api/deliveries/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare(`
    SELECT d.*, u.full_name as driver_name
    FROM deliveries d
    LEFT JOIN users u ON d.driver_id = u.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Not found' });

  if (req.user.role === 'driver' && row.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const photos = db.prepare('SELECT * FROM delivery_photos WHERE delivery_id = ?').all(row.id);
  res.json({ ...row, photos });
});

// PATCH /api/deliveries/:id
router.patch('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  if (req.user.role === 'driver' && row.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { status, note, delivered_at, driver_id } = req.body;
  const allowedStatus = ['pending', 'delivered', 'failed'];

  const newStatus = allowedStatus.includes(status) ? status : row.status;
  const newNote = note !== undefined ? note : row.note;
  const newDeliveredAt = delivered_at !== undefined ? delivered_at : row.delivered_at;
  const syncedAt = new Date().toLocaleString('sv-SE');

  // Admin เท่านั้นที่เปลี่ยน driver ได้
  let newDriverId = row.driver_id;
  if (req.user.role === 'admin' && driver_id !== undefined) {
    const driverExists = driver_id
      ? db.prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_active = 1').get(driver_id, 'driver')
      : true;
    if (!driverExists) return res.status(400).json({ error: 'Driver not found or inactive' });
    newDriverId = driver_id || null;
  }

  db.prepare(`
    UPDATE deliveries
    SET status = ?, note = ?, delivered_at = ?, synced_at = ?, driver_id = ?
    WHERE id = ?
  `).run(newStatus, newNote, newDeliveredAt, syncedAt, newDriverId, row.id);

  const updated = db.prepare(`
    SELECT d.*, u.full_name as driver_name
    FROM deliveries d LEFT JOIN users u ON d.driver_id = u.id
    WHERE d.id = ?
  `).get(row.id);
  res.json(updated);
});

module.exports = router;
