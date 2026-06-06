const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { db } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB raw input limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

const UPLOADS_DIR = path.join(__dirname, '../../server/uploads');

// POST /api/deliveries/:id/photos
router.post('/deliveries/:id/photos', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    if (req.user.role === 'driver' && delivery.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { photo_type, taken_at } = req.body;
    if (!['goods', 'signature_doc'].includes(photo_type)) {
      return res.status(400).json({ error: 'photo_type must be goods or signature_doc' });
    }

    // Store in /uploads/YYYY/MM/
    const now = new Date();
    const subDir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dir = path.join(UPLOADS_DIR, subDir);
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = path.join(dir, filename);

    // Compress to max ~1MB
    await sharp(req.file.buffer)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(filePath);

    const relPath = `/uploads/${subDir}/${filename}`;

    const result = db.prepare(`
      INSERT INTO delivery_photos (delivery_id, photo_type, file_path, taken_at)
      VALUES (?, ?, ?, ?)
    `).run(delivery.id, photo_type, relPath, taken_at || null);

    const photo = db.prepare('SELECT * FROM delivery_photos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/photos/:year/:month/:filename  — protected
router.get('/:year/:month/:filename', requireAuth, (req, res) => {
  const { year, month, filename } = req.params;
  const filePath = path.join(UPLOADS_DIR, year, month, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

module.exports = router;
