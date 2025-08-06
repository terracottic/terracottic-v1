import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { formatPrice } from '../utils/format';
import {
  Container, Typography, Paper, Box, Grid, Button, Divider, Chip,
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stepper, Step, StepLabel, Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const statusSteps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusIcons = {
  'Processing': <PendingIcon color="primary" />,
  'Shipped': <LocalShippingIcon color="info" />,
  'Out for Delivery': <LocalShippingIcon color="warning" />,
  'Delivered': <CheckCircleIcon color="success" />,
  'Cancelled': <CancelIcon color="error" />,
  'Refunded': <CheckCircleIcon color="success" />
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!currentUser) {
          navigate('/login', { state: { from: `/orders/${orderId}` } });
          return;
        }

        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) throw new Error('Order not found');
        
        const orderData = orderDoc.data();
        if (orderData.userId !== currentUser.uid) throw new Error('Unauthorized access');

        setOrder({
          id: orderDoc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate(),
          updatedAt: orderData.updatedAt?.toDate(),
        });
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, currentUser, navigate]);

  const getActiveStep = () => {
    if (!order) return 0;
    const statusOrder = {
      'Processing': 1,
      'Shipped': 2,
      'Out for Delivery': 3,
      'Delivered': 4,
      'Cancelled': -1,
      'Refunded': -1
    };
    return statusOrder[order.status] || 0;
  };

  if (loading) return <CircularProgress sx={{ display: 'block', m: '2rem auto' }} />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!order) return <Alert severity="info" sx={{ m: 2 }}>Order not found</Alert>;

  const activeStep = getActiveStep();
  const orderDate = order.createdAt ? format(order.createdAt, 'MMMM d, yyyy h:mm a') : 'N/A';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} to="/profile?tab=1" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
        Back to Orders
      </Button>

      <Typography variant="h4" gutterBottom>
        Order #{order.orderNumber || order.id.substring(0, 8).toUpperCase()}
      </Typography>
      <Typography color="text.secondary" gutterBottom>Placed on {orderDate}</Typography>

      {/* Order Status */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Order Status</Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {statusSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box mt={2} textAlign="center">
          <Chip
            label={order.status}
            color={
              order.status === 'Delivered' ? 'success' :
              order.status === 'Cancelled' ? 'error' : 'primary'
            }
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </Box>
      </Paper>

      {/* Order Items */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Items ({order.items?.length || 0})
            </Typography>
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
                  {order.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar src={item.image} variant="rounded" sx={{ width: 56, height: 56, mr: 2 }} />
                          <Box>
                            <Typography>{item.name}</Typography>
                            {item.variant && <Typography color="text.secondary" variant="body2">{item.variant}</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatPrice(item.price)}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatPrice(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, position: 'sticky', top: '1rem' }}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
              <div><span>Subtotal:</span> <span>{formatPrice(order.subtotal || 0)}</span></div>
              {order.discount > 0 && (
                <div><span>Discount:</span> <span style={{ color: 'red' }}>-{formatPrice(order.discount)}</span></div>
              )}
              <div><span>Shipping:</span> <span>{order.shippingCost ? formatPrice(order.shippingCost) : 'Free'}</span></div>
              <Divider sx={{ my: 1 }} />
              <div style={{ fontWeight: 'bold' }}>
                <span>Total:</span> <span>{formatPrice(order.total || 0)}</span>
              </div>
            </Box>
            
            <Box mt={3}>
              <Typography variant="subtitle2" color="text.secondary">Shipping Address</Typography>
              <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
                {order.shippingAddress?.fullName || 
                 `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() ||
                 order.shippingAddress?.name ||
                 'Shipping Address'}
              </Typography>
              <Typography>{order.shippingAddress?.address1}</Typography>
              {order.shippingAddress?.address2 && (
                <Typography>{order.shippingAddress.address2}</Typography>
              )}
              <Typography>
                {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
              {order.shippingAddress?.country && (
                <Typography>{order.shippingAddress.country}</Typography>
              )}
              {order.shippingAddress?.phone && (
                <Typography sx={{ mt: 1 }}>Phone: {order.shippingAddress.phone}</Typography>
              )}
              {order.shippingAddress?.email && (
                <Typography>Email: {order.shippingAddress.email}</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetailPage;
