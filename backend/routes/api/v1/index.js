const express = require("express");

const router = express.Router();

// router.use("/chat", require("./chatRoutes"));
router.use("/user", require("./userRoutes"));
router.use("/pdf", require("./pdfRoutes"));

module.exports = router;
