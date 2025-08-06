import { Box, Container, Grid, Link, Typography, IconButton, MenuItem, Select, FormControl } from '@mui/material';
import logo from '@/assets/images/logo.png';
import { Link as RouterLink } from 'react-router-dom';
import { Facebook, Twitter, Instagram, LinkedIn, YouTube, Language as LanguageIcon } from '@mui/icons-material';
import { useCurrency } from '@/contexts/CurrencyContext';

// const CURRENCIES = [
//   { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
//   { code: 'USD', name: 'US Dollar', symbol: '$' },
//   { code: 'EUR', name: 'Euro', symbol: '€' },
//   { code: 'GBP', name: 'British Pound', symbol: '£' },
//   { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
//   { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
//   { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
//   { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
//   { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
//   { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
// ];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  // const { currency, setCurrency, getCurrencySymbol } = useCurrency();

  const handleCurrencyChange = (event) => {
    // setCurrency(event.target.value);
  };

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#fcefdd', // Light beige background color
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4, md: 6 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Box 
                component="img"
                src={logo}
                alt="terracottic Logo"
                sx={{
                  height: {
                    xs: 35,   // Mobile
                    sm: 45,   // Tablets
                    md: 55,   // Small laptops
                    lg: 80,   // Desktops
                    xl: 100   // Large desktops
                  },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  marginBottom: '12px'
                }}
              />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  margin: 0,
                  lineHeight: 1.5,
                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                  maxWidth: '300px'
                }}
              >
                Handcrafted with love and care. Our products are made using traditional methods passed down through generations.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold">
              Quick Links
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <li><Link component={RouterLink} to="/support" color="text.secondary" underline="hover" display="block" mb={1}>
                Support / Help Center
              </Link></li>
              <li><Link component={RouterLink} to="/blog" color="text.secondary" underline="hover" display="block" mb={1}>
                Blog
              </Link></li>
              <li><Link component={RouterLink} to="/faq" color="text.secondary" underline="hover" display="block" mb={1}>
                FAQs
              </Link></li>
              <li><Link component={RouterLink} to="/track-order" color="text.secondary" underline="hover" display="block" mb={1}>
                Order Tracking
              </Link></li>
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold" >
              Customer Service
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <li>
                <Link 
                  component={RouterLink} 
                  to="/contact" 
                  color="text.secondary" 
                  underline="hover" 
                  display="block" 
                  mb={1}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Contact Us
                </Link>
              </li>
              {/* <li><Link component={RouterLink} to="/faq" color="text.secondary" underline="hover" display="block" mb={1}>
                FAQ
              </Link></li> */}
              {/* <li><Link component={RouterLink} to="/shipping" color="text.secondary" underline="hover" display="block" mb={1}>
                Shipping Info
              </Link></li> */}
              <li>
                <Link 
                  component={RouterLink} 
                  to="/founders" 
                  color="text.secondary" 
                  underline="hover" 
                  display="block" 
                  mb={1}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Meet Our Founders
                </Link>
              </li>
              <li>
                <Link 
                  component={RouterLink} 
                  to="/shipping-info" 
                  color="text.secondary" 
                  underline="hover" 
                  display="block" 
                  mb={1}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link 
                  component={RouterLink} 
                  to="/packaging-info" 
                  color="text.secondary" 
                  underline="hover" 
                  display="block" 
                  mb={1}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Packaging Info
                </Link>
              </li>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom fontWeight="bold" >
              Contact Us
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Panchmura, West Bengal, India, 722156
              <br />
              Email: terracottic@gmail.com
              <br />
              Phone: +91 9732029858
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton aria-label="Facebook" color="inherit" href="https://facebook.com/terracottic_official" target="_blank">
                <Facebook />
              </IconButton>
              <IconButton aria-label="X" color="inherit" href="https://x.com/terracottic_official" target="_blank">
                <Twitter />
              </IconButton>
              <IconButton aria-label="Instagram" color="inherit" href="https://instagram.com/terracottic_official" target="_blank">
                <Instagram />
              </IconButton>
              <IconButton aria-label="LinkedIn" color="inherit" href="https://linkedin.com/terracottic_official" target="_blank">
                <LinkedIn />
              </IconButton>
              <IconButton aria-label="YouTube" color="inherit" href="https://youtube.com/terracottic_official" target="_blank">
                <YouTube />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        {/* Currency Selector
        <Box mt={4} display="flex" justifyContent="flex-end" alignItems="center">
          <LanguageIcon color="action" sx={{ mr: 1 }} />
          <FormControl variant="standard" sx={{ minWidth: 120 }}>
            <Select
              value={currency}
              onChange={handleCurrencyChange}
              displayEmpty
              inputProps={{ 'aria-label': 'Select currency' }}
              sx={{
                '&:before, &:after': {
                  borderBottom: 'none !important',
                },
                '& .MuiSelect-select': {
                  padding: '4px 24px 4px 8px',
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                },
                '& .MuiSelect-icon': {
                  color: 'text.secondary',
                },
              }}
            >
              {CURRENCIES.map((curr) => (
                <MenuItem key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name} ({curr.symbol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box> */}
        
        <Box mt={3}>
          {/* <Typography variant="body2" color="text.secondary" align="center">
            &copy; {currentYear} terracottic. All rights reserved. | Prices shown in {currency} ({getCurrencySymbol()})
          </Typography> */}
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            <Link 
              component={RouterLink} 
              to="/privacy-policy" 
              color="inherit" 
              underline="hover" 
              sx={{ mx: 1 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Privacy Policy
            </Link>
            |
            <Link 
              component={RouterLink} 
              to="/terms-and-conditions" 
              color="inherit" 
              underline="hover" 
              sx={{ mx: 1 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Terms & Conditions
            </Link>
          </Typography>
          <Box 
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #fefefe, #f7f0e8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05);',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ 
                fontSize: '1rem',
                letterSpacing: '0.05rem',
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.7)'
              }}
            >
              Created by{' '}
              <Link 
                href="https://smfportfolio.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  color: 'inherit',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                    transform: 'scale(1.02)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                Genumo
              </Link>
              <Box 
                component="span" 
                sx={{ 
                  display: 'block', 
                  fontSize: '0.8rem',
                  color: '#555',
                  mt: 0.5,
                  lineHeight: 1.3
                }}
              >
                Built to lead. Designed to dominate.
              </Box>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export { Footer as default };
