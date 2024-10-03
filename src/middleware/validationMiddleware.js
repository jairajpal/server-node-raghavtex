const { body, validationResult } = require("express-validator");

// Validation Middleware
exports.validateRegistration = [
  // body('name').not().isEmpty().withMessage('Name is required'),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one digit")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
