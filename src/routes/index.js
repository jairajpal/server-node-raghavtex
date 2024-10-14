const express = require("express");
const productRoutes = require("./productRoutes");
const userRoutes = require("./userRoutes");
const loomRoutes = require("./loomRoutes");
const chatRoutes = require("./chatRoutes");

const router = express.Router();

// Register the product routes
router.use("/products", productRoutes);
router.use("/user", userRoutes);
router.use("/looms", loomRoutes);
router.use("/chats", chatRoutes);

module.exports = router;
