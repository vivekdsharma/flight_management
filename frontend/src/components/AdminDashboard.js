import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

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

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Flight Add/Edit/Delete states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [flightForm, setFlightForm] = useState({
    AirlineName: "",
    Departure_Place: "",
    Destination_Place: "",
    DepartureTime: "",
    ArrivalTime: "",
    SeatsAvailable: 150,
    Price: 4500,
  });
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [savingFlight, setSavingFlight] = useState(false);

  // Email Lookup State
  const [searchEmail, setSearchEmail] = useState("");
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [flightsRes, bookingsRes, paymentsRes, passengersRes] =
        await Promise.all([
          axiosInstance.get("/flights"),
          axiosInstance.get("/bookings"),
          axiosInstance.get("/payments"),
          axiosInstance.get("/api/passenger/all"),
        ]);
      setFlights(flightsRes.data);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
      setPassengers(passengersRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Access Denied: Administrator privileges required.
        </Typography>
      </Box>
    );
  }

  // Calculate statistics
  const totalFlights = flights.length;
  const totalBookings = bookings.length;
  const totalRevenue = payments
    .filter((p) => p.Status === "Success")
    .reduce((acc, p) => acc + parseFloat(p.Amount || 0), 0);
  const totalPassengers = passengers.length;

  // Add / Edit Flight Handlers
  const handleOpenAdd = () => {
    setEditingFlightId(null);
    setFlightForm({
      AirlineName: "IndiGo",
      Departure_Place: "Delhi",
      Destination_Place: "Mumbai",
      DepartureTime: "2026-11-10T10:00",
      ArrivalTime: "2026-11-10T12:15",
      SeatsAvailable: 160,
      Price: 4500,
    });
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (flight) => {
    setEditingFlightId(flight.FlightID);
    const dep = flight.DepartureTime
      ? new Date(flight.DepartureTime).toISOString().slice(0, 16)
      : "";
    const arr = flight.ArrivalTime
      ? new Date(flight.ArrivalTime).toISOString().slice(0, 16)
      : "";

    setFlightForm({
      AirlineName: flight.AirlineName,
      Departure_Place: flight.Departure_Place,
      Destination_Place: flight.Destination_Place,
      DepartureTime: dep,
      ArrivalTime: arr,
      SeatsAvailable: flight.SeatsAvailable,
      Price: flight.Price,
    });
    setAddDialogOpen(true);
  };

  const handleSaveFlight = async (e) => {
    e.preventDefault();
    setSavingFlight(true);
    try {
      if (editingFlightId) {
        await axiosInstance.put(`/flights/${editingFlightId}`, flightForm);
        toast.success("Flight updated successfully!");
      } else {
        await axiosInstance.post("/flights", flightForm);
        toast.success("Flight scheduled successfully!");
      }
      setAddDialogOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error saving flight.");
    } finally {
      setSavingFlight(false);
    }
  };

  const handleDeleteFlight = async () => {
    if (!deleteTargetId) return;
    try {
      await axiosInstance.delete(`/flights/${deleteTargetId}`);
      toast.success("Flight removed successfully!");
      setDeleteTargetId(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error deleting flight.");
    }
  };

  // Passenger Email Lookup
  const handleEmailLookup = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setLookupLoading(true);
    setLookupResults([]);
    try {
      const res = await axiosInstance.get(
        `/payments/status?email=${encodeURIComponent(searchEmail.trim())}`
      );
      setLookupResults(res.data);
    } catch (err) {
      toast.info(
        err.response?.data?.message || "No records found for this passenger email."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header */}
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
            Airline Operations & Admin Control
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Master control for flight schedules, reservations, passengers, and financial transactions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{
            background: "linear-gradient(45deg, #00c6ff, #0072ff)",
            fontWeight: 700,
            px: 3,
            py: 1,
            borderRadius: 2,
          }}
        >
          Add New Flight
        </Button>
      </Box>

      {/* KPI Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: "5px solid #0072ff" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    SCHEDULED FLIGHTS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f2027">
                    {totalFlights}
                  </Typography>
                </Box>
                <FlightTakeoffIcon sx={{ fontSize: 40, color: "#0072ff" }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: "5px solid #2e7d32" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL BOOKINGS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f2027">
                    {totalBookings}
                  </Typography>
                </Box>
                <BookOnlineIcon sx={{ fontSize: 40, color: "#2e7d32" }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: "5px solid #ed6c02" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL REVENUE
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f2027">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <MonetizationOnIcon sx={{ fontSize: 40, color: "#ed6c02" }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: "5px solid #9c27b0" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    REGISTERED PASSENGERS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f2027">
                    {totalPassengers}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: "#9c27b0" }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label={`Flights Management (${flights.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Bookings (${bookings.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Payments History (${payments.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Passenger Lookup`} sx={{ fontWeight: 700 }} />
          <Tab label={`Passenger Directory (${passengers.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Syncing operational data...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            {/* TAB 0: Flights Management */}
            {tabIndex === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Flight ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Airline</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Departure</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Destination</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Departure Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Arrival Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Seats Left</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fare (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {flights.map((flight) => (
                      <TableRow key={flight.FlightID} hover>
                        <TableCell>#{flight.FlightID}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{flight.AirlineName}</TableCell>
                        <TableCell>{flight.Departure_Place}</TableCell>
                        <TableCell>{flight.Destination_Place}</TableCell>
                        <TableCell>{formatDateTime(flight.DepartureTime)}</TableCell>
                        <TableCell>{formatDateTime(flight.ArrivalTime)}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${flight.SeatsAvailable} seats`}
                            size="small"
                            color={flight.SeatsAvailable > 20 ? "success" : "warning"}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ₹{parseFloat(flight.Price).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(flight)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => setDeleteTargetId(flight.FlightID)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 1: Bookings */}
            {tabIndex === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Passenger Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Flight / Airline</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fare</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Booking Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.BookingID} hover>
                        <TableCell>#{b.BookingID}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {b.First_name} {b.Last_name}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{b.Email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {b.Phone}
                          </Typography>
                        </TableCell>
                        <TableCell>{b.AirlineName}</TableCell>
                        <TableCell>
                          {b.Departure_Place} ➔ {b.Destination_Place}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          ₹{parseFloat(b.Price || b.Amount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={b.Status}
                            size="small"
                            color={b.Status === "Confirmed" ? "success" : "error"}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={b.PaymentStatus || "Success"}
                            size="small"
                            variant="outlined"
                            color={b.PaymentStatus === "Success" ? "success" : "default"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 2: Payments History */}
            {tabIndex === 2 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Payment ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Passenger</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Flight</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.PaymentID} hover>
                        <TableCell>#{p.PaymentID}</TableCell>
                        <TableCell>#{p.BookingID}</TableCell>
                        <TableCell>
                          {p.First_name} {p.Last_name}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {p.Email}
                          </Typography>
                        </TableCell>
                        <TableCell>{p.AirlineName}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#2e7d32" }}>
                          ₹{parseFloat(p.Amount).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>{p.payment_method}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.Status}
                            size="small"
                            color={p.Status === "Success" ? "success" : "error"}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                          {formatDateTime(p.PaymentDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 3: Passenger Lookup by Email */}
            {tabIndex === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Search Booking & Payment Status by Passenger Email
                </Typography>
                <Box
                  component="form"
                  onSubmit={handleEmailLookup}
                  sx={{ display: "flex", gap: 2, mb: 4, maxWidth: 600 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. aryan.singh@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SearchIcon />}
                    disabled={lookupLoading}
                    sx={{ px: 3, fontWeight: 700 }}
                  >
                    Search
                  </Button>
                </Box>

                {lookupLoading && <CircularProgress size={30} />}

                {lookupResults.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                          <TableCell sx={{ fontWeight: 700 }}>Passenger</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Flight</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Booking Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lookupResults.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              {r.First_name} {r.Last_name}
                              <Typography variant="caption" display="block">
                                {r.Email}
                              </Typography>
                            </TableCell>
                            <TableCell>{r.AirlineName}</TableCell>
                            <TableCell>
                              {r.Departure_Place} ➔ {r.Destination_Place}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={r.BookingStatus}
                                size="small"
                                color={r.BookingStatus === "Confirmed" ? "success" : "error"}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              ₹{parseFloat(r.Amount || 0).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={r.PaymentStatus || "Success"}
                                size="small"
                                color={r.PaymentStatus === "Success" ? "success" : "default"}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* TAB 4: Passenger Directory */}
            {tabIndex === 4 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Passenger ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Account Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {passengers.map((p) => (
                      <TableRow key={p.PassengerID} hover>
                        <TableCell>#{p.PassengerID}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {p.First_name} {p.Last_name}
                        </TableCell>
                        <TableCell>{p.Email}</TableCell>
                        <TableCell>{p.Phone}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.Role}
                            size="small"
                            color={p.Role === "admin" ? "warning" : "default"}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Add / Edit Flight Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => !savingFlight && setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingFlightId ? "Edit Flight Schedule" : "Schedule New Flight"}
        </DialogTitle>
        <form onSubmit={handleSaveFlight}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Airline Name"
                  value={flightForm.AirlineName}
                  onChange={(e) =>
                    setFlightForm({ ...flightForm, AirlineName: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Departure City"
                  value={flightForm.Departure_Place}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      Departure_Place: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Destination City"
                  value={flightForm.Destination_Place}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      Destination_Place: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Departure Time"
                  type="datetime-local"
                  value={flightForm.DepartureTime}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      DepartureTime: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Arrival Time"
                  type="datetime-local"
                  value={flightForm.ArrivalTime}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      ArrivalTime: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Available Seats"
                  type="number"
                  value={flightForm.SeatsAvailable}
                  onChange={(e) =>
                    setFlightForm({
                      ...flightForm,
                      SeatsAvailable: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ticket Price (₹)"
                  type="number"
                  value={flightForm.Price}
                  onChange={(e) =>
                    setFlightForm({ ...flightForm, Price: e.target.value })
                  }
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setAddDialogOpen(false)}
              disabled={savingFlight}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingFlight}
              sx={{ fontWeight: 700 }}
            >
              {savingFlight ? (
                <CircularProgress size={20} color="inherit" />
              ) : editingFlightId ? (
                "Save Changes"
              ) : (
                "Schedule Flight"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Remove Flight?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete flight #{deleteTargetId}? Any existing
            bookings will also be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTargetId(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteFlight}>
            Delete Flight
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;
