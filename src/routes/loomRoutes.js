const express = require("express");
const router = express.Router();
const { loomController } = require("../controllers/index");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, loomController.createLoom);
router.get("/", protect, loomController.getAllLooms);
router.get("/:id", protect, loomController.getLoomById);
router.put("/:id", protect, loomController.updateLoom);
router.delete("/:id", protect, loomController.deleteLoom);

module.exports = router;
