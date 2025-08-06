import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  IconButton, 
  TextField, 
  Button, 
  InputAdornment,
  useMediaQuery,
  useTheme,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Rating,
  Popover
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';

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

const AdvancedSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [rating, setRating] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const open = Boolean(anchorEl);

  // Parse URL parameters on component mount and when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    const minPrice = parseInt(params.get('minPrice')) || 0;
    const maxPrice = parseInt(params.get('maxPrice')) || 20000;
    const categories = params.get('categories') ? params.get('categories').split(',') : [];
    const ratingParam = parseFloat(params.get('rating')) || 0;

    setSearchQuery(search);
    setPriceRange([minPrice, maxPrice]);
    setSelectedCategories(categories);
    setRating(ratingParam);
    
    // Count active filters
    let count = 0;
    if (minPrice > 0) count++;
    if (maxPrice < 20000) count++;
    if (categories.length > 0) count++;
    if (ratingParam > 0) count++;
    setActiveFilters(count);
  }, [location.search]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0]);
    if (priceRange[1] < 20000) params.set('maxPrice', priceRange[1]);
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (rating > 0) params.set('rating', rating);
    
    navigate(`/products?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setAnchorEl(null);
  };
  
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
  
  const clearFilters = () => {
    setPriceRange([0, 20000]);
    setSelectedCategories([]);
    setRating(0);
    
    // Navigate with only search query if it exists
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
    
    handleFilterClose();
  };
  
  const applyFilters = () => {
    handleSearch();
    handleFilterClose();
  };

  return (
    <Box sx={{ display: 'flex', flex: 1, maxWidth: 800, mx: 2, gap: 1 }}>
      {/* Search Input */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'divider',
              },
              '&:hover fieldset': {
                borderColor: 'primary.light',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Search Button */}
      <Button 
        variant="contained" 
        onClick={handleSearch}
        sx={{ 
          px: 3,
          borderRadius: 2,
          textTransform: 'none',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        }}
      >
        Search
      </Button>
      
      {/* Filter Button */}
      <Button
        variant="outlined"
        onClick={isMobile ? () => navigate('/products/filters') : handleFilterClick}
        startIcon={
          <Badge badgeContent={activeFilters} color="primary" overlap="circular">
            <TuneIcon />
          </Badge>
        }
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        }}
      >
        {!isMobile && 'Filters'}
      </Button>
      
      {/* Desktop Filter Menu */}
      {!isMobile && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              width: 320,
              p: 2,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              mt: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Filters
            </Typography>
            <IconButton size="small" onClick={handleFilterClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          {/* Price Range Filter */}
          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Price Range
            </Typography>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              min={0}
              max={20000}
              step={100}
              valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
              sx={{
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'primary.main',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  fontSize: '0.75rem',
                },
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
          
          {/* Categories Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Categories
            </Typography>
            <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
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
          </Box>
          
          {/* Rating Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
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
          
          <Divider sx={{ my: 2 }} />
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              disabled={activeFilters === 0}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                py: 1,
                borderWidth: 1.5,
                '&:hover': {
                  borderWidth: 1.5,
                },
              }}
            >
              Clear All
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={applyFilters}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                py: 1,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              Apply
            </Button>
          </Box>
        </Menu>
      )}
    </Box>
  );
};

export default AdvancedSearch;
