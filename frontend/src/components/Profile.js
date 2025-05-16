import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

function Profile() {
  const navigate = useNavigate();
  const [showPayments, setShowPayments] = useState(false);
  const [myPayments, setMyPayments] = useState([]);
  const [myPaymentsLoading, setMyPaymentsLoading] = useState(false);

  const handleShowPayments = async () => {
    setShowPayments(true);
    setMyPaymentsLoading(true);
    try {
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
      const res = await axios.get(
        `http://localhost:5000/payments/passenger/${passengerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Profile
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/my-bookings")}
            >
              Your Bookings
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/book")}
            >
              Book Now
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleShowPayments}
            >
              Your Payments
            </Button>
          </Stack>
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
                      <b>Method:</b> {pay.payment_method || "N/A"}
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
        </Paper>
      </Box>
    </Container>
  );
}

export default Profile;
