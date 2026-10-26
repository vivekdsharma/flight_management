import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import CancelIcon from "@mui/icons-material/Cancel";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../axiosConfig";

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

function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/bookings/my-bookings");
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await axiosInstance.put(
        `/bookings/cancel/${cancelTarget.BookingID}`
      );
      toast.success(res.data.message || "Booking cancelled successfully!");
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to cancel booking."
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f2027">
            My Flight Bookings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your booked flights, view itinerary status, or cancel reservations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<FlightTakeoffIcon />}
          onClick={() => navigate("/book")}
          sx={{
            background: "linear-gradient(45deg, #00c6ff, #0072ff)",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
          }}
        >
          Book Another Flight
        </Button>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={45} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading your bookings...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            background: "#f9fbfd",
          }}
        >
          <ConfirmationNumberIcon
            sx={{ fontSize: 60, color: "#90a4ae", mb: 2 }}
          />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            No Bookings Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You haven't booked any flights yet. Ready to take off?
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/book")}
            sx={{
              background: "linear-gradient(45deg, #00c6ff, #0072ff)",
              fontWeight: 700,
              px: 4,
            }}
          >
            Explore Available Flights
          </Button>
        </Paper>
      )}

      {/* Bookings List Cards */}
      <Grid container spacing={3}>
        {bookings.map((booking) => {
          const isCancelled = booking.Status === "Cancelled";

          return (
            <Grid item xs={12} key={booking.BookingID}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  borderLeft: `6px solid ${
                    isCancelled ? "#e53935" : "#43a047"
                  }`,
                  opacity: isCancelled ? 0.8 : 1,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    {/* Airline & Reference */}
                    <Grid item xs={12} sm={3}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                      >
                        BOOKING REF #{booking.BookingID}
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="primary">
                        {booking.AirlineName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Booked on: {formatDateTime(booking.BookingDate)}
                      </Typography>
                    </Grid>

                    {/* Flight Route & Timings */}
                    <Grid item xs={12} sm={5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            FROM
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {booking.Departure_Place}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(booking.DepartureTime)}
                          </Typography>
                        </Box>

                        <FlightTakeoffIcon
                          sx={{
                            color: isCancelled ? "gray" : "#0072ff",
                            fontSize: 28,
                            transform: "rotate(90deg)",
                            mx: 2,
                          }}
                        />

                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" color="text.secondary">
                            TO
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {booking.Destination_Place}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(booking.ArrivalTime)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Payment Info & Status */}
                    <Grid item xs={12} sm={2} sx={{ textAlign: "center" }}>
                      <Typography variant="h6" fontWeight={800}>
                        ₹
                        {parseFloat(booking.Price || booking.Amount || 0).toLocaleString(
                          "en-IN"
                        )}
                      </Typography>
                      <Stack
                        direction="column"
                        spacing={0.8}
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        <Chip
                          label={booking.Status}
                          color={isCancelled ? "error" : "success"}
                          size="small"
                          sx={{ fontWeight: 700, width: 100 }}
                        />
                        {booking.payment_method && (
                          <Typography variant="caption" color="text.secondary">
                            Paid via {booking.payment_method}
                          </Typography>
                        )}
                      </Stack>
                    </Grid>

                    {/* Action Button */}
                    <Grid item xs={12} sm={2} sx={{ textAlign: "right" }}>
                      {!isCancelled ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => setCancelTarget(booking)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <Typography
                          variant="body2"
                          color="error"
                          fontWeight={600}
                        >
                          Cancelled
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Cancel Flight Booking?
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel booking #
            {cancelTarget?.BookingID} ({cancelTarget?.AirlineName}:{" "}
            {cancelTarget?.Departure_Place} ➔ {cancelTarget?.Destination_Place})?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Upon cancellation, your reserved seat will be restored to flight availability.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setCancelTarget(null)}
            disabled={cancelling}
            color="inherit"
          >
            Keep Booking
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Bookings;
