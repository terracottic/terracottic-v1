import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Rating,
  useMediaQuery,
  useTheme,
  Chip,
  Skeleton,
  Snackbar,
  Alert as MuiAlert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

const QuickView = ({ open, onClose, product }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { formatPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPopping, setIsPopping] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' or 'error'
  });
  const dialogRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        // Add pop effect before closing
        setIsPopping(true);
        setTimeout(() => {
          onClose();
          setIsPopping(false);
        }, 200); // Match this with CSS transition duration
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && product) {
      setActiveImage(0);
      setLoading(true);
      // Simulate loading
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open, product]);

  const handleClose = (event) => {
    event.stopPropagation();
    onClose();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!product) return null;

  const formatImageUrl = (url) => {
    if (!url) return '';
    let safeUrl = String(url);
    if (typeof url === 'object') {
      safeUrl = url.url || url.src || url.path || '';
    }
    return safeUrl.startsWith('http') ? safeUrl : 
           `http://localhost:3000/${safeUrl.replace(/^\/+/, '')}`;
  };

  const primaryImage = formatImageUrl(product.primaryImage);
  const secondaryImage = formatImageUrl(product.secondaryImage);
  const images = [primaryImage, secondaryImage].filter(Boolean);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setAddingToCart(true);
      const hasDiscount = product.originalPrice > product.price;
      const cartProduct = {
        ...product,
        // If there's an original price, it means the current price is already discounted
        price: hasDiscount ? product.price : product.originalPrice || product.price,
        // Set discountedPrice to the current price if there's a discount
        discountedPrice: hasDiscount ? product.price : undefined,
        // Calculate discount percentage if there's an original price
        discount: hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
        // Include the image URL for the cart
        imageUrl: product.primaryImage || product.images?.[0]?.url || '',
        quantity: 1
      };
      await addToCart(cartProduct);
      showSnackbar('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showSnackbar('Failed to add to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewDetails = () => {
    onClose();
    navigate(`/products/${product.id}`);
  };

  const handleWishlistClick = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setWishlistLoading(true);
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        showSnackbar('Removed from wishlist');
      } else {
        await addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          discount: product.discount,
          primaryImage: product.primaryImage,
          stock: product.stock
        });
        showSnackbar('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={false}
        sx={{
          '& .MuiDialog-paper': {
            margin: 0,
            width: '100%',
            maxWidth: isMobile ? '100%' : '900px',
            maxHeight: isMobile ? '100%' : '90vh',
            borderRadius: 2,
            overflow: 'hidden',
            transform: isPopping ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s ease-in-out',
            boxShadow: isPopping ? '0 0 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.15)',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          },
        }}
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        ref={dialogRef}
      >
        <DialogTitle sx={{ m: 0, p: 2, borderBottom: '1px solid', borderColor: 'divider', position: 'relative' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div">
              {product.name}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                color: (theme) => theme.palette.grey[500],
                '&:hover': {
                  color: (theme) => theme.palette.error.main,
                  transform: 'rotate(90deg)',
                  transition: 'transform 0.3s ease-in-out',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={4}>
            {/* Product Images */}
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', pt: '100%', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                {loading ? (
                  <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: 'absolute', top: 0, left: 0 }} />
                ) : (
                  <>
                    <Box
                      component="img"
                      src={images[activeImage] || primaryImage}
                      alt={product.name}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        p: 2,
                      }}
                    />
                    {product.discount > 0 && (
                      <Chip
                        label={`${product.discount}% OFF`}
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </>
                )}
              </Box>
              
              {!loading && images.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto', py: 1 }}>
                  {images.map((img, index) => (
                    <Box
                      key={index}
                      onClick={() => setActiveImage(index)}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: activeImage === index ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
                        cursor: 'pointer',
                        flexShrink: 0,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
            
            {/* Product Details */}
            <Grid item xs={12} md={6}>
              {loading ? (
                <Box>
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ mt: 4 }} />
                  <Skeleton variant="text" width="100%" height={80} sx={{ mt: 2 }} />
                  <Skeleton variant="rectangular" width={120} height={40} sx={{ mt: 4, borderRadius: 1 }} />
                </Box>
              ) : (
                <Box>
                  <Typography variant="h5" component="h1" fontWeight={600}>
                    {product.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                    <Rating value={product.rating || 4.5} precision={0.5} readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({product.reviewCount || 0} reviews)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ my: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                      {product.discount > 0 ? (
                        <>
                          <Typography 
                            variant="h5" 
                            color="primary" 
                            sx={{ 
                              fontWeight: 800,
                              fontSize: '1.5rem',
                              lineHeight: 1.2,
                              mr: 1
                            }}
                          >
                            {formatPrice(product.price * (1 - (product.discount / 100)))}
                          </Typography>
                          <Typography 
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              textDecoration: 'line-through',
                              opacity: 0.8,
                              mr: 1
                            }}
                          >
                            {formatPrice(product.price)}
                          </Typography>
                          <Chip 
                            label={`${product.discount}% OFF`} 
                            size="small" 
                            color="error"
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem',
                              fontWeight: 'bold'
                            }}
                          />
                        </>
                      ) : (
                        <Typography 
                          variant="h5" 
                          color="primary" 
                          sx={{ 
                            fontWeight: 800,
                            fontSize: '1.5rem',
                            lineHeight: 1.2
                          }}
                        >
                          {formatPrice(product.price)}
                        </Typography>
                      )}
                    </Box>
                    
                    {product.stock <= 0 ? (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        Out of Stock
                      </Typography>
                    ) : product.stock < 10 ? (
                      <Typography color="warning.main" variant="body2" sx={{ mt: 1 }}>
                        Only {product.stock} left in stock
                      </Typography>
                    ) : (
                      <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
                        In Stock
                      </Typography>
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="body1" 
                      paragraph
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 5, // Show approximately 5 lines of text
                        WebkitBoxOrient: 'vertical',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        maxHeight: '7.5em', // Roughly 5 lines of text
                      }}
                    >
                      {product.description 
                        ? product.description.length > 300 
                          ? `${product.description.substring(0, 300)}...`
                          : product.description
                        : 'No description available.'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={!addingToCart && <AddShoppingCartIcon />}
                      onClick={handleAddToCart}
                      disabled={product.stock <= 0 || addingToCart}
                      fullWidth={isMobile}
                      sx={{ 
                        py: 1.5, 
                        textTransform: 'none',
                        minWidth: isMobile ? '100%' : 150,
                        position: 'relative',
                        overflow: 'hidden',
                        '& .MuiButton-startIcon': {
                          marginRight: addingToCart ? 0 : '8px',
                          transition: 'margin-right 0.2s ease-in-out',
                        },
                        '& .MuiButton-label': {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        },
                      }}
                    >
                      {addingToCart ? (
                        <Box 
                          component="span" 
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            left: 0,
                            top: 0,
                          }}
                        >
                          <CircularProgress size={24} color="inherit" />
                        </Box>
                      ) : 'Add to Cart'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={
                        isInWishlist(product.id) ? (
                          <FavoriteBorderIcon color="error" />
                        ) : (
                          <FavoriteBorderIcon />
                        )
                      }
                      onClick={handleWishlistClick}
                      disabled={wishlistLoading}
                      sx={{
                        textTransform: 'none',
                        color: isInWishlist(product.id) ? 'error.main' : 'inherit',
                        borderColor: isInWishlist(product.id) ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                        '&:hover': {
                          borderColor: isInWishlist(product.id) ? 'error.dark' : 'rgba(0, 0, 0, 0.87)',
                          backgroundColor: isInWishlist(product.id) ? 'rgba(244, 67, 54, 0.04)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                      fullWidth={isMobile}
                    >
                      {isInWishlist(product.id) ? 'Wishlisted' : 'Wishlist'}
                    </Button>
                  </Box>
                  
                  <Button
                    variant="text"
                    color="primary"
                    onClick={handleViewDetails}
                    sx={{ mt: 2, textTransform: 'none' }}
                    fullWidth={isMobile}
                  >
                    View Full Details
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default QuickView;
