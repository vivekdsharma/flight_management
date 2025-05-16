import React, { useEffect, useState } from "react";
import axios from "../axiosConfig";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchIcon from "@mui/icons-material/Search";

const ADMIN_EMAIL = "vsharma6_be23@thapar.edu";

function AdminDashboard() {
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editFlight, setEditFlight] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [statusResults, setStatusResults] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    AirlineName: "",
    Departure_Place: "",
    Destination_Place: "",
    DepartureTime: "",
    ArrivalTime: "",
    SeatsAvailable: "",
    Price: "",
  });
  const [showPayments, setShowPayments] = useState(false);
  const [myPayments, setMyPayments] = useState([]);
  const [myPaymentsLoading, setMyPaymentsLoading] = useState(false);

  const token = localStorage.getItem("token");
  const email = localStorage.getItem("email");

  useEffect(() => {
    // Try to get email from token if not present in localStorage
    let userEmail = email;
    if (!userEmail && token) {
      try {
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
        userEmail = decoded.email;
      } catch (e) {
        userEmail = "";
      }
    }
    if (userEmail !== ADMIN_EMAIL) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [flightsRes, bookingsRes, paymentsRes] = await Promise.all([
          axios.get("/flights", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/bookings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/payments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setFlights(flightsRes.data);
        setBookings(bookingsRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        alert("Error fetching admin data");
      }
      setLoading(false);
    };

    fetchData();
  }, [token, email]);

  // Use decoded email for access check
  let userEmail = email;
  if (!userEmail && token) {
    try {
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
      userEmail = decoded.email;
    } catch (e) {
      userEmail = "";
    }
  }
  if (userEmail !== ADMIN_EMAIL) {
    return <h2>Access Denied: Admins only</h2>;
  }

  if (loading) return <div>Loading...</div>;

  const handleEditClick = (flight) => {
    setEditFlight(flight);
    setEditForm({ ...flight });
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSave = async () => {
    try {
      await axios.put(`/flights/${editFlight.FlightID}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Flight updated successfully!");
      setEditFlight(null); // Close the dialog before reload
      setTimeout(() => window.location.reload(), 1200); // Give time for toast to show
    } catch (err) {
      toast.error("Error updating flight");
    }
  };
  const handleDeleteClick = (id) => setDeleteId(id);
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/flights/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      window.location.reload();
    } catch (err) {
      alert("Error deleting flight");
    }
  };
  const handleDialogClose = () => {
    setEditFlight(null);
    setDeleteId(null);
  };

  // Add handler for status search
  const handleStatusSearch = async () => {
    if (!emailStatus.trim()) return;
    setStatusLoading(true);
    setStatusResults([]);
    try {
      const res = await axios.get(
        `/payments/status?email=${encodeURIComponent(emailStatus)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStatusResults(res.data);
    } catch (err) {
      setStatusResults([]);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "No records found for this email."
      );
    }
    setStatusLoading(false);
  };

  // Add Flight Handlers
  const handleAddOpen = () => setAddDialogOpen(true);
  const handleAddClose = () => setAddDialogOpen(false);
  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };
  const handleAddSubmit = async () => {
    try {
      await axios.post("/flights", addForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Flight added successfully!");
      setAddDialogOpen(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error("Error adding flight");
    }
  };

  // Handler for 'Your Payments' button
  const handleShowPayments = async () => {
    setShowPayments(true);
    setMyPaymentsLoading(true);
    try {
      // Get passengerId from token
      const token = localStorage.getItem("token");
      let passengerId = null;
      if (token) {
        try {
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
          passengerId = decoded.id || decoded.passengerId;
        } catch (e) {
          passengerId = null;
        }
      }
      if (!token || !passengerId) throw new Error("Not logged in");
      const res = await axios.get(`/payments/passenger/${passengerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPayments(res.data);
    } catch (err) {
      setMyPayments([]);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fetch your payments."
      );
    }
    setMyPaymentsLoading(false);
  };

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Admin Dashboard
        </Typography>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>
          All Flights
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 2 }}
          onClick={handleAddOpen}
        >
          Add Flight
        </Button>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mb: 2, ml: 2 }}
          onClick={handleShowPayments}
        >
          Your Payments
        </Button>
        <Grid container spacing={2}>
          {flights.map((flight) => (
            <Grid item xs={12} md={6} lg={4} key={flight.FlightID}>
              <Paper
                sx={{ p: 2, mb: 2, cursor: "pointer", position: "relative" }}
                elevation={3}
              >
                <Typography variant="subtitle1">
                  <b>Airline:</b> {flight.AirlineName}
                </Typography>
                <Typography>
                  <b>From:</b> {flight.Departure_Place} <b>To:</b>{" "}
                  {flight.Destination_Place}
                </Typography>
                <Typography>
                  <b>Departure:</b> {flight.DepartureTime}
                </Typography>
                <Typography>
                  <b>Arrival:</b> {flight.ArrivalTime}
                </Typography>
                <Typography>
                  <b>Seats:</b> {flight.SeatsAvailable}
                </Typography>
                <Typography>
                  <b>Price:</b> ₹{flight.Price}
                </Typography>
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleEditClick(flight)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDeleteClick(flight.FlightID)}
                  >
                    Delete
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {/* Edit Dialog */}
        <Dialog open={!!editFlight} onClose={handleDialogClose}>
          <DialogTitle>Edit Flight</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Airline Name"
              name="AirlineName"
              value={editForm.AirlineName || ""}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Departure Place"
              name="Departure_Place"
              value={editForm.Departure_Place || ""}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Destination Place"
              name="Destination_Place"
              value={editForm.Destination_Place || ""}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Departure Time"
              name="DepartureTime"
              value={editForm.DepartureTime || ""}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Arrival Time"
              name="ArrivalTime"
              value={editForm.ArrivalTime || ""}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Seats Available"
              name="SeatsAvailable"
              value={editForm.SeatsAvailable || ""}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Price"
              name="Price"
              value={editForm.Price || ""}
              onChange={handleEditChange}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        {/* Delete Dialog */}
        <Dialog open={!!deleteId} onClose={handleDialogClose}>
          <DialogTitle>Delete Flight</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this flight?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        {/* Add Flight Dialog */}
        <Dialog open={addDialogOpen} onClose={handleAddClose}>
          <DialogTitle>Add New Flight</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Airline Name"
              name="AirlineName"
              value={addForm.AirlineName}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Departure Place"
              name="Departure_Place"
              value={addForm.Departure_Place}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Destination Place"
              name="Destination_Place"
              value={addForm.Destination_Place}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Departure Time"
              name="DepartureTime"
              type="datetime-local"
              value={addForm.DepartureTime}
              onChange={handleAddChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Arrival Time"
              name="ArrivalTime"
              type="datetime-local"
              value={addForm.ArrivalTime}
              onChange={handleAddChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Seats Available"
              name="SeatsAvailable"
              type="number"
              value={addForm.SeatsAvailable}
              onChange={handleAddChange}
              fullWidth
            />
            <TextField
              margin="dense"
              label="Price"
              name="Price"
              type="number"
              value={addForm.Price}
              onChange={handleAddChange}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAddClose}>Cancel</Button>
            <Button onClick={handleAddSubmit} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>
          All Bookings
        </Typography>
        <Grid container spacing={2}>
          {bookings.map((booking) => (
            <Grid item xs={12} md={6} lg={4} key={booking.BookingID}>
              <Paper sx={{ p: 2, mb: 2 }} elevation={3}>
                <Typography variant="subtitle1">
                  <b>Passenger:</b> {booking.First_name} {booking.Last_name}
                </Typography>
                <Typography>
                  <b>Airline:</b> {booking.AirlineName}
                </Typography>
                <Typography>
                  <b>From:</b> {booking.Departure_Place} <b>To:</b>{" "}
                  {booking.Destination_Place}
                </Typography>
                <Typography>
                  <b>Status:</b> {booking.Status}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>
          All Payments
        </Typography>
        <Grid container spacing={2}>
          {payments.map((payment) => (
            <Grid item xs={12} md={6} lg={4} key={payment.PaymentID}>
              <Paper sx={{ p: 2, mb: 2 }} elevation={3}>
                <Typography variant="subtitle1">
                  <b>Passenger:</b> {payment.First_name} {payment.Last_name}
                </Typography>
                <Typography>
                  <b>Airline:</b> {payment.AirlineName}
                </Typography>
                <Typography>
                  <b>Amount:</b> ₹{payment.Amount}
                </Typography>
                <Typography>
                  <b>Status:</b> {payment.Status}
                </Typography>
                <Typography>
                  <b>Method:</b> {payment.payment_method}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {/* Search by email section moved to end */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>
          Search Passenger Booking/Payment Status by Email
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <TextField
            label="Passenger Email"
            value={emailStatus}
            onChange={(e) => setEmailStatus(e.target.value)}
            size="small"
            sx={{ mr: 2, width: 300 }}
          />
          <IconButton
            color="primary"
            onClick={handleStatusSearch}
            disabled={statusLoading}
          >
            <SearchIcon />
          </IconButton>
        </Box>
        {statusResults.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            {statusResults.map((row, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography>
                  <b>Name:</b> {row.First_name} {row.Last_name}
                </Typography>
                <Typography>
                  <b>Email:</b> {row.Email}
                </Typography>
                <Typography>
                  <b>BookingID:</b> {row.BookingID}
                </Typography>
                <Typography>
                  <b>Airline:</b> {row.AirlineName}
                </Typography>
                <Typography>
                  <b>From:</b> {row.Departure_Place} <b>To:</b>{" "}
                  {row.Destination_Place}
                </Typography>
                <Typography>
                  <b>Booking Status:</b> {row.BookingStatus}
                </Typography>
                <Typography>
                  <b>Payment Amount:</b> ₹{row.Amount ?? "-"}
                </Typography>
                <Typography>
                  <b>Payment Status:</b> {row.PaymentStatus ?? "-"}
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Paper>
        )}
        {showPayments && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Payments
            </Typography>
            {myPaymentsLoading ? (
              <Typography>Loading...</Typography>
            ) : myPayments.length === 0 ? (
              <Typography>No payments to display.</Typography>
            ) : (
              myPayments.map((pay, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography>
                    <b>PaymentID:</b> {pay.PaymentID}
                  </Typography>
                  <Typography>
                    <b>Airline:</b> {pay.AirlineName}
                  </Typography>
                  <Typography>
                    <b>Amount:</b> ₹{pay.Amount}
                  </Typography>
                  <Typography>
                    <b>Method:</b> {pay.payment_method}
                  </Typography>
                  <Typography>
                    <b>Status:</b> {pay.Status}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))
            )}
          </Paper>
        )}
      </Box>
      <ToastContainer position="bottom-right" autoClose={2000} />
    </>
  );
}

export default AdminDashboard;
