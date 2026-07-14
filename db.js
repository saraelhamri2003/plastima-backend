const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    original_name TEXT,
    document_type TEXT NOT NULL,
    version TEXT DEFAULT 'V1',
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT DEFAULT 'Inconnu'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT,
    contact TEXT,
    salesperson TEXT,
    visit_type TEXT DEFAULT 'Prospection',
    status TEXT DEFAULT 'Planifiée',
    planned_date TEXT,
    planned_time TEXT,
    location TEXT,
    objectives TEXT,
    notes_before TEXT,
    outcome TEXT,
    report TEXT,
    customer_feedback TEXT,
    next_actions TEXT,
    gps_lat REAL,
    gps_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS visit_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'MAD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS visit_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    original_name TEXT,
    file_type TEXT DEFAULT 'document',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
  )
`);

console.log("SQLite database ready");

module.exports = db;
