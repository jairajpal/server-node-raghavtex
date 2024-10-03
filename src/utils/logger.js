const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, errors, json } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create Winston logger
const logger = createLogger({
  level: "info", // Set the default log level (can be changed based on environment)
  format: combine(
    timestamp(), // Include timestamp
    errors({ stack: true }), // Print stack trace for errors
    logFormat // Use custom log format
  ),
  transports: [
    // Console log
    new transports.Console({
      format: combine(
        format.colorize(), // Colorize output for better readability in the console
        logFormat
      ),
    }),
    // Log to a file for production logs
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }), // All logs
  ],
});

// Log to console only in development mode
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: combine(format.colorize(), logFormat),
    })
  );
}

module.exports = logger;
