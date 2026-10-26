import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  Stack,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import PaymentIcon from "@mui/icons-material/Payment";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { useNavigate } from "react-router-dom";
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

function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, paymentsRes] = await Promise.all([
          axiosInstance.get("/api/passenger/profile"),
          axiosInstance.get("/payments/passenger/me"),
        ]);
        setProfileData(profileRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error("Error loading profile or payments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0f2027">
          Passenger Profile & Payments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your passenger details, membership role, and transaction history
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={45} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading profile information...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* User Details Card */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: "linear-gradient(145deg, #ffffff, #f7f9fc)",
              }}
            >
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1.5,
                    boxShadow: "0 4px 15px rgba(0, 114, 255, 0.3)",
                  }}
                >
                  <PersonIcon sx={{ color: "white", fontSize: 40 }} />
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {profileData?.First_name} {profileData?.Last_name}
                </Typography>
                <Chip
                  label={profileData?.Role?.toUpperCase() || "PASSENGER"}
                  color={
                    profileData?.Role === "admin" ? "warning" : "primary"
                  }
                  size="small"
                  sx={{ mt: 1, fontWeight: 700 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      EMAIL
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {profileData?.Email}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      PHONE
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {profileData?.Phone}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <BadgeIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      PASSENGER ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      #{profileData?.PassengerID}
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FlightTakeoffIcon />}
                  onClick={() => navigate("/book")}
                  sx={{
                    background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                    fontWeight: 700,
                  }}
                >
                  Book Flights
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ConfirmationNumberIcon />}
                  onClick={() => navigate("/my-bookings")}
                  sx={{ fontWeight: 600 }}
                >
                  My Bookings
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Payment Transactions History */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Payment History ({payments.length})
                </Typography>
                <PaymentIcon color="primary" />
              </Box>

              {payments.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No payment records found yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Payment ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Flight / Route</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((pay) => (
                        <TableRow key={pay.PaymentID} hover>
                          <TableCell>#{pay.PaymentID}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {pay.AirlineName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pay.Departure_Place} ➔ {pay.Destination_Place}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#2e7d32" }}>
                            ₹{parseFloat(pay.Amount).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>{pay.payment_method || "UPI"}</TableCell>
                          <TableCell>
                            <Chip
                              label={pay.Status}
                              size="small"
                              color={
                                pay.Status === "Success"
                                  ? "success"
                                  : pay.Status === "Failed"
                                  ? "error"
                                  : "warning"
                              }
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                            {formatDateTime(pay.PaymentDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default Profile;
