const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");
const adminOnly = require("../middleware/adminOnly");
// ✅ GET all payments
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pay.PaymentID, 
        p.First_name, 
        p.Last_name, 
        f.AirlineName, 
        pay.Amount, 
        pay.payment_method, 
        pay.Status
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      JOIN Passenger p ON b.PassengerID = p.PassengerID
      JOIN Flights f ON b.FlightID = f.FlightID
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST new payment
router.post("/", verifyToken, adminOnly, async (req, res) => {
  const { bookingId, amount, payment_method } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Payment (BookingID, Amount, payment_method) VALUES (?, ?, ?)`,
      [bookingId, amount, payment_method || "UPI"]
    );
    res.json({ paymentId: result.insertId, message: "Payment successful!" });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET payments for a specific passenger
router.get("/passenger/:passengerId", verifyToken, async (req, res) => {
  // Always use the logged-in user's ID from the JWT, ignore the URL param
  const passengerId = req.user.id;
  try {
    const [rows] = await db.query(
      `
      SELECT 
        pay.PaymentID, 
        pay.Amount, 
        pay.payment_method, 
        pay.Status,
        f.AirlineName
      FROM Payment pay
      JOIN Booking b ON pay.BookingID = b.BookingID
      JOIN Flights f ON b.FlightID = f.FlightID
      WHERE b.PassengerID = ?`,
      [passengerId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Combined Booking + Payment + Seat Check Route
router.post("/confirm-booking", verifyToken, async (req, res) => {
  const { passengerId, flightId, amount, payment_method } = req.body;

  if (!passengerId || !flightId || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Step 1: Check seat availability
    const [[flight]] = await conn.query(
      `SELECT SeatsAvailable FROM Flights WHERE FlightID = ? FOR UPDATE`,
      [flightId]
    );

    if (!flight || flight.SeatsAvailable < 1) {
      await conn.rollback();
      return res
        .status(400)
        .json({ error: "No seats available for this flight" });
    }

    // Step 2: Insert into Booking table
    const [bookingResult] = await conn.query(
      `INSERT INTO Booking (PassengerID, FlightID, Status) VALUES (?, ?, ?)`,
      [passengerId, flightId, "Confirmed"]
    );

    const bookingId = bookingResult.insertId;

    // Step 3: Insert into Payment table (now includes payment_method)
    await conn.query(
      `INSERT INTO Payment (BookingID, Amount, payment_method, Status) VALUES (?, ?, ?, ?)`,
      [bookingId, amount, payment_method || "UPI", "Success"]
    );

    // 🔄 Step 4: Trigger automatically decrements SeatsAvailable (no manual update)

    await conn.commit();

    res.status(201).json({
      message: "Booking and payment confirmed successfully",
      bookingId,
      status: "Success",
    });
  } catch (error) {
    await conn.rollback();
    console.error("Transaction error:", error.message);
    res.status(500).json({ error: "Booking/payment failed" });
  } finally {
    conn.release();
  }
});

// ✅ GET payment and booking status by passenger email
router.get("/status", verifyToken, adminOnly, async (req, res) => {
  const email = req.query.email?.trim();

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const query = `
    SELECT 
      p.First_name,
      p.Last_name,
      p.Email,
      b.BookingID,
      f.AirlineName,
      f.Departure_Place,
      f.Destination_Place,
      b.Status AS BookingStatus,
      pay.Amount,
      pay.Status AS PaymentStatus
    FROM Passenger p
    JOIN Booking b ON p.PassengerID = b.PassengerID
    JOIN Flights f ON b.FlightID = f.FlightID
    LEFT JOIN Payment pay ON b.BookingID = pay.BookingID
    WHERE p.Email = ?
  `;

  try {
    const [rows] = await db.query(query, [email]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for this email" });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
