const express = require('express');
const { db } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/customers  (Admin + Driver อ่านได้) ──
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM customers WHERE is_active = 1
    ORDER BY customer_name ASC
  `).all();
  res.json(rows);
});

// ── GET /api/customers/search?q=  (real-time autocomplete) ──
router.get('/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  const rows = db.prepare(`
    SELECT id, customer_code, customer_name, branch, address, contact_name, contact_phone, delivery_note
    FROM customers
    WHERE is_active = 1
      AND (
        customer_name LIKE ?
        OR customer_code LIKE ?
        OR branch LIKE ?
        OR contact_name LIKE ?
      )
    ORDER BY customer_name ASC
    LIMIT 10
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  res.json(rows);
});

// ── GET /api/customers/:id  (ดูรายละเอียด + ประวัติการส่ง) ──
router.get('/:id', requireAuth, (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const history = db.prepare(`
    SELECT d.*, u.full_name as driver_name
    FROM deliveries d
    LEFT JOIN users u ON d.driver_id = u.id
    WHERE d.customer_id = ?
    ORDER BY d.delivery_date DESC, d.created_at DESC
    LIMIT 50
  `).all(customer.id);

  res.json({ ...customer, history });
});

// ── POST /api/customers  (Admin) ──
router.post('/', requireAdmin, (req, res) => {
  const { customer_code, customer_name, branch, address, contact_name, contact_phone, delivery_note } = req.body;
  if (!customer_name) return res.status(400).json({ error: 'customer_name required' });

  // Auto-generate customer_code if not provided
  const code = customer_code || null;

  try {
    const result = db.prepare(`
      INSERT INTO customers (customer_code, customer_name, branch, address, contact_name, contact_phone, delivery_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(code, customer_name, branch || null, address || null, contact_name || null, contact_phone || null, delivery_note || null);

    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'รหัสลูกค้าซ้ำ' });
    throw err;
  }
});

// ── PATCH /api/customers/:id  (Admin) ──
router.patch('/:id', requireAdmin, (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const {
    customer_code, customer_name, branch, address,
    contact_name, contact_phone, delivery_note, is_active
  } = req.body;

  const now = new Date().toLocaleString('sv-SE');

  try {
    db.prepare(`
      UPDATE customers SET
        customer_code  = ?,
        customer_name  = ?,
        branch         = ?,
        address        = ?,
        contact_name   = ?,
        contact_phone  = ?,
        delivery_note  = ?,
        is_active      = ?,
        updated_at     = ?
      WHERE id = ?
    `).run(
      customer_code  !== undefined ? customer_code  : customer.customer_code,
      customer_name  !== undefined ? customer_name  : customer.customer_name,
      branch         !== undefined ? branch         : customer.branch,
      address        !== undefined ? address        : customer.address,
      contact_name   !== undefined ? contact_name   : customer.contact_name,
      contact_phone  !== undefined ? contact_phone  : customer.contact_phone,
      delivery_note  !== undefined ? delivery_note  : customer.delivery_note,
      is_active      !== undefined ? (is_active ? 1 : 0) : customer.is_active,
      now,
      customer.id
    );

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'รหัสลูกค้าซ้ำ' });
    throw err;
  }
});

// ── DELETE /api/customers/:id  (soft delete, Admin) ──
router.delete('/:id', requireAdmin, (req, res) => {
  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  db.prepare("UPDATE customers SET is_active = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(customer.id);
  res.json({ message: 'Customer deactivated' });
});

module.exports = router;
