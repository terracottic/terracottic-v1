import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  useTheme,
  useMediaQuery,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HomeIcon from '@mui/icons-material/Home';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { format } from 'date-fns';

const OrderCompleted = ({ orderDetails, onContinueShopping }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const checkIconVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Set animation complete after initial render
  useEffect(() => {
    setAnimationComplete(true);
  }, []);

  const handleContinueShopping = () => {
    navigate('/products');
    if (onContinueShopping) onContinueShopping();
  };

  const handleTrackOrder = () => {
    // Navigate to order tracking page
    navigate('/account/orders');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <motion.div
        initial="hidden"
        animate={animationComplete ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <motion.div
            variants={checkIconVariants}
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing(3),
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: theme.palette.success.light,
              color: theme.palette.success.dark,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 60 }} />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Typography variant="h4" component="h1" gutterBottom>
              Order Placed Successfully!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              Thank you for your purchase. Your order has been received and is being processed.
            </Typography>
            {orderDetails?.orderNumber && (
              <Typography variant="body1" sx={{ mt: 1 }}>
                Order #: <strong>{orderDetails.orderNumber}</strong>
              </Typography>
            )}
          </motion.div>
        </Box>

        <motion.div variants={itemVariants}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              mb: 6,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`
            }}
          >
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalShippingIcon color="primary" sx={{ mr: 1.5 }} />
                  <Typography variant="h6">Order Status</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Your order is being processed and will be shipped soon.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                    Estimated Delivery:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HomeIcon color="primary" sx={{ mr: 1.5 }} />
                  <Typography variant="h6">Shipping Address</Typography>
                </Box>
                {orderDetails?.shippingAddress ? (
                  <Box>
                    <Typography variant="body1">
                      {orderDetails.shippingAddress.firstName} {orderDetails.shippingAddress.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {orderDetails.shippingAddress.address1}
                    </Typography>
                    {orderDetails.shippingAddress.address2 && (
                      <Typography variant="body2" color="text.secondary">
                        {orderDetails.shippingAddress.address2}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state} {orderDetails.shippingAddress.postalCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {orderDetails.shippingAddress.country}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {orderDetails.shippingAddress.phone}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No shipping address provided
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon color="primary" sx={{ mr: 1.5 }} />
                  <Typography variant="h6">Order Updates</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph>
                  We'll send you shipping confirmation when your item(s) are on the way!
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                  {orderDetails?.email || 'No email provided'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Paper elevation={0} sx={{ mb: 4, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            {orderDetails?.items?.map((item, index) => (
              <React.Fragment key={item.id || index}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <CardMedia
                    component="img"
                    image={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                    sx={{ width: 80, height: 80, objectFit: 'contain', mr: 3, borderRadius: 1 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity || 1}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {item.formattedPrice}
                    </Typography>
                    {item.discount > 0 && (
                      <Typography variant="body2" color="success.main">
                        {item.discount}% OFF
                      </Typography>
                    )}
                  </Box>
                </Box>
                {index < orderDetails.items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Paper>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card elevation={0} sx={{ mb: 6, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} sx={{ mb: { xs: 2, md: 0 } }}>
                  <Typography variant="h6" gutterBottom>
                    Order Total
                  </Typography>
                  <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
                    <div>
                      <Typography>Subtotal:</Typography>
                      <Typography>{orderDetails?.subtotal || '₹0.00'}</Typography>
                    </div>
                    {orderDetails?.discountAmount > 0 && (
                      <div>
                        <Typography>Discount:</Typography>
                        <Typography color="success.main">-{orderDetails.discountAmount}</Typography>
                      </div>
                    )}
                    <div>
                      <Typography>Shipping:</Typography>
                      <Typography>{orderDetails?.shippingCost === 0 ? 'Free' : orderDetails?.shippingCost || '₹0.00'}</Typography>
                    </div>
                    <div>
                      <Typography>Tax:</Typography>
                      <Typography>{orderDetails?.tax || '₹0.00'}</Typography>
                    </div>
                    <Divider sx={{ my: 1 }} />
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {orderDetails?.total || '₹0.00'}
                      </Typography>
                    </div>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Payment Method
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {orderDetails?.paymentMethod === 'cod' 
                      ? 'Cash on Delivery' 
                      : orderDetails?.paymentMethod === 'card' 
                        ? 'Credit/Debit Card' 
                        : 'Payment Method'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    A confirmation email has been sent to {orderDetails?.email || 'your email address'}.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: theme.spacing(2),
            justifyContent: 'center',
            marginTop: theme.spacing(4)
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleTrackOrder}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Track Your Order
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={handleContinueShopping}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Continue Shopping
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default OrderCompleted;
