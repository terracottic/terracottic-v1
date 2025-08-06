import React, { useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet, matchPath } from 'react-router-dom';
import { styled, useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  CssBaseline,
  CircularProgress,
  Badge,
  Button
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import CampaignIcon from '@mui/icons-material/Campaign';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TimerIcon from '@mui/icons-material/Timer';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';

// Styled components
const drawerWidth = 260;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      padding: theme.spacing(2),
    },
  })
);

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  backgroundColor: '#8B4513', // SaddleBrown color
  color: '#fff', // Ensure text is readable
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  '& .MuiButton-text': {
    color: '#fff', // Ensure buttons text is white
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light hover effect
    }
  },
  '& .MuiSvgIcon-root': {
    color: '#fff', // Ensure icons are white
  },
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const open = !isMobile;

  // Menu items configuration
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/admin/dashboard', 
      exact: true 
    },
    { 
      text: 'Products', 
      icon: <ShoppingBagIcon />, 
      path: '/admin/products',
      matchSubPaths: true
    },
    { 
      text: 'Categories', 
      icon: <CategoryIcon />, 
      path: '/admin/categories' 
    },

    { 
      text: 'Orders', 
      icon: <ReceiptLongIcon />, 
      path: '/admin/orders',
      matchSubPaths: true
    },
    { 
      text: 'Users', 
      icon: <PeopleIcon />, 
      path: '/admin/users',
      matchSubPaths: true
    },
    { 
      text: 'Slider', 
      icon: <ViewCarouselIcon />, 
      path: '/admin/slider' 
    },
    { 
      text: 'Analytics', 
      icon: <AnalyticsIcon />, 
      path: '/admin/analytics' 
    },
    { 
      text: 'Segmentation', 
      icon: <PeopleIcon />, 
      path: '/admin/customer-segmentation' 
    },
    { 
      text: 'Newsletter', 
      icon: <EmailIcon />, 
      path: '/admin/newsletter',
      matchPattern: '/admin/newsletter/*'
    },
    {
      text: 'Workshop',
      icon: <CategoryIcon />,
      path: '/admin/workshop',
      roles: [ROLES.ADMIN],
      matchPattern: '/admin/workshop/*'
    },
    {
      text: 'Popup Manager',
      icon: <CampaignIcon />,
      path: '/admin/popup',
      roles: [ROLES.ADMIN]
    },
    {
      text: 'Out of Stock Waitlist',
      icon: <TimerIcon />,
      path: '/admin/out-of-stock-waitlist',
      roles: [ROLES.ADMIN]
    },
    {
      text: 'Coupon Management',
      icon: <LocalOfferIcon />,
      path: '/admin/coupons',
      roles: [ROLES.ADMIN]
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      roles: [ROLES.ADMIN],
      matchPattern: '/admin/profile'
    }
  ];

  // Memoize filtered menu items with dependency on user role
  const filteredMenuItems = useMemo(() => {
    if (!currentUser || !hasRole(ROLES.ADMIN)) return [];
    return menuItems;
  }, [currentUser, hasRole]);

  // Improved isActive function that handles exact and sub-path matching
  const isActive = useCallback((item) => {
    if (!item || !item.path) return false;
    
    const { path, exact, matchSubPaths } = item;
    const currentPath = location.pathname;
    
    // Check for exact match first
    if (currentPath === path) return true;
    
    // Check for subpath match if enabled
    if (matchSubPaths) {
      // Check if current path starts with the item path followed by / or is the same
      if (currentPath.startsWith(`${path}/`)) return true;
      
      // Special case for root path
      if (path === '/' && currentPath !== '/') return false;
      
      // Check for wildcard match
      const pathSegments = path.split('/').filter(Boolean);
      const currentSegments = currentPath.split('/').filter(Boolean);
      
      if (pathSegments.length > 0 && pathSegments.length <= currentSegments.length) {
        return pathSegments.every((segment, index) => {
          // Handle dynamic segments
          if (segment.startsWith(':')) return true;
          return segment === currentSegments[index];
        });
      }
    }
    
    return false;
  }, [location.pathname]);

  // Handle navigation with prevention of duplicate navigation
  const handleNavigation = useCallback((path, event) => {
    try {
      // Prevent default navigation if event exists
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Close mobile drawer if open
      if (mobileOpen) {
        setMobileOpen(false);
      }
      
      // Only navigate if we're not already on this exact path
      if (location.pathname !== path) {
        navigate(path, { 
          replace: true,
          state: { from: location.pathname }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigate, location.pathname, mobileOpen]);

  // Memoize drawer toggle handler
  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  // Memoize menu handlers
  const handleUserMenuOpen = useCallback((event) => setUserMenuAnchor(event.currentTarget), []);
  const handleUserMenuClose = useCallback(() => setUserMenuAnchor(null), []);
  const handleNotificationsOpen = useCallback((event) => setNotificationsAnchor(event.currentTarget), []);
  const handleNotificationsClose = useCallback(() => setNotificationsAnchor(null), []);

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    handleUserMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }, [handleUserMenuClose, logout, navigate]);

  // Show loading state if user data is not available yet
  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => {
          if (!item) return null;
          const active = isActive(item);
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={isActive(item)}
              onClick={(e) => handleNavigation(item.path, e)}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(139, 69, 19, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(139, 69, 19, 0.15)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: active ? 'primary.main' : 'inherit',
                }}
              >
                {React.cloneElement(item.icon, {
                  color: active ? 'primary' : 'inherit'
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: active ? 'bold' : 'normal',
                  variant: 'body2',
                }}
                sx={{ 
                  opacity: open ? 1 : 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <StyledAppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{
              marginRight: 2,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {filteredMenuItems.find(item => isActive(item.matchPattern))?.text || 'Dashboard'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Button
              color="inherit"
              onClick={handleUserMenuOpen}
              startIcon={
                <Avatar 
                  alt={currentUser.displayName || 'User'} 
                  src={currentUser.photoURL}
                  sx={{ width: 32, height: 32 }}
                />
              }
              sx={{ textTransform: 'none' }}
            >
              {currentUser.displayName || 'User'}
            </Button>
          </Box>
        </Toolbar>
      </StyledAppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen && isMobile ? false : open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Main open={open}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Main>
      
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/admin/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        onClick={handleNotificationsClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 360,
            maxHeight: 440,
            overflow: 'auto',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1.5,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default AdminLayout;
