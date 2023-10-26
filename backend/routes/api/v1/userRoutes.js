const express = require("express");
const UserController = require("../../../controllers/api/v1/userController");
const { protect } = require("../../../middleware/authMiddleware");

const router = express.Router();

router.post("/", UserController.registerUser);
router.post("/login", UserController.authUser);
router.get("/hello", protect, function (req, res) {
  return res.send("Hello world");
});

module.exports = router;
