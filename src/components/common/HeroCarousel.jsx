// src/components/common/HeroCarousel.jsx
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Fetch slides from Firestore with real-time updates
  useEffect(() => {
    const slidesRef = collection(db, 'sliderImages');
    const q = query(slidesRef, orderBy('order'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const slidesList = [];
      querySnapshot.forEach((doc) => {
        slidesList.push({ id: doc.id, ...doc.data() });
      });
      setSlides(slidesList);
    });

    return () => unsubscribe();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === slides.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        width: '100%', 
        height: isMobile ? '60vh' : '80vh',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: 3,
        mb: 4
      }}
    >
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${currentSlide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(4)
          }}
        >
          <Box 
            sx={{ 
              maxWidth: isMobile ? '100%' : '50%',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              p: 4,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 2
            }}
          >
            <Typography 
              variant={isMobile ? 'h4' : 'h3'} 
              component="h2" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              {currentSlide.title}
            </Typography>
            <Typography 
              variant={isMobile ? 'body1' : 'h6'} 
              paragraph
              sx={{ mb: 3 }}
            >
              {currentSlide.subtitle}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/products')}
            >
              {currentSlide.buttonText || 'Shop Now'}
            </Button>
          </Box>
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1
          }}
        >
          {slides.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? 'primary.main' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'primary.main'
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default HeroCarousel;