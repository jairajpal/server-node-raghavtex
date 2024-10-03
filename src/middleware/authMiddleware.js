const jwt = require("jsonwebtoken");

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return; // Circular reference found
        }
        seen.add(value);
      }
      return value;
    },
    2
  );
}
// Authorization Middleware
const protect = (req, res, next) => {
  const token = req.cookies.token; // Expecting 'Bearer TOKEN'

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded token payload (e.g., user ID) to req.user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { protect };
