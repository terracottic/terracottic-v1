import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

const Slide = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$imageUrl',
})(({ theme, $imageUrl }) => ({
  height: '80vh',
  minHeight: '500px',
  width: '100vw',
  maxWidth: '100%',
  margin: 0,
  padding: 0,
  backgroundImage: `url(${$imageUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  color: '#fff',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  transition: 'opacity 0.5s ease-in-out',
}));

const SlideContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  maxWidth: '800px',
  padding: theme.spacing(4),
  '& .MuiTypography-h2': {
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  '& .MuiTypography-subtitle1': {
    marginBottom: theme.spacing(4),
    fontSize: '1.25rem',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
  },
}));

const MainSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const slidesRef = collection(db, 'sliderImages');
        const q = query(slidesRef, orderBy('order'));
        const querySnapshot = await getDocs(q);
        
        const slidesList = [];
        querySnapshot.forEach((doc) => {
          slidesList.push({ id: doc.id, ...doc.data() });
        });
        
        setSlides(slidesList);
      } catch (error) {
        console.error('Error fetching slides:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);

  if (loading) {
    return <Box height="80vh" display="flex" justifyContent="center" alignItems="center">
      <Typography>Loading...</Typography>
    </Box>;
  }

  if (slides.length === 0) {
    return null; // Don't render anything if no slides
  }

  const currentSlideData = slides[currentSlide];

  return (
    <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <Slide $imageUrl={currentSlideData.imageUrl}>
        <SlideContent>
          {currentSlideData.title && (
            <Typography variant="h2" component="h1">
              {currentSlideData.title}
            </Typography>
          )}
          {currentSlideData.subtitle && (
            <Typography variant="subtitle1">
              {currentSlideData.subtitle}
            </Typography>
          )}
          {currentSlideData.buttonText && (
            <Button 
              component={RouterLink}
              to={currentSlideData.buttonRoute || '/products'}
              variant="contained" 
              color="primary" 
              size="large"
              sx={{
                mt: 2,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '50px',
                textTransform: 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {currentSlideData.buttonText}
            </Button>
          )}
        </SlideContent>
      </Slide>
      
      {/* Navigation Dots */}
      {slides.length > 1 && (
        <Box sx={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          zIndex: 3,
        }}>
          {slides.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentSlide(index)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: index === currentSlide ? 'primary.main' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MainSlider;
