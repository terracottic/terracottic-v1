import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { styled, keyframes } from '@mui/material/styles';
import { Box, Typography, Button, CircularProgress, Dialog } from '@mui/material';
import GrassIcon from '@mui/icons-material/Grass';
import ParkIcon from '@mui/icons-material/Park';
import SpaIcon from '@mui/icons-material/Spa';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Animation keyframes
const floating = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

// Styled components for the new design
const PopupOverlay = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  opacity: 0,
  transition: 'opacity 0.3s ease-in-out',
  overflow: 'hidden',
  '&.show': {
    opacity: 1,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '200%',
    height: '200%',
    top: '-50%',
    left: '-50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
    animation: 'pulse 8s infinite alternate',
    zIndex: 0,
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '100%': { transform: 'scale(1.2)' },
  },
});

const PopupBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(26, 35, 26, 0.95)',
  borderRadius: '20px',
  width: '90%',
  maxWidth: '500px',
  overflow: 'hidden',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  transform: 'scale(0.95)',
  opacity: 0,
  position: 'relative',
  zIndex: 1,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.5)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #4caf50, #8bc34a, #cddc39, #8bc34a, #4caf50)',
    backgroundSize: '300% 100%',
    animation: 'gradient 3s ease infinite',
  },
  '&.show': {
    transform: 'scale(1)',
    opacity: 1,
    animation: 'float 6s ease-in-out infinite',
  },
  [theme.breakpoints.down('sm')]: {
    width: '95%',
    maxWidth: '100%',
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0) rotate(0.5deg)' },
    '50%': { transform: 'translateY(-10px) rotate(-0.5deg)' },
  },
  '@keyframes gradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
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
      transform: 'scale(1.01)', // More subtle effect on mobile
    },
  },
}));

const PopupContent = styled(Box)({
  padding: '25px',
  textAlign: 'center',
  color: '#fff',
  '& h2': {
    marginTop: 0,
    marginBottom: '10px',
    fontSize: '26px',
    color: '#fff',
    fontWeight: 600,
  },
  '& p': {
    fontSize: '16px',
    marginBottom: '20px',
    lineHeight: 1.6,
    color: '#e0e0e0',
    margin: '12px 0 25px',
  },
});

const PopupButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
  flexWrap: 'wrap',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const BenefitsSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: '20px 0',
  padding: '20px',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  '& .benefits-container': {
    display: 'flex',
    gap: '16px',
    padding: '10px 0',
    willChange: 'transform',
    transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1))',
    zIndex: -1,
    opacity: 0.5,
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
  },
  '& .benefit-item': {
    flex: '0 0 calc(33.333% - 11px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    margin: '0 4px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.02)',
      background: 'rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
      opacity: 1,
    },
    '&.active': {
      transform: 'scale(1.02)',
      opacity: 1,
      background: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    '& svg': {
      color: '#8bc34a',
      fontSize: '24px',
      filter: 'drop-shadow(0 0 5px rgba(139, 195, 74, 0.5))',
      animation: 'pulse 2s infinite',
      '&:nth-of-type(2)': {
        animationDelay: '0.5s',
      },
    },
    '& span': {
      color: 'white',
      fontSize: '15px',
      fontWeight: 600,
      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
      background: 'linear-gradient(45deg, #fff, #e0f7fa)',      
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
}));

// Keyframe for pulse animation
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 65, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 65, 108, 0);
  }
`;

// Keyframe for bounce animation
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

const PopupButton = styled(Button)(({ variant }) => ({
  padding: '14px 32px',
  fontSize: '14px',
  borderRadius: '50px',
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    zIndex: 0,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
  '& span': {
    position: 'relative',
    zIndex: 1,
  },
  ...(variant === 'primary' ? {
    background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)',
      transform: 'rotate(45deg)',
      transition: 'all 0.6s ease',
      animation: 'shimmer 3s infinite',
    },
    '&:hover': {
      transform: 'translateY(-3px) scale(1.02)',
      boxShadow: '0 10px 25px rgba(76, 175, 80, 0.5)',
      '&::after': {
        left: '100%',
      },
    },
    '&:active': {
      transform: 'translateY(1px) scale(0.98)',
      boxShadow: '0 2px 10px rgba(76, 175, 80, 0.3)',
    },
  } : {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(5px)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      transform: 'translateY(-2px)',
      boxShadow: '0 7px 20px rgba(255, 255, 255, 0.1)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  }),
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%) rotate(45deg)' },
    '100%': { transform: 'translateX(100%) rotate(45deg)' },
  },
}));

// Custom styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'relative',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    maxWidth: '900px',
    width: '90%',
    margin: '16px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    [theme.breakpoints.down('sm')]: {
      width: '95%',
      margin: '8px',
      borderRadius: '16px',
    },
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
  },
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  minHeight: '300px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  [theme.breakpoints.down('md')]: {
    minHeight: '200px',
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  position: 'relative',
  zIndex: 1,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 100%)',
    zIndex: -1,
    opacity: 0,
    transition: 'opacity 0.5s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

// Keyframe for badge pulse effect
const badgePulse = keyframes`
  0% {
    transform: scale(1) rotate(45deg);
    box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.7);
  }
  70% {
    transform: scale(1.05) rotate(45deg);
    box-shadow: 0 0 0 10px rgba(255, 65, 108, 0);
  }
  100% {
    transform: scale(1) rotate(45deg);
    boxShadow: 0 0 0 0 rgba(255, 65, 108, 0);
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
  background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
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

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  borderRadius: '50px',
  textTransform: 'none',
  fontWeight: 700,
  letterSpacing: '0.8px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  backgroundSize: '200% auto',
  boxShadow: '0 4px 15px rgba(63, 81, 181, 0.3)',
  '&:hover': {
    backgroundPosition: 'right center',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(63, 81, 181, 0.4)',
  },
  '&:active': {
    transform: 'translateY(1px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3))',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  '&:hover::before': {
    transform: 'translateX(100%)',
  },
}));

const ripple = keyframes`
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(25, 25);
    opacity: 0;
  }
`;

// Enhanced Slide transition with spring effect
const Transition = React.forwardRef(function Transition(props, ref) {
  return (
    <Slide
      direction="up"
      ref={ref}
      {...props}
      style={{
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
      }}
    />
  );
});

// Particle component
const Particle = styled('div')({
  position: 'absolute',
  borderRadius: '50%',
  pointerEvents: 'none',
  opacity: 0.3,
  animation: `${floating} 6s ease-in-out infinite`,
  '&:nth-of-type(2n)': {
    animationDelay: '1s',
  },
  '&:nth-of-type(3n)': {
    animationDelay: '2s',
  },
});

// Floating container
const FloatingContainer = styled(Box)({
  animation: `${floating} 8s ease-in-out infinite`,
  '&:hover': {
    animation: `${floating} 6s ease-in-out infinite`,
  },
});

const AnnouncementPopup = ({ open, onClose, popupData }) => {
  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    const prevPopupData = useRef(popupData);
    useEffect(() => {
      if (JSON.stringify(prevPopupData.current) !== JSON.stringify(popupData)) {
        console.log('Popup Data:', popupData);
        prevPopupData.current = popupData;
      }
    }, [popupData]);
  }
  
  const benefits = [
    { id: 1, icon: <SpaIcon />, text: '100% Organic Products' },
    { id: 2, icon: <GrassIcon />, text: 'Eco-Friendly Materials' },
    { id: 3, icon: <ParkIcon />, text: 'Handcrafted with Care' },
    { id: 4, icon: <SupportAgentIcon />, text: 'Freindly support 24/7' },
    { id: 5, icon: <GrassIcon />, text: 'Sustainable Sourcing' }
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  
  // Auto-rotate benefits
  useEffect(() => {
    if (!open || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % benefits.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [open, isPaused]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(!popupData);
  const [error, setError] = useState(null);
  const { currentUser, hasRole } = useAuth();
  const isAdmin = currentUser && hasRole('admin');
  const fileInputRef = useRef(null);

  // Handle popup open/close animations
  useEffect(() => {
    if (open) {
      setIsOpen(true);
      // Small delay to allow the DOM to update before showing the popup
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 400); // Match this with the CSS transition time
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Initialize data when popupData changes
  useEffect(() => {
    if (popupData) {
      setLoading(false);
      setError(null);
    }
  }, [popupData]);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 400); // Match this with the CSS transition time
  };

  // Handle primary button click
  const handleButtonClick = () => {
    if (popupData?.buttonLink) {
      window.open(popupData.buttonLink, '_blank');
    }
    handleClose();
  };

  // Don't render anything if not open
  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <PopupOverlay className={isVisible ? 'show' : ''}>
        <PopupBox className={isVisible ? 'show' : ''}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2, color: '#fff' }}>
              Loading popup content...
            </Typography>
          </Box>
        </PopupBox>
      </PopupOverlay>
    );
  }

  // Show error state
  if (error) {
    return (
      <PopupOverlay className={isVisible ? 'show' : ''}>
        <PopupBox className={isVisible ? 'show' : ''}>
          <PopupContent>
            <Typography variant="h6" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography paragraph sx={{ color: '#e0e0e0' }}>
              {error}
            </Typography>
            <PopupButtons>
              <PopupButton onClick={handleClose}>
                Close
              </PopupButton>
            </PopupButtons>
          </PopupContent>
        </PopupBox>
      </PopupOverlay>
    );
  }

  // Don't show anything if:
  // 1. User is logged in
  // 2. No popup data
  // 3. Popup is not active
  if (currentUser || !popupData || !popupData.isActive) return null;

  return (
    <AnimatePresence>
      <PopupOverlay
        className={isVisible ? 'show' : ''}
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <PopupBox className={isVisible ? 'show' : ''}>
          {popupData.imageUrl && (
            <PopupImage>
              <img
                src={popupData.imageUrl}
                alt="Announcement"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {popupData.badge && (
                <Badge>
                  {popupData.badge}
                </Badge>
              )}
            </PopupImage>
          )}

          <PopupContent>
            {popupData.title && (
              <Typography variant="h4" component="h2" sx={{
                color: 'white',
                fontWeight: 600,
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}>
                {popupData.title}
              </Typography>
            )}
            {popupData.message && (
              <Typography variant="body1" component="p" sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                lineHeight: 1.6,
                mb: 2
              }}>
                {popupData.message}
              </Typography>
            )}
            {popupData.description && (
              <Typography variant="body2" component="p" sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                lineHeight: 1.5,
                mb: 3,
                fontStyle: 'italic'
              }}>
                {popupData.description}
              </Typography>
            )}

            <BenefitsSection 
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div 
                ref={containerRef}
                className="benefits-container"
                style={{
                  transform: `translateX(calc(-${currentIndex * (100 + 4.8)}% + ${currentIndex * 8}px))`,
                }}
              >
                {[...benefits, ...benefits, ...benefits].map((benefit, index) => (
                  <div 
                    key={`${benefit.id}-${index}`}
                    className={`benefit-item ${index % benefits.length === currentIndex ? 'active' : ''}`}
                  >
                    {benefit.icon}
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </BenefitsSection>

            <PopupButtons>
              <PopupButton onClick={handleClose}>
                {popupData.secondaryButtonText || 'Maybe Later'}
              </PopupButton>
              {popupData.buttonLink && popupData.buttonText && (
                <PopupButton
                  variant="primary"
                  onClick={handleButtonClick}
                >
                  {popupData.buttonText}
                </PopupButton>
              )}
            </PopupButtons>
          </PopupContent>
        </PopupBox>
      </PopupOverlay>
    </AnimatePresence>
  );
};

const EnhancedAnnouncementPopup = ({ open, onClose, popupData }) => {
  return (
    <>
      <AnnouncementPopup open={open} onClose={onClose} popupData={popupData} />
    </>
  );
};

// Add default props for better type checking and IDE support
EnhancedAnnouncementPopup.defaultProps = {
  open: false,
  onClose: () => { },
  popupData: {
    isActive: true,
    badge: '',
    title: '',
    message: '',
    description: '',
    imageUrl: '',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    secondaryButtonText: 'Maybe Later',
    buttonLink2: '#',
    date: new Date().toLocaleDateString(),
    lastUpdated: new Date(),
  },
};

export default EnhancedAnnouncementPopup;
