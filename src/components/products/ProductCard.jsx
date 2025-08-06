import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { addToRecentlyViewed } from '@/utils/recentlyViewed';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}));

const ProductImage = styled(CardMedia)({
  paddingTop: '100%',
  position: 'relative',
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
});

const BadgeContainer = styled(Box)({
  position: 'absolute',
  top: 8,
  left: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  zIndex: 1,
});

// Action buttons have been removed as per requirements

const ProductCard = ({ product, showCountdown = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { formatPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  // Hover state removed as hover effects are no longer needed
  const navigate = useNavigate();

  const isWishlisted = isInWishlist(product.id);
  const hasDiscount = product.originalPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      // Optionally redirect to login or show a login prompt
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Ensure we're passing the correct price structure to the cart
    const cartProduct = {
      ...product,
      // If there's an original price, it means the current price is already discounted
      price: hasDiscount ? product.price : product.originalPrice || product.price,
      // Set discountedPrice to the current price if there's a discount
      discountedPrice: hasDiscount ? product.price : undefined,
      // Calculate discount percentage if there's an original price
      discount: hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
      // Include the image URL for the cart
      imageUrl: product.images?.[0]?.url || product.imageUrl || '',
      quantity: 1
    };
    addToCart(cartProduct);
  };

  const handleCardClick = (e) => {
    // If the click was on a button, don't navigate
    if (e.target.closest('button, a, [role="button"]')) {
      return;
    }
    // Add to recently viewed before navigating
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || product.imageUrl || '',
      slug: product.slug || `product-${product.id}`,
      category: product.category || '',
      artist: product.artist || ''
    });
    // Navigate to product detail page using React Router
    navigate(`/product/${product.id}`);
  };

  return (
    <StyledCard 
      elevation={2}
      // Hover effects removed as per requirements
    >
      <CardActionArea 
        component={RouterLink} 
        to={`/product/${product.id}`}
        onClick={handleCardClick}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative', pt: '100%' }}>
          <ProductImage
            image={product.images?.[0]?.url || '/placeholder-product.jpg'}
            title={product.name}
          />
          
          {/* Badges */}
          <BadgeContainer>
            {product.isNew && (
              <Chip 
                label="New" 
                size="small" 
                color="primary" 
                sx={{ color: 'white', fontWeight: 'bold' }}
              />
            )}
            {hasDiscount && (
              <Chip 
                label={`${discountPercentage}% OFF`} 
                size="small" 
                color="error"
                sx={{ color: 'white', fontWeight: 'bold' }}
              />
            )}
          </BadgeContainer>

        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2, pb: 0 }}>
          <Typography 
            variant="subtitle2" 
            component="h3" 
            sx={{ 
              fontWeight: 500,
              mb: 0.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.8em',
            }}
          >
            {product.name}
          </Typography>
          
          <Box sx={{ mt: 1, mb: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
              minHeight: '2.5rem' // Ensure consistent height for price container
            }}>
              <Typography 
                variant="h6" 
                component="span" 
                color="primary"
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { 
                    xs: product.price >= 10000 ? '0.9rem' : '1rem', 
                    sm: product.price >= 10000 ? '1rem' : '1.1rem' 
                  },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  transition: 'font-size 0.2s ease-in-out'
                }}
              >
                {formatPrice(product.price)}
              </Typography>
              
              {hasDiscount && (
                <Typography 
                  variant="body2" 
                  component="span" 
                  sx={{ 
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    lineHeight: 1.2
                  }}
                >
                  {formatPrice(product.originalPrice)}
                </Typography>
              )}
            </Box>
            
            {product.rating > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {[...Array(5)].map((_, i) => (
                  <Box 
                    key={i}
                    component="span"
                    sx={{
                      color: i < Math.round(product.rating) ? 'gold' : 'grey.300',
                      fontSize: '1rem',
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </Box>
                ))}
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ ml: 0.5 }}
                >
                  ({product.reviewCount || 0})
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        {/* CardActions removed as per requirements */}
      </CardActionArea>
    </StyledCard>
  );
};

export default ProductCard;
