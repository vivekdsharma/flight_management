const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/verifyToken");
const adminOnly = require("../middleware/adminOnly");

const JWT_SECRET = process.env.JWT_SECRET || "yourSecretKey";

// 🟢 SIGNUP
router.post("/signup", async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existing] = await db.query(
      `SELECT * FROM Passenger WHERE Email = ?`,
      [email.trim()]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email.trim() === "vsharma6_be23@thapar.edu" ? "admin" : "user";

    const [result] = await db.query(
      `INSERT INTO Passenger (First_name, Last_name, Email, Phone, password, Role) VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name.trim(), last_name.trim(), email.trim(), phone.trim(), hashedPassword, role]
    );

    const passengerId = result.insertId;
    const token = jwt.sign(
      { id: passengerId, email: email.trim(), role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Signup successful",
      token,
      passengerId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      role,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [rows] = await db.query(`SELECT * FROM Passenger WHERE Email = ?`, [
      email.trim(),
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    let validPass = false;

    // Check bcrypt hash
    try {
      validPass = await bcrypt.compare(password, user.password);
    } catch (e) {
      validPass = false;
    }

    // Fallback to plain text match if not yet hashed
    if (!validPass && password === user.password) {
      validPass = true;
      try {
        const upgraded = await bcrypt.hash(password, 10);
        await db.query(`UPDATE Passenger SET password = ? WHERE PassengerID = ?`, [
          upgraded,
          user.PassengerID,
        ]);
      } catch (upgradeErr) {
        console.error("Could not upgrade plain password to hash:", upgradeErr);
      }
    }

    if (!validPass) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const role =
      user.Role ||
      (user.Email === "vsharma6_be23@thapar.edu" ? "admin" : "user");

    const token = jwt.sign(
      { id: user.PassengerID, email: user.Email, role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      passengerId: user.PassengerID,
      first_name: user.First_name,
      last_name: user.Last_name,
      email: user.Email,
      phone: user.Phone,
      role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GET CURRENT PROFILE (Protected)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT PassengerID, First_name, Last_name, Email, Phone, Role, CreatedAt FROM Passenger WHERE PassengerID = ?`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GET ALL PASSENGERS (Admin Only)
router.get("/all", verifyToken, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT PassengerID, First_name, Last_name, Email, Phone, Role, CreatedAt FROM Passenger ORDER BY PassengerID DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch all passengers error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
