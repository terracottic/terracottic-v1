import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/format';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '@/contexts/AuthContext';

const statusColors = {
  'Processing': 'primary',
  'Shipped': 'info',
  'Delivered': 'success',
  'Cancelled': 'error',
  'Pending': 'warning'
};

const paymentStatusColors = {
  'Paid': 'success',
  'Pending': 'warning',
  'Failed': 'error',
  'Refunded': 'info'
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Function to get user's display name with loading state
  const getUserDisplayName = (userInfo, order) => {
    if (loadingUsers) {
      return 'Loading...';
    }
    
    // First, check if we have a shipping address with a name
    if (order?.shippingAddress?.name) {
      return order.shippingAddress.name;
    }
    
    // Then check if we have first and last name in shipping address
    if (order?.shippingAddress?.firstName || order?.shippingAddress?.lastName) {
      const first = order.shippingAddress.firstName || '';
      const last = order.shippingAddress.lastName || '';
      const fullName = `${first} ${last}`.trim();
      if (fullName) return fullName;
    }
    
    // Fall back to user info if available
    if (userInfo) {
      const first = userInfo.firstName || '';
      const last = userInfo.lastName || '';
      const fullName = `${first} ${last}`.trim();
      
      if (fullName) return fullName;
      if (userInfo.displayName) return userInfo.displayName;
      if (userInfo.name) return userInfo.name;
      if (userInfo.email) return userInfo.email.split('@')[0];
    }
    
    // If we still don't have a name, check the order's userEmail
    if (order?.userEmail) {
      return order.userEmail.split('@')[0];
    }
    
    return 'Customer';
  };

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

  // Fetch orders
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    console.log('AdminOrdersPage - Component mounted');
    console.log('Current user:', currentUser);
    
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          setError('You do not have permission to view this page');
          setLoading(false);
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Error verifying admin status');
        setLoading(false);
        return false;
      }
    };

    const fetchOrders = async () => {
      try {
        const isAdmin = await checkAdminStatus();
        if (!isAdmin) return;
        
        setLoading(true);
        setLoadingUsers(true);

        console.log('Fetching orders and user data...');
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('orderDate', 'desc'));
        
        const querySnapshot = await getDocs(q);
        console.log('Received orders snapshot with', querySnapshot.size, 'documents');
        
        const ordersData = [];
        const userIds = new Set();
        const userDataMap = new Map();
        
        // First pass: collect all user IDs
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userId && data.userId !== 'unknown') {
            userIds.add(data.userId);
          }
        });
        
        console.log('Found', userIds.size, 'unique user IDs to fetch');
        
        // Fetch all user data in parallel
        const userPromises = Array.from(userIds).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              userDataMap.set(userId, { id: userDoc.id, ...userDoc.data() });
              console.log('Fetched user data for', userId);
            } else {
              console.log('No user data found for', userId);
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
          }
        });
        
        // Wait for all user data to be fetched
        await Promise.all(userPromises);
        console.log('Finished fetching user data');
        
        // Process all orders with user data
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            if (!data) return;
            
            // Safely convert Firestore timestamp to Date
            let orderDate = new Date();
            if (data.orderDate) {
              try {
                orderDate = data.orderDate.toDate ? data.orderDate.toDate() : new Date(data.orderDate);
                if (isNaN(orderDate.getTime())) {
                  console.warn('Invalid orderDate, using current date instead');
                  orderDate = new Date();
                }
              } catch (e) {
                console.warn('Error parsing order date, using current date instead:', e);
                orderDate = new Date();
              }
            }
            
            // Create the order object with user data
            const order = {
              id: doc.id,
              orderNumber: data.orderNumber || `ORD-${doc.id.substring(0, 6).toUpperCase()}`,
              userId: data.userId || 'unknown',
              userEmail: data.userEmail || 'unknown@example.com',
              items: Array.isArray(data.items) ? data.items : [],
              status: data.status || 'Processing',
              paymentStatus: data.paymentStatus || 'Pending',
              paymentMethod: data.paymentMethod || 'Unknown',
              shippingAddress: data.shippingAddress || {},
              billingAddress: data.billingAddress || {},
              subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
              discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : 0,
              shippingCost: typeof data.shippingCost === 'number' ? data.shippingCost : 0,
              tax: typeof data.tax === 'number' ? data.tax : 0,
              total: typeof data.total === 'number' ? data.total : 0,
              orderDate: orderDate,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
              estimatedDelivery: data.estimatedDelivery,
              notes: data.notes || '',
              userInfo: {}
            };
            
            // Attach user data if available
            if (order.userId && order.userId !== 'unknown' && userDataMap.has(order.userId)) {
              order.userInfo = { ...userDataMap.get(order.userId) };
              console.log(`Attached user data for order ${order.id}:`, order.userInfo);
            } else {
              console.log(`No user data available for order ${order.id}, userId: ${order.userId}`);
            }
            
            // Calculate total if not set
            if (order.total === 0 && order.items.length > 0) {
              order.total = order.items.reduce((sum, item) => {
                const price = item.price || 0;
                const quantity = item.quantity || 1;
                return sum + (price * quantity);
              }, 0) + (order.shippingCost || 0) + (order.tax || 0) - (order.discountAmount || 0);
            }
            
            ordersData.push(order);
          } catch (error) {
            console.error('Error processing order:', error);
          }
        });

        console.log(`Fetched ${ordersData.length} orders`);
        setOrders(ordersData);
        setError('');
        setLoading(false);
        setLoadingUsers(false);
      } catch (err) {
        console.error('Error in fetchOrders:', err);
        setError(`Error: ${err.message}`);
        setSnackbarMessage(`Error: ${err.message}`);
        setSnackbarOpen(true);
        setLoading(false);
        setLoadingUsers(false);
      }
    };

    fetchOrders();
  }, [currentUser]);
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    console.log('Setting up orders listener...');
    setLoading(true);
    
    // Check if user is authenticated
    if (!currentUser) {
      console.log('User not authenticated, redirecting to login...');
      setLoading(false);
      setError('Authentication required. Please log in.');
      return;
    }
    
    // Check if user has admin role
    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          console.log('User is not an admin');
          setError('You do not have permission to view this page.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to verify user permissions.');
        setLoading(false);
        return;
      }
    };
    
    checkAdminStatus();
    
    try {
      console.log('Creating Firestore query...');
      const q = query(
        collection(db, 'orders'),
        orderBy('orderDate', 'desc')
      );

      console.log('Firestore query created, setting up listener...');
      
      const unsubscribe = onSnapshot(
        q, 
        (querySnapshot) => {
          console.log('Received orders snapshot with', querySnapshot.size, 'documents');
          
          if (!querySnapshot) {
            console.error('Query snapshot is undefined');
            setError('Failed to load orders. Please try again.');
            setLoading(false);
            return;
          }
          
          if (querySnapshot.empty) {
            console.log('No orders found in the database');
            setOrders([]);
            setLoading(false);
            setSnackbarMessage('No orders found in the database');
            setSnackbarOpen(true);
            return;
          }
          console.log('Received orders snapshot with', querySnapshot.size, 'documents');
          const ordersData = [];
          
          querySnapshot.forEach(async (doc) => {
            try {
              if (!doc.exists()) {
                console.warn('Document does not exist:', doc.id);
                return;
              }
              
              const data = doc.data();
              const orderId = doc.id;
              console.log('Processing order:', orderId);
              
              // Ensure we have the minimum required data
              if (!data) {
                console.warn('Order has no data:', orderId);
                return;
              }
              
              // Set default values for required fields
              const order = {
                id: orderId,
                orderNumber: data.orderNumber || `ORD-${orderId.substring(0, 6).toUpperCase()}`,
                userId: data.userId || 'unknown',
                userEmail: data.userEmail || 'unknown@example.com',
                userInfo: data.userInfo || {},
                items: Array.isArray(data.items) ? data.items : [],
                status: data.status || 'Processing',
                paymentStatus: data.paymentStatus || 'Pending',
                paymentMethod: data.paymentMethod || 'Unknown',
                shippingAddress: data.shippingAddress || {},
                billingAddress: data.billingAddress || {},
                subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
                discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : 0,
                shippingCost: typeof data.shippingCost === 'number' ? data.shippingCost : 
                            (typeof data.shipping === 'number' ? data.shipping : 0),
                tax: typeof data.tax === 'number' ? data.tax : 0,
                total: typeof data.total === 'number' ? data.total : 0,
                orderDate: data.orderDate?.toDate ? data.orderDate.toDate() : 
                          (data.orderDate?.seconds ? new Date(data.orderDate.seconds * 1000) : new Date()),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                          (data.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000) : new Date()),
                estimatedDelivery: data.estimatedDelivery,
                notes: data.notes || ''
              };
              
              // Initialize userInfo as an empty object if it doesn't exist
              order.userInfo = order.userInfo || {};
              
              // If we have a valid user ID, try to fetch the user data
              if (order.userId && order.userId !== 'unknown') {
                try {
                  console.log(`Fetching user data for order ${order.id}, userId:`, order.userId);
                  const userData = await fetchUserData(null, order.userId);
                  console.log(`Fetched user data for order ${order.id}:`, userData);
                  
                  if (userData) {
                    // Merge the user data into userInfo
                    order.userInfo = {
                      ...userData,
                      // Don't override with empty values
                      ...Object.fromEntries(
                        Object.entries(order.userInfo).filter(([_, v]) => v != null && v !== '')
                      )
                    };
                    console.log(`Merged userInfo for order ${order.id}:`, order.userInfo);
                  } else {
                    console.log(`No user data found for userId: ${order.userId}`);
                    // If no user data found, ensure we have at least the email
                    if (order.userEmail) {
                      order.userInfo.email = order.userEmail;
                    }
                  }
                } catch (error) {
                  console.error('Error fetching user data:', error);
                }
              }
              
              // Calculate total if not set
              if (order.total === 0 && order.items.length > 0) {
                order.total = order.items.reduce((sum, item) => {
                  const price = item.price || 0;
                  const quantity = item.quantity || 1;
                  return sum + (price * quantity);
                }, 0) + (order.shippingCost || 0) + (order.tax || 0) - (order.discountAmount || 0);
              }
              
              ordersData.push(order);
              
            } catch (error) {
              console.error('Error processing order:', doc.id, error);
            }
          });
          
          console.log(`Processed ${ordersData.length} valid orders`);
          setOrders(ordersData);
          setLoading(false);
        }, 
        (error) => {
          console.error('Error in orders listener:', error);
          setLoading(false);
        }
      );

      // Clean up the listener when component unmounts
      return () => {
        console.log('Cleaning up orders listener');
        unsubscribe();
      };
      
    } catch (error) {
      console.error('Error setting up orders listener:', error);
      setLoading(false);
    }
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const getItemCount = (items) => {
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
          sx={{ mr: 2 }}
        >
          Retry Loading Orders
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/')}
        >
          Return to Home
        </Button>
        <Box mt={3} sx={{ p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Troubleshooting Tips:
          </Typography>
          <ul>
            <li>Check your internet connection</li>
            <li>Verify you're logged in with an admin account</li>
            <li>Check browser console for detailed error messages (Press F12)</li>
            <li>Make sure Firestore rules allow order reading</li>
          </ul>
          <Typography variant="caption" color="textSecondary" display="block" mt={1}>
            If the issue persists, please contact support with the error details.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 'medium' }}>
            Loading Your Orders...
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: '500px', mx: 'auto', mb: 3 }}>
            We're fetching your order history. This may take a moment.
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: 400, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ flex: 1, height: 4, bgcolor: 'divider', mr: 1 }} />
              <Typography variant="caption" color="textSecondary">
                Status
              </Typography>
              <Box sx={{ flex: 1, height: 4, bgcolor: 'divider', ml: 1 }} />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Connecting to database...
              </Typography>
              <Typography variant="caption" color="primary">
                {currentUser ? 'Authenticated' : 'Checking authentication...'}
              </Typography>
            </Box>
            
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
              size="small"
              sx={{ mt: 2 }}
            >
              Refresh Page
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <LocalShippingIcon sx={{ mr: 1, fontSize: 32 }} color="primary" />
        <Typography variant="h4" component="h1">
          Orders Management
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Debug Info - Only show in development */}
      {import.meta.env.DEV && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Debug Info:
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Orders Count: {orders.length}
            <br />
            Last Updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      )}

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>#{order.orderNumber}</TableCell>
                      <TableCell>
                        {order.orderDate && !isNaN(new Date(order.orderDate).getTime()) ? (
                          <>
                            {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                            <Typography variant="body2" color="textSecondary">
                              {format(new Date(order.orderDate), 'h:mm a')}
                            </Typography>
                          </>
                        ) : (
                          <Typography color="error">Invalid date</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {getUserDisplayName(order.userInfo, order)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {order.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {order.items?.length > 0 ? `${order.items.length} items` : 'No items'}
                        {order.items?.length > 0 && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {getItemCount(order.items)} total
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.total !== undefined && order.total !== null ? (
                          <>
                            <div>{formatPrice(order.total)}</div>
                            <Typography variant="caption" display="block" color="textSecondary">
                              Subtotal: {formatPrice(order.subtotal || 0)}
                            </Typography>
                            {order.discountAmount > 0 && (
                              <Typography variant="caption" display="block" color="error">
                                Discount: -{formatPrice(order.discountAmount || 0)}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block" color="textSecondary">
                              Shipping: {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost || 0)}
                            </Typography>
                            {order.tax > 0 && (
                              <Typography variant="caption" display="block" color="textSecondary">
                                Tax: {formatPrice(order.tax || 0)}
                              </Typography>
                            )}
                          </>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={statusColors[order.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.paymentStatus}
                          color={paymentStatusColors[order.paymentStatus] || 'default'}
                          size="small"
                          icon={order.paymentMethod === 'cod' ? 
                            <PaymentIcon fontSize="small" sx={{ ml: 0.5 }} /> : null}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Order">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewOrder(order.id)}
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default AdminOrdersPage;
