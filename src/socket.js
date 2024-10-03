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

    // Assuming runQuery returns an array of results
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    return null;
  }
};

function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL, // Your frontend URL
    },
  });

  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const user = await authenticateSocket(token);
    if (user) {
      socket.user = user; // Attach user to the socket
      return next();
    }
    return next(new Error("Authentication error"));
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.username} connected`);
    socket.join(socket.user.id);

    socket.on("private_message", ({ to, message }) => {
      io.to(to).emit("private_message", {
        id: to,
        sender: socket.user.id,
        text: message,
        timestamp: new Date().toISOString(),
      });
    });
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
