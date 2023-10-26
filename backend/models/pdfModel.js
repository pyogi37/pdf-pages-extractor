const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  filename: String,
  fileId: String,
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("PDF", pdfSchema);
