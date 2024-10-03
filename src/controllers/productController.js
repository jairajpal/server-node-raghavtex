// controllers/productController.js
const { runQuery } = require("../config/db");
const csv = require("csv-parser");
const { Readable } = require("stream");

exports.uploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const products = [];
    const stream = Readable.from(req.file.buffer.toString("utf-8"));

    stream
      .pipe(csv())
      .on("data", (row) => {
        products.push(row); // Assuming CSV columns match the database table fields
      })
      .on("end", async () => {
        try {
          if (products.length === 0) {
            return res.status(400).json({ error: "No data found in file" });
          }

          const columns = Object.keys(products[0]); // Assumes all rows have the same structure
          const placeholders = columns.map(() => "?").join(", ");

          const query = `INSERT INTO products (${columns.join(
            ", "
          )}) VALUES (${placeholders})`;

          for (const product of products) {
            const values = Object.values(product);
            await runQuery(query, values); // Insert each product row
          }

          res.status(201).json({ status: "success" });
        } catch (error) {
          res
            .status(400)
            .json({ error: "Failed to insert products: " + error.message });
        }
      });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { form_enum } = req.query;
    let query = `SELECT * FROM products`; // Adjust this query based on your table structure
    let queryParams = [];

    if (form_enum === "raw" || form_enum === "dispatch") {
      query += ` WHERE form_enum = $1`;
      queryParams.push(form_enum);
    }

    query += ` ORDER BY date DESC`;

    const products = await runQuery(query, queryParams);
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      challan_no,
      company,
      design,
      size,
      color,
      quantity,
      weight,
      remarks,
      shuttle_or_mat,
      receiving,
      date,
      type,
      form_enum,
    } = req.body;

    const query = `INSERT INTO products (challan_no, company, design, size, color, quantity, weight, remarks, shuttle_or_mat, receiving, date, type, form_enum)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                   RETURNING *`;
    const queryParams = [
      challan_no,
      company,
      design,
      size,
      color,
      quantity,
      weight,
      remarks,
      shuttle_or_mat,
      receiving,
      date,
      type,
      form_enum,
    ];

    const newProduct = await runQuery(query, queryParams);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      challan_no,
      company,
      design,
      size,
      color,
      quantity,
      weight,
      remarks,
      shuttle_or_mat,
      receiving,
      date,
      type,
      form_enum,
    } = req.body;

    const query = `UPDATE products
                   SET challan_no = $1, company = $2, design = $3, size = $4, color = $5, quantity = $6, weight = $7, remarks = $8, shuttle_or_mat = $9, receiving = $10, date = $11, type = $12, form_enum = $13
                   WHERE id = $14
                   RETURNING *`;
    const queryParams = [
      challan_no,
      company,
      design,
      size,
      color,
      quantity,
      weight,
      remarks,
      shuttle_or_mat,
      receiving,
      date,
      type,
      form_enum,
      id,
    ];

    const updatedProduct = await runQuery(query, queryParams);
    if (updatedProduct.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM products WHERE id = $1 RETURNING *`;
    const queryParams = [id];

    const deletedProduct = await runQuery(query, queryParams);
    if (deletedProduct.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
