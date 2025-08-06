import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { styled, keyframes } from '@mui/material/styles';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { SafeHtml } from '@/utils/sanitize.jsx';
import { motion, AnimatePresence } from 'framer-motion';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(63, 81, 181, 0); }
  100% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0); }
`;

// Styled components
const PopupOverlay = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  opacity: 0,
  transition: 'opacity 0.3s ease-in-out',
  '&.show': {
    opacity: 1,
  },
});

const PopupBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  width: '90%',
  maxWidth: '500px',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  transform: 'scale(0.95)',
  opacity: 0,
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&.show': {
    transform: 'scale(1)',
    opacity: 1,
  },
  [theme.breakpoints.down('sm')]: {
    width: '95%',
    maxWidth: '100%',
  },
}));

const PopupImage = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'cover',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    transition: 'all 0.5s ease-in-out',
    transform: 'scale(1)',
    '&:hover': {
      transform: 'scale(1.02)',
      filter: 'brightness(1.05)',
      cursor: 'pointer',
    },
    [theme.breakpoints.up('md')]: {
      maxHeight: '400px',
    },
  },
  [theme.breakpoints.down('sm')]: {
    maxHeight: '200px',
    '& img:hover': {
      transform: 'scale(1.01)',
    },
  },
}));

const PopupContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  '& h4': {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
    fontWeight: 700,
    fontSize: '1.5rem',
  },
  '& p': {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    lineHeight: 1.6,
  },
}));

const PopupButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'center',
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    '& button': {
      width: '100%',
    },
  },
}));

const PopupButton = styled(Button)(({ variant, theme }) => ({
  padding: '12px 28px',
  fontSize: '14px',
  borderRadius: '30px',
  fontWeight: 700,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '5px',
    height: '5px',
    background: 'rgba(255, 255, 255, 0.5)',
    opacity: 0,
    borderRadius: '100%',
    transform: 'scale(1, 1) translate(-50%, -50%)',
    transformOrigin: '50% 50%',
  },
  '&:hover::after': {
    animation: 'ripple 1s ease-out',
  },
  ...(variant === 'primary' ? {
    background: 'linear-gradient(45deg, #3f51b5, #5c6bc0)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(63, 81, 181, 0.3)',
    '&:hover': {
      background: 'linear-gradient(45deg, #3949ab, #4f5cb5)',
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 6px 20px rgba(63, 81, 181, 0.4)',
    },
    '&:active': {
      transform: 'translateY(1px) scale(0.99)',
      boxShadow: '0 2px 10px rgba(63, 81, 181, 0.3)',
    },
  } : {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: theme.palette.text.primary,
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.15)',
      transform: 'translateY(-2px)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  }),
}));

// Keyframe for badge pulse effect
const badgePulse = keyframes`
  0% {
    transform: scale(1) rotate(45deg);
    box-shadow: 0 0 0 0 rgba(63, 81, 181, 0.7);
  }
  70% {
    transform: scale(1.05) rotate(45deg);
    box-shadow: 0 0 0 10px rgba(63, 81, 181, 0);
  }
  100% {
    transform: scale(1) rotate(45deg);
    boxShadow: 0 0 0 0 rgba(63, 81, 181, 0);
  }
`;

const Badge = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  padding: '6px 40px',
  color: 'white',
  fontWeight: 700,
  fontSize: '0.7rem',
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  position: 'absolute',
  top: '20px',
  right: '-40px',
  zIndex: 10,
  transform: 'rotate(45deg)',
  transformOrigin: 'center',
  background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    width: '20px',
    height: '100%',
    backgroundColor: 'inherit',
  },
  '&::before': {
    right: '100%',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
  },
  '&::after': {
    left: '100%',
    clipPath: 'polygon(0 0, 100% 0, 0 100%)',
  },
  '&:hover': {
    animation: `${badgePulse} 1.5s infinite`,
    transform: 'rotate(45deg) scale(1.05) translateY(-1px)',
    boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
  },
  '&:active': {
    transform: 'rotate(45deg) scale(0.98)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '5px 32px',
    fontSize: '0.6rem',
    right: '-32px',
    top: '18px',
    '&::before, &::after': {
      width: '16px',
    }
  }
}));

// Memoize the default popup data to prevent recreation on every render
const defaultPopupData = {
  title: 'Welcome Back!',
  message: 'Thank you for being a valued customer!',
  description: 'Check out our exclusive offers for members.',
  buttonText: 'View Offers',
  buttonLink: '/offers',
  secondaryButtonText: 'Dismiss',
  buttonLink2: '',
  badge: 'Exclusive',
  isActive: true,
  imageUrl: ''
};

const UserAnnouncementPopup = React.memo(function UserAnnouncementPopup({ open, onClose, popupData }) {
  // Use provided popupData or fall back to defaults
  const safePopupData = React.useMemo(() => ({
    ...defaultPopupData,
    ...(popupData || {})
  }), [popupData]);
  
  const [isOpen, setIsOpen] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const [loading, setLoading] = useState(!popupData);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);
  
  // Debug logging in development only
  if (process.env.NODE_ENV === 'development') {
    // Log only when props change
    const prevPropsRef = useRef({ open, popupData });
    useEffect(() => {
      const prevProps = prevPropsRef.current;
      if (prevProps.open !== open || prevProps.popupData !== popupData) {
        console.log('UserAnnouncementPopup props changed:', { open, popupData });
        prevPropsRef.current = { open, popupData };
      }
    }, [open, popupData]);
  }

  // Handle popup open/close animations
  useEffect(() => {
    // console.log('Open prop changed:', open);
    
    // If the popup is being opened
    if (open) {
      // console.log('Opening popup');
      setIsOpen(true);
      // Small delay to trigger the CSS transition
      const timer = setTimeout(() => {
        // console.log('Setting popup visible');
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } 
    // If the popup is being closed
    else {
      // console.log('Closing popup');
      setIsVisible(false);
      // Wait for the fade-out animation to complete before removing from DOM
      const timer = setTimeout(() => {
        // console.log('Setting popup closed');
        setIsOpen(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Ensure internal state stays in sync with the open prop
  useEffect(() => {
    if (open !== isOpen) {
      // console.log('Syncing popup state with open prop:', { was: isOpen, now: open });
      setIsOpen(open);
      setIsVisible(open);
    }
  }, [open, isOpen]);
  
  // Initialize data when popupData changes
  useEffect(() => {
    setLoading(false);
    setError(null);
  }, [safePopupData]);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // Handle primary button click
  const handleButtonClick = () => {
    if (safePopupData.buttonLink) {
      window.open(safePopupData.buttonLink, '_blank');
    }
    handleClose();
  };

  // Handle secondary button click
  const handleSecondaryButtonClick = () => {
    if (safePopupData.buttonLink2) {
      window.open(safePopupData.buttonLink2, '_blank');
    } else {
      handleClose();
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle image click
  const handleImageClick = () => {
    if (safePopupData.imageLink) {
      window.open(safePopupData.imageLink, '_blank');
    }
  };

  // Debug rendering - only in development
  if (process.env.NODE_ENV === 'development') {
    // Log only when state changes
    const prevStateRef = useRef({ isOpen, isVisible, loading });
    useEffect(() => {
      const prevState = prevStateRef.current;
      if (prevState.isOpen !== isOpen || prevState.isVisible !== isVisible || prevState.loading !== loading) {
        console.log('Popup state changed:', { 
          isOpen, 
          isVisible, 
          loading, 
          hasCurrentUser: !!currentUser, 
          isActive: safePopupData?.isActive 
        });
        prevStateRef.current = { isOpen, isVisible, loading };
      }
    }, [isOpen, isVisible, loading, currentUser, safePopupData]);
  }

  // Don't show anything if loading
  if (loading) {
    // console.log('Popup is loading, showing loading state');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if there's an error
  if (error) {
    console.error('Error in popup:', error);
    return (
      <Box sx={{ p: 2, color: 'error.main', textAlign: 'center' }}>
        <Typography variant="body1">Error loading announcement: {error}</Typography>
      </Box>
    );
  }

  // Don't show anything if user is not logged in or popup is not active
  // if (!currentUser) {
  //   console.log('Not showing popup: No current user');
  //   return null;
  // }
  
  // if (!safePopupData.isActive) {
  //   console.log('Not showing popup: Popup is not active');
  //   return null;
  // }

  return (
    <AnimatePresence>
      {isOpen && (
        <PopupOverlay 
          className={isVisible ? 'show' : ''} 
          onClick={handleOverlayClick}
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PopupBox 
            className={isVisible ? 'show' : ''}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isVisible ? 1 : 0, 
              y: isVisible ? 0 : 20 
            }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {safePopupData.imageUrl && (
              <PopupImage>
                <img 
                  src={safePopupData.imageUrl} 
                  alt="Announcement" 
                  onClick={handleImageClick}
                  style={{ cursor: safePopupData.imageLink ? 'pointer' : 'default' }}
                />
                {safePopupData.badge && (
                  <Badge>{safePopupData.badge}</Badge>
                )}
              </PopupImage>
            )}
            <PopupContent>
              {safePopupData.title && (
                <Typography variant="h4" component="h2">
                  {safePopupData.title}
                </Typography>
              )}
              {safePopupData.message && (
                <Typography variant="body1" component="div">
                  <SafeHtml html={safePopupData.message} />
                </Typography>
              )}
              {(safePopupData.buttonText || safePopupData.secondaryButtonText) && (
                <PopupButtons>
                  {safePopupData.secondaryButtonText && (
                    <PopupButton 
                      variant="secondary"
                      onClick={handleSecondaryButtonClick}
                    >
                      {safePopupData.secondaryButtonText}
                    </PopupButton>
                  )}
                  {safePopupData.buttonText && (
                    <PopupButton 
                      variant="primary"
                      onClick={handleButtonClick}
                    >
                      {safePopupData.buttonText}
                    </PopupButton>
                  )}
                </PopupButtons>
              )}
            </PopupContent>
          </PopupBox>
        </PopupOverlay>
      )}
    </AnimatePresence>
  );
}); // Close the React.memo and function component

const EnhancedUserAnnouncementPopup = ({ open, onClose, popupData }) => {
  return <UserAnnouncementPopup open={open} onClose={onClose} popupData={popupData} />;
};

// Add default props for better type checking and IDE support
EnhancedUserAnnouncementPopup.defaultProps = {
  open: false,
  onClose: () => {},
  popupData: {
    isActive: true,
    badge: 'New',
    title: 'Exclusive Member Announcement',
    message: 'Check out our latest features and updates available just for you!',
    buttonText: 'Learn More',
    buttonLink: '#',
    secondaryButtonText: 'Dismiss',
    buttonLink2: '',
    imageUrl: '',
    imageLink: '',
    date: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  },
};

export default EnhancedUserAnnouncementPopup;
