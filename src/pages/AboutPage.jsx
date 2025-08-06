import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Avatar, 
  Chip, 
  Button,
  Card,
  CardContent,
  CardMedia,
  useMediaQuery,
  useTheme,
  Grow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CheckCircle, 
  EmojiNature, 
  Brush, 
  Stars, 
  Public,
  History,
  LightbulbOutlined,
  LinkedIn,
  Email,
  ArrowForward,
  ArrowDownward,
  ArrowUpward
} from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  marginBottom: theme.spacing(6),
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #A67C52 0%, #D4A76A 100%)',
  }
}));

const SectionTitle = ({ children }) => (
  <Typography variant="h3" sx={{
    textAlign: 'center',
    mb: 6,
    color: '#5D4037',
    fontWeight: 800,
    position: 'relative',
    '&:after': {
      content: '""',
      display: 'block',
      width: '80px',
      height: '4px',
      background: '#A67C52',
      margin: '20px auto 0',
      borderRadius: '2px'
    }
  }}>
    {children}
  </Typography>
);

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)'
  }
}));

const AboutPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });
  
  const founders = [
    {
      name: 'Asu',
      role: 'Co-Founder & Creative Director',
      description: 'A visionary artist with a deep-rooted passion for preserving traditional Indian craftsmanship. With over 15 years of experience in terracotta art, Asu combines ancestral techniques with contemporary design, ensuring each piece tells a story of cultural heritage and modern elegance.',
      image: '/src/assets/images/asu.jpg',
      vision: 'To revive and celebrate India\'s rich terracotta heritage while empowering artisan communities through sustainable practices.'
    },
    {
      name: 'Shaik Mohammed Farhaan',
      role: 'Co-Founder & CEO',
      description: 'A dynamic entrepreneur with a keen eye for business and innovation. Son of the esteemed Dr. M. Taaj Basha, Farhaan brings strategic vision and operational excellence, driving Terracottic to bridge traditional craftsmanship with global markets.',
      image: '/src/assets/images/farhaan.jpg',
      vision: 'To establish Terracottic as a global benchmark for sustainable, handcrafted terracotta art while creating meaningful livelihoods for rural artisans.'
    }
  ];
  
  const features = [
    {
      icon: <EmojiNature fontSize="large" />,
      title: 'Handcrafted Excellence',
      text: 'Each piece is meticulously crafted by skilled artisans using traditional techniques passed down through generations, ensuring exceptional quality and authenticity.',
      bgColor: 'rgba(139, 195, 74, 0.1)'
    },
    {
      icon: <Brush fontSize="large" />,
      title: 'Timeless Design',
      text: 'Our designs blend traditional aesthetics with contemporary sensibilities, creating pieces that are both culturally rich and modern in appeal.',
      bgColor: 'rgba(255, 167, 38, 0.1)'
    },
    {
      icon: <Public fontSize="large" />,
      title: 'Eco-Conscious',
      text: 'We use sustainable, natural materials and eco-friendly processes to minimize our environmental impact and promote responsible consumption.',
      bgColor: 'rgba(38, 166, 154, 0.1)'
    },
    {
      icon: <Stars fontSize="large" />,
      title: 'Artisan Empowerment',
      text: 'We work directly with artisans, providing fair wages, skill development, and a platform to showcase their craft to the world.',
      bgColor: 'rgba(171, 71, 188, 0.1)'
    }
  ];
  
  const impactStats = [
    { value: '50+', label: 'Skilled Artisans Empowered' },
    { value: '500+', label: 'Unique Creations' },
    { value: '15+', label: 'Villages Impacted' },
    { value: '100%', label: 'Natural Materials' }
  ];

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      // Better text rendering
      textRendering: 'optimizeLegibility',
      // Smooth scrolling for mobile
      scrollBehavior: 'smooth',
      // Add horizontal padding
      px: { xs: 2, sm: 3, md: 4 },
      '& *': {
        maxWidth: '100%',
        boxSizing: 'border-box',
        // Better tap targets
        WebkitTapHighlightColor: 'transparent'
      },
      // Better touch targets for mobile
      '& button, & [role="button"], & a': {
        minHeight: '44px',
        minWidth: '44px',
        // Better touch feedback
        transition: 'all 0.2s ease',
        '&:active': {
          transform: 'scale(0.98)'
        }
      }
    }}>
      <Box component="main" sx={{ 
        width: '100%',
        // Subtle background pattern that's light on mobile
        backgroundImage: {
          xs: 'none',
          sm: 'radial-gradient(rgba(166, 124, 82, 0.1) 1px, transparent 1px)'
        },
        backgroundSize: '20px 20px',
        // Better mobile experience
        WebkitOverflowScrolling: 'touch',
        // Smooth page transitions
        animation: 'fadeIn 0.6s ease-out',
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        // Mobile optimizations
        '@media (max-width: 600px)': {
          '& > section:nth-of-type(odd)': {
            backgroundColor: 'rgba(255, 248, 240, 0.5)'
          },
          // Better spacing and centering for mobile
          '& > section': {
            py: 6,
            px: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            '&:first-of-type': {
              pt: 8,
              pb: 6,
              '& .MuiContainer-root': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                '& > *': {
                  maxWidth: '100%',
                  width: '100%',
                  textAlign: 'center',
                  '&.MuiGrid-container': {
                    justifyContent: 'center'
                  }
                }
              }
            },
            '&:last-child': {
              pb: 12
            },
            // Center all direct children
            '& > *': {
              maxWidth: '100%',
              width: '100%',
              textAlign: 'center',
              '&.MuiGrid-container': {
                justifyContent: 'center',
                '& .MuiGrid-item': {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  '& > *': {
                    maxWidth: '100%',
                    width: '100%',
                    textAlign: 'center'
                  }
                }
              }
            }
          },
          // Better typography for mobile
          '& h2': {
            fontSize: '1.8rem !important',
            lineHeight: 1.3,
            mb: 3,
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '3px',
              backgroundColor: '#A67C52',
              borderRadius: '3px'
            }
          },
          // Better card styles for mobile
          '& .MuiCard-root': {
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid rgba(166, 124, 82, 0.1)',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: '0 12px 30px rgba(166, 124, 82, 0.15)'
            },
            // Card hover effect for mobile
            '@media (hover: none)': {
              '&:active': {
                transform: 'scale(0.98)'
              }
            }
          },
          // Better button styles
          '& .MuiButton-contained': {
            borderRadius: '30px',
            padding: '12px 32px',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.5px',
            background: 'linear-gradient(45deg, #A67C52 30%, #8B5E3C 90%)',
            boxShadow: '0 4px 15px rgba(166, 124, 82, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, #8B5E3C 30%, #A67C52 90%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              zIndex: 1
            },
            '& span': {
              position: 'relative',
              zIndex: 2
            },
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(166, 124, 82, 0.5)',
              '&:before': {
                opacity: 1
              }
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: '0 2px 10px rgba(166, 124, 82, 0.4)'
            }
          }
        }
      }}>
        {/* Hero Section */}
        <Box component="section" sx={{ 
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 6, sm: 12, md: 16 },
          px: { xs: 3, sm: 3, md: 4 },
          // Mobile optimizations
          '@media (max-width: 600px)': {
            '& h1': {
              fontSize: '2.2rem !important',
              lineHeight: 1.2,
              mb: 2
            },
            '& .MuiTypography-h5': {
              fontSize: '1.1rem !important',
              lineHeight: 1.6
            }
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '5%',
            right: '5%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(166, 124, 82, 0.2), transparent)'
          },
          background: 'linear-gradient(135deg, rgba(255,248,240,0.8) 0%, rgba(255,255,255,0.9) 100%)',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/clay-texture.png")',
            opacity: 0.05,
            zIndex: 0
          }
        }}>
          {/* Decorative Elements */}
          <Box sx={{
            position: 'absolute',
            top: { xs: '-5%', sm: '-10%' },
            right: { xs: '-10%', sm: '5%' },
            width: { xs: '200px', sm: '300px' },
            height: { xs: '200px', sm: '300px' },
            '@media (max-width: 600px)': {
              opacity: 0.6
            },
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(166,124,82,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 0,
            animation: 'pulse 8s infinite alternate'
          }} />
          
          <Box sx={{
            position: 'absolute',
            bottom: '-15%',
            left: '3%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,90,43,0.08) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 0,
            animation: 'pulse 10s 2s infinite alternate'
          }} />
          
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ 
              textAlign: 'center',
              maxWidth: '1000px',
              mx: 'auto',
              position: 'relative',
              '&:before, &:after': {
                content: '"✻"',
                position: 'absolute',
                color: '#A67C52',
                fontSize: '2rem',
                opacity: 0.6,
                animation: 'float 3s ease-in-out infinite',
                display: { xs: 'none', md: 'block' }
              },
              '&:before': {
                left: 0,
                top: '20%',
                animationDelay: '0.5s'
              },
              '&:after': {
                right: 0,
                bottom: '10%',
                animationDelay: '1s'
              }
            }}>
              <Typography 
                variant="h1" 
                sx={{
                  fontWeight: 900,
                  color: '#5D4037',
                  mb: 3,
                  fontSize: { 
                    xs: '2.5rem', 
                    sm: '3.5rem', 
                    md: '4.5rem',
                    lg: '5rem',
                    xl: '5.5rem'
                  },
                  lineHeight: 1.1,
                  textShadow: '2px 2px 0 rgba(255,255,255,0.5)',
                  position: 'relative',
                  display: 'inline-block',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '10px',
                    left: '5%',
                    right: '5%',
                    height: '15px',
                    background: 'rgba(166, 124, 82, 0.2)',
                    zIndex: -1,
                    borderRadius: '50%',
                    filter: 'blur(4px)'
                  }
                }}
              >
                Crafting Stories
                <Box component="span" sx={{ 
                  display: 'inline-block',
                  color: '#A67C52',
                  position: 'relative',
                  '&:before': {
                    content: '"in"',
                    position: 'absolut',
                    top: '-0.5em',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '1em',
                    fontWeight: 400,
                    color: 'rgba(166, 124, 82, 0.8)'
                  }
                }}> Clay </Box>
              </Typography>
              
              <Typography 
                variant="h4" 
                sx={{
                  color: 'text.secondary',
                  maxWidth: '800px',
                  mx: 'auto',
                  mb: 2,
                  fontWeight: 400,
                  fontSize: { 
                    xs: '1.1rem', 
                    sm: '1.2rem',
                    md: '1.3rem',
                    lg: '1.4rem' 
                  },
                  lineHeight: 1.6,
                  position: 'relative',
                  '&:before, &:after': {
                    content: '"❝"',
                    fontSize: '2rem',
                    color: '#A67C52',
                    opacity: 0.3,
                    lineHeight: 0,
                    verticalAlign: 'middle',
                    display: 'inline-block',
                    transform: 'translateY(-0.5em)',
                    mx: 1
                  },
                  '&:after': {
                    content: '"❞"',
                    transform: 'translateY(0.5em)'
                  }
                }}
              >
                We don't just create pottery, we shape legacies from the very soil
              </Typography>
              
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: { xs: 3, sm: 4, md: 5 },
                mt: { xs: 6, sm: 8, md: 10 },
                mb: { xs: 4, sm: 6 },
                '& > *': {
                  flex: '1 1 auto',
                  maxWidth: { xs: '140px', sm: '160px', md: '180px' },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  opacity: 0,
                  transform: 'translateY(20px)',
                },

                '& > *:nth-of-type(1)': { animationDelay: '0.3s' },
                '& > *:nth-of-type(2)': { animationDelay: '0.6s' },
                '& > *:nth-of-type(3)': { animationDelay: '0.9s' },
              }}>
                {[
                  { 
                    icon: <EmojiNature sx={{ 
                      fontSize: '2.5rem',
                      color: '#8B5A2B',
                      transition: 'all 0.3s ease'
                    }} />, 
                    text: 'Handcrafted' 
                  },
                  { 
                    icon: <Brush sx={{ 
                      fontSize: '2.5rem',
                      color: '#8B5A2B',
                      transition: 'all 0.3s ease'
                    }} />, 
                    text: 'Unique Designs' 
                  },
                  { 
                    icon: <Public sx={{ 
                      fontSize: '2.5rem',
                      color: '#8B5A2B',
                      transition: 'all 0.3s ease'
                    }} />, 
                    text: 'Eco-Friendly' 
                  }
                ].map((item, index) => (
                  <Box key={index} sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                    minWidth: { xs: '110px', sm: '130px' },
                    '&:hover': {
                      '& .icon-wrapper': {
                        transform: 'translateY(-5px) rotate(5deg)'
                      }
                    }
                  }}>
                    <Box className="icon-wrapper" sx={{
                      width: { xs: '80px', sm: '90px', md: '100px' },
                      height: { xs: '80px', sm: '90px', md: '100px' },
                      borderRadius: '24px',
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      boxShadow: '0 5px 15px rgba(166, 124, 82, 0.15)',
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      border: '2px solid rgba(166, 124, 82, 0.2)',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: '0 10px 25px rgba(166, 124, 82, 0.25)',
                        '& svg': {
                          transform: 'scale(1.2)'
                        }
                      }
                    }}>
                      {item.icon}
                    </Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600,
                      color: '#5D4037',
                      mt: 1
                    }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              <Box sx={{
                mt: 6,
                display: 'flex',
                justifyContent: 'center',
                animation: 'fadeIn 1s 1.2s forwards',
                opacity: 0
              }}>
                <Box sx={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '2px solid rgba(166, 124, 82, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  animation: 'bounce 2s infinite',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#A67C52',
                    transform: 'scale(1.1)'
                  },
                  '& svg': {
                    color: '#A67C52',
                    fontSize: '1.5rem',
                    animation: 'pulse 2s infinite'
                  }
                }} 
                onClick={() => document.getElementById('our-story')?.scrollIntoView({ behavior: 'smooth' })}>
                  <ArrowDownward />
                </Box>
              </Box>
            </Box>
          </Container>
          
          {/* Global Animations */}
          <style>
            {`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0% { transform: scale(1); opacity: 0.7; }
              100% { transform: scale(1.1); opacity: 0.9; }
            }
            @keyframes fadeInUp {
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
              to { opacity: 1; }
            }
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
            }
            `}
          </style>
        </Box>

        {/* Story Section */}
        <Box id="our-story" sx={{ 
          mb: 10, 
          scrollMarginTop: '80px',
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          '& .MuiContainer-root': {
            px: { xs: 2, sm: 3, md: 4 },
            maxWidth: '100%',
            width: '100%'
          },
          '@media (max-width: 600px)': {
            px: 2,
            '& .MuiContainer-root': {
              px: 2
            }
          }
        }}>
          <Box sx={{ 
            textAlign: 'center',
            mb: { xs: 4, md: 6 },
            '& h2': {
              display: 'inline-block',
              position: 'relative',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '3px',
                backgroundColor: '#A67C52',
                borderRadius: '3px'
              }
            }
          }}>
            <SectionTitle>Our Journey</SectionTitle>
          </Box>
          
          <Grid container spacing={6} alignItems="center" sx={{ 
            mb: 8,
            width: '100%',
            mx: 'auto',
            '& .MuiGrid-item': {
              px: { xs: 0, sm: 3, md: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            },
            '@media (max-width: 600px)': {
              flexDirection: 'column',
              '& .MuiGrid-item': {
                px: 2,
                width: '100%',
                maxWidth: '100%',
                '& > *': {
                  width: '100%',
                  maxWidth: '100%',
                  textAlign: 'center'
                }
              }
            }
          }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                '&:hover img': {
                  transform: 'scale(1.03)'
                }
              }}>
                <Box
                  component="img"
                  src="https://i.postimg.cc/PJ7f1MS2/wmremove-transformed.png"
                  alt="Terracottic Artisans at Work"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'transform 0.5s ease',
                    borderRadius: '16px'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                pl: { md: 4 },
                '& > * + *': { mt: 3 }
              }}>
                <Typography variant="h3" sx={{ 
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: '#5D4037',
                  lineHeight: 1.2,
                  mb: 3
                }}>
                  The Terracottic Story: Where Earth Meets Art
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  color: 'text.secondary',
                  mb: 2
                }}>
                  In the heart of India's rich cultural landscape, Terracottic was born from a simple yet profound vision: 
                  to revive and celebrate the ancient art of terracotta craftsmanship while creating sustainable livelihoods 
                  for rural artisans.
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  color: 'text.secondary',
                  mb: 2
                }}>
                  Founded in 2020 by Asu and Shaik Mohammed Farhaan, Terracottic began as a humble initiative to preserve 
                  traditional Indian craftsmanship that was slowly fading into obscurity. What started as a small workshop 
                  has now blossomed into a movement that celebrates India's rich artistic heritage while embracing 
                  contemporary design sensibilities.
                </Typography>
                
                <Box sx={{ 
                  bgcolor: 'rgba(166, 124, 82, 0.1)',
                  p: 3,
                  borderRadius: '12px',
                  borderLeft: '4px solid #A67C52',
                  mt: 4
                }}>
                  <Typography variant="h6" sx={{ 
                    fontStyle: 'italic', 
                    color: '#5D4037',
                    fontWeight: 600,
                    lineHeight: 1.6
                  }}>
                    "Our journey is not just about creating beautiful objects; it's about preserving traditions, 
                    empowering communities, and telling stories through the timeless medium of clay."
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {/* Mission & Vision */}
          <Grid container spacing={6} sx={{ mb: 10 }}>
            <Grid item xs={12} md={6}>
              <StyledPaper elevation={0}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  color: '#A67C52'
                }}>
                  <History sx={{ fontSize: '2.5rem', mr: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>Our Mission</Typography>
                </Box>
                <Typography variant="body1" sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  color: 'text.secondary'
                }}>
                  To create not just products, but experiences — pieces that speak to the soul, honor the earth, and last a lifetime. 
                  We are committed to preserving traditional craftsmanship while innovating for the future, ensuring that each 
                  piece tells a story of cultural heritage and sustainable luxury.
                </Typography>
                
                <Box sx={{ mt: 4 }}>
                  {[
                    'Empower traditional artisans with modern reach and fair wages',
                    'Preserve and revive cultural heritage through functional art',
                    'Deliver globally while staying rooted in our values',
                    'Set the highest benchmark in quality, ethics, and design'
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <CheckCircle color="primary" sx={{ mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                      <Typography variant="body1">{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </StyledPaper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledPaper elevation={0}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  color: '#A67C52'
                }}>
                  <Stars sx={{ fontSize: '2.5rem', mr: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>Our Vision</Typography>
                </Box>
                <Typography variant="body1" sx={{ 
                  fontSize: '1.1rem', 
                  lineHeight: 1.8,
                  color: 'text.secondary'
                }}>
                  To establish Terracottic as a global benchmark for sustainable, handcrafted terracotta art while creating meaningful 
                  livelihoods for rural artisans. We envision a world where traditional craftsmanship thrives alongside modern 
                  design, where every piece tells a story and every purchase makes a difference.
                </Typography>
                
                <Box sx={{ 
                  mt: 4,
                  p: 3,
                  bgcolor: 'rgba(166, 124, 82, 0.05)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #A67C52'
                }}>
                  <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#5D4037' }}>
                    "We believe in creating a future where art sustains lives and traditions flourish across generations."
                  </Typography>
                </Box>
              </StyledPaper>
            </Grid>
          </Grid>
        </Box>

        {/* What Makes Us Unique */}
        <Box sx={{ mb: 12 }}>
          <SectionTitle>What Makes Us Unique</SectionTitle>
          
          <Typography variant="h5" sx={{
            textAlign: 'center',
            maxWidth: '800px',
            mx: 'auto',
            mb: 6,
            color: 'text.secondary',
            fontSize: '1.25rem',
            lineHeight: 1.7,
            px: 2
          }}>
            At Terracottic, we don't just create products – we create experiences that connect people with the rich heritage 
            of Indian craftsmanship. Here's what sets us apart:
          </Typography>
          
          <Grid container spacing={4} sx={{ mb: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <FeatureCard>
                  <CardContent sx={{ 
                    p: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:last-child': { pb: 0 }
                  }}>
                    <Box sx={{ 
                      background: `linear-gradient(135deg, ${feature.bgColor} 0%, rgba(255,255,255,0.8) 100%)`,
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      mb: 3,
                      borderRadius: '12px 12px 0 0',
                      borderBottom: '2px solid rgba(166, 124, 82, 0.1)'
                    }}>
                      <Box sx={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        bgcolor: 'white',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}>
                        {React.cloneElement(feature.icon, { 
                          sx: { 
                            fontSize: '2.2rem',
                            transition: 'all 0.3s ease'
                          } 
                        })}
                      </Box>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 700,
                        color: '#5D4037',
                        mb: 0
                      }}>
                        {feature.title}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      p: 3,
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <Typography variant="body1" sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.8,
                        mb: 3,
                        flexGrow: 1
                      }}>
                        {feature.text}
                      </Typography>
                      
                      <Box sx={{ 
                        mt: 'auto',
                        pt: 2,
                        borderTop: '1px dashed rgba(0,0,0,0.1)'
                      }}>
                        <Button 
                          endIcon={<ArrowForward />}
                          sx={{
                            textTransform: 'none',
                            color: '#8B5A2B',
                            p: 0,
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: '#5D4037',
                              '& .MuiButton-endIcon': {
                                transform: 'translateX(4px)'
                              }
                            },
                            '& .MuiButton-endIcon': {
                              transition: 'transform 0.3s ease'
                            }
                          }}
                        >
                          Learn more
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
          
          {/* Impact Stats */}
          <Box sx={{ 
            bgcolor: 'rgba(166, 124, 82, 0.05)',
            borderRadius: '16px',
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            mb: 6
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mb: 6,
              color: '#5D4037',
              position: 'relative',
              '&:after': {
                content: '""',
                display: 'block',
                width: '80px',
                height: '4px',
                background: '#A67C52',
                margin: '20px auto 0',
                borderRadius: '2px'
              }
            }}>
              Our Impact
            </Typography>
            
            <Grid container spacing={4}>
              {impactStats.map((stat, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Box sx={{ 
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800,
                      color: '#8B5A2B',
                      mb: 1,
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      lineHeight: 1.2
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'text.secondary',
                      fontSize: '1rem'
                    }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Founders CTA Section */}
        <Box sx={{ 
          py: 8,
          background: 'linear-gradient(180deg, rgba(255,248,240,0.8) 0%, rgba(255,255,255,0.9) 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/texture-light.png")',
            opacity: 0.1,
            zIndex: 0
          }
        }}>
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              mb: 3,
              color: '#5D4037',
              fontSize: { xs: '2rem', md: '2.75rem' },
              lineHeight: 1.2
            }}>
              Meet Our Visionary Founders
            </Typography>
            
            <Typography variant="h6" sx={{ 
              color: 'text.secondary',
              maxWidth: '800px',
              mx: 'auto',
              mb: 6,
              fontSize: '1.25rem',
              lineHeight: 1.7,
              fontWeight: 400
            }}>
              Discover the passionate individuals behind Terracottic who are dedicated to preserving India's rich terracotta heritage while empowering artisan communities.
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/founders')}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '50px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(166, 124, 82, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(166, 124, 82, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Meet Our Founders
            </Button>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box sx={{ 
          bgcolor: 'primary.main',
          borderRadius: '16px',
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          mb: 8,
          background: 'linear-gradient(135deg, #A67C52 0%, #8B5A2B 100%)',
          boxShadow: '0 10px 40px rgba(166, 124, 82, 0.3)'
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h3" sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
              lineHeight: 1.2
            }}>
              Ready to Experience the Art of Terracotta?
            </Typography>
            <Typography variant="h6" sx={{
              maxWidth: '700px',
              mx: 'auto',
              mb: 4,
              fontWeight: 400,
              opacity: 0.9,
              fontSize: '1.2rem',
              lineHeight: 1.7
            }}>
              Discover our exclusive collection of handcrafted terracotta pieces that blend traditional craftsmanship with contemporary design.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/products')}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: '50px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                bgcolor: 'white',
                color: '#8B5A2B',
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-2px)',
                  bgcolor: '#f5f5f5'
                }
              }}
            >
              Shop Now
            </Button>
          </Box>
          
          {/* Decorative elements */}
          <Box sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            zIndex: 0
          }} />
        </Box>
      </Box>
    </Box>
  );
};

export default AboutPage;
