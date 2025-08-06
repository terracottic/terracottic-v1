import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Typography, Container, Paper, Divider, Grid, Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EmailIcon from '@mui/icons-material/Email';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import PaymentIcon from '@mui/icons-material/Payment';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

const OrderComplete = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(location.state?.order || null);
    const [orderNumber] = useState(location.state?.orderNumber || null);

    // Debug: Log the order data to see what we're working with
    useEffect(() => {
        console.log('Order data in OrderComplete:', order);
    }, [order]);

    useEffect(() => {
        // Animation timeline
        const tl = gsap.timeline();

        // Container animation
        tl.fromTo(
            '.order-complete-container',
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
        );

        // Icon animation
        tl.fromTo(
            '.success-icon',
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: 'back.out(1.7)',
                onStart: () => {
                    // Play success sound
                    const successSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.wav');
                    successSound.volume = 0.3;
                    successSound.play();
                }
            },
            '-=0.3'
        );

        // Text animations
        tl.fromTo(
            '.success-title',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            '-=0.3'
        );

        tl.fromTo(
            '.success-message',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            '-=0.2'
        );

        tl.fromTo(
            '.order-details',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            '-=0.2'
        );

        // Confetti effect
        const colors = ['#d2691e', '#f5d7a1', '#e97451', '#fff8dc'];
        const confettiInterval = setInterval(() => {
            confetti({
                particleCount: 20,
                angle: 60,
                spread: 85,
                origin: { x: 0 },
                colors,
                shapes: ['circle', 'square']
            });
            confetti({
                particleCount: 20,
                angle: 120,
                spread: 85,
                origin: { x: 1 },
                colors,
                shapes: ['circle', 'square']
            });
        }, 300);

        // Play celebration sound after a delay
        const celebrationTimer = setTimeout(() => {
            const cheer = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-crowd-cheer-365.wav');
            cheer.volume = 0.5;
            cheer.play();
        }, 800);

        // Cleanup
        return () => {
            clearInterval(confettiInterval);
            clearTimeout(celebrationTimer);
            gsap.killTweensOf(['.order-complete-container', '.success-icon', '.success-title', '.success-message', '.order-details']);
        };
    }, []);

    const handleContinueShopping = () => {
        navigate('/products');
    };

    const handleViewOrders = () => {
        navigate('/profile/orders');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f2e6d9 0%, #d2691e 100%)',
                py: 8,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(210,105,30,0.1) 100%)',
                    zIndex: 0,
                }}
            />

            <Container maxWidth="md" className="order-complete-container">
                <Paper
                    elevation={6}
                    sx={{
                        p: { xs: 3, md: 6 },
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {/* Animated Checkmark */}
                        <Box
                            className="success-icon"
                            sx={{
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 4,
                                boxShadow: '0 10px 25px rgba(76, 175, 80, 0.3)',
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    animation: 'pulse 2s infinite',
                                },
                                '@keyframes pulse': {
                                    '0%': { transform: 'scale(1)', opacity: 0.7 },
                                    '70%': { transform: 'scale(1.5)', opacity: 0 },
                                    '100%': { opacity: 0 },
                                },
                            }}
                        >
                            <CheckCircleOutlineIcon
                                sx={{
                                    fontSize: 60,
                                    color: 'white',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                }}
                            />
                        </Box>

                        {/* Success Title */}
                        <Typography
                            variant="h3"
                            component="h1"
                            className="success-title"
                            sx={{
                                fontWeight: 700,
                                color: '#2e3b55',
                                mb: 2,
                                fontSize: { xs: '2rem', md: '2.5rem' },
                                background: 'linear-gradient(45deg, #d2691e 0%, #a0522d 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Order Confirmed!
                        </Typography>

                        {/* Success Message */}
                        <Typography
                            variant="h6"
                            className="success-message"
                            sx={{
                                color: '#555',
                                mb: 4,
                                maxWidth: '600px',
                                mx: 'auto',
                                lineHeight: 1.6,
                            }}
                        >
                            Thank you for your purchase! Your order #{orderNumber} has been received and is being processed.
                            {order?.shippingAddress?.email && (
                                <Box component="span" display="block" mt={1}>
                                    A confirmation email has been sent to {order.shippingAddress.email}
                                </Box>
                            )}
                        </Typography>

                        {/* Order Details */}
                        <Box
                            className="order-details"
                            sx={{
                                background: 'rgba(210, 105, 30, 0.05)',
                                borderRadius: 3,
                                p: 3,
                                mb: 4,
                                width: '100%',
                                maxWidth: '500px',
                                border: '1px dashed rgba(210, 105, 30, 0.3)',
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <ReceiptIcon sx={{ mr: 1, color: '#d2691e' }} />
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Order Number</Typography>
                                            <Typography variant="body1" fontWeight={600}>{orderNumber}</Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <LocalShippingIcon sx={{ mr: 1, color: '#d2691e' }} />
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                            <Chip 
                                                label="Processing" 
                                                color="primary" 
                                                size="small" 
                                                sx={{ fontWeight: 600, mt: 0.5 }}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PaymentIcon sx={{ mr: 1, color: '#d2691e' }} />
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {order?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Shipping Address
                                    </Typography>
                                    {order?.shippingAddress && (
                                        <Box>
                                            {/* Debug: Show all available name fields */}
                                            {console.log('Shipping Address:', order.shippingAddress)}
                                            <Typography variant="body1" fontWeight={600}>
                                                {order.shippingAddress.name || 
                                                 order.shippingAddress.fullName || 
                                                 (order.shippingAddress.firstName || order.shippingAddress.lastName 
                                                  ? `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() 
                                                  : 'User')}
                                            </Typography>
                                            <Typography variant="body2">
                                                {order.shippingAddress.address1}
                                                {order.shippingAddress.address2 && `, ${order.shippingAddress.address2}`}
                                            </Typography>
                                            <Typography variant="body2">
                                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                            </Typography>
                                            <Typography variant="body2">
                                                {order.shippingAddress.country}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                                                <PhoneIcon sx={                                { fontSize: 16, mr: 0.5, color: '#d2691e' }} />
                                                <Typography variant="body2">
                                                    {order.shippingAddress.phone}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                        <Typography variant="subtitle1" fontWeight={600}>Total:</Typography>
                                        <Typography variant="h6" color="primary" fontWeight={700}>
                                            {order?.total || '₹0.00'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Action Buttons */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                                width: '100%',
                                maxWidth: '400px',
                                mt: 2,
                            }}
                        >
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleContinueShopping}
                                sx={{
                                    background: 'linear-gradient(45deg, #d2691e 0%, #a0522d 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    py: 1.5,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 15px rgba(210, 105, 30, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px rgba(210, 105, 30, 0.4)',
                                        background: 'linear-gradient(45deg, #a0522d 0%, #d2691e 100%)',
                                    },
                                    transition: 'all 0.3s ease',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                }}
                            >
                                Continue Shopping
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                onClick={handleViewOrders}
                                sx={{
                                    borderColor: '#d2691e',
                                    color: '#d2691e',
                                    fontWeight: 600,
                                    py: 1.5,
                                    borderRadius: 2,
                                    '&:hover': {
                                        backgroundColor: 'rgba(210, 105, 30, 0.1)',
                                        borderColor: '#a0522d',
                                        color: '#a0522d',
                                    },
                                    transition: 'all 0.3s ease',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                }}
                            >
                                View Orders
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default OrderComplete;
