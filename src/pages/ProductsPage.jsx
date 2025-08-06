import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '@/contexts/ProductContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import { useTheme, styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Rating,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Skeleton,
  Pagination,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import CategoryIcon from '@mui/icons-material/Category';
import ChairIcon from '@mui/icons-material/Chair';
import KitchenIcon from '@mui/icons-material/Kitchen';
import BathtubIcon from '@mui/icons-material/Bathtub';
import DeckIcon from '@mui/icons-material/Deck';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WallpaperIcon from '@mui/icons-material/Wallpaper';

// Styled Components
const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  margin: 0,
  border: '1px solid #e0e0e0',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    '& .product-image': {
      transform: 'scale(1.05)',
    },
  },
}));

const ProductImageWrapper = styled(Box)({
  position: 'relative',
  paddingTop: '100%',
  overflow: 'hidden',
});

const ProductImage = styled(CardMedia)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'opacity 0.3s ease-in-out, transform 0.5s ease-in-out',
});

// Mobile/Tablet Action Buttons
const MobileActions = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1),
  right: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  zIndex: 2,
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  '& button': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: 36,
    height: 36,
    pointerEvents: 'auto',
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: 'white',
      transform: 'scale(1.1)',
    },
  },
}));

// Desktop Action Buttons
const ProductActions = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
  opacity: 0,
  transform: 'translateY(100%)',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
  '& button': {
    boxShadow: theme.shadows[2],
  },
  '&:hover': {
    opacity: 1,
    transform: 'translateY(0)',
  },
}));

const PriceWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(1),
  '& .original-price': {
    textDecoration: 'line-through',
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1),
  },
  '& .sale-price': {
    color: theme.palette.error.main,
    fontWeight: 'bold',
  },
  '& .discount-chip': {
    ml: 1,
    height: 20,
    fontSize: '0.65rem',
    color: theme.palette.error.main,
    fontWeight: 'bold',
  },
}));

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'furniture':
      return <ChairIcon fontSize="small" />;
    case 'kitchenware':
      return <KitchenIcon fontSize="small" />;
    case 'bath':
      return <BathtubIcon fontSize="small" />;
    case 'garden':
      return <DeckIcon fontSize="small" />;
    case 'decor':
      return <WallpaperIcon fontSize="small" />;
    case 'plants':
      return <LocalFloristIcon fontSize="small" />;
    default:
      return <CategoryIcon fontSize="small" />;
  }
};

const ProductsPage = () => {
  const { products, loading } = useProducts();
  const { formatPrice } = useCurrency();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState({});
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  
  // Read search query from URL on component mount and when location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    if (searchQuery) {
      setSearchTerm(searchQuery);
      // Reset to first page when search changes
      setPage(1);
    }
  }, [location.search]);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  
  // Extract unique categories
  const categories = ['all', ...new Set(products.map(product => product?.category).filter(Boolean))];
  const productsPerPage = 12;
  
  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (!product) return false;
      // If there's a search term, only include products that match it
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower) ||
          product.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      // If no search term, only filter by category
      return category === 'all' || product.category === category;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });
  
  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );
  
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };
  
  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser) {
      setAuthDialogTab(0); // Show login tab first
      setShowAuthDialog(true);
      return;
    }
    
    try {
      const result = await addToCart(product);
      if (result.success) {
        toast.success(`${product.name} added to cart!`);
      } else {
        toast.error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('An error occurred while adding to cart');
    }
  };
  
  const handleWishlistClick = async (e, product) => {
    e.stopPropagation();
    setWishlistLoading(prev => ({ ...prev, [product.id]: true }));
    
    try {
      if (isInWishlist(product.id)) {
        const result = await removeFromWishlist(product.id);
        if (result.success) {
          toast.success(`${product.name} removed from wishlist`);
        } else {
          toast.error(result.error || 'Failed to remove from wishlist');
        }
      } else {
        const result = await addToWishlist(product);
        if (result.success) {
          toast.success(`${product.name} added to wishlist!`);
        } else {
          toast.error(result.error || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('An error occurred while updating wishlist');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const { currentUser } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState(0);

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      '& .MuiContainer-root': {
        width: '100%',
        maxWidth: '100%',
        padding: '0 !important',
        margin: 0,
      }
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        px: { xs: 2, sm: 3, md: 4 },
      }}>
        {/* Page Header */}
        <Box sx={{ py: 4, background: 'linear-gradient(to bottom, #f9f5f0, #ffffff)' }}>
          <Container maxWidth="xl">
            <Box 
              sx={{ 
                mb: 6,
                textAlign: 'center',
                '&::after': {
                  content: '""',
                  display: 'block',
                  width: '80px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #8B4513, #D2B48C)',
                  margin: '20px auto 0',
                  borderRadius: '2px',
                }
              }}
            >
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800, 
                  color: 'primary.main',
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  mb: 2,
                  position: 'relative',
                  display: 'inline-block',
                  '&::before, &::after': {
                    content: '"✧"',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#D2B48C',
                    fontSize: '1.5rem',
                  },
                  '&::before': { left: -40 },
                  '&::after': { right: -40 },
                  '@media (max-width: 600px)': {
                    '&::before, &::after': {
                      fontSize: '1.2rem',
                    },
                    '&::before': { left: -30 },
                    '&::after': { right: -30 },
                  }
                }}
              >
                Discover Our Collection
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  maxWidth: 800, 
                  mx: 'auto',
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                  mb: 4,
                  position: 'relative',
                  '&::before, &::after': {
                    content: '"❝"',
                    position: 'absolute',
                    color: 'rgba(139, 69, 19, 0.2)',
                    fontSize: '3rem',
                    lineHeight: 1,
                  },
                  '&::before': {
                    top: -15,
                    left: -30,
                  },
                  '&::after': {
                    bottom: -30,
                    right: -30,
                    transform: 'rotate(180deg)',
                  }
                }}
              >
                Each piece in our collection is handcrafted with love and tradition, bringing the essence of Indian craftsmanship to your home.
              </Typography>
              
              {/* Search and Filter Section */}
              <Box 
                sx={{ 
                  mb: 6,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  background: 'white',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Search Input */}
                  <Grid item xs={12} md={4}>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      navigate(`/products${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
                    }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </form>
                  </Grid>

                  {/* Category Filter */}
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel 
                        id="category-label"
                        sx={{
                          color: 'text.secondary',
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        Category
                      </InputLabel>
                      <Select
                        labelId="category-label"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        label="Category"
                        sx={{
                          borderRadius: 2,
                          bgcolor: 'rgba(210, 180, 140, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(210, 180, 140, 0.15)',
                            boxShadow: '0 4px 12px rgba(210, 180, 140, 0.2)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            boxShadow: '0 0 0 2px rgba(139, 69, 19, 0.3)'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          },
                          '& .MuiSelect-select': {
                            padding: '14px 14px',
                            display: 'flex',
                            alignItems: 'center'
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'primary.main',
                            right: '12px'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              mt: 1,
                              borderRadius: 2,
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                              '& .MuiMenuItem-root': {
                                padding: '10px 16px',
                                '&:hover': {
                                  backgroundColor: 'rgba(210, 180, 140, 0.1)',
                                  color: 'primary.main'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(139, 69, 19, 0.08)',
                                  color: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: 'rgba(139, 69, 19, 0.12)'
                                  }
                                }
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="all">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AllInclusiveIcon fontSize="small" />
                            All Categories
                          </Box>
                        </MenuItem>
                        {categories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getCategoryIcon(cat)}
                              {cat}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Sort By */}
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel 
                        id="sort-by-label"
                        sx={{
                          color: 'text.secondary',
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        Sort By
                      </InputLabel>
                      <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        label="Sort By"
                        sx={{
                          borderRadius: 2,
                          bgcolor: 'rgba(210, 180, 140, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(210, 180, 140, 0.15)',
                            boxShadow: '0 4px 12px rgba(210, 180, 140, 0.2)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            boxShadow: '0 0 0 2px rgba(139, 69, 19, 0.3)'
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          },
                          '& .MuiSelect-select': {
                            padding: '14px 14px',
                            display: 'flex',
                            alignItems: 'center'
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'primary.main',
                            right: '12px'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              mt: 1,
                              borderRadius: 2,
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                              '& .MuiMenuItem-root': {
                                padding: '10px 16px',
                                '&:hover': {
                                  backgroundColor: 'rgba(210, 180, 140, 0.1)',
                                  color: 'primary.main'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(139, 69, 19, 0.08)',
                                  color: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: 'rgba(139, 69, 19, 0.12)'
                                  }
                                }
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="featured">Featured</MenuItem>
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="price-asc">Price: Low to High</MenuItem>
                        <MenuItem value="price-desc">Price: High to Low</MenuItem>
                        <MenuItem value="rating">Highest Rated</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Clear Filters Button (Mobile) */}
                  {isMobile && (
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          setSearchTerm('');
                          setCategory('all');
                          setSortBy('featured');
                          setPage(1);
                        }}
                        sx={{
                          mt: 1,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(139, 69, 19, 0.04)',
                          },
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Products Grid */}
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          {loading ? (
            // Loading state
            <Grid container spacing={3}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Skeleton variant="rectangular" height={300} animation="wave" />
                  <Box sx={{ pt: 2 }}>
                    <Skeleton width="80%" height={24} animation="wave" />
                    <Skeleton width="60%" height={20} animation="wave" />
                    <Skeleton width="40%" height={20} animation="wave" />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : filteredProducts.length > 0 ? (
            // Products grid
            <>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" component="h1" gutterBottom>
                  {searchTerm ? `Search Results for "${searchTerm}"` : 'Our Products'}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {searchTerm 
                    ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} found`
                    : 'Handcrafted with love and tradition'}
                </Typography>
              </Box>
              <Grid container spacing={3}>
                {paginatedProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <ProductCard
                      onMouseEnter={() => setHoveredProduct(product.id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      onClick={(e) => {
                        // Only navigate if the click wasn't on a button
                        if (!e.target.closest('button, .MuiIconButton-root')) {
                          handleProductClick(product.id);
                        }
                      }}
                      sx={{
                        '&:hover .product-actions': {
                          opacity: 1,
                          transform: 'translateY(0)',
                          [theme.breakpoints.down('md')]: {
                            opacity: 0,
                            transform: 'translateY(10px)'
                          }
                        },
                        '&:hover .product-image-primary': {
                          [theme.breakpoints.up('md')]: {
                            opacity: 0,
                            transform: 'scale(1.05)'
                          }
                        },
                        '&:hover .product-image-secondary': {
                          [theme.breakpoints.up('md')]: {
                            opacity: 1,
                            transform: 'scale(1.05)'
                          }
                        }
                      }}
                    >
                      <ProductImageWrapper>
                        {/* Primary Image */}
                        <Box
                          className="product-image-primary"
                          component="img"
                          src={product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product+Image'}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x300?text=Product+Image';
                          }}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: 1,
                            backfaceVisibility: 'hidden',
                            willChange: 'transform, opacity'
                          }}
                        />
                        
                        {/* Mobile/Tablet Action Buttons */}
                        <MobileActions>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleAddToCart(e, product);
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            aria-label="Add to cart"
                            disabled={wishlistLoading[product.id]}
                            sx={{ 
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(139, 69, 19, 0.1)'
                              },
                              pointerEvents: 'auto',
                              zIndex: 2
                            }}
                          >
                            <AddShoppingCartIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleWishlistClick(e, product);
                            }}
                            onTouchStart={(e) => e.stopPropagation()}
                            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            disabled={wishlistLoading[product.id]}
                            sx={{ 
                              color: isInWishlist(product.id) ? 'error.main' : 'secondary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 0, 0, 0.1)'
                              },
                              pointerEvents: 'auto',
                              zIndex: 2
                            }}
                          >
                            {isInWishlist(product.id) ? (
                              <FavoriteIcon fontSize="small" />
                            ) : (
                              <FavoriteBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        </MobileActions>

                        {/* Secondary Image (shown on hover) */}
                        {product.images?.[1]?.url && (
                          <Box
                            className="product-image-secondary"
                            component="img"
                            src={product.images[1].url}
                            alt={`${product.name} - Alternate view`}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              opacity: 0,
                              backfaceVisibility: 'hidden',
                              willChange: 'transform, opacity'
                            }}
                          />
                        )}
                        
                        {/* Show first image as fallback if no second image */}
                        {!product.images?.[1]?.url && (
                          <Box
                            className="product-image-secondary"
                            component="img"
                            src={product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=Product+Image'}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              opacity: 0,
                              backfaceVisibility: 'hidden',
                              willChange: 'transform, opacity',
                              filter: 'brightness(0.9)'
                            }}
                          />
                        )}
                        <ProductActions className="product-actions">
                          <IconButton
                            onClick={(e) => handleAddToCart(e, product)}
                            aria-label="Add to cart"
                            disabled={wishlistLoading[product.id]}
                            sx={{
                              backgroundColor: 'white',
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <AddShoppingCartIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={(e) => handleWishlistClick(e, product)}
                            aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            disabled={wishlistLoading[product.id]}
                            sx={{
                              backgroundColor: 'white',
                              color: isInWishlist(product.id) ? 'error.main' : 'secondary.main',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            {isInWishlist(product.id) ? (
                              <FavoriteIcon fontSize="small" />
                            ) : (
                              <FavoriteBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={() => handleProductClick(product.id)}
                            aria-label="View details"
                            sx={{
                              backgroundColor: 'white',
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease-in-out',
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </ProductActions>
                      </ProductImageWrapper>
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            gutterBottom
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              minHeight: '3.6em',
                            }}
                          >
                            {product.name}
                          </Typography>
                          {product.category && (
                            <Chip
                              label={product.category}
                              size="small"
                              icon={getCategoryIcon(product.category)}
                              sx={{ 
                                ml: 1, 
                                color: 'primary.main',
                                bgcolor: 'rgba(139, 69, 19, 0.1)',
                                '& .MuiChip-icon': {
                                  color: 'primary.main',
                                },
                                height: '24px',
                                '& .MuiChip-label': {
                                  px: 1,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                },
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            minHeight: '40px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {product.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating
                            value={product.rating || 0}
                            precision={0.5}
                            readOnly
                            size="small"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarBorderIcon fontSize="inherit" />}
                            sx={{ color: '#ffb74d' }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({product.reviewCount || 0} reviews)
                          </Typography>
                        </Box>
                        {/* Stock Status */}
                        {product.stock < 10 && product.stock > 0 && (
                          <Box sx={{ 
                            display: 'inline-block', 
                            bgcolor: 'warning.light', 
                            color: 'warning.contrastText', 
                            px: 1, 
                            py: 0.3, 
                            borderRadius: 1,
                            mb: 1,
                            width: 'fit-content'
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              Only {product.stock} left in stock!
                            </Typography>
                          </Box>
                        )}
                        {product.stock === 0 && (
                          <Box sx={{ 
                            display: 'inline-block', 
                            bgcolor: 'error.light', 
                            color: 'error.contrastText', 
                            px: 1, 
                            py: 0.3, 
                            borderRadius: 1,
                            mb: 1,
                            width: 'fit-content'
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              Out of Stock
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ 
                          mt: 1,
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1
                        }}>
                          {product.discount > 0 ? (
                            <>
                            <Typography 
                                variant="h6" 
                                color="primary" 
                                sx={{ 
                                  fontWeight: 800,
                                  fontSize: '1.1rem',
                                  lineHeight: 1.2
                                }}
                              >
                                {formatPrice(product.price * (1 - (product.discount / 100)))}
                              </Typography>
                              <Typography 
                                variant="body2"
                                color="text.secondary"
                                sx={{ 
                                  textDecoration: 'line-through',
                                  opacity: 0.8
                                }}
                              >
                                {formatPrice(product.price)}
                              </Typography>
                              
                              <Chip 
                                label={`${product.discount}% OFF`} 
                                size="small" 
                                color="error"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            </>
                          ) : (
                            <Typography 
                              variant="h6" 
                              color="primary" 
                              sx={{ 
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                lineHeight: 1.2
                              }}
                            >
                              {formatPrice(product.price)}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </ProductCard>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                    showFirstButton
                    showLastButton={!isMobile}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={isMobile ? 1 : 2}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: 'text.primary',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </>
          ) : (
            // No products found
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                We couldn't find any products matching your search.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setSearchTerm('');
                  setCategory('all');
                  setSortBy('featured');
                  setPage(1);
                }}
                sx={{ mt: 2 }}
              >
                Clear all filters
              </Button>
            </Box>
          )}
        </Container>
      </Box>
      
      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
        initialTab={authDialogTab}
      />
    </Box>
  );
};

export default ProductsPage;
