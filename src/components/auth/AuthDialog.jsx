import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  IconButton,
  Divider,
  Alert,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function AuthDialog({ open, onClose, initialTab = 0 }) {
  const [tabValue, setTabValue] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleClose = () => {
    onClose();
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setTabValue(initialTab);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      handleClose();
    } catch (error) {
      setError(error.message || 'Failed to log in');
    }
    
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    
    try {
      await signup(email, password, name);
      // Don't close on signup as we need to verify email
      setTabValue(0);
      setError('');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      setError(error.message || 'Failed to create an account');
    }
    
    setLoading(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '12px',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="span">
          {tabValue === 0 ? 'Login to Your Account' : 'Create an Account'}
        </Typography>
        <IconButton 
          aria-label="close" 
          onClick={handleClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            height: 3,
          },
        }}
      >
        <Tab 
          label="Login" 
          icon={<LoginIcon />} 
          iconPosition="start"
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 56,
          }}
        />
        <Tab 
          label="Register" 
          icon={<PersonAddIcon />} 
          iconPosition="start"
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 56,
          }}
        />
      </Tabs>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleLogin}>
            <Stack spacing={2}>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="small"
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="small"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => navigate('/forgot-password')}
                  sx={{ textTransform: 'none' }}
                >
                  Forgot Password?
                </Button>
              </Box>
            </Stack>
          </form>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleSignup}>
            <Stack spacing={2}>
              <TextField
                autoFocus
                margin="dense"
                label="Full Name"
                type="text"
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                size="small"
              />
              <TextField
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="small"
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size="small"
                helperText="Password should be at least 6 characters"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !name || !email || password.length < 6}
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Stack>
          </form>
        </TabPanel>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {tabValue === 0 ? "Don't have an account?" : 'Already have an account?'}
          <Button 
            onClick={() => setTabValue(tabValue === 0 ? 1 : 0)}
            color="primary"
            size="small"
            sx={{ ml: 1, textTransform: 'none' }}
          >
            {tabValue === 0 ? 'Sign Up' : 'Sign In'}
          </Button>
        </Typography>
      </DialogActions>
    </Dialog>
  );
}

export default AuthDialog;
