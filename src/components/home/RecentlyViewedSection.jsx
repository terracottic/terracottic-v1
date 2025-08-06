import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Container,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Star as StarIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { getRecentlyViewed } from '@/utils/recentlyViewed';
import { useCurrency } from '@/contexts/CurrencyContext';

const RecentlyViewedSection = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const { formatPrice } = useCurrency();
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load recently viewed products
    useEffect(() => {
        const loadRecentlyViewed = () => {
            try {
                const items = getRecentlyViewed();
                setRecentlyViewed(items || []);
            } catch (error) {
                console.error('Error loading recently viewed:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRecentlyViewed();

        // Listen for storage events to update when recently viewed changes in other tabs
        const handleStorageChange = (e) => {
            if (e.key === 'recentlyViewedProducts' || !e.key) {
                loadRecentlyViewed();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Format image URL helper function
    const formatImageUrl = (url) => {
        if (!url) return '';
        let safeUrl = String(url);
        if (typeof url === 'object') {
            safeUrl = url.url || url.src || url.path || '';
        }
        return safeUrl.startsWith('http') ? safeUrl : `http://localhost:3000/${safeUrl.replace(/^\/+/, '')}`;
    };

    // Handle product click
    const handleProductClick = (product) => {
        navigate(`/products/${product.id}`);
    };

    // Don't render anything if there are no recently viewed items
    if (!loading && recentlyViewed.length === 0) {
        return null;
    }

    return (
        <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography 
                        variant="h3" 
                        component="h2" 
                        sx={{ 
                            fontWeight: 700,
                            mb: 2,
                            position: 'relative',
                            display: 'inline-block',
                            '&:after': {
                                content: '""',
                                position: 'absolute',
                                width: '60px',
                                height: '4px',
                                backgroundColor: 'primary.main',
                                bottom: -10,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                borderRadius: '2px'
                            }
                        }}
                    >
                        Recently Viewed
                    </Typography>
                    <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                            maxWidth: '700px',
                            mx: 'auto',
                            fontSize: '1.1rem',
                            lineHeight: 1.7,
                            mt: 3
                        }}
                    >
                        Browse through your recently viewed items
                    </Typography>
                </Box>

                <Box sx={{ position: 'relative' }}>
                    <Button 
                        endIcon={<ArrowForwardIcon />}
                        sx={{ 
                            position: 'absolute', 
                            right: 0, 
                            top: -60,
                            textTransform: 'none', 
                            fontWeight: 600,
                            color: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.04)'
                            }
                        }}
                        component={RouterLink}
                        to="/products"
                    >
                        View All
                    </Button>
                    <Grid container spacing={3}>
                        {recentlyViewed.slice(0, 4).map((product) => (
                            <Grid item xs={12} sm={6} md={3} key={product.id}>
                                <Card 
                                    sx={{ 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: '1px solid rgba(0,0,0,0.04)',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
                                        }
                                    }}
                                >
                                    <Box sx={{ position: 'relative', pt: '100%', overflow: 'hidden' }}>
                                        <CardMedia
                                            component="img"
                                            image={formatImageUrl(product.image)}
                                            alt={product.name}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.5s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.05)'
                                                }
                                            }}
                                        />local
                                    </Box>
                                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography 
                                                variant="h6" 
                                                component="h3" 
                                                sx={{ 
                                                    fontWeight: 600, 
                                                    mb: 1,
                                                    fontSize: '1rem',
                                                    lineHeight: 1.4,
                                                    minHeight: '2.8em',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {product.name}
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, mr: 0.5 }}>
                                                        {product.rating ? Number(product.rating).toFixed(1) : '0.0'}
                                                    </Typography>
                                                    <StarIcon sx={{ color: 'warning.main', fontSize: '1rem' }} />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                    • {product.reviewCount || '0'} reviews
                                                </Typography>
                                            </Box>

                                            {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography variant="caption" sx={{ 
                                                        color: 'error.main',
                                                        fontWeight: 500,
                                                        fontSize: '0.75rem',
                                                        display: 'inline-block',
                                                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1
                                                    }}>
                                                        Only {product.stockQuantity} left in stock!
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    fontSize: '0.875rem',
                                                    lineHeight: 1.6,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    minHeight: '4.2em' // 3 lines * 1.4 line-height
                                                }}
                                            >
                                                {product.shortDescription || product.description || 'No description available'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 'auto', pt: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                                                <Typography variant="h6" sx={{ 
                                                    fontWeight: 700, 
                                                    fontSize: '1.25rem',
                                                    color: 'text.primary'
                                                }}>
                                                    {formatPrice(product.price)}
                                                </Typography>
                                            </Box>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => handleProductClick(product)}
                                                sx={{
                                                    backgroundColor: 'primary.main',
                                                    color: '#fff',
                                                    '&:hover': {
                                                        backgroundColor: 'primary.dark',
                                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                                                    },
                                                    py: 1,
                                                    borderRadius: 1,
                                                    textTransform: 'none',
                                                    fontWeight: 500,
                                                    fontSize: '0.9375rem',
                                                    letterSpacing: '0.3px',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                View Product
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default RecentlyViewedSection;
