import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  MonetizationOn as MonetizationOnIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import RFMAnalysis from './RFMAnalysis';
import BehavioralAnalysis from './BehavioralAnalysis';
import CreateSegmentDialog from './CreateSegmentDialog';

// Mock data for customer segments
const mockSegments = [
  {
    id: 'seg-1',
    name: 'High-Value Customers',
    description: 'Top 10% of customers by lifetime value',
    customerCount: 42,
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-15T10:30:00Z',
    conditions: [
      { type: 'rfm', values: { recency: [4, 5], frequency: [4, 5], monetary: [4, 5] } },
      { type: 'behavior', values: ['Frequent Purchaser', 'High Spender'] }
    ]
  },
  {
    id: 'seg-2',
    name: 'At Risk',
    description: 'Customers who haven\'t purchased in the last 90 days',
    customerCount: 128,
    createdAt: '2023-04-22T14:15:00Z',
    updatedAt: '2023-06-01T09:45:00Z',
    conditions: [
      { type: 'rfm', values: { recency: [1, 2], frequency: [1, 5], monetary: [1, 5] } },
      { type: 'purchase', values: { lastPurchaseDays: 90, comparison: 'greaterThan' } }
    ]
  },
  {
    id: 'seg-3',
    name: 'New Customers',
    description: 'First-time buyers in the last 30 days',
    customerCount: 87,
    createdAt: '2023-06-10T11:20:00Z',
    updatedAt: '2023-06-10T11:20:00Z',
    conditions: [
      { type: 'behavior', values: ['First-time Buyer'] },
      { type: 'purchase', values: { firstPurchaseDays: 30, comparison: 'lessThan' } }
    ]
  },
  {
    id: 'seg-4',
    name: 'Discount Seekers',
    description: 'Customers who primarily shop during sales',
    customerCount: 156,
    createdAt: '2023-03-05T16:45:00Z',
    updatedAt: '2023-05-28T13:10:00Z',
    conditions: [
      { type: 'behavior', values: ['Discount Seeker', 'Sale Shopper'] },
      { type: 'rfm', values: { discountUsage: 'high' } }
    ]
  },
  {
    id: 'seg-5',
    name: 'Loyal Customers',
    description: 'Consistent buyers with high engagement',
    customerCount: 64,
    createdAt: '2023-02-18T09:15:00Z',
    updatedAt: '2023-06-05T14:30:00Z',
    conditions: [
      { type: 'rfm', values: { frequency: [4, 5], recency: [3, 5], monetary: [3, 5] } },
      { type: 'behavior', values: ['Loyalty Member', 'Subscriber'] }
    ]
  }
];

// Mock customer data with RFM scores and behaviors
const mockCustomers = Array.from({ length: 50 }, (_, i) => ({
  id: `cust-${i + 1}`,
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  joinDate: new Date(Date.now() - Math.floor(Math.random() * 3 * 365 * 24 * 60 * 60 * 1000)).toISOString(),
  lastPurchase: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)).toISOString(),
  orders: Math.floor(Math.random() * 50) + 1,
  totalSpent: Math.floor(Math.random() * 10000) + 100,
  rfm: {
    recency: Math.floor(Math.random() * 5) + 1,
    frequency: Math.floor(Math.random() * 5) + 1,
    monetary: Math.floor(Math.random() * 5) + 1,
    score: Math.floor(Math.random() * 555) + 111
  },
  behaviors: (() => {
    const behaviors = [];
    if (Math.random() > 0.6) behaviors.push('Frequent Purchaser');
    if (Math.random() > 0.7) behaviors.push('Discount Seeker');
    if (Math.random() > 0.5) behaviors.push('Mobile User');
    if (Math.random() > 0.8) behaviors.push('Loyalty Member');
    if (Math.random() > 0.9) behaviors.push('First-time Buyer');
    if (Math.random() > 0.7) behaviors.push('Abandoned Cart');
    if (behaviors.length === 0) behaviors.push('Occasional Shopper');
    return behaviors;
  })(),
  tags: (() => {
    const tags = [];
    if (Math.random() > 0.5) tags.push('Premium');
    if (Math.random() > 0.7) tags.push('VIP');
    if (Math.random() > 0.8) tags.push('Wholesale');
    return tags;
  })(),
  segments: (() => {
    const segments = [];
    if (Math.random() > 0.7) segments.push('seg-1');
    if (Math.random() > 0.7) segments.push('seg-2');
    if (Math.random() > 0.7) segments.push('seg-3');
    if (Math.random() > 0.7) segments.push('seg-4');
    if (Math.random() > 0.7) segments.push('seg-5');
    return segments;
  })()
}));

const CustomerSegmentation = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [segments, setSegments] = useState(mockSegments);
  const [customers, setCustomers] = useState(mockCustomers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredSegments, setFilteredSegments] = useState(mockSegments);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSegments(segments);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = segments.filter(
        segment =>
          segment.name.toLowerCase().includes(searchLower) ||
          segment.description.toLowerCase().includes(searchLower)
      );
      setFilteredSegments(filtered);
    }
  }, [searchTerm, segments]);

  // Handle menu open
  const handleMenuOpen = (event, segment) => {
    setAnchorEl(event.currentTarget);
    setSelectedSegment(segment);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSegment(null);
  };

  // Handle segment delete
  const handleDeleteSegment = () => {
    if (!selectedSegment) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSegments(prev => prev.filter(seg => seg.id !== selectedSegment.id));
      setIsLoading(false);
      handleMenuClose();
    }, 500);
  };

  // Handle segment save from dialog
  const handleSaveSegment = (newSegment) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSegments(prev => [...prev, newSegment]);
      setIsLoading(false);
      setIsCreateDialogOpen(false);
    }, 800);
  };

  // Handle segment refresh
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Segments tab
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <TextField
                placeholder="Search segments..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreateDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Create Segment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredSegments.length === 0 ? (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1
              }}>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  No segments found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {searchTerm ? 'Try a different search term' : 'Create your first segment to get started'}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create Segment
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredSegments.map((segment) => (
                  <Grid item xs={12} sm={6} lg={4} key={segment.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {segment.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                              {segment.description}
                            </Typography>
                          </Box>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuOpen(e, segment)}
                            aria-label="segment actions"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">
                              {segment.customerCount} customers
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" color="textSecondary">
                              Updated {new Date(segment.updatedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {segment.conditions.slice(0, 3).map((condition, idx) => (
                            <Chip
                              key={idx}
                              label={
                                condition.type === 'rfm' ? 'RFM Score' : 
                                condition.type === 'behavior' ? `${condition.values.length} behaviors` :
                                condition.type === 'purchase' ? 'Purchase History' : 'Condition'
                              }
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {segment.conditions.length > 3 && (
                            <Chip
                              label={`+${segment.conditions.length - 3} more`}
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </CardContent>
                      
                      <Box sx={{ p: 1.5, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          size="small" 
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => {
                            // Navigate to segment details
                            console.log('View segment:', segment.id);
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      
      case 1: // RFM Analysis tab
        return <RFMAnalysis customers={customers} />;
        
      case 2: // Behavioral Analysis tab
        return <BehavioralAnalysis customers={customers} />;
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="customer segmentation tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Segments" 
            icon={<CategoryIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="RFM Analysis" 
            icon={<MonetizationOnIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Behavioral Analysis" 
            icon={<TimelineIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>
      
      {renderTabContent()}
      
      {/* Create/Edit Segment Dialog */}
      <CreateSegmentDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleSaveSegment}
        customers={customers}
      />
      
      {/* Segment Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Segment</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleDeleteSegment}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomerSegmentation;
