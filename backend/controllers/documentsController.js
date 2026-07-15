const db = require("../db");
const fs = require("fs");
const path = require("path");

exports.uploadDocument = (req, res) => {
  try {
    const { deal_id, document_type, version, uploaded_by } = req.body;

    const stmt = db.prepare(`
      INSERT INTO documents (deal_id, file_name, original_name, document_type, version, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(deal_id, req.file.filename, req.file.originalname, document_type, version, uploaded_by);

    res.status(201).json({ message: "Document uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getDocuments = (req, res) => {
  try {
    const { dealId } = req.params;
    const stmt = db.prepare("SELECT * FROM documents WHERE deal_id = ? ORDER BY upload_date DESC");
    const results = stmt.all(dealId);
    res.json(results);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = (req, res) => {
  try {
    const { id } = req.params;

    const findStmt = db.prepare("SELECT file_name FROM documents WHERE id = ?");
    const doc = findStmt.get(id);

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const deleteStmt = db.prepare("DELETE FROM documents WHERE id = ?");
    deleteStmt.run(id);

    if (doc.file_name) {
      const filePath = path.join(__dirname, "../uploads", doc.file_name);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete physical file:", err.message);
      }
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateDocumentVersion = (req, res) => {
  try {
    const { id } = req.params;
    const { version, uploaded_by } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Get the old document info to delete the old file
    const findStmt = db.prepare("SELECT file_name FROM documents WHERE id = ?");
    const doc = findStmt.get(id);

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const oldFileName = doc.file_name;

    // 2. Update database record
    const updateStmt = db.prepare(`
      UPDATE documents
      SET file_name = ?, original_name = ?, version = ?, uploaded_by = ?, upload_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(req.file.filename, req.file.originalname, version, uploaded_by, id);

    // 3. Delete old file from filesystem if it exists
    if (oldFileName) {
      const oldFilePath = path.join(__dirname, "../uploads", oldFileName);
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error("Failed to delete old file:", err.message);
      }
    }

    res.status(200).json({ message: "Document version updated successfully" });
  } catch (error) {
    console.error("Update version error:", error);
    res.status(500).json({ message: error.message });
  }
};
