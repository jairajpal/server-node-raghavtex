"use strict";
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const routes = require("./routes/index");
const { initSocket } = require("./socket");

// Load environment variables from .env file
dotenv.config();

const app = express();

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Default for development
    credentials: true, // Allow credentials
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(cookieParser());

// Register the routes at the /api path
app.use("/api", routes);

// Initialize Socket.IO
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

// Pass the server instance to Socket.IO initialization
initSocket(server);

// Error handling middleware for routes that don't exist
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handling middleware for server errors
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
