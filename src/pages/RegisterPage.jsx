import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff, FiHome, FiLogIn } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Box, TextField, Button, Typography, IconButton, InputAdornment, Divider } from '@mui/material';
import AnimatedBackground from '../components/auth/AnimatedBackground';
import AuthFooter from '../components/auth/AuthFooter';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Create Account | Terracottic';
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if email domain is allowed
    const allowedDomains = ['gmail.com', 'yahoo.com'];
    const emailDomain = email.split('@')[1];
    
    if (!allowedDomains.includes(emailDomain)) {
      return setError('Only Gmail and Yahoo email addresses are allowed for registration');
    }
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!acceptedTerms) {
      return setError('You must accept the Terms and Conditions to register');
    }

    try {
      setError('');
      setLoading(true);
      // Pass the name as the third argument to signup
      await signup(email, password, name);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        height: '100%',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        p: 0,
        m: 0,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(\"/images/auth-bg-pattern.png\")',
          opacity: 0.03,
          zIndex: 0,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Animated Background Elements */}
      <AnimatedBackground />
      
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto',
            padding: '16px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '90vh',
              overflowY: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.2)',
              },
              '@media (max-height: 600px)': {
                maxHeight: '95vh',
              }
            }}
          >
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 4,
                p: { xs: 3, sm: 4 },
                position: 'relative',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: 'linear-gradient(90deg, #8B4513 0%, #D2691E 100%)',
                }
              }}
            >
              <Box textAlign="center" mb={4}>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    mb: 1,
                    background: 'linear-gradient(90deg, #8B4513 0%, #D2691E 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Create Your Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join our community today
                </Typography>
              </Box>

              {error && (
                <Box
                  sx={{
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    p: 2,
                    borderRadius: 1,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Typography variant="body2">{error}</Typography>
                </Box>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Box mb={3}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FiUser color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <TextField
                    fullWidth
                    type="email"
                    variant="outlined"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FiMail color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FiLock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FiLock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={toggleConfirmPasswordVisibility}
                            edge="end"
                          >
                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>

                <Box mb={3} display="flex" alignItems="flex-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '10px',
                      marginTop: '4px',
                      accentColor: '#8B4513',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="body2" component="label" htmlFor="terms" sx={{ cursor: 'pointer', color: 'text.secondary' }}>
                    I agree to the{' '}
                    <Link to="/terms" style={{ color: '#8B4513', textDecoration: 'none', fontWeight: 500 }}>
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" style={{ color: '#8B4513', textDecoration: 'none', fontWeight: 500 }}>
                      Privacy Policy
                    </Link>
                  </Typography>
                </Box>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    size="large"
                    endIcon={<FiArrowRight />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(90deg, #8B4513 0%, #D2691E 100%)',
                      '&:hover': {
                        opacity: 0.9,
                      },
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </motion.div>
              </Box>
          {/* Bottom Links */}
          <Box sx={{ 
            mt: 3, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Already have an account?{' '}
              <Button
                component={Link}
                to="/login"
                startIcon={<FiLogIn />}
                sx={{
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign in
              </Button>
            </Typography>
            <Button
              component={Link}
              to="/"
              startIcon={<FiHome />}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                }
              }}
            >
              Back to Home
            </Button>
            
            </Box>
          </Box>
          
          </Box>
        </motion.div>
      </Box>
      
      {/* Footer */}
      <AuthFooter />
    </Box>
  );
}
