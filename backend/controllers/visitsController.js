const db = require("../db");
const fs = require("fs");
const path = require("path");

const VALID_STATUSES = new Set(["Planifiée", "Terminée", "Annulée", "Reportée"]);
const VALID_VISIT_TYPES = new Set([
  "Prospection",
  "Suivi",
  "Visite Technique",
  "Négociation",
  "Livraison",
  "Autre",
]);
const VALID_EXPENSE_CATEGORIES = new Set(["Transport", "Hôtel", "Repas", "Divers"]);

function badRequest(res, message) {
  return res.status(400).json({ message });
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeVisitPayload(body) {
  return {
    title: body.title,
    company: body.company || "",
    contact: body.contact || "",
    salesperson: body.salesperson || "",
    visit_type: body.visit_type || "Prospection",
    status: body.status || "Planifiée",
    planned_date: body.planned_date || "",
    planned_time: body.planned_time || "",
    location: body.location || "",
    objectives: body.objectives || "",
    notes_before: body.notes_before || "",
    outcome: body.outcome || "",
    report: body.report || "",
    customer_feedback: body.customer_feedback || "",
    next_actions: body.next_actions || "",
    gps_lat: optionalNumber(body.gps_lat),
    gps_lng: optionalNumber(body.gps_lng),
  };
}

function validateVisitPayload(res, payload, requireReportFields = false) {
  if (!payload.title || !String(payload.title).trim()) {
    return badRequest(res, "Le titre de la visite est obligatoire.");
  }

  if (!VALID_VISIT_TYPES.has(payload.visit_type)) {
    return badRequest(res, "Type de visite invalide.");
  }

  if (!VALID_STATUSES.has(payload.status)) {
    return badRequest(res, "Statut de visite invalide.");
  }

  if (Number.isNaN(payload.gps_lat) || Number.isNaN(payload.gps_lng)) {
    return badRequest(res, "Coordonnées GPS invalides.");
  }

  if (requireReportFields && payload.status === "Terminée" && !payload.report.trim()) {
    return badRequest(res, "Le compte rendu est obligatoire pour terminer une visite.");
  }

  return null;
}

exports.createVisit = (req, res) => {
  try {
    const { deal_id } = req.body;
    const payload = normalizeVisitPayload(req.body);

    if (!deal_id) {
      return badRequest(res, "Deal ID obligatoire.");
    }

    const invalid = validateVisitPayload(res, payload);
    if (invalid) return invalid;

    const stmt = db.prepare(`
      INSERT INTO visits (deal_id, title, company, contact, salesperson, visit_type, status, planned_date, planned_time, location, objectives, notes_before)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      deal_id,
      payload.title,
      payload.company,
      payload.contact,
      payload.salesperson,
      payload.visit_type,
      payload.status,
      payload.planned_date,
      payload.planned_time,
      payload.location,
      payload.objectives,
      payload.notes_before
    );

    res.status(201).json({ message: "Visit created successfully", id: info.lastInsertRowid });
  } catch (error) {
    console.error("Create visit error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getVisits = (req, res) => {
  try {
    const { dealId } = req.params;
    const stmt = db.prepare("SELECT * FROM visits WHERE deal_id = ? ORDER BY planned_date DESC, planned_time DESC");
    const results = stmt.all(dealId);
    res.json(results);
  } catch (error) {
    console.error("Get visits error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getVisitDetail = (req, res) => {
  try {
    const { id } = req.params;

    const visitStmt = db.prepare("SELECT * FROM visits WHERE id = ?");
    const visit = visitStmt.get(id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const expensesStmt = db.prepare("SELECT * FROM visit_expenses WHERE visit_id = ? ORDER BY created_at DESC");
    const expenses = expensesStmt.all(id);

    const attachmentsStmt = db.prepare("SELECT * FROM visit_attachments WHERE visit_id = ? ORDER BY uploaded_at DESC");
    const attachments = attachmentsStmt.all(id);

    res.json({ ...visit, expenses, attachments });
  } catch (error) {
    console.error("Get visit detail error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVisit = (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeVisitPayload(req.body);

    const findStmt = db.prepare("SELECT id FROM visits WHERE id = ?");
    const visit = findStmt.get(id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const invalid = validateVisitPayload(res, payload, true);
    if (invalid) return invalid;

    const updateStmt = db.prepare(`
      UPDATE visits
      SET title = ?, company = ?, contact = ?, salesperson = ?, visit_type = ?, status = ?, planned_date = ?, planned_time = ?, location = ?, objectives = ?, notes_before = ?, outcome = ?, report = ?, customer_feedback = ?, next_actions = ?, gps_lat = ?, gps_lng = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(
      payload.title,
      payload.company,
      payload.contact,
      payload.salesperson,
      payload.visit_type,
      payload.status,
      payload.planned_date,
      payload.planned_time,
      payload.location,
      payload.objectives,
      payload.notes_before,
      payload.outcome,
      payload.report,
      payload.customer_feedback,
      payload.next_actions,
      payload.gps_lat,
      payload.gps_lng,
      id
    );

    res.status(200).json({ message: "Visit updated successfully" });
  } catch (error) {
    console.error("Update visit error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateVisitStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.has(status)) {
      return badRequest(res, "Statut de visite invalide.");
    }

    const findStmt = db.prepare("SELECT id FROM visits WHERE id = ?");
    const visit = findStmt.get(id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const updateStmt = db.prepare(`
      UPDATE visits
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(status, id);

    res.status(200).json({ message: "Visit status updated successfully" });
  } catch (error) {
    console.error("Update visit status error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVisit = (req, res) => {
  try {
    const { id } = req.params;

    const findStmt = db.prepare("SELECT id FROM visits WHERE id = ?");
    const visit = findStmt.get(id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const attachmentsStmt = db.prepare("SELECT file_name FROM visit_attachments WHERE visit_id = ?");
    const attachments = attachmentsStmt.all(id);

    for (const attachment of attachments) {
      if (attachment.file_name) {
        const filePath = path.join(__dirname, "../uploads", attachment.file_name);
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete attachment file:", err.message);
        }
      }
    }

    const deleteStmt = db.prepare("DELETE FROM visits WHERE id = ?");
    deleteStmt.run(id);

    res.status(200).json({ message: "Visit deleted successfully" });
  } catch (error) {
    console.error("Delete visit error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addExpense = (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, currency } = req.body;
    const amount = Number(req.body.amount);

    if (!VALID_EXPENSE_CATEGORIES.has(category)) {
      return badRequest(res, "Catégorie de dépense invalide.");
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return badRequest(res, "Montant de dépense invalide.");
    }

    const findStmt = db.prepare("SELECT id FROM visits WHERE id = ?");
    const visit = findStmt.get(id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const stmt = db.prepare(`
      INSERT INTO visit_expenses (visit_id, category, description, amount, currency)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(id, category, description || "", amount, currency || "MAD");

    res.status(201).json({ message: "Expense added successfully", id: info.lastInsertRowid });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteExpense = (req, res) => {
  try {
    const { expenseId } = req.params;

    const findStmt = db.prepare("SELECT id FROM visit_expenses WHERE id = ?");
    const expense = findStmt.get(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const deleteStmt = db.prepare("DELETE FROM visit_expenses WHERE id = ?");
    deleteStmt.run(expenseId);

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addAttachment = (req, res) => {
  try {
    const { id } = req.params;
    const { file_type } = req.body;

    if (!req.file) {
      return badRequest(res, "Fichier obligatoire.");
    }

    const findStmt = db.prepare("SELECT id FROM visits WHERE id = ?");
    const visit = findStmt.get(id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    const stmt = db.prepare(`
      INSERT INTO visit_attachments (visit_id, file_name, original_name, file_type)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(id, req.file.filename, req.file.originalname, file_type || "document");

    res.status(201).json({ message: "Attachment added successfully", id: info.lastInsertRowid });
  } catch (error) {
    console.error("Add attachment error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttachment = (req, res) => {
  try {
    const { attachmentId } = req.params;

    const findStmt = db.prepare("SELECT file_name FROM visit_attachments WHERE id = ?");
    const attachment = findStmt.get(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const deleteStmt = db.prepare("DELETE FROM visit_attachments WHERE id = ?");
    deleteStmt.run(attachmentId);

    if (attachment.file_name) {
      const filePath = path.join(__dirname, "../uploads", attachment.file_name);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete attachment file:", err.message);
      }
    }

    res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    res.status(500).json({ message: error.message });
  }
};
