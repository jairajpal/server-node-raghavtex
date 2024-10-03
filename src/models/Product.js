// models/Product.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // your sequelize instance

const Product = sequelize.define(
  "Product",
  {
    form_enum: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // add other fields as necessary
  },
  {
    timestamps: false, // depending on your table structure
  }
);

module.exports = Product;
