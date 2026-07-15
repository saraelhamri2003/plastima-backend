const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
    uploadDocument,
    getDocuments,
    deleteDocument,
    updateDocumentVersion
} = require("../controllers/documentsController");

router.post(
    "/",
    upload.single("file"),
    uploadDocument
);

router.put(
    "/:id/version",
    upload.single("file"),
    updateDocumentVersion
);

router.get(
    "/:dealId",
    getDocuments
);

router.delete(
    "/:id",
    deleteDocument
);

module.exports = router;