const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { runQuery } = require("../config/db");
const { generateToken } = require("../utils/tokenUtils");
const { logger } = require("../utils/logger");
const { validationResult } = require("express-validator");
const { isValidUserID } = require("../utils/tools"); // Import the utility function

// Registration Controller
exports.register = async (req, res) => {
  const { email, password } = req.body;

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if email already exists
  const emailCheckQuery = "SELECT id FROM auth_user WHERE email = $1";
  try {
    const existingUser = await runQuery(emailCheckQuery, [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already in use" }); // Conflict
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds

    // Insert new user into the database
    const queryText = `
            INSERT INTO auth_user (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, username, email
        `;
    const newUser = await runQuery(queryText, [
      email.split("@")[0],
      email,
      hashedPassword,
    ]);

    // Generate JWT token for the new user
    const token = generateToken(newUser[0].id);

    return res.status(201).json({ token });
  } catch (error) {
    console.error("Error during user registration: ", error);
    return res
      .status(500)
      .json({ message: "User registration failed", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate inputs
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Fetch the user based on email
    const queryText = "SELECT * FROM auth_user WHERE email = $1";
    const user = await runQuery(queryText, [email]);

    if (!user[0]) {
      // logger.info(`Login attempt failed: Invalid email - ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user[0].password);
    if (!passwordMatch) {
      // logger.info(
      //   `Login attempt failed: Password mismatch for email - ${email}`
      // );
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user[0].id);

    // Log successful login
    // logger.info(`User logged in: ${email}`);

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: false, // Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // Set Secure flag in production
      sameSite: "Strict", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
    });

    // Return the token in response
    return res.status(200).json({ message: "Login Success" });
  } catch (error) {
    console.log("error: ", error);
    // logger.error(`Login error for email: ${email} - `, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Logout
exports.logout = (req, res) => {
  try {
    // Clear the token cookie by setting an expired date
    res.cookie("token", "", {
      httpOnly: false, // Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // Use Secure flag in production
      sameSite: "Strict", // CSRF protection
      expires: new Date(0), // Expire the cookie immediately
      path: "/", // Ensure cookie is cleared for all routes
    });

    // Log successful logout
    // logger.info(`User logged out`);

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("error: ", error);
    // logger.error("Logout error: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password (Sending email is omitted, but you'd generate a token and send an email)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await runQuery("SELECT * FROM auth_user WHERE email = $1", [
    email,
  ]);
  if (!user[0]) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = generateToken(user[0].id); // Could be a special reset token

  // Send token via email (skipping this in the code)
  res.json({ message: "Reset token sent to email", resetToken });
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await runQuery("UPDATE auth_user SET password = $1 WHERE id = $2", [
      hashedPassword,
      decoded.id,
    ]);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    // Validate user input
    const userId = req.user?.id; // Ensure the user is authenticated and ID exists
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Validate userId format (assuming it's a UUID)
    if (!isValidUserID(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Query to fetch user data (ensure index on 'id')
    const userQuery = `
      SELECT id, username, email 
      FROM auth_user 
      WHERE id = $1
    `;

    const user = await runQuery(userQuery, [userId]);

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return sanitized user data
    return res.status(200).json({
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
    });
  } catch (error) {
    // logger.error("Error fetching user profile: ", error); // Log the error
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// All Users
exports.allUsers = async (req, res) => {
  try {
    // Validate user input
    const userId = req.user?.id; // Ensure the user is authenticated and ID exists
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Query to fetch user data (ensure index on 'id')
    const userQuery = `
      SELECT id, username, email 
      FROM auth_user 
      WHERE id != $1
    `;

    const user = await runQuery(userQuery, [userId]);
    console.log("user: ", user);

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return sanitized user data
    return res.status(200).json(user);
  } catch (error) {
    // logger.error("Error fetching user profile: ", error); // Log the error
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  await runQuery("UPDATE auth_user SET name = $1, email = $2 WHERE id = $3", [
    name,
    email,
    userId,
  ]);
  res.json({ message: "Profile updated successfully" });
};
