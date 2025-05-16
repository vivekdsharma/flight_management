const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken"); // Middleware to verify JWT
const adminOnly = require("../middleware/adminOnly");

// GET all bookings
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.BookingID, p.First_name, p.Last_name, f.AirlineName, f.Departure_Place, f.Destination_Place, b.Status
      FROM Booking b
      JOIN Passenger p ON b.PassengerID = p.PassengerID
      JOIN Flights f ON b.FlightID = f.FlightID
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new booking (basic version)
router.post("/", verifyToken, adminOnly, async (req, res) => {
  const { passengerId, flightId, status } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Booking (PassengerID, FlightID, Status) VALUES (?, ?, ?)`,
      [passengerId, flightId, status || "Pending"]
    );
    res.json({ bookingId: result.insertId, message: "Booking created!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all bookings for a passenger using email
router.get("/my-bookings", verifyToken, async (req, res) => {
  const passengerId = req.user.id; // Use 'id' from JWT payload
  try {
    const [rows] = await db.query(
      `SELECT b.BookingID, f.AirlineName, f.Departure_Place, f.Destination_Place, b.Status
       FROM Booking b JOIN Flights f ON b.FlightID = f.FlightID
       WHERE b.PassengerID = ?`,
      [passengerId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel a booking
router.put("/cancel/:bookingId", verifyToken, async (req, res) => {
  const { bookingId } = req.params;
  let loggedInPassengerId = req.user.id; // Use 'id' from JWT payload

  // Ensure both IDs are numbers for comparison
  if (typeof loggedInPassengerId === "string") {
    loggedInPassengerId = parseInt(loggedInPassengerId, 10);
  }

  try {
    // Step 1: Check if this booking belongs to the logged-in user
    const [rows] = await db.query(
      `SELECT PassengerID FROM Booking WHERE BookingID = ?`,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    let bookingOwnerId = rows[0].PassengerID;
    if (typeof bookingOwnerId === "string") {
      bookingOwnerId = parseInt(bookingOwnerId, 10);
    }

    if (bookingOwnerId !== loggedInPassengerId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to cancel this booking" });
    }

    // Step 2: Update booking status to Cancelled
    const [result] = await db.query(
      `UPDATE Booking SET Status = 'Cancelled' WHERE BookingID = ?`,
      [bookingId]
    );

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get one booking by ID
router.get("/booking/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT b.BookingID, p.First_name, p.Last_name, f.AirlineName, f.Departure_Place, f.Destination_Place, b.Status
       FROM Booking b
       JOIN Passenger p ON b.PassengerID = p.PassengerID
       JOIN Flights f ON b.FlightID = f.FlightID
       WHERE b.BookingID = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Booking not found" });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
