import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/format';
import {
  Container, Typography, Paper, Box, Grid, Button, Divider, Chip,
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stepper, Step, StepLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/contexts/AuthContext';

const UserOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        if (orderData.userId !== currentUser.uid) {
          throw new Error('Access denied');
        }
        
        setOrder(orderData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId && currentUser) fetchOrder();
  }, [orderId, currentUser]);

  const getActiveStep = () => {
    if (!order) return 0;
    return {
      'Processing': 0,
      'Shipped': 1,
      'Delivered': 2
    }[order.status] || 0;
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
      <CircularProgress />
    </Container>
  );

  if (error) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      <Button onClick={() => navigate('/profile/orders')} startIcon={<ArrowBackIcon />}>
        Back to Orders
      </Button>
    </Container>
  );

  if (!order) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Order not found</Typography>
      <Button onClick={() => navigate('/profile/orders')} startIcon={<ArrowBackIcon />}>
        Back to Orders
      </Button>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
      </Typography>

      <Stepper 
        activeStep={getActiveStep()} 
        alternativeLabel 
        sx={{ 
          mb: 4,
          '& .MuiStepConnector-line': {
            borderColor: 'primary.main',
            borderTopWidth: 2,
            marginTop: 0,
            minHeight: 4
          },
          '& .MuiStepLabel-label': {
            mt: 1,
            color: 'text.primary',
            fontWeight: 500
          },
          '& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed': {
            fontWeight: 600
          }
        }}
      >
        {['Processing', 'Shipped', 'Delivered'].map((label, index) => {
          const isCompleted = order.status === 'Delivered' && index < 3;
          const isActive = order.status === 'Delivered' && index === 2;
          
          return (
            <Step 
              key={label} 
              completed={isCompleted} 
              active={isActive}
              sx={{
                '& .MuiStepIcon-root': {
                  color: isCompleted ? 'primary.main' : 'action.disabled',
                  '&.Mui-active, &.Mui-completed': {
                    color: 'primary.main'
                  }
                }
              }}
            >
              <StepLabel 
                StepIconProps={{
                  icon: isCompleted ? (
                    <CheckCircle color="primary" />
                  ) : (
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: isActive ? 'primary.main' : 'action.disabled',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'background.paper',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {index + 1}
                    </Box>
                  )
                }}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Order Items</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{formatPrice(item.price * (1 - (item.discount / 100)))}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatPrice(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Box mb={1}>
                <span>Subtotal: </span>
                <span style={{ minWidth: 150, display: 'inline-block' }}>
                  {formatPrice(order.subtotal || 0)}
                </span>
              </Box>
              
              {/* Shipping Charges */}
              <Box mb={1}>
                <span>Shipping Charges: </span>
                <span style={{ minWidth: 150, display: 'inline-block' }}>
                  {order.shipping ? formatPrice(order.shipping) : 'Free'}
                </span>
              </Box>
              
              {/* Packaging Charges */}
              <Box mb={1}>
                <span>Packaging: </span>
                <span style={{ minWidth: 150, display: 'inline-block' }}>
                  {order.packagingType === 'free' || !order.packaging 
                    ? 'Free' 
                    : `${order.packagingType || 'Essential'} (${formatPrice(order.packaging)})`
                  }
                </span>
              </Box>
              
              {/* Tax */}
              {order.tax > 0 && (
                <Box mb={1}>
                  <span>Tax ({order.taxRate || 5}%): </span>
                  <span style={{ minWidth: 150, display: 'inline-block' }}>
                    {formatPrice(order.tax || 0)}
                  </span>
                </Box>
              )}
              
              {/* Discount */}
              <Box mb={1}>
                <span>Discount: </span>
                <span style={{ 
                  color: order.discount > 0 ? 'red' : 'inherit',
                  minWidth: 150, 
                  display: 'inline-block' 
                }}>
                  -{formatPrice(order.discount || 0)}
                </span>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Grand Total */}
              <Box mb={1}>
                <strong>Grand Total: </strong>
                <strong style={{ minWidth: 150, display: 'inline-block' }}>
                  {formatPrice(order.total || 0)}
                </strong>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Order Status</Typography>
            <Chip 
              label={order.status}
              color={
                order.status === 'Delivered' ? 'success' : 
                order.status === 'Shipped' ? 'info' : 'primary'
              }
            />
            <Typography variant="body2" color="textSecondary" mt={1}>
              {(() => {
                try {
                  if (!order.updatedAt) return 'N/A';
                  // Handle Firebase timestamp format
                  if (order.updatedAt.seconds) {
                    return format(new Date(order.updatedAt.seconds * 1000), 'MMM d, yyyy h:mm a');
                  }
                  // Handle regular date string
                  if (typeof order.updatedAt === 'string' || order.updatedAt instanceof Date) {
                    return format(new Date(order.updatedAt), 'MMM d, yyyy h:mm a');
                  }
                  return 'N/A';
                } catch (error) {
                  console.error('Error formatting date:', error);
                  return 'N/A';
                }
              })()}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>Shipping Address</Typography>
            {order.shippingAddress && (
              <Box>
                <Typography>{order.shippingAddress.name}</Typography>
                <Typography>{order.shippingAddress.address}</Typography>
                <Typography>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </Typography>
                <Typography>{order.shippingAddress.country}</Typography>
                <Typography>Phone: {order.shippingAddress.phone}</Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>Payment</Typography>
            <Typography>Method: {order.paymentMethod || 'N/A'}</Typography>
            <Typography>Status: {order.paymentStatus || 'N/A'}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserOrderDetails;
