// controllers/loomController.js
const { runQuery } = require("../config/db");

// Create a Loom
exports.createLoom = async (req, res) => {
  try {
    const {
      date,
      loomNo,
      company,
      design,
      warp,
      warpColor,
      weft,
      weftColor,
      widthInch,
      lengthMeter,
      threadCount,
      reed,
      bOrM,
      dentThread,
      remarks,
      type,
    } = req.body;

    const query = `
      INSERT INTO public.looms (
        "date", "loomNo", company, design, warp, "warpColor", 
        weft, "weftColor", "widthInch", "lengthMeter", 
        "threadCount", reed, "bOrM", "dentThread", remarks, "type"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
      RETURNING *`;

    const queryParams = [
      date,
      loomNo,
      company,
      design,
      warp,
      warpColor,
      weft,
      weftColor,
      widthInch,
      lengthMeter,
      threadCount,
      reed,
      bOrM,
      dentThread,
      remarks,
      type,
    ];

    const newLoom = await runQuery(query, queryParams);
    res.status(201).json(newLoom[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all Looms
exports.getAllLooms = async (req, res) => {
  try {
    const query = `SELECT * FROM public.looms ORDER BY "date" DESC`;
    const looms = await runQuery(query);
    res.status(200).json(looms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Loom by ID
exports.getLoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM public.looms WHERE id = $1`;
    const loom = await runQuery(query, [id]);

    if (loom.length === 0) {
      return res.status(404).json({ error: "Loom not found" });
    }
    res.status(200).json(loom[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update Loom
exports.updateLoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      loomNo,
      company,
      design,
      warp,
      warpColor,
      weft,
      weftColor,
      widthInch,
      lengthMeter,
      threadCount,
      reed,
      bOrM,
      dentThread,
      remarks,
      type,
    } = req.body;

    const query = `
      UPDATE public.looms SET 
        "date" = $1, "loomNo" = $2, company = $3, design = $4, 
        warp = $5, "warpColor" = $6, weft = $7, 
        "weftColor" = $8, "widthInch" = $9, "lengthMeter" = $10, 
        "threadCount" = $11, reed = $12, "bOrM" = $13, 
        "dentThread" = $14, remarks = $15, "type" = $16 
      WHERE id = $17 RETURNING *`;

    const queryParams = [
      date,
      loomNo,
      company,
      design,
      warp,
      warpColor,
      weft,
      weftColor,
      widthInch,
      lengthMeter,
      threadCount,
      reed,
      bOrM,
      dentThread,
      remarks,
      type,
      id,
    ];

    const updatedLoom = await runQuery(query, queryParams);
    if (updatedLoom.length === 0) {
      return res.status(404).json({ error: "Loom not found" });
    }
    res.status(200).json(updatedLoom[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete Loom
exports.deleteLoom = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `DELETE FROM public.looms WHERE id = $1 RETURNING *`;
    const deletedLoom = await runQuery(query, [id]);

    if (deletedLoom.length === 0) {
      return res.status(404).json({ error: "Loom not found" });
    }
    res.status(200).json({ message: "Loom deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
