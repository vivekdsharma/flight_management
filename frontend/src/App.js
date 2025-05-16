import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import Bookings from "./components/Bookings";
import BookNow from "./components/BookNow";
import AdminDashboard from "./components/AdminDashboard";
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/profile"
              element={
                localStorage.getItem("token") ? (
                  <Profile />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            
            <Route
              path="/admin"
              element={
                localStorage.getItem("token") ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            
            <Route
              path="/my-bookings"

              element={
                localStorage.getItem("token") ? (
                  <Bookings />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/book"
              element={
                localStorage.getItem("token") ? (
                  <BookNow />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
          <ToastContainer position="bottom-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
