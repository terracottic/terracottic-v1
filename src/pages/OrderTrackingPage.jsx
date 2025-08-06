import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Box, Button, Container, Grid, Paper, Step, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';

const OrderTrackingPage = () => {
    const [orderId, setOrderId] = useState('');
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [error, setError] = useState('');

    // Sample tracking data - in a real app, this would come from an API
    const sampleTrackingData = {
        orderId: 'ORD-123456',
        status: 'In Transit',
        estimatedDelivery: 'August 12, 2024',
        carrier: 'Delhivery',
        trackingNumber: 'DEL123456789IN',
        steps: [
            {
                status: 'Order Placed',
                date: 'Aug 5, 2024 10:30 AM',
                completed: true,
                description: 'Your order has been received and is being processed.'
            },
            {
                status: 'Processing',
                date: 'Aug 5, 2024 2:15 PM',
                completed: true,
                description: 'Your order is being prepared for shipment.'
            },
            {
                status: 'Shipped',
                date: 'Aug 6, 2024 11:00 AM',
                completed: true,
                description: 'Your order has been handed over to the courier partner.'
            },
            {
                status: 'In Transit',
                date: 'Aug 7, 2024',
                completed: true,
                description: 'Your order is on its way to the nearest hub.'
            },
            {
                status: 'Out for Delivery',
                date: 'Expected Aug 10, 2024',
                completed: false,
                description: ''
            },
            {
                status: 'Delivered',
                date: '',
                completed: false,
                description: ''
            },
        ]
    };

    const handleTrackOrder = (e) => {
        e.preventDefault();
        setError('');

        // In a real app, this would be an API call
        if (orderId.trim() === '') {
            setError('Please enter a valid order ID');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setTrackingInfo(sampleTrackingData);
        }, 1000);
    };

    const getActiveStep = () => {
        if (!trackingInfo) return -1;
        return trackingInfo.steps.findIndex(step => !step.completed);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box display="flex" alignItems="center" mb={4}>
                    <LocalShippingIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h4" component="h1">
                        Track Your Order
                    </Typography>
                </Box>

                <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
                    <form onSubmit={handleTrackOrder}>
                        <Grid container spacing={2} alignItems="flex-start">
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Order ID"
                                    variant="outlined"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="Enter your order number"
                                    error={!!error}
                                    helperText={error}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    type="submit"
                                    sx={{ height: '56px' }}
                                >
                                    Track Order
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    You can find your order number in your order confirmation email.
                                </Typography>
                            </Grid>
                        </Grid>
                    </form>
                </Box>

                {trackingInfo && (
                    <Box>
                        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Order Number</Typography>
                                    <Typography variant="body1">{trackingInfo.orderId}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Typography variant="body1" color="primary" fontWeight={500}>
                                        {trackingInfo.status}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Estimated Delivery</Typography>
                                    <Typography variant="body1">{trackingInfo.estimatedDelivery}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Courier</Typography>
                                    <Typography variant="body1">{trackingInfo.carrier} ({trackingInfo.trackingNumber})</Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <Stepper activeStep={getActiveStep()} orientation="vertical" sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
                            {trackingInfo.steps.map((step, index) => (
                                <Step key={step.status} completed={step.completed}>
                                    <StepLabel
                                        optional={step.date && <Typography variant="caption">{step.date}</Typography>}
                                        StepIconComponent={step.completed ? CheckCircleOutlineIcon : undefined}
                                    >
                                        <Box>
                                            <Typography variant="subtitle1">{step.status}</Typography>
                                            {step.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {step.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default OrderTrackingPage;
