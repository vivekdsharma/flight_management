const express = require("express");
const router = express.Router();
const db = require("../db");

// Get distinct available places for origin/destination dropdowns
router.get("/places", async (req, res) => {
  try {
    const [origins] = await db.query(
      "SELECT DISTINCT Departure_Place as place FROM Flights ORDER BY Departure_Place"
    );
    const [destinations] = await db.query(
      "SELECT DISTINCT Destination_Place as place FROM Flights ORDER BY Destination_Place"
    );
    const placesSet = new Set([
      ...origins.map((o) => o.place),
      ...destinations.map((d) => d.place),
    ]);
    res.json(Array.from(placesSet));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search flights with flexible parameters
router.get("/search", async (req, res) => {
  const { source, destination, date } = req.query;

  try {
    let query = "SELECT * FROM Flights WHERE 1=1";
    const params = [];

    if (source && source.trim()) {
      query += " AND LOWER(TRIM(Departure_Place)) = LOWER(TRIM(?))";
      params.push(source.trim());
    }

    if (destination && destination.trim()) {
      query += " AND LOWER(TRIM(Destination_Place)) = LOWER(TRIM(?))";
      params.push(destination.trim());
    }

    if (date && date.trim()) {
      const formattedDate = date.trim().replace(/\//g, "-");
      query += " AND DATE(DepartureTime) = ?";
      params.push(formattedDate);
    }

    query += " ORDER BY DepartureTime ASC";

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No flights found matching the criteria" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Flight search error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
