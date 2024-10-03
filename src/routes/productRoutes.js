const express = require("express");
const { productController } = require("../controllers/index");
const upload = require("../middleware/uploadMiddleware"); // multer middleware for file upload
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, productController.getProducts);
router.post(
  "/upload",
  protect,
  upload.single("file"),
  productController.uploadProducts
);
router.post("/", protect, productController.createProduct); // Create a product
router.put("/:id", protect, productController.updateProduct); // Update a product
router.delete("/:id", protect, productController.deleteProduct);
module.exports = router;
