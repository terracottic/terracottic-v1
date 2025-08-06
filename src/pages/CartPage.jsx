import { useState, useEffect, useCallback } from 'react';
import Checkbox from '@mui/material/Checkbox';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Card,
  Chip,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  IconButton,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import GoogleIcon from '@mui/icons-material/Google';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PaymentIcon from '@mui/icons-material/Payment';
import { styled, keyframes } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  LocalShipping as ShippingIcon,
  LocalShipping,
  Discount as DiscountIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { InputAdornment } from '@mui/material';

// Format price in Indian Rupees
const formatPrice = (price) => {
  // Return empty string if price is not a valid number
  if (price === undefined || price === null || isNaN(price)) {
    return '';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};

const CartPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { 
    cart: cartItems, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    cartTotal,
    cartSubtotal,
    getDiscountAmount,
    appliedCoupon,
    couponError,
    setCouponError,
    applyCoupon,
    removeCoupon,
    selectedPackaging,
    setSelectedPackaging
  } = useCart();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // Initialize loading states when cart items change
  useEffect(() => {
    const newStatus = {};
    cartItems.forEach(item => {
      
    });
    
    cartItems.forEach(item => {
      
    });
    
    cartItems.forEach(item => {
      
    });
    
  }, [cartItems]);
  const [discount, setDiscount] = useState(0);
  
  // Packaging selection is managed by CartContext
  const [selectedItems, setSelectedItems] = useState({});
  
  // Initialize selected items when cart changes
  useEffect(() => {
    const initialSelected = {};
    cartItems.forEach(item => {
      initialSelected[item.id] = true; // Default all items as selected
    });
    setSelectedItems(initialSelected);
  }, [cartItems]);
  
  // Toggle item selection
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Select all items
  const selectAllItems = () => {
    const allSelected = {};
    cartItems.forEach(item => {
      allSelected[item.id] = true;
    });
    setSelectedItems(allSelected);
  };
  
  // Deselect all items
  const deselectAllItems = () => {
    setSelectedItems({});
  };
  
  // Handle packaging selection
  const handlePackagingSelect = (packagingType) => {
    setSelectedPackaging(packagingType);
  };

  // Calculate packaging cost based on selected items and packaging type
  const getPackagingCost = () => {
    // If free packaging is selected or a free_packaging/free_shipping coupon is applied, return 0
    if (selectedPackaging === 'free' || 
        (appliedCoupon && (appliedCoupon.type === 'free_packaging' || appliedCoupon.type === 'free_shipping'))) {
      return 0;
    }

    // Get all packaging prices from selected items
    const packagingPrices = selectedCartItems
      .map(item => parseFloat(item.packagingPrice) || 0);

    // If no items, return 0
    if (packagingPrices.length === 0) {
      return 0;
    }

    // Get the highest packaging price from selected items
    const maxPackagingPrice = Math.max(...packagingPrices);
    
    // For premium packaging, ensure minimum of ₹150
    if (selectedPackaging === 'premium') {
      return Math.max(150, maxPackagingPrice);
    }
    
    // For essential packaging, show the highest packaging price from selected items
    return maxPackagingPrice;
  };

  // Helper function to get the display price with discount applied
  const getDisplayPrice = (item) => {
    return item.discount > 0 
      ? item.price * (1 - (item.discount / 100))
      : item.price;
  };

  // Calculate cart totals (in INR) for selected items only
  const selectedCartItems = cartItems.filter(item => selectedItems[item.id]);
  
  // Calculate subtotal using discounted prices
  const subtotal = selectedCartItems.reduce((sum, item) => {
    const itemPrice = item.discount > 0 
      ? item.price * (1 - (item.discount / 100))
      : item.price;
    return sum + (itemPrice * (item.quantity || 1));
  }, 0);
  
  // Calculate original subtotal (without product discounts) for reference
  const originalSubtotal = selectedCartItems.reduce((sum, item) => {
    return sum + (item.price * (item.quantity || 1));
  }, 0);
  
  // Shipping is free by default, only charge for essential shipping
  const shipping = selectedCartItems.length > 0 && selectedPackaging === 'essential' ? 50 : 0; // ₹50 only for essential shipping
  const packagingCost = selectedCartItems.length > 0 ? getPackagingCost() : 0;
  
  // Calculate discount based on selected items' subtotal
  const discountAmount = getDiscountAmount(subtotal);
  
  // Calculate final total after applying coupon discount and packaging cost
  const maxDiscount = Math.min(discountAmount, subtotal);
  const total = Math.max(0, subtotal - maxDiscount + shipping + packagingCost);
  
  // Check if all items are selected
  const allItemsSelected = cartItems.length > 0 && Object.values(selectedItems).every(Boolean);
  const someItemsSelected = Object.values(selectedItems).some(Boolean) && !allItemsSelected;
  
  // Update item quantity
  // const updateQuantity = async (id, newQuantity) => {
  //   if (newQuantity < 1) return;
    
  //   const item = cartItems.find(item => item.id === id);
  //   if (!item) return;
    
  //   // Update the quantity in the cart
  //   // await updateCartQuantity(id, newQuantity);
  // };
  
  // Remove item from cart
  const removeItem = async (id) => {
    // await removeFromCart(id);
  };
  
  // Handle coupon code submission
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    setIsApplyingCoupon(true);
    const result = await applyCoupon(couponCode);
    setIsApplyingCoupon(false);
    
    if (result.success) {
      setCouponCode(''); // Clear the input field on success
    }
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (error) {
      console.error('Error applying coupon:', error);
    } finally {
      setIsApplyingCoupon(false);
    }
  };
  
  // Handle removing coupon
  const handleRemoveCoupon = async () => {
    setIsApplyingCoupon(true);
    await removeCoupon();
    setIsApplyingCoupon(false);
  };
  
  // Proceed to checkout
  const handleCheckout = () => {
    if (!currentUser) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Navigate to the checkout page
    navigate('/checkout');
  };
  
  // Helper to determine if item is in stock
  const isItemInStock = (item) => {
    // If stock is explicitly defined, use that
    if (item.stock !== undefined) {
      return item.stock > 0;
    }
    // Fallback to inStock flag if stock is not defined
    return item.inStock !== false; // Default to true if not specified
  };
 
  // Handle login redirect
  const handleLogin = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  // Handle register redirect
  const handleRegister = () => {
    navigate('/register', { state: { from: location.pathname } });
  };
  
  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Looks like you haven't added anything to your cart yet.
        </Typography>
        <Button 
          variant="contained" 
          component={RouterLink} 
          to="/products"
          size="large"
          sx={{ mt: 2 }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Continue Shopping
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Cart
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items in your cart
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={allItemsSelected}
                      indeterminate={someItemsSelected}
                      onChange={() => allItemsSelected ? deselectAllItems() : selectAllItems()}
                    />
                  </TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow 
                    key={item.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                      },
                      ...(!selectedItems[item.id] ? { 
                        opacity: 0.6,
                        backgroundColor: 'action.disabledBackground',
                      } : {})
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={!!selectedItems[item.id]}
                        onChange={() => toggleItemSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 80, height: 80, flexShrink: 0 }}>
                          <img 
                            src={(function() {
                              // Debug log the item to see what image data we have
                              console.log('Cart Item Image Debug:', {
                                id: item.id,
                                imageUrl: item.imageUrl,
                                images: item.images,
                                image: item.image
                              });
                              
                              // Try to get the image URL in this order of priority:
                              // 1. Direct image URL
                              // 2. First image from images array
                              // 3. Image object with url property
                              // 4. Fallback to placeholder
                              const imageUrl = 
                                (item.imageUrl) ||
                                (item.images && item.images[0]?.url) ||
                                (item.image?.url) ||
                                (typeof item.image === 'string' ? item.image : null);
                              
                              console.log('Selected Image URL:', imageUrl);
                              
                              // If we have a valid URL, make sure it's absolute
                              if (imageUrl) {
                                // If it's a relative URL, make it absolute
                                if (typeof imageUrl === 'string' && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
                                  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
                                }
                                return imageUrl;
                              }
                              
                              // Fallback to placeholder
                              return '/placeholder-product.jpg';
                            })()}
                            alt={item.name}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              borderRadius: theme.shape.borderRadius
                            }}
                            onError={(e) => {
                              e.target.onerror = null; // Prevent infinite loop
                              e.target.src = '/placeholder-product.jpg';
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1">{item.name}</Typography>
                          {!isItemInStock(item) ? (
                            <Typography variant="body2" color="error">
                              Out of Stock
                            </Typography>
                          ) : item.stock < 5 && item.stock > 0 ? (
                            <Typography variant="body2" color="warning.main">
                              Only {item.stock} left in stock
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {item.discount > 0 ? (
                          <>
                            <Typography
                              variant="h6"
                              color="primary"
                              sx={{
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                lineHeight: 1.2,
                                textAlign: 'right'
                              }}
                            >
                              {formatPrice(item.price * (1 - (item.discount / 100)))}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  textDecoration: 'line-through',
                                  opacity: 0.8,
                                  mr: 1
                                }}
                              >
                                {formatPrice(item.price)}
                              </Typography>
                              <Chip
                                label={`${item.discount}% OFF`}
                                size="small"
                                color="error"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                          </>
                        ) : (
                          <Typography
                            variant="h6"
                            color="primary"
                            sx={{
                              fontWeight: 800,
                              fontSize: '1.1rem',
                              lineHeight: 1.2,
                              textAlign: 'right'
                            }}
                          >
                            {formatPrice(item.price)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          type="number"
                          inputProps={{ 
                            min: 1, 
                            max: item.maxQuantity,
                            style: { 
                              width: '40px', 
                              textAlign: 'center',
                              WebkitAppearance: 'textfield',
                              MozAppearance: 'textfield',
                            } 
                          }}
                          variant="standard"
                          sx={{ 
                            '& .MuiInput-root': { 
                              '&:before, &:after': { 
                                display: 'none' 
                              } 
                            },
                            '& .MuiInput-input': {
                              padding: '8px 0',
                            },
                          }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxQuantity}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatPrice(getDisplayPrice(item) * item.quantity)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => removeFromCart(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Coupon Code */}
          <Box sx={{ mt: 4, width: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Have a coupon code?
            </Typography>
            <Box component="form" onSubmit={handleApplyCoupon} sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (couponError) setCouponError('');
                  }}
                  disabled={isApplyingCoupon || !!appliedCoupon}
                  error={!!couponError}
                  helperText={couponError}
                  sx={{ flexGrow: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DiscountIcon color={appliedCoupon ? 'success' : 'action'} />
                      </InputAdornment>
                    ),
                  }}
                />
                {appliedCoupon ? (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleRemoveCoupon}
                    disabled={isApplyingCoupon}
                    startIcon={<CloseIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    type="submit"
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    startIcon={isApplyingCoupon ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                  </Button>
                )}
              </Box>
              {appliedCoupon && (
                <Box sx={{ 
                  mt: 1, 
                  p: 1.5, 
                  bgcolor: 'success.50', 
                  border: '1px solid',
                  borderColor: 'success.100',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="success.dark" fontWeight={500}>
                      Coupon <strong>{appliedCoupon.code}</strong> applied
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {appliedCoupon.type === 'percentage' 
                        ? `${appliedCoupon.value}% off` 
                        : appliedCoupon.type === 'fixed' 
                          ? `₹${appliedCoupon.value} off`
                          : 'Special offer applied'}
                      {appliedCoupon.maxDiscount && appliedCoupon.type === 'percentage' && 
                        ` (max ₹${appliedCoupon.maxDiscount})`}
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    color="inherit"
                    onClick={handleRemoveCoupon}
                    sx={{ 
                      color: 'error.main',
                      minWidth: 'auto',
                      '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' }
                    }}
                    startIcon={<CloseIcon fontSize="small" />}
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
        
        {/* Order Summary */}
        
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Order Summary
            </Typography>
            {/* Packaging Options */}
            <Box sx={{ mb: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Select Packaging
                  </Typography>
                  {(appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') && (
                    <Chip 
                      label={appliedCoupon.type === 'free_shipping' ? 'Free Shipping & Packaging' : 'Free Packaging Applied'} 
                      size="small" 
                      color="success"
                      sx={{ 
                        height: 20, 
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                </Box>
                
                {/* Free Packaging - Rice Straw */}
                <Box 
                  onClick={() => setSelectedPackaging('free')}
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: selectedPackaging === 'free' ? 'success.main' : 'divider',
                    bgcolor: selectedPackaging === 'free' ? 'success.light' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'success.main',
                      bgcolor: selectedPackaging === 'free' ? 'success.light' : 'success.light',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={700} 
                        color={selectedPackaging === 'free' ? 'common.white' : 'text.primary'}
                        sx={{
                          textShadow: selectedPackaging === 'free' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Free Packaging
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={selectedPackaging === 'free' ? 'common.white' : 'text.secondary'}
                        sx={{
                          fontWeight: selectedPackaging === 'free' ? 500 : 400,
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Eco-friendly rice straw padding
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={700} 
                      color={selectedPackaging === 'free' ? 'common.white' : 'text.primary'}
                      sx={{
                        bgcolor: selectedPackaging === 'free' ? 'success.main' : 'transparent',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        transition: 'all 0.2s ease-in-out',
                        fontWeight: 600,
                      }}
                    >
                      {selectedPackaging === 'free' ? '✓ Selected' : 'Free'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Essential Packaging - Bubble Wrap */}
                <Box 
                  onClick={() => handlePackagingSelect('essential')}
                  sx={{
                    p: 2,
                    mb: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: selectedPackaging === 'essential' ? 'success.main' : 'divider',
                    bgcolor: selectedPackaging === 'essential' ? 'success.light' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') ? 0.6 : 1,
                    pointerEvents: (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') ? 'none' : 'auto',
                    position: 'relative',
                    '&:hover': {
                      borderColor: (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') ? 'divider' : 'success.main',
                      bgcolor: selectedPackaging === 'essential' ? 'success.light' : 'success.light',
                    },
                  }}
                >
                  {appliedCoupon?.type === 'free_packaging' && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: 'rgba(255, 255, 255, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      borderRadius: '4px',
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        {appliedCoupon.type === 'free_shipping' ? 'Free with shipping' : 'Included with coupon'}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight={selectedPackaging === 'essential' ? 700 : 600}
                        color={selectedPackaging === 'essential' ? 'common.white' : 'text.primary'}
                        sx={{
                          textShadow: selectedPackaging === 'essential' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Essential Packaging
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color={selectedPackaging === 'essential' ? 'common.white' : 'text.secondary'}
                        sx={{
                          fontWeight: selectedPackaging === 'essential' ? 500 : 400,
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Bubble wrap and sliced paper padding
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontWeight={selectedPackaging === 'essential' ? 700 : 500}
                      color={selectedPackaging === 'essential' ? 'common.white' : (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') ? 'success.main' : 'text.primary'}
                      sx={{
                        bgcolor: selectedPackaging === 'essential' 
                          ? 'success.main' 
                          : (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping')
                            ? 'success.light' 
                            : 'transparent',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        transition: 'all 0.2s ease-in-out',
                        fontWeight: 600,
                        textDecoration: (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') ? 'line-through' : 'none',
                        position: 'relative',
                        '&:after': (appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') ? {
                          content: '"Free"',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          textAlign: 'center',
                          color: 'success.main',
                          textDecoration: 'none',
                        } : {}
                      }}
                    >
                      {(appliedCoupon?.type === 'free_packaging' || appliedCoupon?.type === 'free_shipping') 
                        ? 'Free'
                        : selectedPackaging === 'essential' 
                          ? '✓ Selected' 
                          : `+ ₹${selectedCartItems.length > 0 ? Math.max(0, ...selectedCartItems.map(item => Number(item.packagingPrice) || 0)) : '0'}`}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Premium Packaging - Hidden for now */}
                {false && (
                  <Box 
                    onClick={() => setSelectedPackaging('premium')}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: selectedPackaging === 'premium' ? 'success.main' : 'divider',
                      bgcolor: selectedPackaging === 'premium' ? 'success.light' : 'action.disabledBackground',
                      position: 'relative',
                      cursor: 'pointer',
                      opacity: selectedPackaging === 'premium' ? 1 : 0.7,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'success.main',
                        bgcolor: selectedPackaging === 'premium' ? 'success.light' : 'success.light',
                        opacity: 1,
                      },
                      '&::after': {
                        content: '"Coming Soon"',
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        fontSize: '0.7rem',
                        px: 1,
                        borderRadius: 1,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ opacity: selectedPackaging === 'premium' ? 1 : 0.7 }}>
                          Premium Packaging
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ opacity: selectedPackaging === 'premium' ? 1 : 0.7 }}>
                          Custom foam protection (most secure)
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color={selectedPackaging === 'premium' ? 'success.dark' : 'text.secondary'}
                        fontWeight={selectedPackaging === 'premium' ? 600 : 400}
                        sx={{ opacity: selectedPackaging === 'premium' ? 1 : 0.7 }}
                      >
                        {selectedPackaging === 'premium' ? '✓ Selected' : '+ ₹150'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Subtotal</Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    {originalSubtotal > subtotal ? (
                      <>
                        <Typography 
                          variant="h6" 
                          color="primary"
                          sx={{ fontWeight: 800, fontSize: '1.1rem' }}
                        >
                          {formatPrice(subtotal)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ textDecoration: 'line-through', opacity: 0.8 }}
                        >
                          {formatPrice(originalSubtotal)}
                        </Typography>
                      </>
                    ) : (
                      <Typography 
                        variant="h6" 
                        color="primary"
                        sx={{ fontWeight: 800, fontSize: '1.1rem' }}
                      >
                        {formatPrice(subtotal)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Shipping</Typography>
                  <Typography>{shipping === 0 ? 'Free' : formatPrice(shipping)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Packaging</Typography>
                  <Typography>{packagingCost > 0 ? `+${formatPrice(packagingCost)}` : 'Free'}</Typography>
                </Box>
                
              
              {discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="success.main">Coupon Discount</Typography>
                  <Typography color="success.main">-{formatPrice(discountAmount)}</Typography>
                </Box>
              )}
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="success.main">Promo Discount</Typography>
                  <Typography color="success.main">-{formatPrice(discount)}</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  {appliedCoupon && (
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      {formatPrice(total + discountAmount)}
                    </Typography>
                  )}
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(total)}
                  </Typography>
                  {appliedCoupon && (
                    <Typography variant="caption" color="success.main">
                      You saved {formatPrice(discountAmount)}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Free shipping message removed as per request */}
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleCheckout}
                disabled={!Object.values(selectedItems).some(Boolean)}
                sx={{ mt: 1 }}
              >
                {currentUser ? `Proceed to Checkout (${Object.values(selectedItems).filter(Boolean).length} items)` : 'Login to Checkout'}
              </Button>
              
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                or{' '}
                <MuiLink 
                  component={RouterLink} 
                  to="/products" 
                  color="primary"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Continue Shopping
                </MuiLink>
              </Typography>
            </Box>
          </Paper>
          
          {/* Payment Methods */}
          <Paper 
            elevation={0} 
            variant="outlined" 
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{ 
              p: 2, 
              mt: 2, 
              borderRadius: 2, 
              border: '1px solid rgba(0,0,0,0.04)',
              background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
              Payment Methods
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1.5,
              '& > *': {
                flex: '1 0 auto',
                minWidth: 60,
                maxWidth: 80,
              }
            }}>
              {[
                { 
                  icon: <CreditCardIcon sx={{ fontSize: 24, color: '#1A237E' }} />, 
                  label: 'Cards' 
                },
                { 
                  icon: <QrCodeIcon sx={{ fontSize: 24, color: '#00B9F5' }} />, 
                  label: 'UPI' 
                },
                { 
                  icon: <AccountBalanceIcon sx={{ fontSize: 24, color: '#1A237E' }} />, 
                  label: 'NetBank' 
                },
                { 
                  icon: <GoogleIcon sx={{ fontSize: 24, color: '#4285F4' }} />, 
                  label: 'GPay' 
                },
                { 
                  icon: <SmartphoneIcon sx={{ fontSize: 24, color: '#5F259F' }} />, 
                  label: 'PhonePe' 
                },
              ].map((method, i) => (
                <Box 
                  key={i} 
                  component={motion.div}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  sx={{ 
                    textAlign: 'center',
                    p: 1,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      '& .payment-icon': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                      '& .payment-label': {
                        color: 'primary.main',
                        fontWeight: 500
                      }
                    }
                  }}
                >
                  <Box 
                    className="payment-icon"
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      mb: 0.5,
                      mx: 'auto',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.03)'
                    }}
                  >
                    {method.icon}
                  </Box>
                  <Typography 
                    className="payment-label"
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.65rem',
                      fontWeight: 400,
                      color: 'text.secondary',
                      transition: 'all 0.2s',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {method.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                mt: 1.5,
                pt: 1,
                textAlign: 'center',
                color: 'text.secondary',
                fontSize: '0.7rem',
                borderTop: '1px dashed',
                borderColor: 'divider',
                '&:before': {
                  content: '"🔒"',
                  mr: 0.5,
                  opacity: 0.8
                }
              }}
            >
              Secure & Encrypted Payments
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Login/Register Prompt Dialog */}
      {showLoginPrompt && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300
          }}
          onClick={() => setShowLoginPrompt(false)}
        >
          <Paper 
            sx={{ 
              p: 4, 
              maxWidth: 400, 
              width: '100%',
              textAlign: 'center',
              '&:hover': {
                cursor: 'default'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" gutterBottom>
              Login Required
            </Typography>
            <Typography variant="body1" paragraph>
              You need to be logged in to proceed to checkout.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => setShowLoginPrompt(false)}
              >
                Continue as Guest
              </Button>
              <Button 
                variant="contained" 
                onClick={handleLogin}
                sx={{ ml: 1 }}
              >
                Login
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button 
                  color="primary" 
                  size="small" 
                  onClick={handleRegister}
                  sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                  Register here
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default CartPage;
