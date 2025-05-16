// routes/flightRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const adminOnly = require("../middleware/adminOnly");

function toMySQLDateTime(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// GET all flights
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const [flights] = await db.query("SELECT * FROM flights");
    res.json(flights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET single flight by ID
router.get("/:id", verifyToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM Flights WHERE FlightID = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ message: "Flight not found" });
    res.json(results[0]);
  });
});

// POST new flight
router.post("/", verifyToken, adminOnly, (req, res) => {
  const flight = req.body;
  const sql =
    "INSERT INTO Flights (AirlineName, Departure_Place, Destination_Place, DepartureTime, ArrivalTime, SeatsAvailable, Price) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [
    flight.AirlineName,
    flight.Departure_Place,
    flight.Destination_Place,
    toMySQLDateTime(flight.DepartureTime),
    toMySQLDateTime(flight.ArrivalTime),
    flight.SeatsAvailable,
    flight.Price,
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Flight added", FlightID: result.insertId });
  });
});

// PUT update flight
router.put("/:id", verifyToken, adminOnly, (req, res) => {
  const { id } = req.params;
  const flight = req.body;
  const sql =
    "UPDATE Flights SET AirlineName=?, Departure_Place=?, Destination_Place=?, DepartureTime=?, ArrivalTime=?, SeatsAvailable=?, Price=? WHERE FlightID=?";
  const values = [
    flight.AirlineName,
    flight.Departure_Place,
    flight.Destination_Place,
    toMySQLDateTime(flight.DepartureTime),
    toMySQLDateTime(flight.ArrivalTime),
    flight.SeatsAvailable,
    flight.Price,
    id,
  ];

  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Flight updated" });
  });
});

// DELETE flight
router.delete("/:id", verifyToken, adminOnly, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM Flights WHERE FlightID = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Flight deleted" });
  });
});

module.exports = router;
