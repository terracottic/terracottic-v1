import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const MaintenancePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleCheckUpdates = () => {
    window.location.reload();
  };

  const handleWhatsAppClick = () => {
    const phone = 'YOUR_WHATSAPP_NUMBER'; // e.g., 919999999999
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleAdminLogin = () => {
    setLoginOpen(true);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      await login(loginData.email, loginData.password);
      setSnackbar({
        open: true,
        message: 'Login successful! Redirecting...',
        severity: 'success'
      });
      setLoginOpen(false);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            color="primary"
            fontWeight="bold"
          >
            🚧 Under Maintenance
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 4 }}
          >
            We're currently performing scheduled maintenance.
            <br />
            We'll be back shortly!
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleCheckUpdates}
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
            >
              Check for Updates
            </Button>

            <Button
              variant="outlined"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={handleWhatsAppClick}
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
            >
              Contact Us on WhatsApp
            </Button>

            <Button
              variant="text"
              color="primary"
              startIcon={<LockOpenIcon />}
              onClick={handleAdminLogin}
              fullWidth
              size="large"
              sx={{ mt: 2 }}
            >
              Admin Login
            </Button>
          </Box>

          <Typography variant="caption" color="text.disabled">
            Last updated: {new Date().toLocaleString()}
          </Typography>
        </Paper>
      </Container>

      {/* Admin Login Dialog */}
      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} fullWidth maxWidth="xs">
        <form onSubmit={handleLoginSubmit}>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={loginData.email}
              onChange={handleLoginChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            {loginError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {loginError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setLoginOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaintenancePage;
