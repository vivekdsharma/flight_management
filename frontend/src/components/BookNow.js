import React, { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import axios from "axios";

function BookNow() {
  const [form, setForm] = useState({
    source: "",
    destination: "",
    date: "",
  });
  const [flights, setFlights] = useState([]);
  const [error, setError] = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: "Credit Card",
    cardNumber: "",
    name: "",
    expiry: "",
    cvv: "",
    upiId: "",
    netBankingBank: "",
  });
  const [paymentError, setPaymentError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFlights([]);
    try {
      const res = await axios.get(`http://localhost:5000/api/flights/search`, {
        params: form,
      });
      setFlights(res.data);
    } catch (err) {
      setFlights([]);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "No flights found."
      );
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleOpenPayment = () => {
    setPaymentError("");
    setPaymentOpen(true);
  };

  const handleClosePayment = () => {
    setPaymentOpen(false);
    setPaymentForm({
      payment_method: "Credit Card",
      cardNumber: "",
      name: "",
      expiry: "",
      cvv: "",
      upiId: "",
      netBankingBank: "",
    });
    setPaymentError("");
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError("");
    // Validate based on payment method
    if (!paymentForm.payment_method) {
      setPaymentError("Please select a payment method.");
      return;
    }
    if (
      paymentForm.payment_method === "Credit Card" ||
      paymentForm.payment_method === "Debit Card"
    ) {
      if (
        !paymentForm.cardNumber ||
        !paymentForm.name ||
        !paymentForm.expiry ||
        !paymentForm.cvv
      ) {
        setPaymentError("Please fill all card details.");
        return;
      }
      if (paymentForm.cardNumber.length < 12) {
        setPaymentError("Invalid card number.");
        return;
      }
      if (paymentForm.cvv.length < 3) {
        setPaymentError("Invalid CVV.");
        return;
      }
    } else if (paymentForm.payment_method === "UPI") {
      if (!paymentForm.upiId) {
        setPaymentError("Please enter your UPI ID.");
        return;
      }
    } else if (paymentForm.payment_method === "Net Banking") {
      if (!paymentForm.netBankingBank) {
        setPaymentError("Please select your bank.");
        return;
      }
    }
    setProcessingPayment(true);
    setTimeout(async () => {
      setProcessingPayment(false);
      setPaymentOpen(false);
      await handleConfirmBooking(paymentForm.payment_method);
    }, 1500);
  };

  const handleConfirmBooking = async (
    payment_method = paymentForm.payment_method
  ) => {
    setBookingStatus("");
    try {
      const token = localStorage.getItem("token");
      if (!token || !selectedFlight) {
        setBookingStatus("Please login and select a flight.");
        return;
      }
      // Decode JWT to get passengerId
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      const passengerId = decoded.id || decoded.passengerId;
      if (!passengerId) {
        setBookingStatus("Could not get passenger ID from token.");
        return;
      }
      const res = await axios.post(
        "http://localhost:5000/payments/confirm-booking",
        {
          passengerId: passengerId,
          flightId: selectedFlight.FlightID,
          amount: selectedFlight.Price,
          payment_method: payment_method,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookingStatus(res.data.message || "Booking confirmed!");
    } catch (err) {
      setBookingStatus(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Booking failed."
      );
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Search Flights
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Source"
              name="source"
              value={form.source}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Destination"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
            >
              Search Flights
            </Button>
          </form>
          {error && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          {flights.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Available Flights
              </Typography>
              {flights.map((flight) => (
                <Paper
                  key={flight.FlightID}
                  sx={{
                    p: 2,
                    mb: 2,
                    border:
                      selectedFlight?.FlightID === flight.FlightID
                        ? "2px solid #1976d2"
                        : "1px solid #ccc",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedFlight(flight)}
                >
                  <Typography>Airline: {flight.AirlineName}</Typography>
                  <Typography>
                    From: {flight.Departure_Place} To:{" "}
                    {flight.Destination_Place}
                  </Typography>
                  <Typography>Departure: {flight.DepartureTime}</Typography>
                  <Typography>Arrival: {flight.ArrivalTime}</Typography>
                  <Typography>
                    Seats Available: {flight.SeatsAvailable}
                  </Typography>
                  <Typography>Price: ₹{flight.Price}</Typography>
                  {selectedFlight?.FlightID === flight.FlightID && (
                    <Typography color="primary">Selected</Typography>
                  )}
                </Paper>
              ))}
              {selectedFlight && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleOpenPayment}
                >
                  Confirm Booking
                </Button>
              )}
              {/* Payment Dialog */}
              <Dialog open={paymentOpen} onClose={handleClosePayment}>
                <DialogTitle>Payment Gateway</DialogTitle>
                <form onSubmit={handlePaymentSubmit}>
                  <DialogContent>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="payment-method-label">
                        Payment Method
                      </InputLabel>
                      <Select
                        labelId="payment-method-label"
                        name="payment_method"
                        value={paymentForm.payment_method}
                        label="Payment Method"
                        onChange={handlePaymentChange}
                        required
                      >
                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                        <MenuItem value="Debit Card">Debit Card</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="Net Banking">Net Banking</MenuItem>
                      </Select>
                    </FormControl>
                    {/* Card fields */}
                    {(paymentForm.payment_method === "Credit Card" ||
                      paymentForm.payment_method === "Debit Card") && (
                      <>
                        <TextField
                          label="Card Number"
                          name="cardNumber"
                          value={paymentForm.cardNumber}
                          onChange={handlePaymentChange}
                          fullWidth
                          margin="normal"
                          required
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <CreditCardIcon />
                              </InputAdornment>
                            ),
                            inputMode: "numeric",
                          }}
                        />
                        <TextField
                          label="Name on Card"
                          name="name"
                          value={paymentForm.name}
                          onChange={handlePaymentChange}
                          fullWidth
                          margin="normal"
                          required
                        />
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <TextField
                            label="Expiry (MM/YY)"
                            name="expiry"
                            value={paymentForm.expiry}
                            onChange={handlePaymentChange}
                            margin="normal"
                            required
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label="CVV"
                            name="cvv"
                            value={paymentForm.cvv}
                            onChange={handlePaymentChange}
                            margin="normal"
                            required
                            inputProps={{ maxLength: 4, inputMode: "numeric" }}
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      </>
                    )}
                    {/* UPI fields */}
                    {paymentForm.payment_method === "UPI" && (
                      <TextField
                        label="UPI ID"
                        name="upiId"
                        value={paymentForm.upiId}
                        onChange={handlePaymentChange}
                        fullWidth
                        margin="normal"
                        required
                      />
                    )}
                    {/* Net Banking fields */}
                    {paymentForm.payment_method === "Net Banking" && (
                      <TextField
                        label="Bank Name"
                        name="netBankingBank"
                        value={paymentForm.netBankingBank}
                        onChange={handlePaymentChange}
                        fullWidth
                        margin="normal"
                        required
                      />
                    )}
                    {paymentError && (
                      <Typography color="error" sx={{ mt: 1 }}>
                        {paymentError}
                      </Typography>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={handleClosePayment}
                      disabled={processingPayment}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={processingPayment}
                    >
                      {processingPayment ? "Processing..." : "Pay & Book"}
                    </Button>
                  </DialogActions>
                </form>
              </Dialog>
              {bookingStatus && (
                <Typography
                  align="center"
                  sx={{ mt: 2 }}
                  color={
                    bookingStatus.includes("confirm") ? "success.main" : "error"
                  }
                >
                  {bookingStatus}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default BookNow;
