import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Container, Grid, Card, CardContent, CardMedia, 
  CardActions, Chip, useTheme, useMediaQuery, Divider, Paper, IconButton, Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import { db } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { CalendarMonth, AccessTime, LocationOn, People, ArrowForward, ArrowBack } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Helmet } from 'react-helmet-async';

// Styled Components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/images/workshop-hero.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  padding: theme.spacing(15, 2),
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(10, 2),
  },
}));

const WorkshopCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
}));

const WorkshopPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample workshop data
  const sampleWorkshops = [
    {
      id: '1',
      title: 'Beginner\'s Pottery Workshop',
      description: 'Learn the basics of pottery in this hands-on workshop. Perfect for beginners!',
      date: '2025-09-15',
      time: '10:00 AM - 1:00 PM',
      location: 'MittiCraft Studio, Bangalore',
      price: 2500,
      image: '/images/workshop1.jpg',
      capacity: 15,
      available: 8,
      category: 'beginner'
    },
    {
      id: '2',
      title: 'Advanced Wheel Throwing',
      description: 'Master the art of wheel throwing with our expert potters. Previous experience required.',
      date: '2025-09-20',
      time: '2:00 PM - 5:00 PM',
      location: 'MittiCraft Studio, Bangalore',
      price: 3500,
      image: '/images/workshop2.jpg',
      capacity: 10,
      available: 4,
      category: 'advanced'
    },
    {
      id: '3',
      title: 'Kids Pottery Camp',
      description: 'A fun and creative pottery experience designed especially for children aged 8-14.',
      date: '2025-09-25',
      time: '9:30 AM - 12:30 PM',
      location: 'MittiCraft Studio, Bangalore',
      price: 2000,
      image: '/images/workshop3.jpg',
      capacity: 12,
      available: 12,
      category: 'kids'
    },
  ];

  useEffect(() => {
    // In a real app, fetch workshops from Firestore
    const fetchWorkshops = async () => {
      try {
        // TODO: Uncomment and implement Firestore fetch
        // const querySnapshot = await getDocs(collection(db, 'workshops'));
        // const workshopsList = querySnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data()
        // }));
        // setWorkshops(workshopsList);
        
        setWorkshops(sampleWorkshops);
      } catch (error) {
        console.error('Error fetching workshops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  const handleBookNow = (workshopId) => {
    navigate(`/workshops/${workshopId}/book`);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === workshops.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? workshops.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading workshops...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pottery Workshops | MittiCraft</title>
        <meta name="description" content="Join our pottery workshops and learn from master craftsmen. Perfect for all skill levels." />
      </Helmet>

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant={isMobile ? 'h4' : 'h2'} 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                mb: 3,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              Discover the Art of Pottery
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => document.getElementById('workshops').scrollIntoView({ behavior: 'smooth' })}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: '50px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
              }}
            >
              View Upcoming Workshops
            </Button>
          </motion.div>
        </Container>
      </HeroSection>

      {/* Workshops Grid */}
      <Container id="workshops" maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 6, textAlign: 'center', fontWeight: 700 }}>
          Upcoming Workshops
        </Typography>
        
        <Grid container spacing={4}>
          {workshops.map((workshop) => (
            <Grid item xs={12} md={4} key={workshop.id}>
              <WorkshopCard>
                <CardMedia
                  component="img"
                  height="200"
                  image={workshop.image}
                  alt={workshop.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Chip 
                    label={workshop.category} 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 2 }}
                  />
                  <Typography gutterBottom variant="h6" component="h3">
                    {workshop.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {workshop.description}
                  </Typography>
                  
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarMonth fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {new Date(workshop.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">{workshop.time}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">{workshop.location}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <People fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {workshop.available} of {workshop.capacity} spots left
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mt: 2 }}>
                    ₹{workshop.price.toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={() => handleBookNow(workshop.id)}
                    disabled={workshop.available === 0}
                  >
                    {workshop.available > 0 ? 'Book Now' : 'Sold Out'}
                  </Button>
                </CardActions>
              </WorkshopCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default WorkshopPage;
