const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/delivery.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

function initDatabase() {
  // WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('driver','admin')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_address TEXT,
      delivery_date TEXT NOT NULL,
      driver_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','delivered','failed')),
      delivered_at TEXT,
      note TEXT,
      synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS delivery_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
      photo_type TEXT NOT NULL CHECK(photo_type IN ('goods','signature_doc')),
      file_path TEXT NOT NULL,
      taken_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT UNIQUE,
      customer_name TEXT NOT NULL,
      branch TEXT,
      address TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      delivery_note TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
    CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);
    CREATE INDEX IF NOT EXISTS idx_photos_delivery ON delivery_photos(delivery_id);
  `);

  // Migrate: add customer_id to deliveries if not exists
  const cols = db.prepare("PRAGMA table_info(deliveries)").all().map(c => c.name);
  if (!cols.includes('customer_id')) {
    db.exec('ALTER TABLE deliveries ADD COLUMN customer_id INTEGER REFERENCES customers(id)');
    console.log('Migration: added customer_id to deliveries');
  }

  seedData();
  console.log('Database initialized:', DB_PATH);
}

function seedData() {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (adminExists) return;

  const adminHash = bcrypt.hashSync('admin1234', 10);
  const driverHash = bcrypt.hashSync('driver1234', 10);

  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES (?, ?, ?, ?)
  `).run('admin', adminHash, 'ผู้ดูแลระบบ', 'admin');

  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES (?, ?, ?, ?)
  `).run('driver01', driverHash, 'คนขับ 1', 'driver');

  console.log('Seed data created: admin / driver01');
}

module.exports = { db, initDatabase };
