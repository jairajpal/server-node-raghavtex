const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { runQuery } = require("./config/db");

let io;

// Middleware to authenticate socket connections
const authenticateSocket = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await runQuery("SELECT * FROM auth_user WHERE id = $1", [
      decoded.id,
    ]);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    return null;
  }
};

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const user = await authenticateSocket(token);
    if (user) {
      socket.user = user;
      return next();
    }
    return next(new Error("Authentication error"));
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    socket.on("join_room", async ({ room }) => {
      const query = `SELECT * FROM room_participants WHERE user_id = $1 AND room_id = $2`;
      const queryParams = [userId, room.id];
      const result = await runQuery(query, queryParams);
      if (result.length > 0) {
        socket.join(room.id);
        console.log(`User ${userId} joined room ${room.id}`);
      } else {
        socket.emit("error", "Not a participant in this room");
      }
    });

    socket.on("send_message", async ({ room, data }) => {
      console.log("room: ", room);
      console.log("data: ", data);
      // const result = await pool.query(
      //   "INSERT INTO messages (room_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *",
      //   [room_id, userId, message]
      // );

      // const newMessage = result.rows[0];
      io.to(room?.id).emit("receive_message", data);
    });

    // socket.join(socket.user.id);

    // socket.on("private_message", ({ to, message }) => {
    //   io.to(to).emit("private_message", {
    //     id: to,
    //     sender: socket.user.id,
    //     text: message,
    //     time: new Date().toISOString(),
    //   });
    //   io.emit("message-update", {}); // Broadcast new message
    // });

    // socket.on("new-message", (messageData) => {
    //   io.emit("message-update", messageData); // Broadcast new message
    // });

    // // Broadcast user activity (for online status, etc.)
    // socket.on("user-active", (userData) => {
    //   io.emit("user-status-change", userData);
    // });
    // Listen for messages from clients
    // socket.on("sendMessage", (msg) => {
    //   console.log("Message received:", msg);

    //   // Emit the message to all connected clients
    //   io.emit("receiveMessage", msg); // Broadcast message to all clients
    //   console.log("msg:==========> ", msg);
    // });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

module.exports = { initSocket };
