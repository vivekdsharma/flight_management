import React, { useState, useEffect } from "react";
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import PaymentIcon from "@mui/icons-material/Payment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AirlineSeatReclineNormalIcon from "@mui/icons-material/AirlineSeatReclineNormal";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

const POPULAR_ROUTES = [
  { source: "Delhi", destination: "Goa" },
  { source: "Delhi", destination: "Mumbai" },
  { source: "Mumbai", destination: "Chennai" },
  { source: "Bangalore", destination: "Kolkata" },
  { source: "Pune", destination: "Delhi" },
];

const AIRLINE_COLORS = {
  IndiGo: { bg: "#00488f", text: "#ffffff" },
  "Air India": { bg: "#c41230", text: "#ffffff" },
  SpiceJet: { bg: "#ff5200", text: "#ffffff" },
  Vistara: { bg: "#582c4d", text: "#ffffff" },
  GoAir: { bg: "#009688", text: "#ffffff" },
};

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BookNow() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    source: "",
    destination: "",
    date: "",
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Payment Modal States
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [cardData, setCardData] = useState({
    number: "4532 8901 2345 6789",
    name: "Aryan Singh",
    expiry: "12/28",
    cvv: "321",
  });
  const [upiId, setUpiId] = useState("aryan@okhdfcbank");
  const [bank, setBank] = useState("HDFC Bank");
  const [processing, setProcessing] = useState(false);

  // Success Dialog State
  const [successBooking, setSuccessBooking] = useState(null);

  // Load all flights initially
  const loadFlights = async (searchParams = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/api/flights/search", {
        params: searchParams,
      });
      setFlights(res.data);
    } catch (err) {
      setFlights([]);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "No flights found matching criteria."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadFlights(form);
  };

  const handleQuickRoute = (route) => {
    setForm({ source: route.source, destination: route.destination, date: "" });
    loadFlights({ source: route.source, destination: route.destination });
  };

  const handleShowAll = () => {
    setForm({ source: "", destination: "", date: "" });
    loadFlights();
  };

  const handleOpenPayment = (flight) => {
    if (!token) {
      toast.warning("Please sign in to proceed with booking.");
      navigate("/login");
      return;
    }
    setSelectedFlight(flight);
    setPaymentOpen(true);
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      const res = await axiosInstance.post("/payments/confirm-booking", {
        flightId: selectedFlight.FlightID,
        amount: selectedFlight.Price,
        payment_method: paymentMethod,
      });

      setProcessing(false);
      setPaymentOpen(false);
      setSuccessBooking({
        bookingId: res.data.bookingId,
        flight: selectedFlight,
        paymentMethod: paymentMethod,
      });
      toast.success("Flight booked and payment confirmed!");
      // Refresh flight seat availability
      loadFlights(form);
    } catch (err) {
      setProcessing(false);
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Booking failed. Please try again."
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
          color: "white",
          p: 4,
          borderRadius: 3,
          mb: 4,
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Explore & Book Flights
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, mb: 3 }}>
          Find the best fares across premier domestic airlines in India
        </Typography>

        {/* Search Bar Form */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "rgba(255, 255, 255, 0.95)",
          }}
        >
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="From (Departure City)"
                  placeholder="e.g. Delhi"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="To (Destination City)"
                  placeholder="e.g. Goa"
                  value={form.destination}
                  onChange={(e) =>
                    setForm({ ...form, destination: e.target.value })
                  }
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Departure Date (Optional)"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1,
                      fontWeight: 700,
                      background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                    }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleShowAll}
                    sx={{ py: 1, textTransform: "none", whiteSpace: "nowrap" }}
                  >
                    Show All
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>

          {/* Quick Route Filter Chips */}
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              POPULAR ROUTES:
            </Typography>
            {POPULAR_ROUTES.map((route, i) => (
              <Chip
                key={i}
                label={`${route.source} ➔ ${route.destination}`}
                size="small"
                clickable
                onClick={() => handleQuickRoute(route)}
                color={
                  form.source === route.source &&
                  form.destination === route.destination
                    ? "primary"
                    : "default"
                }
                variant={
                  form.source === route.source &&
                  form.destination === route.destination
                    ? "filled"
                    : "outlined"
                }
              />
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Results Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="#0f2027">
          Available Flights ({flights.length})
        </Typography>
      </Box>

      {/* Loading & Errors */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={45} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Searching for flights...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <Alert severity="info" sx={{ mb: 4 }}>
          {error} — Try clicking "Show All" or selecting a different date/city.
        </Alert>
      )}

      {/* Flight Cards Grid */}
      <Grid container spacing={3}>
        {flights.map((flight) => {
          const airlineStyle =
            AIRLINE_COLORS[flight.AirlineName] || {
              bg: "#1976d2",
              text: "#fff",
            };
          const seatsAvailable = flight.SeatsAvailable;

          return (
            <Grid item xs={12} md={6} key={flight.FlightID}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Airline Badge & Price Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Chip
                      icon={<FlightTakeoffIcon sx={{ color: "inherit !important" }} />}
                      label={flight.AirlineName}
                      sx={{
                        backgroundColor: airlineStyle.bg,
                        color: airlineStyle.text,
                        fontWeight: 700,
                        px: 1,
                      }}
                    />
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        color="primary"
                        sx={{ lineHeight: 1 }}
                      >
                        ₹{parseFloat(flight.Price).toLocaleString("en-IN")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        per passenger
                      </Typography>
                    </Box>
                  </Box>

                  {/* Route & Times */}
                  <Grid container spacing={2} alignItems="center" sx={{ my: 1 }}>
                    <Grid item xs={5}>
                      <Typography variant="caption" color="text.secondary">
                        DEPARTURE
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {flight.Departure_Place}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(flight.DepartureTime)}
                      </Typography>
                    </Grid>

                    <Grid item xs={2} sx={{ textAlign: "center" }}>
                      <FlightTakeoffIcon
                        color="action"
                        sx={{ transform: "rotate(90deg)" }}
                      />
                    </Grid>

                    <Grid item xs={5} sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        ARRIVAL
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {flight.Destination_Place}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(flight.ArrivalTime)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Seats & Booking Action */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Chip
                      icon={<AirlineSeatReclineNormalIcon />}
                      label={
                        seatsAvailable > 0
                          ? `${seatsAvailable} seats available`
                          : "Sold Out"
                      }
                      color={
                        seatsAvailable > 20
                          ? "success"
                          : seatsAvailable > 0
                          ? "warning"
                          : "error"
                      }
                      size="small"
                      variant="outlined"
                    />

                    <Button
                      variant="contained"
                      disabled={seatsAvailable < 1}
                      onClick={() => handleOpenPayment(flight)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        borderRadius: 2,
                        background:
                          seatsAvailable > 0
                            ? "linear-gradient(45deg, #00c6ff, #0072ff)"
                            : "gray",
                      }}
                    >
                      {seatsAvailable > 0 ? "Book Now" : "Sold Out"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Payment Gateway Modal */}
      <Dialog
        open={paymentOpen}
        onClose={() => !processing && setPaymentOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Secure Checkout & Payment
        </DialogTitle>
        <DialogContent dividers>
          {selectedFlight && (
            <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f7fa", borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Selected Itinerary:
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {selectedFlight.AirlineName}: {selectedFlight.Departure_Place} ➔{" "}
                {selectedFlight.Destination_Place}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Departure: {formatDateTime(selectedFlight.DepartureTime)}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={800}
                color="primary"
                sx={{ mt: 1 }}
              >
                Total Fare: ₹{parseFloat(selectedFlight.Price).toLocaleString("en-IN")}
              </Typography>
            </Box>
          )}

          {/* Payment Method Selector */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="method-select-label">Select Payment Method</InputLabel>
            <Select
              labelId="method-select-label"
              value={paymentMethod}
              label="Select Payment Method"
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="UPI">UPI (Google Pay, PhonePe, Paytm)</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Debit Card">Debit Card</MenuItem>
              <MenuItem value="Net Banking">Net Banking</MenuItem>
            </Select>
          </FormControl>

          {/* UPI Fields */}
          {paymentMethod === "UPI" && (
            <TextField
              fullWidth
              label="Virtual Payment Address (VPA / UPI ID)"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              helperText="e.g. yourname@okhdfcbank or 9876543210@paytm"
              margin="normal"
            />
          )}

          {/* Card Fields */}
          {(paymentMethod === "Credit Card" || paymentMethod === "Debit Card") && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={cardData.number}
                  onChange={(e) =>
                    setCardData({ ...cardData, number: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cardholder Name"
                  value={cardData.name}
                  onChange={(e) =>
                    setCardData({ ...cardData, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry (MM/YY)"
                  value={cardData.expiry}
                  onChange={(e) =>
                    setCardData({ ...cardData, expiry: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVV"
                  type="password"
                  value={cardData.cvv}
                  onChange={(e) =>
                    setCardData({ ...cardData, cvv: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          )}

          {/* Net Banking Fields */}
          {paymentMethod === "Net Banking" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Choose Bank</InputLabel>
              <Select
                value={bank}
                label="Choose Bank"
                onChange={(e) => setBank(e.target.value)}
              >
                <MenuItem value="HDFC Bank">HDFC Bank</MenuItem>
                <MenuItem value="State Bank of India">State Bank of India</MenuItem>
                <MenuItem value="ICICI Bank">ICICI Bank</MenuItem>
                <MenuItem value="Axis Bank">Axis Bank</MenuItem>
                <MenuItem value="Kotak Mahindra">Kotak Mahindra Bank</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setPaymentOpen(false)}
            disabled={processing}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmPayment}
            disabled={processing}
            startIcon={
              processing ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />
            }
            sx={{
              px: 3,
              fontWeight: 700,
              background: "linear-gradient(45deg, #00c6ff, #0072ff)",
            }}
          >
            {processing
              ? "Processing Payment..."
              : `Pay ₹${parseFloat(selectedFlight?.Price || 0).toLocaleString("en-IN")}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Success Dialog */}
      <Dialog
        open={Boolean(successBooking)}
        onClose={() => setSuccessBooking(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1 }} />
          <Typography variant="h5" fontWeight={800}>
            Booking Confirmed!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your flight ticket has been booked and confirmed.
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2.5,
              border: "2px dashed #4caf50",
              borderRadius: 2,
              bgcolor: "#f1f8e9",
              textAlign: "left",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Booking Reference: #{successBooking?.bookingId}
            </Typography>
            <Typography variant="body2">
              <b>Airline:</b> {successBooking?.flight?.AirlineName}
            </Typography>
            <Typography variant="body2">
              <b>Route:</b> {successBooking?.flight?.Departure_Place} ➔{" "}
              {successBooking?.flight?.Destination_Place}
            </Typography>
            <Typography variant="body2">
              <b>Departure:</b>{" "}
              {formatDateTime(successBooking?.flight?.DepartureTime)}
            </Typography>
            <Typography variant="body2">
              <b>Amount Paid:</b> ₹
              {parseFloat(successBooking?.flight?.Price || 0).toLocaleString(
                "en-IN"
              )}{" "}
              via {successBooking?.paymentMethod}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setSuccessBooking(null)}
          >
            Book Another Flight
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/my-bookings")}
          >
            View My Bookings
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BookNow;
