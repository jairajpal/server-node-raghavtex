// middleware/uploadMiddleware.js
const multer = require("multer");

// Set up Multer for handling file uploads
const storage = multer.memoryStorage(); // Store file in memory (you can change this to disk if needed)

const fileFilter = (req, file, cb) => {
  // Accept only CSV files
  if (file.mimetype === "text/csv") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only CSV allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit file size to 5MB
  },
});

module.exports = upload;
