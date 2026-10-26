// routes/flightRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const adminOnly = require("../middleware/adminOnly");

function toMySQLDateTime(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt; // Already formatted string
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// GET all flights (Public / Authenticated)
router.get("/", async (req, res) => {
  try {
    const [flights] = await db.query(
      "SELECT * FROM Flights ORDER BY DepartureTime ASC"
    );
    res.json(flights);
  } catch (err) {
    console.error("Error fetching flights:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET single flight by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query(
      "SELECT * FROM Flights WHERE FlightID = ?",
      [id]
    );
    if (results.length === 0) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error("Error fetching flight:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST new flight (Admin only)
router.post("/", verifyToken, adminOnly, async (req, res) => {
  const flight = req.body;
  try {
    const sql = `
      INSERT INTO Flights 
      (AirlineName, Departure_Place, Destination_Place, DepartureTime, ArrivalTime, SeatsAvailable, Price) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      flight.AirlineName,
      flight.Departure_Place,
      flight.Destination_Place,
      toMySQLDateTime(flight.DepartureTime),
      toMySQLDateTime(flight.ArrivalTime),
      parseInt(flight.SeatsAvailable, 10),
      parseFloat(flight.Price),
    ];

    const [result] = await db.query(sql, values);
    res.status(201).json({
      message: "Flight added successfully",
      FlightID: result.insertId,
    });
  } catch (err) {
    console.error("Error adding flight:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update flight (Admin only)
router.put("/:id", verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  const flight = req.body;
  try {
    const sql = `
      UPDATE Flights 
      SET AirlineName=?, Departure_Place=?, Destination_Place=?, DepartureTime=?, ArrivalTime=?, SeatsAvailable=?, Price=? 
      WHERE FlightID=?
    `;
    const values = [
      flight.AirlineName,
      flight.Departure_Place,
      flight.Destination_Place,
      toMySQLDateTime(flight.DepartureTime),
      toMySQLDateTime(flight.ArrivalTime),
      parseInt(flight.SeatsAvailable, 10),
      parseFloat(flight.Price),
      id,
    ];

    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.json({ message: "Flight updated successfully" });
  } catch (err) {
    console.error("Error updating flight:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE flight (Admin only)
router.delete("/:id", verifyToken, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM Flights WHERE FlightID = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.json({ message: "Flight deleted successfully" });
  } catch (err) {
    console.error("Error deleting flight:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
