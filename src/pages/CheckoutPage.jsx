import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import OrderCompleted from '@/components/checkout/OrderCompleted';
import { db } from '@/config/firebase';
import { formatPrice } from '@/utils/format';
import axios from 'axios';
import { countries, getStatesByCountry, getCitiesByState } from '@/utils/countryStateCity';
// Material-UI Components
import {
  Container, Typography, Paper, Stepper, Step, StepLabel, 
  Button, Box, Grid, TextField, FormControlLabel, Checkbox,
  Divider, Chip, CircularProgress, useTheme, useMediaQuery,
  Radio, RadioGroup, FormControl, FormLabel
} from '@mui/material';

// Icons
import {
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  LocalOfferOutlined as LocalOfferOutlinedIcon,
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  QrCode as QrCodeIcon,
  AccountBalance as AccountBalanceIcon,
  Google as GoogleIcon,
  Smartphone as SmartphoneIcon
} from '@mui/icons-material';

const steps = ['Shipping', 'Payment', 'Review'];

const CheckoutPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, cartTotal, cartSubtotal, discountAmount, clearCart, selectedPackaging, setSelectedPackaging } = useCart();
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false); // State to track if we should show the manual form (for new addresses)
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [directCheckoutItem, setDirectCheckoutItem] = useState(null);
  
  // Check for direct checkout item in location state
  useEffect(() => {
    if (location.state?.directCheckoutItem) {
      setDirectCheckoutItem(location.state.directCheckoutItem);
      // Clear the state to prevent issues on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  // Calculate the packaging price from cart items or direct checkout item
  const calculatePackagingPrice = useCallback(() => {
    if (directCheckoutItem) {
      // For direct checkout, use the item's packaging price or default
      const price = directCheckoutItem.packagingPrice 
        ? (typeof directCheckoutItem.packagingPrice === 'string' 
            ? parseFloat(directCheckoutItem.packagingPrice) 
            : directCheckoutItem.packagingPrice)
        : 0;
      return price > 0 ? price : 150;
    }
    
    if (!cart || cart.length === 0) return 0;
    
    // If there's only one item, use its packaging price directly
    if (cart.length === 1) {
      const item = cart[0];
      const price = typeof item.packagingPrice === 'string' 
        ? parseFloat(item.packagingPrice) || 0 
        : item.packagingPrice || 0;
      return price > 0 ? price : 150; // Default to 150 if no price found
    }
    
    // For multiple items, find the maximum packaging price
    const packagingPrices = cart.map(item => {
      // Handle both string and number packaging prices
      const price = typeof item.packagingPrice === 'string' 
        ? parseFloat(item.packagingPrice) || 0 
        : item.packagingPrice || 0;
      return price;
    });
    
    const maxPrice = Math.max(0, ...packagingPrices);
    return maxPrice > 0 ? maxPrice : 150; // Default to 150 if no price found
  }, [cart, directCheckoutItem]);

  // Initialize essential packaging state based on cart selection
  const [essentialPackaging, setEssentialPackaging] = useState({
    selected: selectedPackaging === 'essential',
    price: 0
  });

  // Update essential packaging state when selectedPackaging or cart changes
  useEffect(() => {
    const packagingPrice = calculatePackagingPrice();
    const isEssential = selectedPackaging === 'essential';
    
    // Only update if there's an actual change to prevent infinite loops
    setEssentialPackaging(prev => {
      const newPrice = isEssential ? packagingPrice : 0;
      if (prev.selected === isEssential && prev.price === newPrice) {
        return prev; // No change needed
      }
      return {
        selected: isEssential,
        price: newPrice
      };
    });
  }, [selectedPackaging, cart, calculatePackagingPrice]);
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    district: '',
    postalCode: '',
    country: 'India',
    phone: '',
    saveAddress: true
  });
  
  // Billing form data
  const [billingFormData, setBillingFormData] = useState({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: ''
  });
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expDate: '',
    cvv: '',
    nameOnCard: ''
  });
  
  // Location data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Calculate order totals
  const discountedSubtotal = cart.reduce((sum, item) => {
    const itemPrice = item.discount > 0 
      ? item.price * (1 - (item.discount / 100))
      : item.price;
    return sum + (itemPrice * (item.quantity || 1));
  }, 0);
  
  // Shipping is ₹50 only for essential packaging, free otherwise
  const shippingCost = essentialPackaging.selected ? 50 : 0;
  const tax = discountedSubtotal * 0.05;
  const packagingCost = essentialPackaging.selected ? essentialPackaging.price : 0;
  const orderTotal = discountedSubtotal + tax + shippingCost + packagingCost;

  // Fetch user's saved addresses on mount
  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!currentUser) return;
      
      try {
        // Get addresses from the addresses subcollection
        const addressesRef = collection(db, 'users', currentUser.uid, 'addresses');
        const snapshot = await getDocs(addressesRef);
        
        if (!snapshot.empty) {
          const addresses = [];
          snapshot.forEach(doc => {
            addresses.push({ id: doc.id, ...doc.data() });
          });
          
          setSavedAddresses(addresses);
          
          // Set the first address as default if form is empty
          if (addresses.length > 0 && !formData.address1) {
            setUserAddress(addresses[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching user addresses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAddress();
    setStates(getStatesByCountry('India'));
  }, [currentUser]);

  // Handle address selection from saved addresses
  const setUserAddress = (address) => {
    if (!address) {
      // Reset form for new address
      setFormData({
        firstName: '',
        lastName: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        district: '',
        postalCode: '',
        country: 'India',
        phone: '',
        saveAddress: true
      });
      return;
    }
    
    setFormData({
      ...formData,
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      address1: address.addressLine1 || '',
      address2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      district: address.district || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
      phone: address.phone || ''
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle payment input changes
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle country change
  const handleCountryChange = (e) => {
    const country = e.target.value;
    const countryStates = getStatesByCountry(country);
    setStates(countryStates);
    setCities([]);
    
    setFormData(prev => ({
      ...prev,
      country,
      state: '',
      city: ''
    }));
  };
  
  // Handle state change
  const handleStateChange = (e) => {
    const state = e.target.value;
    const stateCities = getCitiesByCountryAndState(formData.country, state);
    setCities(stateCities);
    
    setFormData(prev => ({
      ...prev,
      state,
      city: ''
    }));
  };
  
  // Handle pincode lookup
  const handlePincodeLookup = async () => {
    const pincode = formData.postalCode;
    if (!pincode || pincode.length !== 6) return;
    
    setIsLoadingLocation(true);
    
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data?.[0];
      
      if (data?.Status === 'Success' && data.PostOffice?.[0]) {
        const postOffice = data.PostOffice[0];
        setFormData(prev => ({
          ...prev,
          state: postOffice.State,
          city: postOffice.District,
          district: postOffice.District,
          postalCode: pincode
        }));
        
        const countryStates = getStatesByCountry('India');
        setStates(countryStates);
        
        if (postOffice.State) {
          const stateCities = getCitiesByState('India', postOffice.State);
          setCities(stateCities);
        }
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  // Handle step navigation
  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);
  
  // Update product quantities in the database
  const updateProductQuantities = async (items) => {
    try {
      const batch = writeBatch(db);
      
      for (const item of items) {
        const productRef = doc(db, 'products', item.id);
        
        // Add the update to the batch
        batch.update(productRef, {
          stock: increment(-(item.quantity || 1)),  // Decrease stock by the ordered quantity
          updatedAt: serverTimestamp()
        });
      }
      
      // Commit the batch
      await batch.commit();
      console.log('Successfully updated product quantities');
      return true;
    } catch (error) {
      console.error('Error updating product quantities:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Handle order submission
  const handlePlaceOrder = async () => {
    try {
      if (!currentUser) {
        console.error('User not logged in');
        return;
      }

      const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const orderId = `${currentUser.uid}_${Date.now()}`;
      
      // Get items for the order (either from direct checkout or cart)
      const orderItems = directCheckoutItem ? [{
        ...directCheckoutItem,
        // Ensure quantity is set (default to 1 if not provided)
        quantity: directCheckoutItem.quantity || 1
      }] : cart;
      
      // Calculate order totals
      const cartTotal = orderItems.reduce((sum, item) => {
        const displayPrice = item.discountedPrice || item.price;
        return sum + (displayPrice * (item.quantity || 1));
      }, 0);
      
      const tax = cartTotal * 0.05; // 5% tax
      const packagingPrice = calculatePackagingPrice();
      const isEssentialSelected = selectedPackaging === 'essential' || essentialPackaging.selected;
      const packagingCost = isEssentialSelected ? packagingPrice : 0;
      const shipping = isEssentialSelected ? 50 : 0;
      const grandTotal = cartTotal + tax + packagingCost + shipping;
      
      const orderData = {
        id: orderId,
        orderNumber,
        userId: currentUser.uid,
        userEmail: currentUser.email || formData.email,
        // Use formData for address information
        fullName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        // For backward compatibility
        userName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        userPhone: formData.phone || '',
        items: cart.map(item => {
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            quantity: item.quantity || 1,
            discount: item.discount || 0,
            productId: item.id,
            category: item.category || '',
            sku: item.sku || '',
            // Add any other product details that might be needed
            productData: {
              name: item.name,
              price: item.price,
            }
          };
        }),
        shippingAddress: { ...formData },
        billingAddress: billingSameAsShipping ? { ...formData } : { ...billingFormData },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
        subtotal: discountedSubtotal,
        discountAmount: discountAmount,
        shippingCost: shippingCost, // Changed from shipping to shippingCost to match Firestore rules
        packagingCost: essentialPackaging.price,
        selectedPackaging: selectedPackaging,
        tax,
        total: orderTotal,
        status: 'Processing',
        orderDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        notes: ''
      };
      
      console.log('Saving order with data:', JSON.stringify(orderData, null, 2));
      
      try {
        // Create a batch to ensure atomic updates
        const batch = writeBatch(db);
        
        // Save order to the main orders collection
        const orderRef = doc(db, 'orders', orderId);
        batch.set(orderRef, orderData);
        console.log('Order queued for main collection:', orderId);
        
        // Save to user's orders subcollection
        const userOrderRef = doc(collection(db, 'users', currentUser.uid, 'orders'), orderId);
        batch.set(userOrderRef, orderData);
        console.log('Order queued for user subcollection:', orderId);
        
        // Commit the batch
        await batch.commit();
        console.log('Order saved to both collections successfully');
        
        // Format order data for display
        setOrderDetails({
          ...orderData,
          orderDate: new Date().toISOString(),
          subtotal: formatPrice(orderData.subtotal),
          discountAmount: formatPrice(orderData.discountAmount),
          shipping: orderData.shippingCost === 0 ? 'Free' : formatPrice(orderData.shippingCost),
          tax: formatPrice(orderData.tax),
          total: formatPrice(orderData.total)
        });
      } catch (saveError) {
        console.error('Error saving order:', saveError);
        throw saveError; // Re-throw to be caught by the outer catch
      }
      
      // Update product quantities in the database
      await updateProductQuantities(cart);
      
      // Clear cart and navigate to order complete page with order details
      await clearCart();
      
      // Format order data for display
      const formattedOrder = {
        ...orderData,
        orderDate: new Date().toISOString(),
        subtotal: formatPrice(orderData.subtotal),
        discountAmount: formatPrice(orderData.discountAmount),
        shipping: orderData.shippingCost === 0 ? 'Free' : formatPrice(orderData.shippingCost),
        tax: formatPrice(orderData.tax),
        total: formatPrice(orderData.total)
      };
      
      // Navigate to order complete page with order details
      navigate('/ordercomplete', { 
        state: { 
          order: formattedOrder,
          orderNumber: orderNumber
        } 
      });
      
    } catch (error) {
      console.error('Error placing order:', error);
      // Show error message to user
      alert('There was an error processing your order. Please try again.');
      console.error('Order placement error details:', error.message);
    }
  };

  // Calculate packaging price
  const packagingPrice = calculatePackagingPrice();

  // Render the shipping address form
  const renderShippingForm = () => (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Select a Delivery Address</Typography>
          
          {/* Packaging Option */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: '600', fontSize: '1rem', color: 'text.primary' }}>
                <LocalShippingIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
                Packaging Protection
              </FormLabel>
              <RadioGroup
                value={selectedPackaging || 'free'}
                onChange={(e) => setSelectedPackaging(e.target.value)}
                sx={{ gap: 2 }}
              >
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mb: 2,
                    borderRadius: 1,
                    borderColor: selectedPackaging === 'free' ? 'primary.main' : 'divider',
                    borderWidth: selectedPackaging === 'free' ? 2 : 1,
                    bgcolor: selectedPackaging === 'free' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                    '&:hover': { borderColor: 'primary.light' },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => setSelectedPackaging('free')}
                >
                  {selectedPackaging === 'free' && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 50px 50px 0',
                      borderColor: 'transparent #4caf50 transparent transparent',
                    }}>
                      <CheckCircleIcon sx={{
                        position: 'absolute',
                        top: 6,
                        right: -42,
                        color: 'white',
                        fontSize: '1rem'
                      }} />
                    </Box>
                  )}
                  <FormControlLabel
                    value="free"
                    control={
                      <Radio 
                        color="primary" 
                        checked={selectedPackaging === 'free'}
                        onChange={() => {}}
                      />
                    }
                    label={
                      <Box sx={{ ml: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Standard Protection</Typography>
                          <Chip 
                            label="FREE" 
                            size="small" 
                            color="success"
                            variant="filled"
                            sx={{ 
                              fontWeight: 700, 
                              color: 'white',
                              fontSize: '0.8rem',
                              px: 1,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              textTransform: 'uppercase'
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Your items will be securely packed in our standard packaging.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
                
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    borderRadius: 1,
                    borderColor: selectedPackaging === 'essential' ? 'primary.main' : 'divider',
                    borderWidth: selectedPackaging === 'essential' ? 2 : 1,
                    bgcolor: selectedPackaging === 'essential' ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                    '&:hover': { borderColor: 'primary.light' },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => setSelectedPackaging('essential')}
                >
                  {selectedPackaging === 'essential' && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 50px 50px 0',
                      borderColor: 'transparent #1976d2 transparent transparent',
                    }}>
                      <CheckCircleIcon sx={{
                        position: 'absolute',
                        top: 6,
                        right: -42,
                        color: 'white',
                        fontSize: '1rem'
                      }} />
                    </Box>
                  )}
                  <FormControlLabel
                    value="essential"
                    control={
                      <Radio 
                        color="primary" 
                        checked={selectedPackaging === 'essential'}
                        onChange={() => {}}
                      />
                    }
                    label={
                      <Box sx={{ ml: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Premium Protection</Typography>
                          <Chip 
                            label={'₹' + packagingPrice} 
                            size="small" 
                            color="primary"
                            sx={{ 
                              height: 22, 
                              '& .MuiChip-label': { 
                                px: 1.25,
                                fontFeatureSettings: '"tnum"',
                                WebkitFontSmoothing: 'antialiased',
                                MozOsxFontSmoothing: 'grayscale',
                                textRendering: 'optimizeLegibility',
                                backfaceVisibility: 'hidden',
                                transform: 'translateZ(0)'
                              },
                              bgcolor: 'primary.main',
                              color: 'white',
                              fontWeight: 700, 
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%, 100%': { 
                                  transform: 'scale(1)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                                },
                                '50%': { 
                                  transform: 'scale(1.02)',
                                  boxShadow: '0 3px 6px rgba(0,0,0,0.15)'
                                }
                              },
                              '&:hover': {
                                bgcolor: 'primary.dark'
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Extra protective packaging with bubble wrap and paper slicing for fragile items.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
            </RadioGroup>
          </FormControl>
        </Paper>
          
          {/* Saved Addresses Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {savedAddresses.map((address, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper 
                  elevation={formData.address1 === (address.addressLine1 || '') ? 3 : 1}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: formData.address1 === (address.addressLine1 || '') ? 'primary.main' : 'transparent',
                    '&:hover': { borderColor: 'primary.light' },
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => {
                    setUserAddress(address);
                    setIsAddingNewAddress(false);
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {`${address.firstName || ''} ${address.lastName || ''}`.trim()}
                      </Typography>
                      {formData.address1 === (address.addressLine1 || '') && (
                        <CheckCircleIcon color="primary" fontSize="small" />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.city}, {address.state} {address.postalCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {address.country}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Phone: {address.phone}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
            
            {/* Add New Address Button */}
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  border: '2px dashed',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '180px',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => {
                  setFormData({
                    firstName: '',
                    lastName: '',
                    address1: '',
                    address2: '',
                    city: '',
                    state: '',
                    district: '',
                    postalCode: '',
                    country: 'India',
                    phone: '',
                    saveAddress: true
                  });
                  setIsAddingNewAddress(true);
                }}
              >
                <AddIcon sx={{ fontSize: 32, mb: 1, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  Add New Address
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        
        </Grid>
        
        {/* Manual Address Form - Only show if user clicks to add manually */}
        {isAddingNewAddress && (
          <Paper variant="outlined" sx={{ p: 3, mb: 3, width: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {savedAddresses.length > 0 ? 'Add New Address' : 'Enter Delivery Address'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                  <TextField
                  required
                  fullWidth
                  id="firstName"
                  name="firstName"
                  label="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  name="lastName"
                  label="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
          
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="address1"
                  name="address1"
                  label="Address line 1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address2"
                  name="address2"
                  label="Address line 2 (Optional)"
                  value={formData.address2}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
          
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  id="country"
                  name="country"
                  label="Country"
                  value={formData.country}
                  onChange={handleCountryChange}
                  margin="normal"
                  SelectProps={{ native: true }}
                >
                  {countries.map((country) => (
                    <option key={country.isoCode} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  id="state"
                  name="state"
                  label="State"
                  value={formData.state}
                  onChange={handleStateChange}
                  margin="normal"
                  disabled={!formData.country}
                  SelectProps={{ native: true }}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
          
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="city"
                  name="city"
                  label="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="postalCode"
                  name="postalCode"
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData(prev => ({ ...prev, postalCode: value }));
                  }}
                  onBlur={handlePincodeLookup}
                  margin="normal"
                  InputProps={{
                    endAdornment: isLoadingLocation && <CircularProgress size={20} />
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="phone"
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, phone: value }));
                  }}
                  margin="normal"
                />
              </Grid>
          
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      color="primary" 
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    />
                  }
                  label="Use this address for payment details"
                />
              </Grid>
              
              {!billingSameAsShipping && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Billing Address</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        name="billingFirstName"
                        label="First name"
                        value={billingFormData.firstName}
                        onChange={(e) => setBillingFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        name="billingLastName"
                        label="Last name"
                        value={billingFormData.lastName}
                        onChange={(e) => setBillingFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        name="billingAddress1"
                        label="Address line 1"
                        value={billingFormData.address1}
                        onChange={(e) => setBillingFormData(prev => ({ ...prev, address1: e.target.value }))}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="billingAddress2"
                        label="Address line 2 (Optional)"
                        value={billingFormData.address2}
                        onChange={(e) => setBillingFormData(prev => ({ ...prev, address2: e.target.value }))}
                        margin="normal"
                      />
                    </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="billingCity"
                    label="City"
                    value={billingFormData.city}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, city: e.target.value }))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="billingPostalCode"
                    label="Postal Code"
                    value={billingFormData.postalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setBillingFormData(prev => ({ ...prev, postalCode: value }));
                    }}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                sx={{ ml: 1 }}
                disabled={loading}
              >
                Continue to Payment
              </Button>
            </Box>
          </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* Continue to Payment Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, width: '100%' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!formData.address1 || !formData.city || !formData.postalCode}
          >
            Continue to Payment
          </Button>
        </Box>
      </Grid>
    </Box>
  );


  // Payment method options with Material-UI icons
  const paymentMethods = [
    { 
      id: 'credit-card', 
      label: 'Cards', 
      icon: <CreditCardIcon sx={{ fontSize: 24, color: '#ffffff' }} />
    },
    { 
      id: 'upi', 
      label: 'UPI', 
      icon: <QrCodeIcon sx={{ fontSize: 24, color: '#ffffff' }} />
    },
    { 
      id: 'netbanking', 
      label: 'NetBank', 
      icon: <AccountBalanceIcon sx={{ fontSize: 24, color: '#ffffff' }} />
    },
    { 
      id: 'gpay', 
      label: 'Google Pay', 
      icon: (
        <Box
          sx={{
            width: 52,
            height: 52,
            minWidth: 52,
            minHeight: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ffffff',
            padding: '6px',
            boxSizing: 'border-box',
            '& img': {
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }
          }}
        >
          <img 
            src="https://www.credithuman.com/getmedia/accf5b11-a240-4597-94a4-c3ea27b3908b/google-pay-logo-png.png" 
            alt="Google Pay"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain'
            }}
          />
        </Box>
      )
    },
    { 
      id: 'phonepe', 
      label: 'PhonePe', 
      icon: (
        <Box
          sx={{
            width: 52,
            height: 52,
            minWidth: 52,
            minHeight: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ffffff',
            padding: '10px',
            boxSizing: 'border-box',
            '& svg': {
              fill: '#5F259F',
              width: '100%',
              height: '100%',
              maxWidth: '32px',
              maxHeight: '32px',
              display: 'block',
              margin: '0 auto'
            }
          }}
        >
          <svg 
            role="img" 
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
          >
            <title>PhonePe</title>
            <path d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/>
          </svg>
        </Box>
      )
    }
  ];

  // Render the payment form
  const renderPaymentForm = () => (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleNext(); }} noValidate sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Payment Method</Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          {paymentMethods.map((method, index) => (
            <Grid item xs={12} sm={6} key={method.id}>
              <Paper 
                component={motion.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                elevation={0}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: paymentMethod === method.id ? 'primary.main' : 'rgba(0,0,0,0.08)',
                  background: 'linear-gradient(145deg, #fcfbff, #f5f3ff)',
                  boxShadow: '0 2px 8px rgba(95, 37, 159, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(95, 37, 159, 0.1)',
                    borderColor: 'primary.main',
                    background: 'linear-gradient(145deg, #f9f7ff, #f0ebff)'
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 6px rgba(95, 37, 159, 0.1)'
                  },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
                onClick={() => setPaymentMethod(method.id)}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: method.id === 'gpay' ? '16px' : '20px'
                }}>
                  {method.icon}
                </Box>
                <Typography variant="subtitle1">{method.label}</Typography>
                {paymentMethod === method.id && (
                  <CheckCircleIcon color="primary" sx={{ ml: 'auto' }} />
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Payment details form based on selected method */}
        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          {paymentMethod === 'credit-card' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Card Number"
                  placeholder="1234 5678 9012 3456"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setPaymentDetails(prev => ({
                      ...prev,
                      cardNumber: value.replace(/(\d{4})(?=\d)/g, '$1 ')
                    }));
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Name on Card"
                  value={paymentDetails.nameOnCard}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    nameOnCard: e.target.value
                  }))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={paymentDetails.expDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setPaymentDetails(prev => ({
                      ...prev,
                      expDate: value
                    }));
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="CVV"
                  type="password"
                  value={paymentDetails.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPaymentDetails(prev => ({
                      ...prev,
                      cvv: value
                    }));
                  }}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}

          {paymentMethod === 'netbanking' && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Select Bank</Typography>
              <Grid container spacing={2}>
                {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                  <Grid item xs={6} sm={4} key={bank}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Typography>{bank}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {paymentMethod === 'upi' && (
            <Box>
              <TextField
                fullWidth
                label="UPI ID"
                placeholder="yourname@upi"
                margin="normal"
                sx={{ mb: 2 }}
              />
              <Button variant="contained" fullWidth>
                Pay Now via UPI
              </Button>
            </Box>
          )}

          {(paymentMethod === 'phonepe' || paymentMethod === 'gpay') && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You will be redirected to {paymentMethod === 'phonepe' ? 'PhonePe' : 'Google Pay'} to complete your payment
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: paymentMethod === 'phonepe' ? '#5f259f' : '#4285F4',
                  '&:hover': {
                    bgcolor: paymentMethod === 'phonepe' ? '#4a1e7f' : '#357ABD',
                  },
                  mt: 2
                }}
                fullWidth
              >
                Pay with {paymentMethod === 'phonepe' ? 'PhonePe' : 'Google Pay'}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={handleBack}>Back</Button>
        <Button 
          type="submit" 
          variant="contained"
          disabled={paymentMethod === 'credit-card' && (
            !paymentDetails.cardNumber || 
            !paymentDetails.nameOnCard || 
            !paymentDetails.expDate || 
            !paymentDetails.cvv
          )}
        >
          Review Order
        </Button>
      </Box>
    </Box>
  );

  // Helper function to get display price with discount
  const getDisplayPrice = (item) => {
    return item.discount > 0 
      ? item.price * (1 - (item.discount / 100))
      : item.price;
  };
  
  // Render the order review
  const renderReviewOrder = () => {
    // Get the selected address from saved addresses if available
    const selectedAddress = savedAddresses.find(addr => 
      addr.addressLine1 === formData.address1 ||
      (addr.firstName === formData.firstName && addr.lastName === formData.lastName)
    );

    // Create address object with priority: selected saved address > form data
    const address = selectedAddress || {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      addressLine1: formData.address1 || '',
      addressLine2: formData.address2 || '',
      city: formData.city || '',
      state: formData.state || '',
      district: formData.district || '',
      postalCode: formData.postalCode || '',
      country: formData.country || 'India',
      phone: formData.phone || '',
      email: formData.email || currentUser?.email || ''
    };
    
    // Use direct checkout item if available, otherwise use cart
    const orderItems = directCheckoutItem ? [directCheckoutItem] : (cart || []);
    
    // Debug: Log order items to see their structure
    console.log('Order items in review:', JSON.parse(JSON.stringify(orderItems)));
    
    // Calculate order totals
    const cartTotal = orderItems.reduce((sum, item) => {
      // Calculate discounted price if discount exists, otherwise use regular price
      const displayPrice = item.discount > 0 
        ? item.price * (1 - (item.discount / 100))
        : item.price;
      return sum + (displayPrice * (item.quantity || 1));
    }, 0);
    
    const tax = cartTotal * 0.05; // 5% tax
    
    // Calculate packaging cost - ensure we always use the latest price
    const isEssentialSelected = selectedPackaging === 'essential' || essentialPackaging.selected;
    const packagingPrice = calculatePackagingPrice();
    const packagingCost = isEssentialSelected ? packagingPrice : 0;
    const shipping = isEssentialSelected ? 50 : 0;
    const grandTotal = cartTotal + tax + packagingCost + shipping;
    
    console.log('Packaging state:', { 
      selectedPackaging, 
      essentialPackaging, 
      isEssentialSelected, 
      packagingCost,
      orderItems: orderItems.map(i => ({ 
        id: i.id, 
        packagingPrice: i.packagingPrice,
        name: i.name
      }))
    });
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Review Your Order</Typography>
        
        {/* Order Summary */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" 
          sx={{ 
            fontWeight: 600, 
            mb: 2, 
            pb: 1.5, 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            color: 'text.primary'
          }}
          gutterBottom>Order Summary</Typography>
          {orderItems.map((item, index) => {
            // Calculate display price based on discount
            const displayPrice = item.discount > 0 
              ? item.price * (1 - (item.discount / 100))
              : item.price;
            const quantity = item.quantity || 1;
            return (
              <Box key={item.id || `item-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Product Image */}
                  <Box sx={{ 
                    width: 60, 
                    height: 60, 
                    flexShrink: 0,
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={
                        (function() {
                          // Try to get the image URL in this order of priority:
                          // 1. Direct image URL (string or object with url property)
                          // 2. First image from images array
                          // 3. Primary image from item.primaryImage
                          // 4. Fallback to placeholder
                          let imageUrl = null;
                          
                          // Case 1: Direct image URL (string or object with url property)
                          if (item.imageUrl) {
                            imageUrl = item.imageUrl;
                          } else if (item.image) {
                            // Handle both string and object formats
                            imageUrl = typeof item.image === 'string' ? item.image : item.image.url;
                          } 
                          // Case 2: First image from images array
                          else if (item.images && item.images.length > 0) {
                            imageUrl = typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url;
                          }
                          // Case 3: Primary image
                          else if (item.primaryImage) {
                            imageUrl = item.primaryImage;
                          }
                          
                          // Process the URL if we found one
                          if (imageUrl) {
                            // If it's a relative URL, make it absolute
                            if (typeof imageUrl === 'string' && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
                              return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                            }
                            return imageUrl;
                          }
                          
                          // Fallback to placeholder
                          return '/placeholder-product.jpg';
                        })()
                      }
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1">{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity} x ₹{displayPrice.toFixed(2)}
                      {item.discount > 0 && (
                        <span style={{ textDecoration: 'line-through', marginLeft: '8px', color: 'text.disabled' }}>
                          ₹{item.price.toFixed(2)}
                        </span>
                      )}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1">
                  ₹{(displayPrice * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            );
          })}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Order Summary */}
          <Box sx={{ mb: 3 }}>
            
            {/* Order Totals */}
            <Box sx={{ 
              '& > div': { 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.25,
                '&:not(:last-child)': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }
              } 
            }}>
              {/* Subtotal */}
              <Box>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  ₹{cartTotal.toFixed(2)}
                </Typography>
              </Box>
              
              {/* Packaging */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isEssentialSelected ? 'Essential Packaging' : 'Packaging'}
                  </Typography>
                  {isEssentialSelected && (
                    <CheckCircleIcon color="primary" sx={{ fontSize: '1rem' }} />
                  )}
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  {isEssentialSelected 
                    ? `₹${(packagingPrice).toFixed(2)}` 
                    : 'Free'}
                </Typography>
              </Box>
              
              {/* Shipping */}
              <Box>
                <Typography variant="body2" color="text.secondary">Shipping</Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 500, 
                  color: isEssentialSelected ? 'text.primary' : 'success.main' 
                }}>
                  {isEssentialSelected ? '₹50.00' : 'Free'}
                </Typography>
              </Box>
              
              {/* Tax */}
              <Box>
                <Typography variant="body2" color="text.secondary">Tax (5%)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  ₹{tax.toFixed(2)}
                </Typography>
              </Box>
              
              {/* Grand Total */}
              <Box sx={{ 
                pt: 2, 
                mt: 1,
                borderTop: '2px solid',
                borderColor: 'divider',
                '& .MuiTypography-root': {
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'primary.main'
                }
              }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    textAlign: 'left',
                    fontSize: { xs: '0.6rem', sm: '0.6.5rem', md: '0.7rem' },
                    lineHeight: 1.2
                  }}
                >
                  (Inclusive of all taxes)
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total:</Typography>
                  <Typography>₹{grandTotal.toFixed(2)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
        
        {/* Shipping Information */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Shipping Information</Typography>
            <Button onClick={() => setActiveStep(0)}>Edit</Button>
          </Box>
          <Box>
            {/* User's Real Name Display */}
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {`${address.firstName || ''} ${address.lastName || ''}`.trim()}
            </Typography>
            {/* Address Lines */}
            <Box sx={{ mt: 1 }}>
              {formData.address1 && (
                <Typography variant="body2">{formData.address1}</Typography>
              )}
              {formData.address2 && <Typography>{formData.address2}</Typography>}
              <Typography>
                {[formData.city, formData.state, formData.postalCode].filter(Boolean).join(', ')}
              </Typography>
              {address.phone && (
                <Typography variant="body2" sx={{ mb: 1 }}>Phone: {address.phone}</Typography>
              )}
              {formData.district && <Typography>{formData.district}</Typography>}
              {formData.country && formData.country !== 'India' && (
                <Typography>{formData.country}</Typography>
              )}
            </Box>
          </Box>
        </Paper>
        
        {/* Payment Method */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Payment Method</Typography>
            <Button onClick={() => setActiveStep(1)}>Change</Button>
          </Box>
          <Box>
            <Typography>
              <strong>Payment Method:</strong> {paymentMethods.find(m => m.id === paymentMethod)?.label || paymentMethod}
            </Typography>
            {paymentMethod === 'credit-card' && (
              <Typography>
                <strong>Card:</strong> •••• •••• •••• {paymentDetails.cardNumber?.slice(-4) || ''}
              </Typography>
            )}
          </Box>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={handleBack}>Back</Button>
          <Button 
            variant="contained" 
            onClick={handlePlaceOrder}
            size="large"
          >
            Place Order
          </Button>
        </Box>
      </Box>
    );
  };

  // Main render function
  const getStepContent = (step) => {
    switch(step) {
      case 0:
        return renderShippingForm();
      case 1:
        return renderPaymentForm();
      case 2:
        return renderReviewOrder();
      case 3:
        return (
          <OrderCompleted 
            orderDetails={orderDetails} 
            onContinueShopping={() => navigate('/')}
          />
        );
      default:
        throw new Error('Unknown step');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          <Box>
            <Typography variant="h5" gutterBottom>
              Thank you for your order.
            </Typography>
            <Typography variant="subtitle1">
              Your order has been placed successfully. We've sent a confirmation email with order details.
            </Typography>
          </Box>
        ) : (
          <>{getStepContent(activeStep)}</>
        )}
      </Paper>
    </Container>
  );
};

export default CheckoutPage;
