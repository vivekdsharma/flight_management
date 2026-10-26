import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired") === "1") {
      setSessionExpiredNotice(true);
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/api/passenger/login", formData);
      const data = response.data;

      login(data.token, data);
      toast.success(`Welcome back, ${data.first_name || "User"}!`);

      if (data.role === "admin" || data.email === "vsharma6_be23@thapar.edu") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/book", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Login failed. Please verify credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 6, mb: 6 }}>
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            background: "linear-gradient(145deg, #ffffff, #f7f9fc)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                boxShadow: "0 4px 15px rgba(0, 114, 255, 0.3)",
              }}
            >
              <FlightTakeoffIcon sx={{ color: "white", fontSize: 32 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="#0f2027">
              Sign In to SkyFlight
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter your credentials to manage or book flights
            </Typography>
          </Box>

          {sessionExpiredNotice && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your session has expired. Please sign in again to continue.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 2,
                background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                boxShadow: "0 4px 15px rgba(0, 114, 255, 0.3)",
              }}
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : "Sign In"}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Typography align="center" variant="body2" color="text.secondary">
            Don't have an account yet?{" "}
            <Link
              to="/signup"
              style={{
                color: "#0072ff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Register here
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
