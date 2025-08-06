import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Paper,
  Alert,
  Link
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Email as EmailIcon } from '@mui/icons-material';

const VerifyEmailPage = () => {
  const { currentUser, sendEmailVerification } = useAuth();
  const [status, setStatus] = useState('sending'); // 'sending', 'sent', 'verified', 'error'
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();

  // Check if email is already verified
  useEffect(() => {
    if (currentUser?.emailVerified) {
      setStatus('verified');
    } else if (currentUser) {
      handleSendVerification();
    } else {
      // If no user is logged in, redirect to login
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (status === 'sent' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, status]);

  const handleSendVerification = async () => {
    try {
      setStatus('sending');
      setError('');
      
      const { success, error } = await sendEmailVerification();
      
      if (success) {
        setStatus('sent');
        setCountdown(30); // Reset countdown
      } else {
        throw new Error(error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError(error.message || 'Failed to send verification email. Please try again.');
      setStatus('error');
    }
  };

  const handleCheckVerification = async () => {
    try {
      setStatus('verifying');
      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        setStatus('verified');
        // Redirect to home after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setError(error.message || 'Failed to check verification status. Please try again.');
      setStatus('sent');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          {status === 'verified' ? (
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          ) : (
            <EmailIcon color="primary" sx={{ fontSize: 80, mb: 2 }} />
          )}
          
          <Typography variant="h4" component="h1" gutterBottom>
            {status === 'verified' ? 'Email Verified!' : 'Verify Your Email'}
          </Typography>
          
          {status === 'verified' ? (
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for verifying your email address. You'll be redirected to the home page shortly.
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary" paragraph>
              We've sent a verification link to <strong>{currentUser?.email}</strong>.
              Please check your inbox and click the link to verify your email address.
            </Typography>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
          )}
          
          {status === 'sending' && (
            <Box sx={{ my: 3 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Sending verification email...
              </Typography>
            </Box>
          )}
          
          {status === 'verifying' && (
            <Box sx={{ my: 3 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Verifying your email...
              </Typography>
            </Box>
          )}
          
          {status === 'sent' && (
            <Box sx={{ my: 3 }}>
              <Typography variant="body2" color="success.main" gutterBottom>
                Verification email sent! Check your inbox.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Didn't receive the email? Check your spam folder or request a new link.
              </Typography>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCheckVerification}
                  disabled={status === 'verifying'}
                >
                  I've Verified My Email
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleSendVerification}
                  disabled={countdown > 0 || status === 'sending'}
                >
                  {status === 'sending' ? 'Sending...' : `Resend Email${countdown > 0 ? ` (${countdown}s)` : ''}`}
                </Button>
              </Box>
            </Box>
          )}
          
          {status === 'verified' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Continue to Home
            </Button>
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Need help? <Link component={RouterLink} to="/contact">Contact support</Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default VerifyEmailPage;
