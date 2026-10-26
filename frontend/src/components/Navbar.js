import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  Tooltip,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="sticky" elevation={2} sx={{ background: "#0f2027" }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 0.5 }}>
          {/* Logo & Brand */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              mr: 3,
            }}
            onClick={() => navigate(token ? "/book" : "/login")}
          >
            <FlightTakeoffIcon
              sx={{
                fontSize: 32,
                color: "#00c6ff",
                mr: 1,
                transform: "rotate(-10deg)",
              }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                letterSpacing: ".05rem",
                background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SkyFlight Pro
            </Typography>
          </Box>

          {/* Navigation Links for Logged-In Users */}
          <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
            {token && (
              <>
                <Button
                  startIcon={<SearchIcon />}
                  sx={{
                    color: isActive("/book") ? "#00c6ff" : "white",
                    borderBottom: isActive("/book") ? "2px solid #00c6ff" : "none",
                    borderRadius: 0,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => navigate("/book")}
                >
                  Book Flights
                </Button>

                <Button
                  startIcon={<ConfirmationNumberIcon />}
                  sx={{
                    color: isActive("/my-bookings") ? "#00c6ff" : "white",
                    borderBottom: isActive("/my-bookings")
                      ? "2px solid #00c6ff"
                      : "none",
                    borderRadius: 0,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => navigate("/my-bookings")}
                >
                  My Bookings
                </Button>

                <Button
                  startIcon={<AccountCircleIcon />}
                  sx={{
                    color: isActive("/profile") ? "#00c6ff" : "white",
                    borderBottom: isActive("/profile")
                      ? "2px solid #00c6ff"
                      : "none",
                    borderRadius: 0,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => navigate("/profile")}
                >
                  My Account
                </Button>

                {isAdmin && (
                  <Button
                    startIcon={<AdminPanelSettingsIcon />}
                    sx={{
                      color: isActive("/admin") ? "#ff9800" : "#ffb74d",
                      borderBottom: isActive("/admin")
                        ? "2px solid #ff9800"
                        : "none",
                      borderRadius: 0,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                    onClick={() => navigate("/admin")}
                  >
                    Admin Dashboard
                  </Button>
                )}
              </>
            )}
          </Box>

          {/* User Status / Login Buttons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {token ? (
              <>
                <Chip
                  icon={<AccountCircleIcon sx={{ color: "white !important" }} />}
                  label={
                    isAdmin
                      ? `Admin: ${user?.firstName || "Vivek"}`
                      : `Hi, ${user?.firstName || "Passenger"}`
                  }
                  color={isAdmin ? "warning" : "primary"}
                  variant="outlined"
                  sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
                />
                <Tooltip title="Log out">
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                      textTransform: "none",
                      borderColor: "rgba(255,255,255,0.3)",
                      "&:hover": { borderColor: "#ff5252", color: "#ff5252" },
                    }}
                  >
                    Logout
                  </Button>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate("/login")}
                  sx={{ textTransform: "none" }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate("/signup")}
                  sx={{
                    textTransform: "none",
                    background: "linear-gradient(45deg, #00c6ff, #0072ff)",
                    boxShadow: "0 3px 10px rgba(0, 198, 255, 0.4)",
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
