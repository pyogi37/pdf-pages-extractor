const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Use in-memory storage for temporary file storage
const { protect } = require("../../../config/authMiddleware");

const {
  savePdfToMongoDB,
  getAllUserPdfs,
  getSinglePDF,
  downloadPdf,
  deletePdf,
} = require("../../../controllers/api/v1/pdfController");

// POST route to handle PDF file uploads
router.post("/upload", protect, upload.single("pdf"), savePdfToMongoDB);
router.get("/get-all", protect, getAllUserPdfs);
router.get("/:id", protect, getSinglePDF);
router.post("/download", protect, downloadPdf);
router.delete("/:id", protect, deletePdf);
module.exports = router;
