// Helper function to validate numeric user ID format
const isValidUserID = (id) => {
  const userIdRegex = /^\d+$/; // Matches one or more digits
  return userIdRegex.test(id);
};

module.exports = { isValidUserID };
