import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { styled } from '@mui/material/styles';
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
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Home as HomeIcon,
  ShoppingBag as ShoppingBagIcon,
  GridOn as GridOnIcon,
  Diamond as DiamondIcon,
  Info as InfoIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const StickyAppBar = styled(AppBar)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.appBar,
  backgroundColor: '#fcefdd',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart } = useCart();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  
  // Calculate total items in cart
  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  const navItems = [
    { text: 'Products', path: '/products', icon: <ShoppingBagIcon /> },
    // { text: 'Custom Order', path: '/custom-order', icon: <DiamondIcon /> },
    { text: 'Our Story', path: '/about', icon: <InfoIcon /> },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };



  const drawer = (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        marginLeft: 'auto',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
        color: '#5d4037',
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #f0e6d9',
        backgroundColor: '#f9f5f0'
      }}>
        <Box component={RouterLink} to="/" onClick={() => setMobileOpen(false)} sx={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/src/assets/images/logo.png"
            alt="terracottic Logo"
            style={{ height: 32, width: 'auto' }}
          />
        </Box>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ color: '#8B5E3C' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ py: 1, '& .MuiListItemIcon-root': { minWidth: 40 } }}>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              color: '#5d4037',
              py: 1.5,
              px: 3,
              '&:hover': {
                backgroundColor: 'rgba(93, 64, 55, 0.05)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(139, 94, 60, 0.1)',
                color: '#8B5E3C',
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: 'inherit',
              '& svg': {
                fontSize: '1.5rem',
                color: 'inherit'
              }
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {item.text}
                </Typography>
              } 
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        {currentUser ? (
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2, bgcolor: '#8B5E3C' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle2">{currentUser.displayName || 'User'}</Typography>
              <Typography variant="body2" color="textSecondary">
                {currentUser.email}
              </Typography>
            </Box>
          </Box>
          <Button
            fullWidth
            variant="outlined"
            onClick={async () => {
              await logout();
              setMobileOpen(false);
            }}
            sx={{ mt: 1 }}
          >
            Sign Out
          </Button>
        </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              fullWidth
              startIcon={<LoginIcon />}
              onClick={() => setMobileOpen(false)}
              sx={{
                color: '#8B5E3C',
                borderColor: '#8B5E3C',
                '&:hover': {
                  backgroundColor: 'rgba(139, 94, 60, 0.05)',
                  borderColor: '#8B5E3C',
                },
              }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              fullWidth
              startIcon={<PersonAddIcon />}
              onClick={() => setMobileOpen(false)}
              sx={{
                backgroundColor: '#8B5E3C',
                '&:hover': {
                  backgroundColor: '#7a5234',
                },
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <StickyAppBar position="sticky" elevation={0}>
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, sm: 3 },
            py: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: { xs: 56, sm: 64 },
            position: 'relative',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Mobile Menu Button */}
          {/* <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              display: { md: 'none' },
              color: '#8B5E3C',
              backgroundColor: 'rgba(139, 94, 60, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(139, 94, 60, 0.2)',
              },
            }}
          >
            <MenuIcon />
          </IconButton> */}
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              mr: { xs: 'auto', md: 4 },
            }}
          >
            <img
              src="/src/assets/images/logo.png"
              alt="terracottic Logo"
              style={{ height: 40, width: 'auto' }}
            />
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.text}
                component={RouterLink}
                to={item.path}
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(139, 94, 60, 0.05)',
                  },
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>



          {/* Right Side Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentUser ? (
              <>
                <IconButton
                  component={RouterLink}
                  to="/cart"
                  sx={{
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <Badge 
                    badgeContent={cartItemCount} 
                    color="error"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -3,
                        top: 5,
                        padding: '0 4px',
                        height: '18px',
                        minWidth: '18px',
                        fontSize: '0.7rem',
                      },
                    }}
                  >
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
                <IconButton
                  component={RouterLink}
                  to="/profile"
                  sx={{
                    color: 'text.primary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  startIcon={<LoginIcon />}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  startIcon={<PersonAddIcon />}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Register
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <IconButton
              color="#8B5E3C"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { xs: 'flex', md: 'none' }, 
                ml: 1,
                color: '#8B5E3C',
                backgroundColor: 'rgba(139, 94, 60, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(139, 94, 60, 0.2)',
                },
                minWidth: '40px',
                minHeight: '40px',
                padding: '8px'
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </StickyAppBar>

      {/* Mobile Drawer - Slides in from right */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            color: '#8B5E3C',
            left: 'auto',
            right: 0,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
