import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Container,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navItems = [
    { text: 'Home', path: '/' },
    { text: 'Shop', path: '/products' },
    { text: 'About', path: '/about' },
    { text: 'Contact', path: '/contact' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            height: 40,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img 
            src="/src/assets/images/logo.png" 
            alt="terracottic Logo" 
            style={{ 
              height: '100%',
              width: 'auto',
              maxWidth: '160px',
              objectFit: 'contain'
            }} 
          />
        </Box>
        <IconButton onClick={handleDrawerToggle} color="inherit">
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderLeft: '4px solid #4361ee',
              },
              '&:hover': {
                backgroundColor: 'rgba(67, 97, 238, 0.05)',
              },
            }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="sticky"
      elevation={scrolled ? 4 : 1}
      sx={{
        backgroundColor: '#fcefdd',
        color: 'text.primary',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 64, justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              height: 50,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              flexGrow: isMobile ? 1 : 0,
            }}
          >
            <img 
              src="/src/assets/images/logo.png" 
              alt="terracottic Logo" 
              style={{ 
                height: '100%', 
                width: 'auto',
                maxWidth: '200px',
                objectFit: 'contain'
              }} 
            />
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.text}
                component={RouterLink}
                to={item.path}
                sx={{
                  mx: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(139, 69, 19, 0.1)',
                  },
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Right side elements */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentUser ? (
              <>
                <IconButton 
                  color="primary" 
                  aria-label="cart" 
                  component={RouterLink} 
                  to="/cart"
                  sx={{ 
                    backgroundColor: 'white',
                    color: 'primary.main',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    width: 40,
                    height: 40,
                  }}
                >
                  <Badge 
                    badgeContent={4} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        right: 5,
                        top: 5,
                        padding: '0 4px',
                        height: 16,
                        minWidth: 16,
                        borderRadius: 8,
                      },
                    }}
                  >
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
                <IconButton
                  size="medium"
                  aria-label="account of current user"
                  aria-haspopup="true"
                  onClick={() => navigate('/profile')}
                  color="inherit"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    width: 40,
                    height: 40,
                  }}
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  variant="outlined"
                  component={RouterLink}
                  to="/login"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: '#8B5E3C',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: '#a96d47',
                    },
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    height: 40,
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  sx={{
                    backgroundColor: '#DA8552',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#c15e2f',
                    },
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    height: 40,
                    ml: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  Register
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { md: 'none' },
                ml: 1
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Mobile Drawer */}
          <Drawer
            variant="temporary"
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box',
                width: 280,
                backgroundColor: '#fcefdd',
              },
            }}
          >
            {drawer}
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
