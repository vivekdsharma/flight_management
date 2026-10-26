const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const adminOnly = require("../middleware/adminOnly");

// ✅ GET all payments (Admin only)
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pay.PaymentID, 
        pay.BookingID,
        p.First_name, 
        p.Last_name, 
        p.Email,
        f.AirlineName, 
        f.Departure_Place,
        f.Destination_Place,
        pay.Amount, 
        pay.payment_method, 
        pay.Status,
        pay.PaymentDate
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      JOIN Passenger p ON b.PassengerID = p.PassengerID
      JOIN Flights f ON b.FlightID = f.FlightID
      ORDER BY pay.PaymentID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST new payment manually (Admin only)
router.post("/", verifyToken, adminOnly, async (req, res) => {
  const { bookingId, amount, payment_method } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Payment (BookingID, Amount, payment_method, Status) VALUES (?, ?, ?, 'Success')`,
      [bookingId, amount, payment_method || "UPI"]
    );
    res.json({ paymentId: result.insertId, message: "Payment recorded successfully!" });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET payments for the logged-in passenger
router.get("/passenger/:passengerId", verifyToken, async (req, res) => {
  const passengerId = req.user.id;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        pay.PaymentID, 
        pay.BookingID,
        pay.Amount, 
        pay.payment_method, 
        pay.Status,
        pay.PaymentDate,
        f.AirlineName,
        f.Departure_Place,
        f.Destination_Place
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      JOIN Flights f ON b.FlightID = f.FlightID
      WHERE b.PassengerID = ?
      ORDER BY pay.PaymentID DESC`,
      [passengerId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching passenger payments:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Combined Booking + Seat Verification + Payment Confirmation
router.post("/confirm-booking", verifyToken, async (req, res) => {
  const passengerId = req.user.id;
  const { flightId, amount, payment_method } = req.body;

  if (!flightId || !amount) {
    return res.status(400).json({ error: "Flight ID and amount are required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: Check seat availability with row lock
    const [[flight]] = await conn.query(
      `SELECT SeatsAvailable, Price FROM Flights WHERE FlightID = ? FOR UPDATE`,
      [flightId]
    );

    if (!flight) {
      await conn.rollback();
      return res.status(404).json({ error: "Flight not found" });
    }

    if (flight.SeatsAvailable < 1) {
      await conn.rollback();
      return res.status(400).json({ error: "Sorry, this flight has no seats available" });
    }

    // Step 2: Insert into Booking table (Status='Confirmed')
    // The trigger reduce_seat_after_booking will automatically decrement SeatsAvailable
    const [bookingResult] = await conn.query(
      `INSERT INTO Booking (PassengerID, FlightID, Status) VALUES (?, ?, 'Confirmed')`,
      [passengerId, flightId]
    );

    const bookingId = bookingResult.insertId;

    // Step 3: Insert into Payment table
    const [paymentResult] = await conn.query(
      `INSERT INTO Payment (BookingID, Amount, payment_method, Status) VALUES (?, ?, ?, 'Success')`,
      [bookingId, amount, payment_method || "UPI"]
    );

    await conn.commit();

    res.status(201).json({
      message: "Flight booked and payment confirmed successfully!",
      bookingId,
      paymentId: paymentResult.insertId,
      status: "Success",
    });
  } catch (error) {
    await conn.rollback();
    console.error("Booking transaction error:", error);
    res.status(500).json({ error: "Booking/payment failed: " + error.message });
  } finally {
    conn.release();
  }
});

// ✅ GET payment and booking status by passenger email (Admin only)
router.get("/status", verifyToken, adminOnly, async (req, res) => {
  const email = req.query.email?.trim();

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  const query = `
    SELECT 
      p.PassengerID,
      p.First_name,
      p.Last_name,
      p.Email,
      p.Phone,
      b.BookingID,
      f.AirlineName,
      f.Departure_Place,
      f.Destination_Place,
      f.DepartureTime,
      b.Status AS BookingStatus,
      b.BookingDate,
      pay.PaymentID,
      pay.Amount,
      pay.payment_method,
      pay.Status AS PaymentStatus,
      pay.PaymentDate
    FROM Passenger p
    JOIN Booking b ON p.PassengerID = b.PassengerID
    JOIN Flights f ON b.FlightID = f.FlightID
    LEFT JOIN Payment pay ON b.BookingID = pay.BookingID
    WHERE LOWER(TRIM(p.Email)) = LOWER(TRIM(?))
    ORDER BY b.BookingID DESC
  `;

  try {
    const [rows] = await db.query(query, [email]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for email: " + email });
    }
    res.json(rows);
  } catch (err) {
    console.error("Status lookup error:", err);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

module.exports = router;
