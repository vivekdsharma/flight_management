const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const adminOnly = require("../middleware/adminOnly");

// GET all bookings (Admin only)
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.BookingID, 
        b.PassengerID,
        b.FlightID,
        p.First_name, 
        p.Last_name, 
        p.Email,
        p.Phone,
        f.AirlineName, 
        f.Departure_Place, 
        f.Destination_Place, 
        f.DepartureTime,
        f.ArrivalTime,
        f.Price,
        b.BookingDate,
        b.Status,
        pay.Amount,
        pay.payment_method,
        pay.Status AS PaymentStatus
      FROM Booking b
      JOIN Passenger p ON b.PassengerID = p.PassengerID
      JOIN Flights f ON b.FlightID = f.FlightID
      LEFT JOIN Payment pay ON b.BookingID = pay.BookingID
      ORDER BY b.BookingID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST new booking (Admin manual create)
router.post("/", verifyToken, adminOnly, async (req, res) => {
  const { passengerId, flightId, status } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Booking (PassengerID, FlightID, Status) VALUES (?, ?, ?)`,
      [passengerId, flightId, status || "Pending"]
    );
    res.status(201).json({ bookingId: result.insertId, message: "Booking created successfully!" });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings for the logged-in passenger
router.get("/my-bookings", verifyToken, async (req, res) => {
  const passengerId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT 
         b.BookingID, 
         b.FlightID,
         f.AirlineName, 
         f.Departure_Place, 
         f.Destination_Place, 
         f.DepartureTime,
         f.ArrivalTime,
         f.Price,
         b.BookingDate,
         b.Status,
         pay.Amount,
         pay.payment_method,
         pay.Status AS PaymentStatus
       FROM Booking b 
       JOIN Flights f ON b.FlightID = f.FlightID
       LEFT JOIN Payment pay ON b.BookingID = pay.BookingID
       WHERE b.PassengerID = ?
       ORDER BY b.BookingID DESC`,
      [passengerId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching passenger bookings:", error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel a booking
router.put("/cancel/:bookingId", verifyToken, async (req, res) => {
  const { bookingId } = req.params;
  const loggedInPassengerId = parseInt(req.user.id, 10);
  const isAdmin = req.user.role === "admin" || req.user.email === "vsharma6_be23@thapar.edu";

  try {
    const [rows] = await db.query(
      `SELECT PassengerID, Status FROM Booking WHERE BookingID = ?`,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = rows[0];

    // Only owner or admin can cancel
    if (!isAdmin && booking.PassengerID !== loggedInPassengerId) {
      return res.status(403).json({ message: "Unauthorized to cancel this booking" });
    }

    if (booking.Status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Trigger increase_seat_on_cancel will automatically add +1 back to SeatsAvailable!
    await db.query(
      `UPDATE Booking SET Status = 'Cancelled' WHERE BookingID = ?`,
      [bookingId]
    );

    res.json({ message: "Booking cancelled successfully. Seat restored to flight availability." });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get one booking by ID
router.get("/booking/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
         b.BookingID, 
         p.First_name, 
         p.Last_name, 
         p.Email,
         f.AirlineName, 
         f.Departure_Place, 
         f.Destination_Place, 
         f.DepartureTime,
         f.ArrivalTime,
         f.Price,
         b.BookingDate,
         b.Status,
         pay.Amount,
         pay.payment_method,
         pay.Status AS PaymentStatus
       FROM Booking b
       JOIN Passenger p ON b.PassengerID = p.PassengerID
       JOIN Flights f ON b.FlightID = f.FlightID
       LEFT JOIN Payment pay ON b.BookingID = pay.BookingID
       WHERE b.BookingID = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
