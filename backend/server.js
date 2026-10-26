// server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const flightRoutes = require('./routes/flightRoutes');
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const flightSearchRoutes = require("./routes/flightSearch");
const passengerRoutes = require("./routes/passengerRoutes");

const app = express();

// Enable CORS for all origins (supports Render, Vercel, Netlify, localhost)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token']
}));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '✈️ Flight Management Backend Running!',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/flights', flightRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/api/flights', flightSearchRoutes);
app.use('/api/passenger', passengerRoutes);

// Optional: Serve Frontend Production Build if placed in ../frontend/build
const frontendBuildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuildPath));

app.get('*', (req, res, next) => {
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/flights') ||
    req.path.startsWith('/bookings') ||
    req.path.startsWith('/payments')
  ) {
    return next();
  }

  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>✈️ Flight Management Backend Running!</h2>
          <p>Backend API is active and connected to TiDB Cloud Database.</p>
          <p>Frontend API endpoint: <code>/api/flights/search</code></p>
        </div>
      `);
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
