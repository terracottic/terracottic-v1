import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Grid, useTheme, useMediaQuery } from '@mui/material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const WorkshopSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [nextImageLoading, setNextImageLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState('');
    const slidesContainerRef = useRef(null);
    const [preloadedImages, setPreloadedImages] = useState([]);
    const timeoutRef = useRef(null);
    const [workshopData, setWorkshopData] = useState({
        title: 'Join Our Workshop',
        description: 'Learn the art of pottery from our master craftsmen. Create beautiful pieces with your own hands.',
        buttonText: 'Book Now',
        buttonLink: '/',
        slides: [
            {
                imageUrl: 'https://images.unsplash.com/photo-1587351021112-16bafbc6abf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
                alt: 'Pottery Workshop'
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
                alt: 'Clay Shaping'
            },
            {
                imageUrl: 'https://images.unsplash.com/photo-1587351021112-16bafbc6abf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
                alt: 'Pottery Wheel'
            }
        ]
    });
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch workshop data from Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'homepageSections', 'workshopSection'), (doc) => {
            if (doc.exists()) {
                setWorkshopData(doc.data());
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching workshop section:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Preload images
    useEffect(() => {
        if (!workshopData.slides) return;

        const loadImages = async () => {
            const promises = workshopData.slides.map((slide) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = slide.imageUrl;
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                });
            });

            const loadedImages = await Promise.all(promises);
            setPreloadedImages(loadedImages.filter(img => img !== null));
        };

        loadImages();
    }, [workshopData.slides]);

    const goToNextSlide = useCallback(() => {
        setNextImageLoading(true);
        setCurrentImage(workshopData.slides[(currentSlide + 1) % workshopData.slides.length]?.imageUrl);
        setTimeout(() => {
            setCurrentSlide(prev => (prev + 1) % workshopData.slides.length);
            setNextImageLoading(false);
        }, 100);
    }, [workshopData?.slides.length, currentSlide]);

    const goToPrevSlide = useCallback(() => {
        setNextImageLoading(true);
        setCurrentImage(workshopData.slides[(currentSlide - 1 + workshopData.slides.length) % workshopData.slides.length]?.imageUrl);
        setTimeout(() => {
            setCurrentSlide(prev => (prev - 1 + workshopData.slides.length) % workshopData.slides.length);
            setNextImageLoading(false);
        }, 100);
    }, [workshopData?.slides.length, currentSlide]);

    // Auto-advance slides
    useEffect(() => {
        if (!workshopData.slides || workshopData.slides.length <= 1 || isHovered) return;

        timeoutRef.current = setTimeout(() => {
            goToNextSlide();
            setImageLoaded(false);
        }, 5000);

        return () => clearTimeout(timeoutRef.current);
    }, [workshopData.slides, currentSlide, isHovered, goToNextSlide]);

    // Clear timeout on unmount
    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        setNextImageLoading(false);
    }, []);

    if (loading) {
        return (
            <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: 400, bgcolor: 'grey.200', borderRadius: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ height: 300, bgcolor: 'grey.200', borderRadius: 2 }} />
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{
            py: { xs: 6, md: 10 },
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
                <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={isMobile ? 'column' : 'row'}>
                    {/* Text Content - Right Side */}
                    <Grid item xs={12} md={6} sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        pl: { md: 6, xs: 0 },
                        mt: { xs: 4, md: 0 }
                    }}>
                        <Box sx={{
                            maxWidth: 600,
                            mx: { xs: 'auto', md: 0 },
                            ml: { md: -2 },
                            px: { xs: 2, sm: 4 },
                            textAlign: { xs: 'center', md: 'left' }
                        }}>
                            <Typography
                                variant="h3"
                                component="h2"
                                gutterBottom
                                sx={{
                                    fontWeight: 800,
                                    mb: 3,
                                    color: 'text.primary',
                                    fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                                    lineHeight: 1.2
                                }}
                            >
                                {workshopData.title}
                            </Typography>

                            <Typography
                                variant="body1"
                                color="text.secondary"
                                paragraph
                                sx={{
                                    mb: 4,
                                    fontSize: { xs: '1rem', md: '1.1rem' },
                                    lineHeight: 1.7,
                                    maxWidth: '90%',
                                    mx: { xs: 'auto', md: 0 }
                                }}
                            >
                                {workshopData.description}
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                justifyContent: { xs: 'center', md: 'flex-start' },
                                mt: 3
                            }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={() => navigate(workshopData.buttonLink)}
                                    sx={{
                                        px: 5,
                                        py: 1.5,
                                        borderRadius: '50px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '1.1rem',
                                        boxShadow: theme.shadows[4],
                                        '&:hover': {
                                            boxShadow: theme.shadows[8],
                                            transform: 'translateY(-2px)',
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                >
                                    {workshopData.buttonText}
                                </Button>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Image Slider - Hidden on mobile/tablet, visible on desktop */}
                    <Grid item xs={false} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            sx={{
                                position: 'relative',
                                width: 'calc(100% - 32px)',
                                maxWidth: '100%',
                                margin: '0 auto',
                                height: { xs: '250px', sm: '380px', md: '448px' },
                                [theme.breakpoints.up('sm')]: {
                                    width: '100%',
                                    height: '380px',
                                },
                                [theme.breakpoints.up('md')]: {
                                    height: '400px',
                                    padding: 0,
                                },
                                [theme.breakpoints.up('lg')]: {
                                    maxWidth: 673,
                                    height: '448px',
                                },
                                borderRadius: 4,
                                overflow: 'visible',
                                boxShadow: theme.shadows[2],
                                transform: 'translateZ(0)',
                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                '&:hover': {
                                    transform: 'translateY(-4px) scale(1.01)',
                                    boxShadow: theme.shadows[16],
                                    '& .slide-controls': {
                                        opacity: 1,
                                        transform: 'translateY(0)'
                                    }
                                },
                                [theme.breakpoints.down('sm')]: {
                                    maxWidth: '100%',
                                    borderRadius: 3,
                                    '&:hover': {
                                        transform: 'none',
                                        boxShadow: theme.shadows[8]
                                    }
                                }
                            }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                        overflow: 'hidden',
                                        borderRadius: '16px'
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: imageLoaded && !nextImageLoading ? 1 : 0.5,
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        opacity: { duration: 0.4, ease: 'easeInOut' }
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={workshopData.slides[currentSlide]?.imageUrl}
                                        alt={workshopData.slides[currentSlide]?.alt || 'Workshop'}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center',
                                            borderRadius: '16px',
                                            opacity: imageLoaded && !nextImageLoading ? 1 : 0,
                                            transition: 'opacity 0.4s ease-in-out',
                                            willChange: 'opacity, transform',
                                            backfaceVisibility: 'hidden',
                                            WebkitBackfaceVisibility: 'hidden',
                                            transform: 'translateZ(0)',
                                            backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                        }}
                                        onLoad={handleImageLoad}
                                        onError={(e) => {
                                            console.error('Error loading image:', e);
                                            setImageLoaded(true);
                                            setNextImageLoading(false);
                                        }}
                                    />
                                    {!imageLoaded && (
                                        <Box 
                                            sx={{ 
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                width: '100%', 
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: 'grey.50',
                                                borderRadius: '16px',
                                                zIndex: 1,
                                                overflow: 'hidden',
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: 'linear-gradient(45deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 100%)',
                                                    zIndex: -1
                                                }
                                            }}
                                        >
                                            <Box sx={{ 
                                                width: 40, 
                                                height: 40, 
                                                border: '3px solid', 
                                                borderColor: 'grey.300', 
                                                borderTopColor: 'primary.main', 
                                                borderRadius: '50%', 
                                                animation: 'spin 1s linear infinite' 
                                            }} />
                                        </Box>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Slide Indicators */}
                            {workshopData.slides.length > 1 && (
                                <Box 
                                    component={motion.div}
                                    initial={{ opacity: 1, y: 0 }}
                                    animate={{ 
                                        opacity: 1,
                                        y: 0
                                    }}
                                    sx={{
                                        position: 'absolute',
                                        bottom: 24,
                                        left: 0,
                                        right: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: 1.5,
                                        zIndex: 2,
                                        px: 2,
                                        '&:hover': {
                                            opacity: 1
                                        }
                                    }}
                                >
                                    {workshopData.slides.map((_, index) => (
                                        <Box
                                            key={index}
                                            onClick={() => {
                                                setCurrentSlide(index);
                                                setImageLoaded(false);
                                            }}
                                            sx={{
                                                width: currentSlide === index ? 32 : 12,
                                                height: 4,
                                                borderRadius: 2,
                                                bgcolor: currentSlide === index ? 'primary.main' : 'rgba(255, 255, 255, 0.3)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                transform: 'scale(1)',
                                                '&:hover': {
                                                    transform: currentSlide === index ? 'scaleX(1.1)' : 'scaleX(1.2)',
                                                    bgcolor: currentSlide === index ? 'primary.light' : 'rgba(255, 255, 255, 0.6)',
                                                    height: currentSlide === index ? 4 : 5
                                                },
                                                '&:active': {
                                                    transform: 'scaleX(0.95)'
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default WorkshopSection;
