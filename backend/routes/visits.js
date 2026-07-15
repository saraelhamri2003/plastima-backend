const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createVisit,
  getVisits,
  getVisitDetail,
  updateVisit,
  updateVisitStatus,
  deleteVisit,
  addExpense,
  deleteExpense,
  addAttachment,
  deleteAttachment
} = require("../controllers/visitsController");

router.post("/", createVisit);
router.get("/detail/:id", getVisitDetail);
router.get("/:dealId", getVisits);
router.put("/:id", updateVisit);
router.patch("/:id/status", updateVisitStatus);
router.delete("/expenses/:expenseId", deleteExpense);
router.delete("/attachments/:attachmentId", deleteAttachment);
router.delete("/:id", deleteVisit);
router.post("/:id/expenses", addExpense);
router.post("/:id/attachments", upload.single("file"), addAttachment);

module.exports = router;
