const express = require("express");
const { userController } = require("../controllers/index");
const { protect } = require("../middleware/authMiddleware");
const { validateRegistration } = require("../middleware/validationMiddleware");

const router = express.Router();

// Authentication routes
router.post("/register", validateRegistration, userController.register);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/logout", userController.logout);

// Profile routes (protected)
router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);
router.get("/all", protect, userController.allUsers);

module.exports = router;
