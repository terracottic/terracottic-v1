import React from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Button,
    Chip,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { Email, ContentCopy } from '@mui/icons-material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Tooltip, Snackbar, Alert } from '@mui/material';

const StyledPaper = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: '16px',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 15px 40px rgba(0,0,0,0.12)'
    }
}));

const founders = [
    {
        name: 'Asu',
        fullName: 'Asit Kumbhakar',
        role: 'Co-Founder & Creative Director',
        description: 'A visionary artist with a deep-rooted passion for preserving traditional Indian craftsmanship. Son of the esteemed Buddhadeb, Asu brings forth a legacy of artistic brilliance. With over 15 years of experience in terracotta art, he combines ancestral techniques with contemporary design — ensuring each piece tells a story of cultural heritage and modern elegance.',
        image: '/src/assets/images/asu.jpg',
        vision: 'To revive and celebrate India\'s rich terracotta heritage while empowering artisan communities through sustainable practices.'
    },
    {
        name: 'Farhaan',
        fullName: 'Shaik Mohammed Farhaan',
        role: 'Co-Founder & CEO',
        description: 'A dynamic entrepreneur with a keen eye for business and innovation. Son of the esteemed Dr. M. Taaj Basha, Farhaan brings strategic vision and operational excellence. With a deep respect for cultural roots, he empowers Terracottic to bridge timeless craftsmanship with global markets through bold leadership and modern thinking.',
        image: '/src/assets/images/farhaan.jpg',
        vision: 'To establish Terracottic as a global benchmark for sustainable, handcrafted terracotta art while creating meaningful livelihoods for rural artisans.'
    }
];

const FoundersPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [copiedEmail, setCopiedEmail] = useState('');

    const getEmailLink = (founderName) => {
        const email = founderName === 'Asu' 
            ? 'asitkumbhakar144@gmail.com' 
            : 'farhaanthegenius@gmail.com';
        
        const subject = encodeURIComponent('Inquiry from Terracottic Website');
        const body = encodeURIComponent('Hello,\n\nI would like to inquire about...');
        return `mailto:${email}?subject=${subject}&body=${body}`;
    };
    
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ py: 8 }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h3" sx={{
                        fontWeight: 800,
                        mb: 3,
                        color: '#5D4037',
                        fontSize: { xs: '2rem', md: '2.75rem' },
                        lineHeight: 1.2
                    }}>
                        The Visionaries Behind Terracottic
                    </Typography>
                    <Typography variant="h6" sx={{
                        color: 'text.secondary',
                        maxWidth: '800px',
                        mx: 'auto',
                        fontSize: '1.25rem',
                        lineHeight: 1.7,
                        fontWeight: 400
                    }}>
                        Meet the passionate individuals who transformed a shared vision into a movement that celebrates India's rich terracotta heritage
                    </Typography>
                </Box>

                <Grid container spacing={{ xs: 6, md: 8 }} justifyContent="center" alignItems="stretch">
                    {founders.map((founder, index) => (
                        <Grid item xs={12} md={5} key={index} sx={{ display: 'flex' }}>
                            <StyledPaper sx={{
                                p: { xs: 3, sm: 4, md: 5 },
                                height: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'visible',
                                background: 'rgba(255, 255, 255, 0.85)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                    borderColor: 'rgba(255, 255, 255, 0.4)'
                                }
                            }}>
                                {/* Circular Image */}
                                <Box sx={{
                                    width: { xs: '180px', sm: '200px', md: '220px' },
                                    height: { xs: '180px', sm: '200px', md: '220px' },
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '6px solid #fff',
                                    boxShadow: '0 10px 30px rgba(139, 90, 43, 0.15)',
                                    mb: 3,
                                    position: 'relative',
                                    zIndex: 1,
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0 15px 35px rgba(139, 90, 43, 0.25)'
                                    },
                                    '&:before, &:after': {
                                        content: '""',
                                        position: 'absolute',
                                        borderRadius: '50%',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(45deg, #8B5A2B, #D2B48C, #8B5A2B)',
                                        backgroundSize: '200% 200%',
                                        animation: 'gradient 8s ease infinite',
                                        zIndex: -1,
                                        opacity: 0.8,
                                        transition: 'all 0.5s ease',
                                    },
                                    '&:after': {
                                        background: 'linear-gradient(45deg, #D2B48C, #8B5A2B, #D2B48C)',
                                        animation: 'gradient 8s ease infinite reverse',
                                        opacity: 0
                                    },
                                    '&:hover:before': {
                                        opacity: 0,
                                        transform: 'scale(1.1)'
                                    },
                                    '&:hover:after': {
                                        opacity: 0.8,
                                        transform: 'scale(1.1)'
                                    },
                                    '@keyframes gradient': {
                                        '0%': { backgroundPosition: '0% 50%' },
                                        '50%': { backgroundPosition: '100% 50%' },
                                        '100%': { backgroundPosition: '0% 50%' }
                                    }
                                }}>
                                    <Box
                                        component="img"
                                        src={founder.image}
                                        alt={founder.name}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'top center',
                                            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                            filter: 'grayscale(20%)',
                                            '&:hover': {
                                                transform: 'scale(1.03)',
                                                filter: 'grayscale(0%) brightness(1.05)',
                                            }
                                        }}
                                    />
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '40%',
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: 2,
                                        opacity: 0,
                                        transition: 'all 0.5s ease',
                                        '&:hover': {
                                            opacity: 1
                                        }
                                    }}>
                                        <Chip
                                            label="Co-Founder"
                                            size="small"
                                            sx={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                color: '#5D4037',
                                                fontWeight: 600,
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                '& .MuiChip-label': {
                                                    px: 2,
                                                    py: 0.5
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>
                                {/* Content */}
                                <Box sx={{ width: '100%', mt: 2 }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ 
                                            position: 'relative',
                                            display: 'inline-block',
                                            mb: 1
                                        }}>
                                            <Typography 
                                                variant="h5" 
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#5D4037',
                                                    mb: 0,
                                                    fontSize: '1.8rem',
                                                    lineHeight: 1.2,
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                    '&:after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        width: '0%',
                                                        height: '3px',
                                                        bottom: -5,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        backgroundColor: '#A67C52',
                                                        transition: 'width 0.3s ease-in-out'
                                                    },
                                                    '&:hover': {
                                                        '&:after': {
                                                            width: '80%'
                                                        }
                                                    }
                                                }}
                                            >
                                                {founder.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mt: 0.5, mb: 2, whiteSpace: 'nowrap', overflow: 'visible' }}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{
                                                    color: '#8B5A2B',
                                                    fontWeight: 500,
                                                    fontSize: '1.1rem',
                                                    letterSpacing: '1px',
                                                    position: 'relative',
                                                    display: 'inline-block',
                                                    padding: '0 4px 4px',
                                                    '&:after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        width: '0%',
                                                        height: '2px',
                                                        bottom: 0,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        backgroundColor: '#A67C52',
                                                        transition: 'all 0.3s ease-in-out',
                                                    },
                                                    '&:hover': {
                                                        color: '#6E4C34',
                                                        '&:after': {
                                                            width: '100%',
                                                            height: '1px',
                                                            backgroundColor: '#8B5A2B',
                                                        },
                                                        '& .name-text': {
                                                            background: 'linear-gradient(45deg, #8B5A2B, #A67C52)',
                                                            WebkitBackgroundClip: 'text',
                                                            WebkitTextFillColor: 'transparent',
                                                            fontWeight: 600,
                                                        }
                                                    },
                                                }}
                                            >
                                                <span className="name-text">
                                                    {founder.fullName}
                                                </span>
                                            </Typography>
                                        </Box>

                                        <Chip
                                            label={founder.role}
                                            color="primary"
                                            variant="outlined"
                                            size="medium"
                                            sx={{
                                                mb: 2,
                                                fontWeight: 500,
                                                borderColor: 'rgba(166, 124, 82, 0.3)',
                                                color: '#8B5A2B',
                                                backgroundColor: 'rgba(166, 124, 82, 0.05)'
                                            }}
                                        />

                                        <Typography variant="body1" sx={{
                                            color: 'text.secondary',
                                            mb: 3,
                                            lineHeight: 1.7,
                                            fontSize: '1rem'
                                        }}>
                                            {founder.description}
                                        </Typography>

                                        <Box sx={{ 
                                            mt: 3,
                                            pt: 3,
                                            borderTop: '1px dashed rgba(0,0,0,0.08)',
                                            backgroundColor: 'rgba(255, 251, 245, 0.5)',
                                            mx: { xs: -3, md: -5 },
                                            mb: { xs: -3, md: -5 },
                                            px: { xs: 3, md: 5 },
                                            pb: 3,
                                            borderBottomLeftRadius: '12px',
                                            borderBottomRightRadius: '12px'
                                        }}>
                                            <Typography variant="subtitle2" sx={{
                                                color: '#8B5A2B',
                                                fontWeight: 600,
                                                mb: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                justifyContent: 'center',
                                                fontSize: '1rem'
                                            }}>
                                                Vision
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                fontStyle: 'italic',
                                                color: 'text.secondary',
                                                mb: 3,
                                                fontSize: '0.95rem',
                                                lineHeight: 1.6
                                            }}>
                                                "{founder.vision}"
                                            </Typography>
                                            
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                my: 2
                                            }}>
                                                <Box sx={{ 
                                                    flexGrow: 1, 
                                                    height: '1px', 
                                                    bgcolor: 'divider',
                                                    mr: 1
                                                }} />
                                                <Typography variant="caption" sx={{ 
                                                    color: 'text.secondary', 
                                                    opacity: 0.7,
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {founder.name === 'Asu' ? 'Asu\'s' : 'Farhaan\'s'} Motto
                                                </Typography>
                                                <Box sx={{ 
                                                    flexGrow: 1, 
                                                    height: '1px', 
                                                    bgcolor: 'divider',
                                                    ml: 1
                                                }} />
                                            </Box>
                                            
                                            <Typography variant="body2" sx={{ 
                                                color: 'text.secondary',
                                                textAlign: 'center',
                                                fontStyle: 'italic',
                                                fontSize: '0.95rem',
                                                opacity: 0.9,
                                                mb: 3,
                                                lineHeight: 1.6
                                            }}>
                                                {founder.name === 'Asu' 
                                                    ? 'Rooted in heritage, inspired by earth – I shape stories, not just clay.' 
                                                    : 'Dream big. Build bold. Leave a legacy in every creation.'}
                                            </Typography>

                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Box 
                                                    component="a"
                                                    href={getEmailLink(founder.name)}
                                                    sx={{
                                                        textDecoration: 'none',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="medium"
                                                        startIcon={<Email />}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: '50px',
                                                            px: 4,
                                                            py: 1.2,
                                                            fontWeight: 600,
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                            transition: 'all 0.2s ease-in-out',
                                                            background: 'linear-gradient(45deg, #8B5A2B, #A67C52)',
                                                            '&:hover': {
                                                                transform: 'translateY(-2px)',
                                                                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                                                                background: 'linear-gradient(45deg, #A67C52, #8B5A2B)'
                                                            }
                                                        }}
                                                    >
                                                        Contact {founder.name.split(' ')[0]}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </StyledPaper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
            
            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity || 'info'}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default FoundersPage;
