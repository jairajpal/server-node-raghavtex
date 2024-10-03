const jwt = require("jsonwebtoken");

// Token generation utility
exports.generateToken = (id) => {
  const payload = { id }; // Only the user ID in the token
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h", // Set token expiration time
  });
};
