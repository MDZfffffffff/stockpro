const express = require('express');
const { db } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/sync/status — ping
router.get('/status', (req, res) => {
  res.json({ online: true, ts: new Date().toISOString() });
});

// POST /api/sync — batch upsert offline records
router.post('/', requireAuth, (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records array required' });

  const results = [];
  const syncedAt = new Date().toLocaleString('sv-SE');

  const upsertDelivery = db.prepare(`
    INSERT INTO deliveries (invoice_no, customer_name, customer_address, delivery_date, driver_id, status, delivered_at, note, synced_at)
    VALUES (@invoice_no, @customer_name, @customer_address, @delivery_date, @driver_id, @status, @delivered_at, @note, @synced_at)
    ON CONFLICT DO NOTHING
  `);

  const updateDelivery = db.prepare(`
    UPDATE deliveries
    SET status = @status, delivered_at = @delivered_at, note = @note, synced_at = @synced_at
    WHERE invoice_no = @invoice_no AND driver_id = @driver_id AND status = 'pending'
  `);

  const checkConflict = db.prepare(`
    SELECT id, status FROM deliveries WHERE invoice_no = ? AND driver_id = ?
  `);

  const transaction = db.transaction((records) => {
    for (const rec of records) {
      const driverId = req.user.role === 'driver' ? req.user.id : (rec.driver_id || req.user.id);
      const existing = checkConflict.get(rec.invoice_no, driverId);

      if (existing && existing.status !== 'pending') {
        results.push({ invoice_no: rec.invoice_no, result: 'conflict', existing_status: existing.status });
        continue;
      }

      if (!existing) {
        upsertDelivery.run({
          invoice_no: rec.invoice_no,
          customer_name: rec.customer_name || '-',
          customer_address: rec.customer_address || null,
          delivery_date: rec.delivery_date || new Date().toISOString().slice(0, 10),
          driver_id: driverId,
          status: rec.status || 'pending',
          delivered_at: rec.delivered_at || null,
          note: rec.note || null,
          synced_at: syncedAt
        });
        results.push({ invoice_no: rec.invoice_no, result: 'created' });
      } else {
        updateDelivery.run({
          status: rec.status || 'pending',
          delivered_at: rec.delivered_at || null,
          note: rec.note || null,
          synced_at: syncedAt,
          invoice_no: rec.invoice_no,
          driver_id: driverId
        });
        results.push({ invoice_no: rec.invoice_no, result: 'updated' });
      }
    }
  });

  try {
    transaction(records);
    res.json({ synced: results.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
