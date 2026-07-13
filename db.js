const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma("journal_mode = WAL");

// Create table if not exists
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

console.log("✅ SQLite database ready");

module.exports = db;
