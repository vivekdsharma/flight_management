import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const firstName = localStorage.getItem('firstName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('firstName');
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Flight Management
        </Typography>
        <Box>
          {token ? (
            <>
              <Button color="inherit" onClick={() => navigate('/profile')}>
                Welcome, {firstName}
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
            
          )}

          {localStorage.getItem("email") === "vsharma6_be23@thapar.edu" && (
            <Button color="inherit" onClick={() => navigate('/admin')}>
              Admin Dashboard
            </Button>
          )}

        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 