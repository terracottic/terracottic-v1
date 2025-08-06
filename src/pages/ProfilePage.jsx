import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, 
  doc, serverTimestamp, writeBatch, getFirestore, orderBy, getDoc,
  onSnapshot
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { app } from '../config/firebase';
import Navbar from '../components/common/Navbar';

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Import Material-UI components
import {
  Container, Box, Typography, Paper, Tabs, Tab, Grid, TextField,
  Button, Avatar, Divider, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, ListItemSecondaryAction, IconButton, Badge, useTheme,
  useMediaQuery, Card, CardContent, CardMedia, CardActions, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  CircularProgress, Snackbar, Alert, TextareaAutosize, FormControlLabel, Checkbox,
  CssBaseline
} from '@mui/material';

// Import Material-UI Icons
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {
  Person as PersonIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationOnIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CameraAlt as CameraAltIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Info as InfoIcon,
  MonetizationOn as MonetizationOnIcon,
  AssignmentReturn as AssignmentReturnIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { Stepper, Step, StepLabel} from '@mui/material';



const ProfilePage = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { addToCart } = useCart();
  const { wishlist, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef(null);
  const [processingItems, setProcessingItems] = useState({});
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [orders, setOrders] = useState([]);
  // const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoURL: ''
  });
  
  // Address form data
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'home',
    isDefault: false
  });
  
  // Set page title
  useEffect(() => {
    document.title = 'My Profile | Terracottic';
  }, []);

  // Process order document from Firestore
  const processOrderDoc = (doc, isSubcollection = false) => {
    try {
      const data = doc.data();
      if (!data) {
        console.log('No data in document:', doc.id);
        return null;
      }
      
      // Convert Firestore timestamps to Date objects
      const convertTimestamp = (timestamp) => {
        if (!timestamp) return new Date();
        return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      };
      
      const order = {
        id: doc.id,
        status: data.status || 'Processing',
        paymentStatus: data.paymentStatus || 'Pending',
        shippingCost: data.shippingCost || 0,
        tax: data.tax || 0,
        total: data.total || 0,
        orderDate: convertTimestamp(data.orderDate || data.createdAt || new Date()),
        createdAt: convertTimestamp(data.createdAt || new Date()),
        updatedAt: convertTimestamp(data.updatedAt || new Date()),
        estimatedDelivery: data.estimatedDelivery || ''
      };
      
      // Add additional fields if available
      if (data.items) order.items = data.items;
      if (data.shippingAddress) order.shippingAddress = data.shippingAddress;
      if (data.billingAddress) order.billingAddress = data.billingAddress;
      if (data.paymentMethod) order.paymentMethod = data.paymentMethod;
      if (data.userId) order.userId = data.userId;
      if (data.userEmail) order.userEmail = data.userEmail;
      if (data.orderNumber) order.orderNumber = data.orderNumber;
      
      return order;
      
    } catch (e) {
      console.error('Error processing order:', doc?.id, e);
      return null;
    }
  };

  // Set up real-time order status listeners
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('Setting up real-time order listeners for user:', currentUser.uid);
    
    // Set up listener for main orders collection
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef, 
      where('userId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribeOrders = onSnapshot(ordersQuery, 
      (snapshot) => {
        console.log('Orders collection updated');
        snapshot.docChanges().forEach((change) => {
          const updatedOrder = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          console.log('Order change detected:', change.type, updatedOrder.id, 'Status:', updatedOrder.status);
          
          if (change.type === 'modified' || change.type === 'added') {
            setOrders(prevOrders => {
              const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
              
              // If order exists, update it
              if (orderIndex >= 0) {
                // Only update if the status has actually changed to prevent unnecessary re-renders
                if (prevOrders[orderIndex].status !== updatedOrder.status) {
                  console.log('Updating existing order status:', prevOrders[orderIndex].status, '->', updatedOrder.status);
                  const newOrders = [...prevOrders];
                  newOrders[orderIndex] = {
                    ...newOrders[orderIndex],
                    status: updatedOrder.status,
                    updatedAt: updatedOrder.updatedAt || new Date().toISOString()
                  };
                  return newOrders;
                }
                return prevOrders;
              } 
              // If new order, add it
              else if (change.type === 'added') {
                console.log('Adding new order:', updatedOrder.id);
                return [processOrderDoc(change.doc), ...prevOrders];
              }
              
              return prevOrders;
            });
          }
        });
      },
      (error) => {
        console.error('Error in orders listener:', error);
        setSnackbar({
          open: true,
          message: 'Error loading order updates',
          severity: 'error'
        });
      }
    );
    
    // Set up listener for user's orders subcollection
    const userOrdersRef = collection(db, 'users', currentUser.uid, 'orders');
    const userOrdersQuery = query(userOrdersRef, orderBy('updatedAt', 'desc'));
    
    const unsubscribeUserOrders = onSnapshot(userOrdersQuery, 
      (snapshot) => {
        console.log('User orders subcollection updated');
        snapshot.docChanges().forEach((change) => {
          const updatedOrder = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          console.log('User order change detected:', change.type, updatedOrder.id, 'Status:', updatedOrder.status);
          
          if (change.type === 'modified' || change.type === 'added') {
            setOrders(prevOrders => {
              const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
              
              // If order exists, update it
              if (orderIndex >= 0) {
                // Only update if the status has actually changed to prevent unnecessary re-renders
                if (prevOrders[orderIndex].status !== updatedOrder.status) {
                  console.log('Updating existing user order status:', prevOrders[orderIndex].status, '->', updatedOrder.status);
                  const newOrders = [...prevOrders];
                  newOrders[orderIndex] = {
                    ...newOrders[orderIndex],
                    status: updatedOrder.status,
                    updatedAt: updatedOrder.updatedAt || new Date().toISOString()
                  };
                  return newOrders;
                }
                return prevOrders;
              } 
              // If new order, add it
              else if (change.type === 'added') {
                console.log('Adding new user order:', updatedOrder.id);
                return [processOrderDoc(change.doc), ...prevOrders];
              }
              
              return prevOrders;
            });
          }
        });
      },
      (error) => {
        console.error('Error in user orders listener:', error);
        setSnackbar({
          open: true,
          message: 'Error loading user order updates',
          severity: 'error'
        });
      }
    );
    
    // Initial data fetch for orders
    const fetchInitialOrders = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch from main orders collection
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = [];
        
        ordersSnapshot.forEach(doc => {
          const order = processOrderDoc(doc);
          if (order) ordersData.push(order);
        });
        
        // Fetch from user's orders subcollection if needed
        const userOrdersSnapshot = await getDocs(userOrdersQuery);
        userOrdersSnapshot.forEach(doc => {
          const order = processOrderDoc(doc, true);
          if (order && !ordersData.some(o => o.id === order.id)) {
            ordersData.push(order);
          }
        });
        
        // Sort by date, newest first
        ordersData.sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt || new Date(0);
          const dateB = b.updatedAt || b.createdAt || new Date(0);
          return new Date(dateB) - new Date(dateA);
        });
        
        setOrders(ordersData);
        console.log('Initial orders loaded:', ordersData.length);
      } catch (error) {
        console.error('Error fetching initial orders:', error);
        setSnackbar({
          open: true,
          message: 'Error loading orders',
          severity: 'error'
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchInitialOrders();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up order listeners');
      unsubscribeOrders();
      unsubscribeUserOrders();
    };
  }, [currentUser]);

  // Load user data, addresses, orders, and wishlist
  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        try {
          let firstName = '';
          let lastName = '';
          let phoneNumber = currentUser.phoneNumber || '';
          
          // Try to get from Firestore first
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if we have separate first/last names in Firestore
            if (userData.firstName && userData.lastName) {
              firstName = userData.firstName;
              lastName = userData.lastName;
            } 
            // Otherwise try to split displayName if it exists
            else if (userData.displayName) {
              const nameParts = userData.displayName.split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
            
            phoneNumber = userData.phoneNumber || phoneNumber;
          }
          
          // If we still don't have names, try to get from auth displayName
          if ((!firstName || !lastName) && currentUser.displayName) {
            const nameParts = currentUser.displayName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // If still no names, use email username as first name
          if ((!firstName || !lastName) && currentUser.email) {
            firstName = currentUser.email.split('@')[0];
            lastName = '';
          }
          
          setFormData({
            firstName,
            lastName,
            email: currentUser.email || '',
            phone: phoneNumber,
            photoURL: currentUser.photoURL || ''
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data on error
          setFormData({
            displayName: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : ''),
            email: currentUser?.email || '',
            phone: currentUser?.phoneNumber || '',
            photoURL: currentUser?.photoURL || ''
          });
        } finally {
          // Load other data
          loadAddresses();
          loadUserData();
        }
      };

      fetchUserData();
    }
  }, [currentUser]);

  // Load user addresses
  const loadAddresses = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const addressesRef = collection(db, 'users', currentUser.uid, 'addresses');
      const querySnapshot = await getDocs(addressesRef);
      
      const addressesData = [];
      querySnapshot.forEach((doc) => {
        addressesData.push({ id: doc.id, ...doc.data() });
      });
      
      setAddresses(addressesData);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load addresses',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's orders and wishlist
  const loadUserData = async (retryCount = 0) => {
    if (!currentUser) return;
    
    // Initialize ordersData at the function scope
    let ordersData = [];
    
    // Function to process order document
    const processOrderDoc = (doc, isSubcollection = false) => {
      try {
        const data = doc.data();
        if (!data) {
          console.log('No data in document:', doc.id);
          return null;
        }
        
        // Convert Firestore timestamps to Date objects
        const convertTimestamp = (timestamp) => {
          if (!timestamp) return new Date();
          return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        };
        
        // Define valid statuses to ensure we don't set an invalid status
        // Using an object to map all possible status variations to their canonical form
        const statusMap = {
          // Processing variations
          'processing': 'Processing',
          'process': 'Processing',
          'pending': 'Processing',
          'ordered': 'Processing',
          
          // Confirmed variations
          'confirmed': 'Confirmed',
          'accepted': 'Confirmed',
          
          // Shipped variations
          'shipped': 'Shipped',
          'dispatched': 'Shipped',
          'in_transit': 'Shipped',
          
          // Out for delivery variations
          'out_for_delivery': 'Out for Delivery',
          'out for delivery': 'Out for Delivery',
          'out_for_deliver': 'Out for Delivery',
          'out for deliver': 'Out for Delivery',
          'on the way': 'Out for Delivery',
          'on its way': 'Out for Delivery',
          
          // Delivered variations
          'delivered': 'Delivered',
          'delivery successful': 'Delivered',
          'completed': 'Delivered',
          'fulfilled': 'Delivered',
          
          // Cancelled variations
          'cancelled': 'Cancelled',
          'canceled': 'Cancelled',
          'cancellation': 'Cancelled',
          'void': 'Cancelled',
          
          // Refunded variations
          'refunded': 'Refunded',
          'refund': 'Refunded',
          'refund processed': 'Refunded',
          
          // Returned variations
          'returned': 'Returned',
          'return': 'Returned',
          'item returned': 'Returned',
          
          // Failed variations
          'failed': 'Failed',
          'failure': 'Failed',
          'delivery failed': 'Failed',
          'payment failed': 'Failed'
        };
        
        // Get status from data or default to 'Processing' if not set or invalid
        const normalizedStatus = data.status?.toString().trim().toLowerCase() || 'processing';
        const status = statusMap[normalizedStatus] || 'Processing';
          
        const order = {
          id: doc.id,
          orderNumber: data.orderNumber || `ORD-${doc.id.substring(0, 8).toUpperCase()}`,
          userId: data.userId || currentUser.uid,
          userEmail: data.userEmail || currentUser.email || '',
          userName: data.userName || '',
          status: status, // Use the validated status
          items: data.items || [],
          shippingAddress: data.shippingAddress || {},
          billingAddress: data.billingAddress || {},
          paymentMethod: data.paymentMethod || 'Unknown',
          paymentStatus: data.paymentStatus || 'Pending',
          subtotal: data.subtotal || 0,
          discountAmount: data.discountAmount || 0,
          shippingCost: data.shippingCost || 0,
          tax: data.tax || 0,
          total: data.total || 0,
          orderDate: convertTimestamp(data.orderDate || data.createdAt || new Date()),
          createdAt: convertTimestamp(data.createdAt || new Date()),
          updatedAt: convertTimestamp(data.updatedAt || new Date()),
          estimatedDelivery: data.estimatedDelivery || ''
        };
        
        console.log('Processed order:', order.id, 'with date:', order.orderDate);
        return order;
        
      } catch (e) {
        console.error('Error processing order:', doc?.id, e);
        return null;
      }
    };
    
    try {
      setIsLoadingData(true);
      console.log('Loading orders for user:', currentUser.uid);
      
      // Try to load from both collections in parallel
      const loadFromSubcollection = async () => {
        try {
          const userOrdersQuery = query(
            collection(db, 'users', currentUser.uid, 'orders'),
            orderBy('orderDate', 'desc')
          );
          const snapshot = await getDocs(userOrdersQuery);
          const orders = [];
          snapshot.forEach(doc => {
            const order = processOrderDoc(doc, true);
            if (order) orders.push(order);
          });
          console.log(`Loaded ${orders.length} orders from user subcollection`);
          return orders;
        } catch (error) {
          console.error('Error loading from user subcollection:', error);
          return [];
        }
      };
      
      const loadFromMainCollection = async () => {
        try {
          // First, get all orders for the user without ordering
          const userOrdersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid)
          );
          const snapshot = await getDocs(userOrdersQuery);
          const orders = [];
          
          // Process and sort the orders in memory
          snapshot.forEach(doc => {
            const order = processOrderDoc(doc, false);
            if (order) orders.push(order);
          });
          
          // Sort by orderDate in descending order (newest first)
          orders.sort((a, b) => b.orderDate - a.orderDate);
          
          console.log(`Loaded and sorted ${orders.length} orders from main collection`);
          return orders;
        } catch (error) {
          console.error('Error loading from main collection:', error);
          return [];
        }
      };
      
      // Load from both collections in parallel
      const [subcollectionOrders, mainCollectionOrders] = await Promise.all([
        loadFromSubcollection(),
        loadFromMainCollection()
      ]);
      
      // Combine and deduplicate orders
      const orderMap = new Map();
      
      [...subcollectionOrders, ...mainCollectionOrders].forEach(order => {
        if (order && order.id) {
          // Keep the most recent version of each order
          const existingOrder = orderMap.get(order.id);
          if (!existingOrder || (order.updatedAt > existingOrder.updatedAt)) {
            orderMap.set(order.id, order);
          }
        }
      });
      
      ordersData = Array.from(orderMap.values());
      
      if (ordersData.length === 0 && retryCount < 2) {
        console.log('No orders found, retrying...');
        return loadUserData(retryCount + 1);
      }
      
      // The orders are already processed and deduplicated in the orderMap
      console.log(`Total unique orders found: ${ordersData.length}`);
      setOrders(ordersData);
      
    } catch (error) {
      console.error('Error in loadUserData:', error);
      
      // Handle specific Firestore index errors
      if (error.code === 'failed-precondition' && retryCount < 3) {
        // If index is still building, wait and retry
        console.log(`Index not ready, retry ${retryCount + 1}/3...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return loadUserData(retryCount + 1);
      } 
      
      // Show error to user
      setSnackbar({
        open: true,
        message: 'Failed to load orders. Please try again later.',
        severity: 'error'
      });
      
      // Try fallback query for non-indexed fields
      if (retryCount < 2) {
        console.log('Trying fallback query...');
        try {
          const fallbackQuery = collectionGroup(db, 'orders');
          const snapshot = await getDocs(fallbackQuery);
          const allOrders = [];
          
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.userId === currentUser.uid) {
              allOrders.push({ id: doc.id, ...data });
            }
          });
          
          // Remove duplicates by order ID
          const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.id, order])).values());
          
          // Sort manually in memory
          uniqueOrders.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          
          console.log(`Loaded ${uniqueOrders.length} orders from fallback query`);
          setOrders(uniqueOrders);
          
          // Continue to load wishlist after successful fallback
          await loadWishlist();
          return;
          
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          // Even if wishlist fails, we still want to continue
          await loadWishlist();
        }
      } else {
        // If we've exhausted retries, still try to load wishlist
        await loadWishlist();
      }
      return; // Exit the function after error handling
    }
    
    // Load wishlist after successful orders load
    await loadWishlist();
  };
  
  // Helper function to load wishlist
  // Note: Wishlist is now managed by WishlistContext, so we don't need to load it separately here
  const loadWishlist = async () => {
    // Wishlist is automatically loaded by WishlistProvider
    // We just need to ensure loading state is updated
    setIsLoadingData(false);
    return;
  };

  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address form input changes
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle profile picture change
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsLoading(true);
      const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await updateProfile({ photoFile: file });
      
      setFormData(prev => ({
        ...prev,
        photoURL
      }));
      
      showSnackbar('Profile picture updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      showSnackbar('Failed to update profile picture', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Combine first and last name for display name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Update auth profile
      if (updateProfile) {
        await updateProfile({
          displayName: fullName,
          photoURL: formData.photoURL || currentUser.photoURL
        });
      } else {
        console.warn('updateProfile function not available in AuthContext');
      }
      
      // Prepare the update data
      const updateData = {
        displayName: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phone,
        updatedAt: serverTimestamp()
      };
      
      // Only include photoURL if it exists
      if (formData.photoURL) {
        updateData.photoURL = formData.photoURL;
      } else if (currentUser.photoURL) {
        updateData.photoURL = currentUser.photoURL;
      }
      
      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updateData, { merge: true });
      
      // Refresh user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || formData.firstName,
          lastName: userData.lastName || formData.lastName,
          phone: userData.phoneNumber || formData.phone,
          photoURL: userData.photoURL || formData.photoURL
        }));
      }
      
      showSnackbar('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    // Reset form with current user data
    if (currentUser) {
      const nameParts = (currentUser.displayName || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: currentUser.email || '',
        phone: currentUser.phoneNumber || '',
        photoURL: currentUser.photoURL || ''
      });
    }
    setIsEditing(false);
  };

  // Open address dialog for adding/editing
  const openAddressDialog = (address = null) => {
    if (address) {
      // If we have a fullName but no firstName/lastName, split it
      let firstName = '';
      let lastName = '';
      
      if (address.firstName && address.lastName) {
        // If we already have separate names, use them
        firstName = address.firstName;
        lastName = address.lastName;
      } else if (address.fullName) {
        // Otherwise, try to split the fullName
        const nameParts = address.fullName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      setEditingAddress(address.id);
      setAddressForm({
        firstName,
        lastName,
        phone: address.phone || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'India',
        addressType: address.addressType || 'home',
        isDefault: address.isDefault || false
      });
    } else {
      // For new addresses, try to get name from user profile
      const displayName = currentUser?.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setEditingAddress(null);
      setAddressForm({
        firstName,
        lastName,
        phone: currentUser?.phoneNumber || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'home',
        isDefault: addresses.length === 0
      });
    }
    setIsAddressDialogOpen(true);
  };

  // Save address
  const handleSaveAddress = async () => {
    try {
      setIsLoading(true);
      
      // Create address data with both firstName/lastName and fullName for backward compatibility
      const addressData = {
        ...addressForm,
        // Store fullName for backward compatibility
        fullName: `${addressForm.firstName} ${addressForm.lastName}`.trim(),
        updatedAt: serverTimestamp()
      };
      
      if (editingAddress) {
        await updateDoc(doc(db, 'users', currentUser.uid, 'addresses', editingAddress), addressData);
        showSnackbar('Address updated successfully', 'success');
      } else {
        await addDoc(collection(db, 'users', currentUser.uid, 'addresses'), {
          ...addressData,
          createdAt: serverTimestamp()
        });
        showSnackbar('Address added successfully', 'success');
      }
      
      await loadAddresses();
      setIsAddressDialogOpen(false);
    } catch (error) {
      console.error('Error saving address:', error);
      showSnackbar('Failed to save address', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (addressId) => {
    try {
      setIsLoading(true);
      const batch = writeBatch(db);
      
      addresses.forEach(addr => {
        const addressRef = doc(db, 'users', currentUser.uid, 'addresses', addr.id);
        batch.update(addressRef, { isDefault: addr.id === addressId });
      });
      
      await batch.commit();
      
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })));
      
      showSnackbar('Default address updated', 'success');
    } catch (error) {
      console.error('Error setting default address:', error);
      showSnackbar('Failed to update default address', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'addresses', addressId));
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      showSnackbar('Address deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting address:', error);
      showSnackbar('Failed to delete address', 'error');
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render order status steps
  const renderOrderStatus = (status) => {
    const statuses = [
      { id: 'processing', label: 'Processing' },
      { id: 'confirmed', label: 'Confirmed' },
      { id: 'shipped', label: 'Shipped' },
      { id: 'delivered', label: 'Delivered' }
    ];

    const currentStatusIndex = statuses.findIndex(s => s.id === status?.toLowerCase());

    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Stepper activeStep={currentStatusIndex} alternativeLabel>
          {statuses.map((step) => (
            <Step key={step.id}>
              <StepLabel
                StepIconComponent={() => (
                  <Badge
                    color={currentStatusIndex >= statuses.findIndex(s => s.id === step.id) ? 'primary' : 'default'}
                    badgeContent={currentStatusIndex >= statuses.findIndex(s => s.id === step.id) ? <CheckIcon fontSize="small" /> : null}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: currentStatusIndex >= statuses.findIndex(s => s.id === step.id) ? 'primary.main' : 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {getStatusIcon(step.id)}
                    </Box>
                  </Badge>
                )}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };

  // Render profile tab
  const renderProfileTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
        {/* Profile Picture - Commented out for now */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Personal Information</Typography>
            {!isEditing ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                disabled
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                margin="normal"
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );

  // Helper function to get status color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    const normalizedStatus = status.toString().trim().toLowerCase();
    
    // Map status to color
    const colorMap = {
      // Processing variations
      'processing': 'warning',
      'process': 'warning',
      'pending': 'warning',
      'ordered': 'warning',
      
      // Confirmed variations
      'confirmed': 'info',
      'accepted': 'info',
      
      // Shipped variations
      'shipped': 'info',
      'dispatched': 'info',
      'in_transit': 'info',
      
      // Out for delivery variations
      'out_for_delivery': 'info',
      'out for delivery': 'info',
      'out_for_deliver': 'info',
      'on the way': 'info',
      'on its way': 'info',
      
      // Delivered variations
      'delivered': 'success',
      'delivery successful': 'success',
      'completed': 'success',
      'fulfilled': 'success',
      
      // Cancelled variations
      'cancelled': 'error',
      'canceled': 'error',
      'cancellation': 'error',
      'void': 'error',
      
      // Refunded variations
      'refunded': 'success',
      'refund': 'success',
      'refund processed': 'success',
      
      // Returned variations
      'returned': 'info',
      'return': 'info',
      'item returned': 'info',
      
      // Failed variations
      'failed': 'error',
      'failure': 'error',
      'delivery failed': 'error',
      'payment failed': 'error'
    };
    
    return colorMap[normalizedStatus] || 'default';
  };

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    if (!status) return null;
    const normalizedStatus = status.toString().trim().toLowerCase();
    
    // Map status to icon
    const iconMap = {
      // Processing variations
      'processing': <HourglassEmptyIcon fontSize="small" />,
      'process': <HourglassEmptyIcon fontSize="small" />,
      'pending': <HourglassEmptyIcon fontSize="small" />,
      'ordered': <HourglassEmptyIcon fontSize="small" />,
      
      // Confirmed variations
      'confirmed': <CheckCircleOutlineIcon fontSize="small" />,
      'accepted': <CheckCircleOutlineIcon fontSize="small" />,
      
      // Shipped variations
      'shipped': <LocalShippingIcon fontSize="small" />,
      'dispatched': <LocalShippingIcon fontSize="small" />,
      'in_transit': <LocalShippingIcon fontSize="small" />,
      
      // Out for delivery variations
      'out_for_delivery': <LocalShippingIcon fontSize="small" />,
      'out for delivery': <LocalShippingIcon fontSize="small" />,
      'out_for_deliver': <LocalShippingIcon fontSize="small" />,
      'on the way': <LocalShippingIcon fontSize="small" />,
      'on its way': <LocalShippingIcon fontSize="small" />,
      
      // Delivered variations
      'delivered': <CheckCircleIcon fontSize="small" />,
      'delivery successful': <CheckCircleIcon fontSize="small" />,
      'completed': <CheckCircleIcon fontSize="small" />,
      'fulfilled': <CheckCircleIcon fontSize="small" />,
      
      // Cancelled variations
      'cancelled': <CancelIcon fontSize="small" />,
      'canceled': <CancelIcon fontSize="small" />,
      'cancellation': <CancelIcon fontSize="small" />,
      'void': <CancelIcon fontSize="small" />,
      
      // Refunded variations
      'refunded': <MonetizationOnIcon fontSize="small" />,
      'refund': <MonetizationOnIcon fontSize="small" />,
      'refund processed': <MonetizationOnIcon fontSize="small" />,
      
      // Returned variations
      'returned': <AssignmentReturnIcon fontSize="small" />,
      'return': <AssignmentReturnIcon fontSize="small" />,
      'item returned': <AssignmentReturnIcon fontSize="small" />,
      
      // Failed variations
      'failed': <ErrorOutlineIcon fontSize="small" />,
      'failure': <ErrorOutlineIcon fontSize="small" />,
      'delivery failed': <ErrorOutlineIcon fontSize="small" />,
      'payment failed': <ErrorOutlineIcon fontSize="small" />
    };
    
    return iconMap[normalizedStatus] || <InfoIcon fontSize="small" />;
  };

  
  // Render orders tab
  const renderOrdersTab = () => (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        My Orders
      </Typography>
      
      {isLoadingData ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Box textAlign="center" py={6}>
          <ShoppingBagIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.6 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Orders Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            You haven't placed any orders yet. Start shopping to see your orders here.
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/products"
            size="large"
            startIcon={<ShoppingCartIcon />}
          >
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card 
                variant="outlined" 
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    mb: 2,
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Order #{order.orderNumber || `ORD-${order.id.substring(0, 8).toUpperCase()}`}
                        </Typography>
                        <Chip 
                          label={order.status || 'Processing'}
                          size="small"
                          color={getStatusColor(order.status)}
                          icon={getStatusIcon(order.status)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Placed on {formatDate(order.createdAt || order.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: isMobile ? 2 : 0, textAlign: isMobile ? 'left' : 'right' }}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        ₹{order.total?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Order Items */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Order Items
                    </Typography>
                    <List dense>
                      {order.items?.slice(0, 2).map((item, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon>
                            <Avatar 
                              src={item.image || item.imageUrl || (item.images && item.images[0])} 
                              alt={item.name}
                              variant="rounded"
                              sx={{ 
                                width: 56, 
                                height: 56, 
                                mr: 2,
                                bgcolor: 'background.paper',
                                '& img': {
                                  objectFit: 'contain',
                                  width: '100%',
                                  height: '100%'
                                }
                              }}
                              imgProps={{
                                style: {
                                  objectFit: 'contain'
                                }
                              }}
                            >
                              {(!item.image && !item.imageUrl && (!item.images || item.images.length === 0)) && (
                                <ShoppingBagIcon color="action" />
                              )}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography component="span" variant="body1" noWrap display="block">
                                {item.name || 'Product'}
                              </Typography>
                            }
                            secondary={
                              <Box component="span">
                                <Typography component="span" variant="body2" color="text.secondary" display="block">
                                  Qty: {item.quantity || 1}
                                  {item.size && ` • Size: ${item.size}`}
                                  {item.color && ` • Color: ${item.color}`}
                                </Typography>
                                <Typography component="span" variant="body2" fontWeight={500} display="block">
                                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                      ))}
                      {order.items?.length > 2 && (
                        <Typography variant="body2" color="primary" sx={{ mt: 1, ml: 9 }}>
                          +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </List>
                  </Box>

                  {/* Order Status */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Order Status
                    </Typography>
                    {renderOrderStatus(order.status)}
                  </Box>

                  {/* Order Actions */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: 2,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      component={RouterLink}
                      to={`/profile/orders/${order.id}`}
                    >
                      View Details
                    </Button>
                    {/* {order.status?.toLowerCase() === 'delivered' && (
                      <Button 
                        variant="contained" 
                        size="small"
                        color="primary"
                      >
                        Track Order
                      </Button>
                    )} */}
                    {order.status?.toLowerCase() === 'delivered' && (
                      <Button 
                        variant="outlined" 
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/products/${order.id}`)}
                      >
                        Buy Again
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (productId, e) => {
    e?.stopPropagation();
    setProcessingItems(prev => ({ ...prev, [productId]: 'removing' }));
    try {
      const result = await removeFromWishlist(productId);
      if (!result.success) {
        showSnackbar(result.error || 'Failed to remove item from wishlist', 'error');
      } else {
        showSnackbar('Item removed from wishlist', 'success');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showSnackbar('An error occurred while removing from wishlist', 'error');
    } finally {
      setProcessingItems(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
    }
  };

  // Handle add to cart from wishlist
  const handleAddToCart = async (item, e) => {
    e?.stopPropagation();
    setProcessingItems(prev => ({ ...prev, [item.id]: 'adding' }));
    try {
      await addToCart(item);
      showSnackbar('Item added to cart', 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showSnackbar('Failed to add item to cart', 'error');
    } finally {
      setProcessingItems(prev => {
        const newState = { ...prev };
        delete newState[item.id];
        return newState;
      });
    }
  };

  // Render wishlist tab
  const renderWishlistTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">My Wishlist</Typography>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/products')}
          disabled={wishlistLoading}
        >
          Add Items
        </Button>
      </Box>

      {wishlistLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : wishlist.length === 0 ? (
        <Box textAlign="center" py={4}>
          <FavoriteIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your Wishlist is Empty
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Save items you love to buy them later.
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/products"
            disabled={wishlistLoading}
          >
            Browse Products
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wishlist.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                  position: 'relative'
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={item.images?.[0] || item.image || 'https://via.placeholder.com/300'}
                  alt={item.name}
                  sx={{ 
                    objectFit: 'cover',
                    bgcolor: 'background.paper',
                    p: item.images?.[0] || item.image ? 0 : 4
                  }}
                />
                <CardContent sx={{ 
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  p: 2
                }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={600} 
                    gutterBottom
                    sx={{
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      color="primary" 
                      component="div"
                      sx={{ 
                        fontWeight: 700,
                        lineHeight: 1.2,
                        mb: 0.5
                      }}
                    >
                      ₹{item.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          textDecoration: 'line-through',
                          display: 'inline-block',
                          mr: 1
                        }}
                      >
                        ₹{item.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    )}
                    {item.discountPercentage > 0 && (
                      <Chip
                        label={`${Math.round(item.discountPercentage)}% OFF`}
                        color="secondary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontWeight: 'bold',
                          boxShadow: 1
                        }}
                      />
                    )}
                  </Box>
                  <Chip 
                    label={item.inStock || item.stockStatus === 'in_stock' || item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    color={item.inStock || item.stockStatus === 'in_stock' || item.quantity > 0 ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      mt: 1,
                      borderWidth: '1.5px',
                      '& .MuiChip-label': {
                        fontWeight: 500
                      },
                      alignSelf: 'flex-start'
                    }}
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    color="primary" 
                    variant="contained"
                    disabled={!(item.inStock || item.stockStatus === 'in_stock' || item.quantity > 0) || processingItems[item.id]}
                    onClick={(e) => handleAddToCart(item, e)}
                    startIcon={processingItems[item.id] === 'adding' ? 
                      <CircularProgress size={16} color="inherit" /> : 
                      <ShoppingCartIcon fontSize="small" />
                    }
                    sx={{
                      minWidth: '120px',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                      },
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {processingItems[item.id] === 'adding' ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <IconButton 
                    color="error" 
                    disabled={!!processingItems[item.id]}
                    onClick={(e) => handleRemoveFromWishlist(item.id, e)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.contrastText',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {processingItems[item.id] === 'removing' ? 
                      <CircularProgress size={24} color="error" /> : 
                      <DeleteIcon />
                    }
                  </IconButton>
                </CardActions>
                {/* Discount chip moved inside CardContent */}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  // Render addresses tab
  const renderAddressesTab = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">My Addresses</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => openAddressDialog()}
        >
          Add New Address
        </Button>
      </Box>

      {isLoading && addresses.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : addresses.length === 0 ? (
        <Box textAlign="center" py={4}>
          <LocationOnIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Saved Addresses
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You haven't added any addresses yet.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => openAddressDialog()}
          >
            Add Address
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {addresses.map((address) => (
            <Grid item xs={12} md={6} key={address.id}>
              <Card 
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: address.isDefault ? '2px solid' : '1px solid',
                  borderColor: address.isDefault ? 'primary.main' : 'divider',
                  position: 'relative'
                }}
              >
                {address.isDefault && (
                  <Chip
                    label="Default"
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 16, right: 16 }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {address.addressType === 'home' ? (
                      <HomeIcon color="action" sx={{ mr: 1 }} />
                    ) : (
                      <WorkIcon color="action" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="subtitle1" textTransform="capitalize">
                      {address.addressType}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {address.firstName && address.lastName 
                      ? `${address.firstName} ${address.lastName}`
                      : address.fullName || 'No name provided'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {address.addressLine1}
                  </Typography>
                  {address.addressLine2 && (
                    <Typography variant="body2" color="text.secondary">
                      {address.addressLine2}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {address.city}, {address.state} {address.postalCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {address.country}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <Box component="span" display="flex" alignItems="center">
                      <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {address.phone}
                    </Box>
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  {!address.isDefault && (
                    <Button 
                      size="small" 
                      onClick={() => handleSetDefaultAddress(address.id)}
                      disabled={isLoading}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    onClick={() => openAddressDialog(address)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Address Dialog */}
      <Dialog 
        open={isAddressDialogOpen} 
        onClose={() => setIsAddressDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={addressForm.firstName}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={addressForm.lastName}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                name="addressLine1"
                value={addressForm.addressLine1}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2 (Optional)"
                name="addressLine2"
                value={addressForm.addressLine2}
                onChange={handleAddressChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={addressForm.city}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province/Region"
                name="state"
                value={addressForm.state}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ZIP/Postal Code"
                name="postalCode"
                value={addressForm.postalCode}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={addressForm.country}
                onChange={handleAddressChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Address Type"
                name="addressType"
                value={addressForm.addressType}
                onChange={handleAddressChange}
                margin="normal"
                SelectProps={{ native: true }}
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      isDefault: e.target.checked
                    }))}
                    name="isDefault"
                    color="primary"
                  />
                }
                label="Set as default address"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setIsAddressDialogOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveAddress}
            disabled={isLoading || !addressForm.fullName || !addressForm.phone || 
                     !addressForm.addressLine1 || !addressForm.city || 
                     !addressForm.state || !addressForm.postalCode}
            startIcon={isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isLoading ? 'Saving...' : 'Save Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Render settings tab
  const renderSettingsTab = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Account Settings</Typography>
      <List>
        <ListItem button onClick={() => navigate('/change-password')}>
          <ListItemIcon>
            <LockIcon />
          </ListItemIcon>
          <ListItemText primary="Change Password" />
        </ListItem>
        <ListItem button onClick={() => navigate('/notifications')}>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="Notification Preferences" />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={async () => {
            try {
              await logout();
              navigate('/login');
            } catch (error) {
              console.error('Failed to log out', error);
              showSnackbar('Failed to log out', 'error');
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  // Main render
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100%',
      overflowX: 'hidden',
      bgcolor: 'background.default',
      position: 'relative'
    }}>
      <CssBaseline />
      <Box component="main" sx={{
        flex: '1 0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        py: { xs: 0, sm: 0 },
        px: { xs: 0, sm: 0 },
        margin: 0,
        maxWidth: '100%',
        height: 'calc(100vh - 64px)', // Subtract header height
        overflow: 'hidden'
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            overflow: 'hidden',
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            m: 0,
            '@media (min-width: 600px)': {
              borderRadius: '16px 16px 0 0',
              margin: { sm: 2, md: 3 },
              height: 'calc(100% - 32px)',
              maxHeight: 'none',
              width: 'calc(100% - 32px)'
            },
            '@media (min-width: 900px)': {
              maxWidth: '1200px',
              margin: '24px auto',
              height: 'calc(100% - 48px)',
              borderRadius: 2
            }
          }}
        >
          {/* Header with Back Button and Tabs */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            borderBottom: 1, 
            borderColor: 'divider',
            flexShrink: 0,
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 2
          }}>
            {/* Back Button */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              borderBottom: 1,
              borderColor: 'divider',
              pl: { xs: 1, sm: 2 },
              pr: 1,
              py: 0.5
            }}>
              <Button 
                startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                onClick={() => navigate('/')}
                sx={{
                  textTransform: 'none',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 2
                  },
                  px: 1.5,
                  py: 1,
                  mr: 1
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Back to Home
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Back
                </Box>
              </Button>
              <Box sx={{ flex: 1 }} />
            </Box>
            <Tabs 
              value={activeTab} 
              onChange={(event, newValue) => setActiveTab(newValue)}
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : true}
              allowScrollButtonsMobile
              sx={{
                minHeight: 64,
                '& .MuiTab-root': {
                  minHeight: 64,
                  py: 1.5,
                  px: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '& svg': {
                    marginBottom: '0 !important',
                    marginRight: 1
                  }
                }
              }}
            >
              <Tab icon={<PersonIcon />} label="Profile" />
              <Tab icon={<ShoppingBagIcon />} label="Orders" />
              <Tab icon={<FavoriteIcon />} label="Wishlist" />
              <Tab icon={<LocationOnIcon />} label="Addresses" />
              <Tab icon={<SettingsIcon />} label="Settings" />
            </Tabs>

          </Box>

          {/* Tab Content */}
          <Box sx={{ 
            flex: '1 1 auto',
            p: { xs: 2, sm: 3, md: 4 },
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
            // Responsive padding
            '@media (max-width: 600px)': {
              p: 1.5,
              '& > *': {
                maxWidth: '100%',
                mx: 'auto'
              }
            }
          }}>
            <Box sx={{ 
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '100%',
              margin: '0 auto',
              width: '100%'
            }}>
              {activeTab === 0 && renderProfileTab()}
              {activeTab === 1 && renderOrdersTab()}
              {activeTab === 2 && renderWishlistTab()}
              {activeTab === 3 && renderAddressesTab()}
              {activeTab === 4 && renderSettingsTab()}
            </Box>
          </Box>
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ProfilePage;
