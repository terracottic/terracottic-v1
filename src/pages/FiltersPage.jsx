import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Slider, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Button, 
  Divider,
  IconButton,
  Rating,
  Container,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Sample categories - replace with your actual categories from the database
const categories = [
  'Pottery',
  'Sculptures',
  'Home Decor',
  'Kitchenware',
  'Garden Decor',
  'Jewelry',
  'Wall Art'
];

const priceMarks = [
  { value: 0, label: '₹0' },
  { value: 1000, label: '₹1K' },
  { value: 5000, label: '₹5K' },
  { value: 10000, label: '₹10K' },
  { value: 20000, label: '₹20K' },
];

const FiltersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [rating, setRating] = useState(0);

  // Parse URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const minPrice = parseInt(params.get('minPrice')) || 0;
    const maxPrice = parseInt(params.get('maxPrice')) || 20000;
    const categories = params.get('categories') ? params.get('categories').split(',') : [];
    const ratingParam = parseInt(params.get('rating')) || 0;

    setPriceRange([minPrice, maxPrice]);
    setSelectedCategories(categories);
    setRating(ratingParam);
  }, [location.search]);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    // Get existing search query if any
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) params.set('search', searchQuery);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0]);
    if (priceRange[1] < 20000) params.set('maxPrice', priceRange[1]);
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (rating > 0) params.set('rating', rating);
    
    navigate(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setPriceRange([0, 20000]);
    setSelectedCategories([]);
    setRating(0);
    
    // Navigate back to products with only search query if it exists
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1">
            Filters
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />

        {/* Price Range Filter */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Price Range
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={20000}
              step={100}
              valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
              marks={priceMarks}
              sx={{
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'primary.main',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  fontSize: '0.75rem',
                },
                '& .MuiSlider-markLabel': {
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                },
                mt: 4,
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                ₹{priceRange[0].toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ₹{priceRange[1].toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Categories Filter */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Categories
          </Typography>
          <FormGroup>
            {categories.map((category) => (
              <FormControlLabel
                key={category}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    size="small"
                    sx={{ py: 0.5 }}
                  />
                }
                label={category}
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                  },
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </FormGroup>
        </Box>

        {/* Rating Filter */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Minimum Rating
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating
              name="rating-filter"
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
              precision={0.5}
              sx={{ mr: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              {rating > 0 ? `${rating}+` : 'Any'}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4, position: 'sticky', bottom: 16, zIndex: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              py: 1.5,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Clear All
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleApplyFilters}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              py: 1.5,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FiltersPage;
