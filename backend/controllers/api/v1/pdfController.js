const mongoose = require("mongoose");
const PDF = require("../../../models/pdfModel");
const connectDB = require("../../../config/db");
const asyncHandler = require("express-async-handler");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");

// Function to save the PDF file to MongoDB using GridFS
module.exports.savePdfToMongoDB = asyncHandler(async (req, res) => {
  console.log("Inside save pdf controller");

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  console.log(req.file);

  const { originalname, buffer } = req.file;
  const { user } = req;

  try {
    const { bucket } = await connectDB(); // Get the MongoDB connection and GridFS bucket

    const uploadStream = await bucket.openUploadStream(originalname);

    uploadStream.end(buffer);

    uploadStream.on("finish", async () => {
      const pdf = new PDF({
        filename: originalname,
        fileId: uploadStream.id.toString(),
        user: user._id,
      });

      await pdf.save();
      console.log("Upload completed.");
      res
        .status(200)
        .json({ message: "PDF uploaded and saved to MongoDB", pdf: pdf }); // Respond with a success message
    });
  } catch (error) {
    console.error("Error saving PDF:", error);
    res.status(500).json({ error: "Failed to save PDF" }); // Respond with an error message
  }
});

module.exports.getAllUserPdfs = asyncHandler(async (req, res) => {
  const user = req.user;

  try {
    const pdfs = await PDF.find({ user: user });
    console.log(pdfs);
    res.status(200).json({
      pdfs,
      message: "PDFs retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving PDFs:", error);
    res.status(500).json({ error: "Failed to retrieve PDFs" });
  }
});

module.exports.getSinglePDF = asyncHandler(async (req, res) => {
  const pdfId = req.params.id; // Assuming the PDF ID is provided as a request parameter

  try {
    const { bucket } = await connectDB(); // Get the MongoDB connection and GridFS bucket

    // Find the PDF record in your schema based on the provided ID
    const pdf = await PDF.findById(pdfId);
    console.log("file id", pdf.fileId);
    const fileId = new mongoose.Types.ObjectId(pdf.fileId);

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    // const file = bucket.find(pdf.fileId);

    // Retrieve the PDF from GridFS
    const downloadStream = bucket.openDownloadStream(fileId);

    // Set response headers for the file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdf.filename}"`);

    // Pipe the file to the response to send it to the client
    downloadStream.pipe(res);
    // console.log(downloadStream);
  } catch (error) {
    console.error("Error retrieving PDF:", error.message);
    res.status(500).json({ error: "Failed to retrieve PDF" });
  }
});

module.exports.downloadPdf = async (req, res) => {
  const selectedPages = req.body.selectedPages; // Get selected pages from the request
  const pdfId = req.body.id; // Assuming the PDF ID is provided as a request parameter

  try {
    // Get the MongoDB connection and GridFS bucket
    const { bucket } = await connectDB();

    // Find the PDF record in your schema based on the provided ID
    const pdf = await PDF.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    // Retrieve the original PDF data from GridFS
    const fileId = new mongoose.Types.ObjectId(pdf.fileId);
    const downloadStream = bucket.openDownloadStream(fileId);

    // Read the PDF data as a buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
      downloadStream.on("error", (error) => reject(error)); // Handle errors during the download
    });

    console.log("PDF Buffer Length: ", pdfBuffer.length);

    // Load the original PDF as a PDFDocument
    const originalPdfDoc = await PDFDocument.load(pdfBuffer);
    // const pdfBytes = await originalPdfDoc.save();

    // Create a new PDFDocument
    const newPdfDoc = await PDFDocument.create();
    const pageCount = originalPdfDoc.getPageCount(); // Use getPageCount() to get the page count

    // Process selected pages in sequence
    for (const selectedPage of selectedPages) {
      if (selectedPage >= 1 && selectedPage <= pageCount) {
        let [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [
          selectedPage - 1,
        ]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    // Serialize the new PDF document to a buffer
    const modifiedPdfBytes = await newPdfDoc.save();
    const buffer = Buffer.from(modifiedPdfBytes);

    console.log("modified bytes", buffer);

    // Set the response headers for downloading the PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=downloaded.pdf`);

    // Send the modified PDF buffer as the response
    res.send(buffer);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(400).json({ error: "Failed to download PDF" });
  }
};

module.exports.deletePdf = asyncHandler(async (req, res) => {
  const pdfId = req.params.id; // Assuming the PDF ID is provided as a request parameter

  try {
    // Check if the provided PDF ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(pdfId)) {
      return res.status(400).json({ error: "Invalid PDF ID" });
    }

    // Find the PDF record in your schema based on the provided ID
    const pdf = await PDF.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    // You may want to add additional checks, like ensuring the user is authorized to delete the PDF.

    // Get the MongoDB connection and GridFS bucket
    const { bucket } = await connectDB();

    // Delete the PDF file from GridFS using its fileId
    await bucket.delete(new mongoose.Types.ObjectId(pdf.fileId));

    // Remove the PDF record from your schema
    await PDF.findByIdAndRemove(pdfId);

    res.status(204).send(); // Successfully deleted the PDF with no content in response.
  } catch (error) {
    console.error("Error deleting PDF:", error);
    res.status(500).json({ error: "Failed to delete PDF" });
  }
});
