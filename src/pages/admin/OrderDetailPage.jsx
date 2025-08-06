import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/format';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PrintIcon from '@mui/icons-material/Print';
import QRCode from 'react-qr-code';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';

// Styles for print
const PrintOnly = styled('div')({
  '@media print': {
    display: 'block',
  },
  display: 'none',
});

const NoPrint = styled('div')({
  '@media print': {
    display: 'none',
  },
});

const statusOptions = [
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Refunded'
];

const paymentStatusOptions = [
  'Pending',
  'Paid',
  'Failed',
  'Refunded'
];

const statusIcons = {
  'Processing': <PendingIcon color="primary" />,
  'Shipped': <LocalShippingIcon color="info" />,
  'Out for Delivery': <LocalShippingIcon color="warning" />,
  'Delivered': <CheckCircleIcon color="success" />,
  'Cancelled': <CancelIcon color="error" />,
  'Refunded': <CheckCircleIcon color="success" />
};

const paymentStatusColors = {
  'Pending': 'warning',
  'Paid': 'success',
  'Failed': 'error',
  'Refunded': 'info'
};

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });
  
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const printRef = useRef();

  // Function to fetch user data from Firestore by email or user ID
  const fetchUserData = async (email, userId) => {
    try {
      let userQuery;
      const usersRef = collection(db, 'users');
      
      if (email) {
        // Try to find user by email
        userQuery = query(usersRef, where('email', '==', email.toLowerCase().trim()));
      } else if (userId) {
        // Try to find user by ID
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
      } else {
        return null;
      }
      
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        // Get the first matching user
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOrderAndUser = async () => {
      try {
        setLoading(true);
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = {
          id: orderDoc.id,
          ...orderDoc.data()
        };

        // Debug: Log the order data structure
        console.log('Order Data:', orderData);
        
        // Try to fetch user data if we have email or user ID
        const userEmail = orderData.userEmail || orderData.userInfo?.email;
        const userId = orderData.userId || orderData.userInfo?.uid;
        
        if (userEmail || userId) {
          const userData = await fetchUserData(userEmail, userId);
          if (userData) {
            console.log('Fetched user data:', userData);
            setUserData(userData);
          }
        }

        console.log('Order data with packaging:', orderData);
        setOrder(orderData);
      } catch (err) {
        console.error('Error in fetchOrderAndUser:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndUser();
  }, [orderId]);

  const handleStatusChange = async (field, value) => {
    if (!order || !order.userId) return;

    try {
      setSaving(true);
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', order.id);
      const userOrderRef = doc(db, 'users', order.userId, 'orders', order.id);
      const updatedAt = new Date().toISOString();
      
      // Update the main order document
      batch.update(orderRef, {
        [field]: value,
        updatedAt
      });
      
      // Also update the user's order subcollection
      batch.update(userOrderRef, {
        [field]: value,
        updatedAt
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Order ${order.id} status updated to ${value} in both collections`);
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        [field]: value,
        updatedAt
      }));
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Order status updated to ${value}`,
        severity: 'success'
      });
      
    } catch (err) {
      console.error('Error updating order:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update order status',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  // Helper function to get display name with fallbacks
  const getDisplayName = (orderData, addressData, userData) => {
    // 1. Check address name fields first
    if (addressData?.name) return addressData.name;
    
    // 2. Try first + last name from address
    if (addressData?.firstName || addressData?.lastName) {
      return `${addressData.firstName || ''} ${addressData.lastName || ''}`.trim();
    }
    
    // 3. Check order customer name
    if (orderData?.customerName) return orderData.customerName;
    
    // 4. Check user data from Firestore
    if (userData) {
      if (userData.displayName) return userData.displayName;
      if (userData.name) return userData.name;
      if (userData.firstName || userData.lastName) {
        return `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      }
    }
    
    // 5. Check order user info
    if (orderData?.userInfo?.displayName) return orderData.userInfo.displayName;
    if (orderData?.userInfo?.name) return orderData.userInfo.name;
    
    // 6. Try to get name from email
    if (orderData?.userEmail) {
      return orderData.userEmail.split('@')[0];
    }
    
    // 7. Final fallback
    return 'Guest';
  };

  const handlePrintBill = () => {
    const printWindow = window.open('', '', 'width=800,height=1000');
    const orderDateFormatted = format(new Date(orderDate?.toDate?.() || orderDate), 'PPpp');
    const customerName = getDisplayName(order, shippingAddress, userData);
    const qrData = `Order #${orderNumber}|${customerName}|${formatPrice(total)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order #${orderNumber} - Bill</title>
          <style>
            @page { size: auto; margin: 0; }
            body { font-family: Arial, sans-serif; margin: 20px; }
            .bill-header { text-align: center; margin-bottom: 20px; }
            .bill-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .bill-subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
            .bill-section { margin-bottom: 20px; }
            .bill-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .bill-divider { border-top: 1px dashed #000; margin: 15px 0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-bold { font-weight: bold; }
            .qr-code { margin: 20px auto; text-align: center; }
            .thank-you { text-align: center; margin-top: 30px; font-style: italic; }
            .order-details { margin: 20px 0; }
            .order-items { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              table-layout: fixed;
            }
            .order-items th { 
              text-align: left; 
              border-bottom: 1px solid #ddd; 
              padding: 4px 8px; 
              font-weight: bold;
            }
            .order-items td { 
              padding: 4px 8px; 
              border-bottom: 1px solid #eee; 
              line-height: 1.2; 
              vertical-align: top;
            }
            .order-items .text-right { 
              text-align: right;
              padding-right: 8px;
              white-space: nowrap; 
              width: 1%;
            }
            .order-items .item-name { width: 50%; }
            .order-items .item-qty { width: 10%; text-align: right; }
            .order-items .item-price { width: 20%; }
            .order-items .item-total { width: 20%; }
            .order-items .total-row { font-weight: bold; border-top: 2px solid #000; }
          </style>
        </head>
        <body>
          <div class="bill-header">
            <div class="bill-logo">
              <img src="/src/assets/images/logo.png" alt="Terracottic Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 10px;" />
            </div>
            <div class="bill-subtitle">Handcrafted with Love</div>
            <div>Order #${orderNumber}</div>
            <div>${orderDateFormatted}</div>
          </div>
          
          <div class="bill-section seller-info">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
              <div style="width: 48%; margin-bottom: 15px;">
                <h3 style="margin: 0 0 8px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Sold By:</h3>
                <div style="font-weight: bold; margin-bottom: 5px;">Terracottic</div>
                <div>Panchmura,</div>
                <div>Bankura,</div>
                <div>West Bengal,</div>
                <div>722156</div>
                <div>India</div>
                <div style="margin-top: 5px;">
                  <div>GSTIN: 12ABCDE3456F7Z8</div>
                  <div>Phone: +91 9732029858</div>
                  <div>Email: terracottic@gmail.com</div>
                  <div>Website: www.terracottic.com</div>
                </div>
              </div>
              <div style="width: 48%; margin-bottom: 15px;">
                <h3 style="margin: 0 0 8px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Billing To:</h3>
                <div style="font-weight: bold; margin-bottom: 5px;">${escapeHtml(getDisplayName(order, order.billingAddress || shippingAddress, userData))}</div>
                <div>${shippingAddress?.address1 ? escapeHtml(shippingAddress.address1) : ''}</div>
                ${shippingAddress?.address2 ? `<div>${escapeHtml(shippingAddress.address2)}</div>` : ''}
                <div>${[shippingAddress?.city, shippingAddress?.state, shippingAddress?.postalCode]
                  .filter(Boolean)
                  .map(part => escapeHtml(part))
                  .join(', ')}</div>
                ${shippingAddress?.country ? `<div>${escapeHtml(shippingAddress.country)}</div>` : ''}
                ${shippingAddress?.phone ? `<div>Phone: ${escapeHtml(shippingAddress.phone)}</div>` : ''}
                ${order.userEmail ? `<div>Email: ${escapeHtml(order.userEmail)}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="bill-section">
            <table class="order-items">
              <thead>
                <tr>
                  <th class="item-name">Item</th>
                  <th class="item-qty">Qty</th>
                  <th class="text-right item-price">Price</th>
                  <th class="text-right item-total">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td class="item-name">${escapeHtml(item.name)}</td>
                    <td class="item-qty text-right">${item.quantity || 1}</td>
                    <td class="item-price text-right">${formatPrice(item.price * (1 - (item.discount / 100)))}</td>
                    <td class="item-total text-right">${formatPrice((item.price * (1 - (item.discount / 100)) * (item.quantity || 1)).toFixed(2))}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" class="text-right">Subtotal:</td>
                  <td class="text-right">${formatPrice(subtotal)}</td>
                </tr>
                ${discountAmount > 0 ? `
                  <tr>
                    <td colspan="3" class="text-right">Discount:</td>
                    <td class="text-right">-${formatPrice(discountAmount)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td colspan="3" class="text-right">Shipping:</td>
                  <td class="text-right">${shippingCost > 0 ? formatPrice(shippingCost) : 'Free'}</td>
                </tr>
                <tr>
                  <td colspan="3" class="text-right">${selectedPackaging === 'essential' ? 'Essential Packaging:' : 'Packaging:'}</td>
                  <td class="text-right">${packagingCost > 0 ? formatPrice(packagingCost) : 'Free'}</td>
                </tr>
                <tr>
                  <td colspan="3" class="text-right">Tax (5%):</td>
                  <td class="text-right">${formatPrice(tax)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3" class="text-right"><strong>Total:</strong></td>
                  <td class="text-right"><strong>${formatPrice(total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="bill-section qr-code">
            <div>Order Verification</div>
            <div style="margin: 10px 0">
              <div style="display: inline-block; background: white; padding: 10px">
                <img 
                  src="${qrCodeUrl}"
                  alt="Order QR Code"
                  style="width: 120px; height: 120px;"
                />
              </div>
            </div>
            <div>Order ID: ${order.id}</div>
          </div>
          
          <div class="thank-you">
            <p>Thank you for shopping with us!</p>
            <p>For any queries, contact: terracottic@gmail.com</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 250);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  // Helper function to escape HTML
  const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return unsafe
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  if (!order) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">Order not found</Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  const {
    orderNumber,
    status,
    paymentStatus,
    items = [],
    subtotal = 0,
    discountAmount = 0,
    shippingCost = 0,
    packagingCost = 0,
    selectedPackaging = 'free',
    tax = 0,
    total = 0,
    orderDate,
    shippingAddress = {},
    // billingAddress = {},
    paymentMethod,
    notes = ''
  } = order;

  const formattedOrderDate = orderDate?.toDate 
    ? format(orderDate.toDate(), 'PPpp')
    : 'N/A';

  const renderAddress = (address, title, isBilling = false) => {
    // If it's billing address and it's the same as shipping, show a note
    if (isBilling && JSON.stringify(address) === JSON.stringify(shippingAddress)) {
      return (
        <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" gutterBottom>{title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Same as shipping address
          </Typography>
        </Paper>
      );
    }
    console.log('Rendering address with:', { address, title, userInfo: order?.userInfo });
    
    if (!address) {
      return (
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>{title}</Typography>
          <Typography color="text.secondary">No address information available</Typography>
        </Paper>
      );
    }

    // Get user's name with priority to address name fields first
    const getDisplayName = () => {
      // 1. Check address name fields first
      if (address?.name) return address.name;
      
      // 2. Try first + last name from address
      if (address?.firstName || address?.lastName) {
        return `${address.firstName || ''} ${address.lastName || ''}`.trim();
      }
      
      // 3. Check user data from Firestore
      if (userData) {
        if (userData.displayName) return userData.displayName;
        if (userData.name) return userData.name;
        if (userData.firstName || userData.lastName) {
          return `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        }
      }
      
      // 4. Fall back to order user info
      if (order?.userInfo?.displayName) return order.userInfo.displayName;
      if (order?.userInfo?.name) return order.userInfo.name;
      
      // 5. Try to get name from email
      if (order?.userEmail) {
        return order.userEmail.split('@')[0];
      }
      
      // 6. Final fallback
      return 'Customer';

      if (order?.billingAddress?.name) {
        return order.billingAddress.name;
      }
    
      if (order?.billingAddress?.firstName || order?.billingAddress?.lastName) {
        return `${order.billingAddress.firstName || ''} ${order.billingAddress.lastName || ''}`.trim();
      }
    
      if (order?.userInfo?.displayName) {
        return order.userInfo.displayName;
      }
    
      if (order?.userInfo?.name) {
        return order.userInfo.name;
      }
    
      return 'Customer';
    };
    

    // Get address components with fallbacks
    const getAddressComponent = (field, fallback = '') => {
      return address?.[field] || fallback;
    };

    // Format address line 2 and city/state/zip
    const formatAddressLine = () => {
      const line2 = getAddressComponent('address2') || getAddressComponent('addressLine2');
      const city = getAddressComponent('city');
      const state = getAddressComponent('state');
      const postalCode = getAddressComponent('postalCode') || getAddressComponent('zipCode');
      
      const addressParts = [city, state, postalCode].filter(Boolean);
      return {
        line2,
        cityStateZip: addressParts.length > 0 ? addressParts.join(', ') : null
      };
    };

    const { line2, cityStateZip } = formatAddressLine();
    const phone = getAddressComponent('phone');
    const email = getAddressComponent('email') || order?.userInfo?.email;
    const country = getAddressComponent('country', 'India');
    const displayName = getDisplayName();
    const addressLine1 = getAddressComponent('address1') || getAddressComponent('addressLine1');

    // Always show customer name from order if available, otherwise use the display name from address
    const customerName = order?.customerName || displayName;
    
    return (
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        
        {/* Always show name section with fallback */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {customerName || 'Customer'}
          </Typography>
        </Box>
        
        {/* Address section */}
        <Box sx={{ mt: 1 }}>
          {addressLine1 && (
            <Typography variant="body2">{addressLine1}</Typography>
          )}
          
          {line2 && (
            <Typography variant="body2">{line2}</Typography>
          )}
          
          {cityStateZip && (
            <Typography variant="body2">{cityStateZip}</Typography>
          )}
          
          {country && country !== 'India' && (
            <Typography variant="body2">{country}</Typography>
          )}
        </Box>
        
        {/* Contact info */}
        <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
          {phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">{phone}</Typography>
            </Box>
          )}
          
          {email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2">{email}</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Order #{orderNumber}
        </Typography>
        <Chip
          label={status}
          color={status === 'Delivered' ? 'success' : status === 'Cancelled' ? 'error' : 'primary'}
          icon={statusIcons[status] || <PendingIcon />}
          sx={{ ml: 2, fontWeight: 'bold' }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrintBill}
          sx={{ ml: 2 }}
        >
          Print Bill
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Order Summary</Typography>
              <Typography variant="body2" color="textSecondary">
                Placed on {formattedOrderDate}
              </Typography>
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => {
                    console.log('Order item:', { 
                      index, 
                      name: item.name, 
                      image: item.image,
                      itemData: item 
                    });
                    return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ 
                            width: 50, 
                            height: 50, 
                            mr: 2,
                            position: 'relative',
                            backgroundColor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {(() => {
                              // Enhanced image URL extraction with proper path handling
                              const getImageUrl = (img) => {
                                console.log('Processing image data:', img);
                                
                                if (!img) {
                                  console.log('No image data');
                                  return null;
                                }
                                
                                // Handle string URL
                                if (typeof img === 'string') {
                                  console.log('Found string URL:', img);
                                  // If it's already a full URL, return as is
                                  if (img.startsWith('http')) {
                                    return img;
                                  }
                                  // If it's a path starting with /, prepend the base URL
                                  if (img.startsWith('/')) {
                                    return `${window.location.origin}${img}`;
                                  }
                                  // For relative paths, assume they're in the public folder
                                  return `${window.location.origin}/${img}`;
                                }
                                
                                // Handle object with url/src
                                if (typeof img === 'object') {
                                  let url;
                                  if (img.url) {
                                    console.log('Found URL in object.url:', img.url);
                                    url = img.url;
                                  } else if (img.src) {
                                    console.log('Found URL in object.src:', img.src);
                                    url = img.src;
                                  } else if (img.downloadURL) {
                                    console.log('Found Firebase downloadURL:', img.downloadURL);
                                    url = img.downloadURL;
                                  }
                                  
                                  // Process the found URL
                                  if (url) {
                                    if (typeof url === 'string') {
                                      if (url.startsWith('http')) {
                                        return url;
                                      }
                                      if (url.startsWith('/')) {
                                        return `${window.location.origin}${url}`;
                                      }
                                      return `${window.location.origin}/${url}`;
                                    }
                                  }
                                  
                                  // Handle array of images
                                  if (Array.isArray(img) && img.length > 0) {
                                    console.log('Processing array of images, using first one');
                                    return getImageUrl(img[0]);
                                  }
                                }
                                
                                console.log('No valid image URL found');
                                return null;
                              };

                              // Try to get image from various possible properties
                              const imageUrl = getImageUrl(
                                item.image || 
                                item.images || 
                                item.img || 
                                (item.images && item.images[0]) ||
                                item.imageUrl
                              );
                              
                              const hasImage = !!imageUrl;
                              console.log('Final image URL:', imageUrl);

                              return (
                                <>
                                  {hasImage ? (
                                    <img
                                      src={imageUrl}
                                      alt={item.name || 'Product'}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                      }}
                                      onError={(e) => {
                                        console.error('Error loading image:', e.target.src);
                                        e.target.style.display = 'none';
                                        const fallback = e.target.parentElement.querySelector('.image-fallback');
                                        if (fallback) {
                                          console.log('Showing fallback UI');
                                          fallback.style.display = 'flex';
                                        }
                                      }}
                                      onLoad={() => console.log('Image loaded successfully')}
                                      crossOrigin="anonymous"
                                    />
                                  ) : null}
                                  <Box 
                                    className="image-fallback"
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      display: hasImage ? 'none' : 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: 'background.paper',
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      textAlign: 'center',
                                      p: 1,
                                      zIndex: 2
                                    }}
                                  >
                                    No Image
                                  </Box>
                                </>
                              );
                            })()}
                          </Box>
                          <Box>
                            <Typography variant="body2">{item.name}</Typography>
                            {item.sku && (
                              <Typography variant="caption" color="textSecondary">
                                SKU: {item.sku}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {item.discount > 0 ? (
                          <>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                              {formatPrice(item.price * (1 - (item.discount / 100)))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                              {formatPrice(item.price)}
                            </Typography>
                          </>
                        ) : (
                          formatPrice(item.price)
                        )}
                      </TableCell>
                      <TableCell align="center">{item.quantity || 1}</TableCell>
                      <TableCell align="right">
                        {formatPrice((item.price * (1 - (item.discount / 100)) * (item.quantity || 1)).toFixed(2))}
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatPrice(subtotal)}</Typography>
              </Box>
              
              {discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Discount:</Typography>
                  <Typography>-{formatPrice(discountAmount)}</Typography>
                </Box>
              )}
              
              {/* Essential Packaging */}
              {(order?.packagingCost > 0 || order?.selectedPackaging === 'essential') && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Essential Packaging:</Typography>
                    {order?.selectedPackaging === 'essential' && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </Box>
                  <Typography>{formatPrice(order?.packagingCost || 0)}</Typography>
                </Box>
              )}
              
              {/* Shipping */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Shipping {order?.shippingCost > 0 ? '(Essential)' : '(Free)'}:</Typography>
                <Typography>{order?.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}</Typography>
              </Box>
              
              {/* Tax */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax (8%):</Typography>
                <Typography>{formatPrice(tax)}</Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{formatPrice(total)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={3} direction="column">
            <Grid item>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Order Status</Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    onChange={(e) => handleStatusChange('status', e.target.value)}
                    disabled={saving}
                    label="Status"
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Payment Status
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip
                    label={paymentStatus}
                    color={paymentStatusColors[paymentStatus] || 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <PaymentIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {paymentMethod || 'N/A'}
                  </Typography>
                </Box>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Update Payment Status</InputLabel>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => handleStatusChange('paymentStatus', e.target.value)}
                    disabled={saving}
                    label="Update Payment Status"
                  >
                    {paymentStatusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              {renderAddress(shippingAddress, 'Shipping Address')}
            </Grid>

            {notes && (
              <Grid item>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Order Notes</Typography>
                  <Typography>{notes}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetailPage;
