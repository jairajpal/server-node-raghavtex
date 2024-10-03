const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: "123456",
  // password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Helper function to run SQL queries
const runQuery = async (queryText, queryValues) => {
  try {
    const result = await pool.query(queryText, queryValues);
    return result.rows;
  } catch (error) {
    console.error(`Query Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  pool,
  runQuery,
};
