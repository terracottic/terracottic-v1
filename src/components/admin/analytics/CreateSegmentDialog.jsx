import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  InputAdornment,
  CircularProgress,
  useTheme,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Badge,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  MonetizationOn as MonetizationOnIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const CreateSegmentDialog = ({ open, onClose, onSave, customers = [] }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [rfmFilters, setRfmFilters] = useState({
    recency: [1, 5],
    frequency: [1, 5],
    monetary: [1, 5]
  });
  const [purchaseHistory, setPurchaseHistory] = useState({
    minPurchases: 0,
    maxPurchases: 100,
    minAmount: 0,
    maxAmount: 10000,
    lastPurchaseDays: 365
  });
  const [matchingCustomers, setMatchingCustomers] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedConditions, setSavedConditions] = useState([]);
  const [activeCondition, setActiveCondition] = useState(null);

  // Get all unique behaviors and tags from customers
  const allBehaviors = [...new Set(customers.flatMap(c => c.behaviors || []))].sort();
  const allTags = [...new Set(customers.flatMap(c => c.tags || []))].sort();

  // Calculate matching customers whenever filters change
  useEffect(() => {
    if (!open) return;
    
    setIsCalculating(true);
    
    // Simulate calculation delay
    const timer = setTimeout(() => {
      const matches = customers.filter(customer => {
        // Check behavior filters
        const matchesBehaviors = selectedBehaviors.length === 0 || 
          selectedBehaviors.every(behavior => customer.behaviors?.includes(behavior));
        
        // Check tag filters
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.every(tag => customer.tags?.includes(tag));
        
        // Check RFM filters
        const matchesRfm = (
          (!customer.rfm || 
            (customer.rfm.recency >= rfmFilters.recency[0] && 
             customer.rfm.recency <= rfmFilters.recency[1] &&
             customer.rfm.frequency >= rfmFilters.frequency[0] && 
             customer.rfm.frequency <= rfmFilters.frequency[1] &&
             customer.rfm.monetary >= rfmFilters.monetary[0] && 
             customer.rfm.monetary <= rfmFilters.monetary[1])
          )
        );
        
        // Check purchase history
        const matchesPurchaseHistory = (
          customer.orders >= purchaseHistory.minPurchases &&
          customer.orders <= purchaseHistory.maxPurchases &&
          customer.totalSpent >= purchaseHistory.minAmount &&
          customer.totalSpent <= purchaseHistory.maxAmount
          // Note: lastPurchaseDays check would be implemented with actual date comparison
        );
        
        return matchesBehaviors && matchesTags && matchesRfm && matchesPurchaseHistory;
      });
      
      setMatchingCustomers(matches.length);
      setIsCalculating(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [selectedBehaviors, selectedTags, rfmFilters, purchaseHistory, customers, open]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleBehavior = (behavior) => {
    setSelectedBehaviors(prev => 
      prev.includes(behavior)
        ? prev.filter(b => b !== behavior)
        : [...prev, behavior]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleRfmFilterChange = (field, value) => {
    setRfmFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCondition = () => {
    const newCondition = {
      id: Date.now(),
      name: `Condition ${savedConditions.length + 1}`,
      behaviors: [...selectedBehaviors],
      tags: [...selectedTags],
      rfmFilters: { ...rfmFilters },
      purchaseHistory: { ...purchaseHistory },
      customerCount: matchingCustomers
    };
    
    setSavedConditions([...savedConditions, newCondition]);
    
    // Reset filters
    setSelectedBehaviors([]);
    setSelectedTags([]);
    setRfmFilters({
      recency: [1, 5],
      frequency: [1, 5],
      monetary: [1, 5]
    });
    setPurchaseHistory({
      minPurchases: 0,
      maxPurchases: 100,
      minAmount: 0,
      maxAmount: 10000,
      lastPurchaseDays: 365
    });
  };

  const handleDeleteCondition = (id, e) => {
    e.stopPropagation();
    setSavedConditions(prev => prev.filter(cond => cond.id !== id));
  };

  const handleSaveSegment = () => {
    if (!segmentName.trim()) return;
    
    const segment = {
      id: `seg-${Date.now()}`,
      name: segmentName,
      description: segmentDescription,
      conditions: savedConditions,
      customerCount: matchingCustomers,
      createdAt: new Date().toISOString()
    };
    
    onSave(segment);
    onClose();
    
    // Reset form
    setSegmentName('');
    setSegmentDescription('');
    setSavedConditions([]);
    setMatchingCustomers(0);
  };

  const renderBehaviorTab = () => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Select behaviors to include in this segment
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        maxHeight: 200,
        overflowY: 'auto',
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 2
      }}>
        {allBehaviors.length > 0 ? (
          allBehaviors.map(behavior => (
            <Chip
              key={behavior}
              label={behavior}
              onClick={() => toggleBehavior(behavior)}
              onDelete={selectedBehaviors.includes(behavior) ? () => toggleBehavior(behavior) : undefined}
              color={selectedBehaviors.includes(behavior) ? 'primary' : 'default'}
              variant={selectedBehaviors.includes(behavior) ? 'filled' : 'outlined'}
              size="small"
              icon={<TimelineIcon fontSize="small" />}
            />
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No behaviors available
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Select tags to include in this segment
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        maxHeight: 150,
        overflowY: 'auto',
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        mb: 2
      }}>
        {allTags.length > 0 ? (
          allTags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => toggleTag(tag)}
              onDelete={selectedTags.includes(tag) ? () => toggleTag(tag) : undefined}
              color={selectedTags.includes(tag) ? 'secondary' : 'default'}
              variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
              size="small"
            />
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No tags available
          </Typography>
        )}
      </Box>
    </Box>
  );

  const renderRfmTab = () => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Filter customers by RFM scores (1-5, where 5 is best)
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Recency: {rfmFilters.recency[0]} - {rfmFilters.recency[1]}
        </Typography>
        <Slider
          value={rfmFilters.recency}
          onChange={(_, newValue) => handleRfmFilterChange('recency', newValue)}
          valueLabelDisplay="auto"
          min={1}
          max={5}
          step={1}
          marks={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
          ]}
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Frequency: {rfmFilters.frequency[0]} - {rfmFilters.frequency[1]}
        </Typography>
        <Slider
          value={rfmFilters.frequency}
          onChange={(_, newValue) => handleRfmFilterChange('frequency', newValue)}
          valueLabelDisplay="auto"
          min={1}
          max={5}
          step={1}
          marks={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
          ]}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Monetary: {rfmFilters.monetary[0]} - {rfmFilters.monetary[1]}
        </Typography>
        <Slider
          value={rfmFilters.monetary}
          onChange={(_, newValue) => handleRfmFilterChange('monetary', newValue)}
          valueLabelDisplay="auto"
          min={1}
          max={5}
          step={1}
          marks={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
          ]}
        />
      </Box>
      
      <Box sx={{ 
        p: 2, 
        bgcolor: 'action.hover', 
        borderRadius: 1,
        mt: 3
      }}>
        <Typography variant="body2">
          <strong>Recency:</strong> How recently a customer has purchased<br />
          <strong>Frequency:</strong> How often they purchase<br />
          <strong>Monetary:</strong> How much they spend
        </Typography>
      </Box>
    </Box>
  );

  const renderPurchaseHistoryTab = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Number of Purchases
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Min"
            type="number"
            size="small"
            value={purchaseHistory.minPurchases}
            onChange={(e) => setPurchaseHistory(prev => ({
              ...prev,
              minPurchases: Math.max(0, parseInt(e.target.value) || 0)
            }))}
            sx={{ width: 100 }}
            InputProps={{
              inputProps: { min: 0 }
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Slider
              value={[purchaseHistory.minPurchases, purchaseHistory.maxPurchases]}
              onChange={(_, newValue) => setPurchaseHistory(prev => ({
                ...prev,
                minPurchases: newValue[0],
                maxPurchases: newValue[1]
              }))}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              step={1}
            />
          </Box>
          <TextField
            label="Max"
            type="number"
            size="small"
            value={purchaseHistory.maxPurchases}
            onChange={(e) => setPurchaseHistory(prev => ({
              ...prev,
              maxPurchases: Math.max(prev.minPurchases, parseInt(e.target.value) || 0)
            }))}
            sx={{ width: 100 }}
            InputProps={{
              inputProps: { min: purchaseHistory.minPurchases }
            }}
          />
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Total Amount Spent
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Min"
            type="number"
            size="small"
            value={purchaseHistory.minAmount}
            onChange={(e) => setPurchaseHistory(prev => ({
              ...prev,
              minAmount: Math.max(0, parseInt(e.target.value) || 0)
            }))}
            sx={{ width: 100 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: 0 }
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Slider
              value={[purchaseHistory.minAmount, purchaseHistory.maxAmount]}
              onChange={(_, newValue) => setPurchaseHistory(prev => ({
                ...prev,
                minAmount: newValue[0],
                maxAmount: newValue[1]
              }))}
              valueLabelDisplay="auto"
              min={0}
              max={10000}
              step={10}
              valueLabelFormat={(value) => `$${value}`}
            />
          </Box>
          <TextField
            label="Max"
            type="number"
            size="small"
            value={purchaseHistory.maxAmount}
            onChange={(e) => setPurchaseHistory(prev => ({
              ...prev,
              maxAmount: Math.max(prev.minAmount, parseInt(e.target.value) || 10000)
            }))}
            sx={{ width: 120 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              inputProps: { min: purchaseHistory.minAmount }
            }}
          />
        </Box>
      </Box>
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Last Purchase
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={purchaseHistory.lastPurchaseDays}
            onChange={(e) => setPurchaseHistory(prev => ({
              ...prev,
              lastPurchaseDays: e.target.value
            }))}
            label="Time Period"
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={60}>Last 60 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
            <MenuItem value={180}>Last 6 months</MenuItem>
            <MenuItem value={365}>Last 12 months</MenuItem>
            <MenuItem value={0}>Any time</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  const renderSavedConditions = () => (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Saved Conditions
      </Typography>
      
      {savedConditions.length === 0 ? (
        <Box sx={{ 
          p: 3, 
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="body2" color="textSecondary">
            No conditions saved yet. Add conditions using the tabs above.
          </Typography>
        </Box>
      ) : (
        <List dense sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
          {savedConditions.map((condition) => (
            <ListItem 
              key={condition.id}
              button
              selected={activeCondition === condition.id}
              onClick={() => setActiveCondition(condition.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  }
                }
              }}
            >
              <ListItemText
                primary={condition.name}
                secondary={
                  <>
                    {condition.behaviors.length} behaviors • {condition.tags.length} tags • {condition.customerCount} customers
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={(e) => handleDeleteCondition(condition.id, e)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1.5,
        bgcolor: 'action.hover',
        borderRadius: 1
      }}>
        <Box>
          <Typography variant="subtitle2">Matching Customers</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCalculating ? (
              <>
                <CircularProgress size={16} />
                <Typography variant="body2" color="textSecondary">
                  Calculating...
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6">{matchingCustomers}</Typography>
                <Typography variant="body2" color="textSecondary">
                  ({((matchingCustomers / customers.length) * 100).toFixed(1)}% of total)
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveCondition}
          disabled={isCalculating}
        >
          Save Condition
        </Button>
      </Box>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: 900
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span>Create Customer Segment</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Segment Name"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                placeholder="e.g., High-Value Customers"
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                value={segmentDescription}
                onChange={(e) => setSegmentDescription(e.target.value)}
                placeholder="Describe this segment"
                margin="normal"
                multiline
                rows={3}
              />
              
              <Box sx={{ 
                mt: 3,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Segment Summary
                </Typography>
                
                {savedConditions.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Add conditions to define your customer segment
                  </Typography>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {savedConditions.length} condition{savedConditions.length !== 1 ? 's' : ''} defined
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {matchingCustomers} matching customers
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="textSecondary">
                        Conditions will be combined with AND logic
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            
            {renderSavedConditions()}
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Behaviors & Tags" icon={<TimelineIcon />} />
                <Tab label="RFM Scores" icon={<MonetizationOnIcon />} />
                <Tab label="Purchase History" icon={<ShoppingCartIcon />} />
              </Tabs>
              
              <Box sx={{ p: 3 }}>
                {activeTab === 0 && renderBehaviorTab()}
                {activeTab === 1 && renderRfmTab()}
                {activeTab === 2 && renderPurchaseHistoryTab()}
              </Box>
            </Paper>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Box>
                <Typography variant="subtitle2">Segment Preview</Typography>
                <Typography variant="body2" color="textSecondary">
                  {savedConditions.length > 0 
                    ? `${matchingCustomers} customers match your conditions`
                    : 'Add conditions to see matching customers'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedBehaviors([]);
                    setSelectedTags([]);
                    setRfmFilters({
                      recency: [1, 5],
                      frequency: [1, 5],
                      monetary: [1, 5]
                    });
                    setPurchaseHistory({
                      minPurchases: 0,
                      maxPurchases: 100,
                      minAmount: 0,
                      maxAmount: 10000,
                      lastPurchaseDays: 365
                    });
                  }}
                >
                  Reset
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCondition}
                  disabled={isCalculating || 
                    (selectedBehaviors.length === 0 && 
                     selectedTags.length === 0 &&
                     (rfmFilters.recency[0] !== 1 || rfmFilters.recency[1] !== 5) &&
                     (rfmFilters.frequency[0] !== 1 || rfmFilters.frequency[1] !== 5) &&
                     (rfmFilters.monetary[0] !== 1 || rfmFilters.monetary[1] !== 5) &&
                     (purchaseHistory.minPurchases !== 0 || 
                      purchaseHistory.maxPurchases !== 100 ||
                      purchaseHistory.minAmount !== 0 ||
                      purchaseHistory.maxAmount !== 10000 ||
                      purchaseHistory.lastPurchaseDays !== 365)
                  )}
                >
                  {isCalculating ? 'Saving...' : 'Save Condition'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSegment}
          disabled={!segmentName.trim() || savedConditions.length === 0}
        >
          Save Segment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSegmentDialog;
