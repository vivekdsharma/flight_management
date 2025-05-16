const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/verifyToken");

// 🟢 SIGNUP
router.post("/signup", async (req, res) => {
  const { first_name, last_name, email, phone, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await db.query(
      `SELECT * FROM Passenger WHERE Email = ?`,
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO Passenger (First_name, Last_name, Email, Phone, Password) VALUES (?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, hashedPassword]
    );

    res
      .status(201)
      .json({ message: "Signup successful", passengerId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(`SELECT * FROM Passenger WHERE Email = ?`, [
      email,
    ]);

    if (rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const validPass = password === rows[0].password;
    if (!validPass)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: rows[0].PassengerID, email },
      "yourSecretKey",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      passengerId: rows[0].PassengerID,
      first_name: rows[0].First_name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 GET PROFILE (Protected Route)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT PassengerID, First_name, Last_name, Email FROM Passenger WHERE PassengerID = ?`,
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
