const express = require("express");
const router = express.Router();
const db = require("../db");

// Search flights by source, destination and optional date
router.get("/search", async (req, res) => {
  const { source, destination, date } = req.query;

  if (!source || !destination) {
    return res
      .status(400)
      .json({ error: "Source and destination are required" });
  }

  try {
    let query = `SELECT * FROM Flights WHERE Departure_Place = ? AND Destination_Place = ?`;
    const params = [source, destination];

    if (date) {
      query += ` AND DATE(DepartureTime) = ?`;
      params.push(date);
    }

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No flights found matching the criteria" });
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
