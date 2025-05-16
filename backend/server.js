// server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const flightSearchRoutes = require("./routes/flightSearch");
const passengerRoutes = require("./routes/passengerRoutes");
const verifyToken = require("./middleware/verifyToken"); // Middleware to verify JWT
const dotenv = require('dotenv');

const app = express();
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('✈️ Flight Management Backend Running!');
});

app.use('/flights',flightRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/api/flights", flightSearchRoutes);
app.use("/api/passenger", passengerRoutes);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

