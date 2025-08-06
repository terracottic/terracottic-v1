import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  TextField, 
  Button, 
  Paper, 
  Divider, 
  InputAdornment,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, YouTube } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { 
  LocationOn as LocationIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon,
  Send as SendIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon
} from '@mui/icons-material';
import emailjs from '@emailjs/browser';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
  }
}));

const ContactPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Initialize EmailJS with public key
      emailjs.init('s11WH3gCgDYz5lR28');
      
      // Prepare email parameters with all form fields
      const currentTime = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const templateParams = {
        to_email: 'teracotta101@gmail.com',
        to_name: 'Terracottic Team',
        from_name: formData.name,
        from_email: formData.email,
        reply_to: formData.email,
        subject: formData.subject || 'New Contact Form Submission',
        message: formData.message,
        time: currentTime,
        // Additional fields for better email formatting
        sender_name: formData.name,
        sender_email: formData.email,
        email_subject: formData.subject || 'New Contact Form Submission',
        email_message: formData.message,
        date: currentTime
      };
      
      await emailjs.send(
        'service_cphtoch',
        'template_g4f2tng',
        templateParams
      );
      
      setSnackbar({
        open: true,
        message: 'Your message has been sent successfully!',
        severity: 'success'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send message. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const contactInfo = [
    {
      icon: <LocationIcon color="primary" fontSize="large" />,
      title: 'Our Location',
      description: 'Panchmura, West Bengal, India, 722156',
      action: 'View on Map',
      href: 'https://maps.google.com'
    },
    {
      icon: <EmailIcon color="primary" fontSize="large" />,
      title: 'Email Us',
      description: 'terracotticinfo@gmail.com',
      action: 'Send an Email',
      href: 'mailto:terracotticinfo@gmail.com'
    },
    {
      icon: <PhoneIcon color="primary" fontSize="large" />,
      title: 'Call Us',
      description: '+91 9732029858',
      action: 'Call Now',
      href: 'tel:+919732029858'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={8}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: '#A67C52', // Sandalwood color
            mb: 2,
            textShadow: '1px 1px 2px rgba(166, 124, 82, 0.2)'
          }}
        >
          Get In Touch
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth="800px" mx="auto">
          Have questions or feedback? We'd love to hear from you!
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Form */}
        <Grid item xs={12} md={7}>
          <StyledPaper elevation={0}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Send Us a Message
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Your Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    variant="outlined"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    multiline
                    rows={6}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    startIcon={<SendIcon />}
                    sx={{
                      borderRadius: '8px',
                      padding: '10px 30px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </StyledPaper>
        </Grid>

        {/* Contact Info */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {contactInfo.map((item, index) => (
              <StyledPaper key={index} elevation={0}>
                <Box display="flex" alignItems="flex-start" gap={3}>
                  <Box sx={{ mt: 0.5 }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                    <Button 
                      href={item.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      variant="outlined" 
                      color="primary"
                      size="small"
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 500,
                        borderRadius: '6px',
                        px: 2,
                        py: 1,
                        mt: 1,
                        borderWidth: '1.5px',
                        '&:hover': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderWidth: '1.5px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          '& svg path': {
                            stroke: 'white'
                          }
                        },
                        '& .MuiButton-startIcon': {
                          mr: 0.5
                        }
                      }}
                      startIcon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      }
                    >
                      {item.action}
                    </Button>
                  </Box>
                </Box>
              </StyledPaper>
            ))}

            {/* Social Media */}
            <StyledPaper elevation={0}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Follow Us
              </Typography>
              <Box display="flex" gap={2}>
                {[
                  { icon: <FacebookIcon />, label: 'Facebook', url: 'https://facebook.com/terracottic' },
                  { icon: <InstagramIcon />, label: 'Instagram', url: 'https://instagram.com/terracottic' },
                  { icon: <TwitterIcon />, label: 'X (Formally Twitter)', url: 'https://x.com/terracottic' }
                ].map((social, index) => (
                  <IconButton
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    sx={{
                      backgroundColor: 'action.hover',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText'
                      },
                      transition: 'all 0.3s ease',
                      width: 48,
                      height: 48
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </StyledPaper>
          </Box>
        </Grid>
      </Grid>

      {/* Contact form ends here */}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ContactPage;
