const express = require("express");
const router = express.Router();
const db = require("../db");
// Handle product search for suggestions
router.get("/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  const sql = `
    SELECT p.id, p.name, p.price, c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.name LIKE ?
    LIMIT 5
  `;

  db.query(sql, [`%${query}%`], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.get("/", (req, res) => {
  const category = req.query.category;

  let sql = `
    SELECT p.id, p.name, p.price, p.image, c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
  `;

  const params = [];

  if (category) {
    sql += " WHERE c.name = ?";
    params.push(category);
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

module.exports = router;
