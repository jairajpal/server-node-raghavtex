const express = require("express");
const router = express.Router();
const { chatController } = require("../controllers/index");
const { protect } = require("../middleware/authMiddleware");

// Create a new room (group or 1-on-1 conversation)
router.post("/room", protect, chatController.createRoom);

// Send a message to a room
router.post("/rooms/:roomId/messages", protect, chatController.sendMessage);

// Get chat list (all rooms/conversations for the user)
router.get("/users/rooms", protect, chatController.getChatList);

// Get all messages for a specific room
router.get(
  "/rooms/:roomId/messages",
  protect,
  chatController.getMessagesForRoom
);

// Get all messages for a specific room
router.get(
  "/rooms/:roomId/messages/:userId",
  protect,
  chatController.getMessagesForRoom
);

module.exports = router;
