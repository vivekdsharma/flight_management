import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import axiosInstance from "../axiosConfig";

function Bookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        // Decode passengerId from token
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
        if (!token || !passengerId) return;
        const response = await axiosInstance.get(`/bookings/my-bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBookings(response.data);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Your Bookings
          </Typography>

          {bookings.length === 0 ? (
            <Typography align="center">No bookings to display yet.</Typography>
          ) : (
            <List>
              {bookings.map((booking) => (
                <React.Fragment key={booking.BookingID}>
                  <ListItem
                    secondaryAction={
                      booking.Status !== "Cancelled" && (
                        <button
                          style={{
                            background: "#dc004e",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            padding: "6px 12px",
                            cursor: "pointer",
                            marginLeft: 16,
                          }}
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              await axiosInstance.put(
                                `/bookings/cancel/${booking.BookingID}`,
                                {},
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );
                              setBookings((prev) =>
                                prev.map((b) =>
                                  b.BookingID === booking.BookingID
                                    ? { ...b, Status: "Cancelled" }
                                    : b
                                )
                              );
                            } catch (err) {
                              alert("Failed to cancel booking");
                            }
                          }}
                        >
                          Cancel Booking
                        </button>
                      )
                    }
                  >
                    <ListItemText
                      primary={`Airline: ${booking.AirlineName}`}
                      secondary={
                        <>
                          <span>From: {booking.Departure_Place}</span>
                          <span style={{ marginLeft: 8 }}>
                            To: {booking.Destination_Place}
                          </span>
                          <span style={{ marginLeft: 8 }}>
                            Status: {booking.Status}
                          </span>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Bookings;
