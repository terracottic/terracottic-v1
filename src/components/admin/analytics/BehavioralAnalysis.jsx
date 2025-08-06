import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Divider,
  useTheme,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  Tag as TagIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const BehavioralAnalysis = ({ customers }) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState('30days');

  // Get all unique behaviors from customers
  const allBehaviors = [...new Set(customers.flatMap(c => c.behaviors))].sort();
  
  // Get all unique tags from customers
  const allTags = [...new Set(customers.flatMap(c => c.tags || []))].sort();
  
  // Calculate behavior distribution
  const behaviorDistribution = allBehaviors.map(behavior => ({
    name: behavior,
    count: customers.filter(c => c.behaviors.includes(behavior)).length
  })).sort((a, b) => b.count - a.count);
  
  // Calculate tag distribution
  const tagDistribution = allTags.map(tag => ({
    name: tag,
    count: customers.filter(c => (c.tags || []).includes(tag)).length
  })).sort((a, b) => b.count - a.count);

  // Filter customers based on selected behaviors and search term
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesBehaviors = selectedBehaviors.length === 0 || 
      selectedBehaviors.every(behavior => customer.behaviors.includes(behavior));
      
    return matchesSearch && matchesBehaviors;
  });

  // Toggle behavior selection
  const toggleBehavior = (behavior) => {
    setSelectedBehaviors(prev => 
      prev.includes(behavior)
        ? prev.filter(b => b !== behavior)
        : [...prev, behavior]
    );
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get color for behavior based on type
  const getBehaviorColor = (behavior) => {
    if (behavior.includes('Frequent')) return theme.palette.success.main;
    if (behavior.includes('Discount')) return theme.palette.warning.main;
    if (behavior.includes('Mobile')) return theme.palette.info.main;
    if (behavior.includes('Desktop')) return theme.palette.primary.main;
    if (behavior.includes('Abandoned')) return theme.palette.error.main;
    return theme.palette.grey[500];
  };

  // Mock data for behavior trends over time
  const behaviorTrends = [
    { name: 'Jan', 'Frequent Purchaser': 120, 'Discount Seeker': 80, 'Mobile User': 200, 'Abandoned Cart': 30 },
    { name: 'Feb', 'Frequent Purchaser': 150, 'Discount Seeker': 90, 'Mobile User': 220, 'Abandoned Cart': 25 },
    { name: 'Mar', 'Frequent Purchaser': 180, 'Discount Seeker': 110, 'Mobile User': 250, 'Abandoned Cart': 40 },
    { name: 'Apr', 'Frequent Purchaser': 200, 'Discount Seeker': 130, 'Mobile User': 270, 'Abandoned Cart': 35 },
    { name: 'May', 'Frequent Purchaser': 220, 'Discount Seeker': 150, 'Mobile User': 300, 'Abandoned Cart': 45 },
    { name: 'Jun', 'Frequent Purchaser': 250, 'Discount Seeker': 170, 'Mobile User': 320, 'Abandoned Cart': 50 },
  ];

  // Mock data for behavior correlations
  const behaviorCorrelations = [
    { behavior: 'Frequent Purchaser', 'Discount Seeker': 0.25, 'Mobile User': 0.65, 'Abandoned Cart': -0.15 },
    { behavior: 'Discount Seeker', 'Frequent Purchaser': 0.25, 'Mobile User': 0.45, 'Abandoned Cart': 0.35 },
    { behavior: 'Mobile User', 'Frequent Purchaser': 0.65, 'Discount Seeker': 0.45, 'Abandoned Cart': 0.15 },
    { behavior: 'Abandoned Cart', 'Frequent Purchaser': -0.15, 'Discount Seeker': 0.35, 'Mobile User': 0.15 },
  ];

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allBehaviors.slice(0, 5).map(behavior => (
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
                ))}
                {allBehaviors.length > 5 && (
                  <Tooltip title={`${allBehaviors.length - 5} more behaviors available`}>
                    <Chip
                      label={`+${allBehaviors.length - 5} more`}
                      size="small"
                      variant="outlined"
                      onClick={() => {}}
                    />
                  </Tooltip>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={2} textAlign="right">
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => {}}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Overview" icon={<TimelineIcon />} />
        <Tab label="Customer Segments" icon={<CategoryIcon />} />
        <Tab label="Behavior Patterns" icon={<ShoppingCartIcon />} />
        <Tab label="Tag Analysis" icon={<TagIcon />} />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Behavior Trends</Typography>
                  <Box>
                    <Select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      size="small"
                      variant="standard"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="7days">Last 7 days</MenuItem>
                      <MenuItem value="30days">Last 30 days</MenuItem>
                      <MenuItem value="90days">Last 90 days</MenuItem>
                      <MenuItem value="12months">Last 12 months</MenuItem>
                    </Select>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={behaviorTrends}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <RechartsLegend />
                      <Line 
                        type="monotone" 
                        dataKey="Frequent Purchaser" 
                        stroke={theme.palette.success.main} 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Discount Seeker" 
                        stroke={theme.palette.warning.main} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Mobile User" 
                        stroke={theme.palette.info.main} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Abandoned Cart" 
                        stroke={theme.palette.error.main} 
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Behavior Correlations</Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={behaviorCorrelations}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="behavior" />
                      <PolarRadiusAxis angle={30} domain={[-1, 1]} />
                      <Radar 
                        name="Correlation" 
                        dataKey="Frequent Purchaser" 
                        stroke={theme.palette.success.main}
                        fill={theme.palette.success.main}
                        fillOpacity={0.2} 
                      />
                      <Radar 
                        name="Correlation" 
                        dataKey="Discount Seeker" 
                        stroke={theme.palette.warning.main}
                        fill={theme.palette.warning.main}
                        fillOpacity={0.2} 
                      />
                      <Radar 
                        name="Correlation" 
                        dataKey="Mobile User" 
                        stroke={theme.palette.info.main}
                        fill={theme.palette.info.main}
                        fillOpacity={0.2} 
                      />
                      <RechartsLegend />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Top Behaviors</Typography>
                  <IconButton size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ height: 300, overflowY: 'auto' }}>
                  {behaviorDistribution.map((item, index) => (
                    <Box 
                      key={item.name} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1.5,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        '&:hover': {
                          bgcolor: 'action.selected',
                          cursor: 'pointer'
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '4px', 
                          bgcolor: getBehaviorColor(item.name),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          flexShrink: 0
                        }}
                      >
                        <TimelineIcon sx={{ color: 'white', fontSize: 16 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>{item.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.count} customers • {Math.round((item.count / customers.length) * 100)}%
                        </Typography>
                      </Box>
                      <ChevronRightIcon color="action" />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Behavior Distribution</Typography>
                  <IconButton size="small">
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={behaviorDistribution.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {behaviorDistribution.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBehaviorColor(entry.name)} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name, props) => [
                          `${value} customers (${((value / customers.length) * 100).toFixed(1)}%)`,
                          props.payload.name
                        ]} 
                      />
                      <RechartsLegend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Customer Segments by Behavior</Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Group customers based on shared behaviors and characteristics
            </Typography>
            
            <Grid container spacing={3}>
              {[
                { 
                  name: 'Frequent Shoppers', 
                  description: 'Customers who make purchases regularly',
                  behaviors: ['Frequent Purchaser', 'Loyal Customer'],
                  count: customers.filter(c => c.behaviors.some(b => b.includes('Frequent') || b.includes('Loyal'))).length,
                  color: theme.palette.success.main
                },
                { 
                  name: 'Discount Seekers', 
                  description: 'Customers who primarily purchase during sales',
                  behaviors: ['Discount Seeker', 'Sale Shopper'],
                  count: customers.filter(c => c.behaviors.some(b => b.includes('Discount') || b.includes('Sale'))).length,
                  color: theme.palette.warning.main
                },
                { 
                  name: 'Mobile Shoppers', 
                  description: 'Customers who primarily use mobile devices',
                  behaviors: ['Mobile User', 'App User'],
                  count: customers.filter(c => c.behaviors.some(b => b.includes('Mobile') || b.includes('App'))).length,
                  color: theme.palette.info.main
                },
                { 
                  name: 'At Risk', 
                  description: 'Customers who haven"t purchased recently',
                  behaviors: ['Inactive', 'Churned'],
                  count: customers.filter(c => c.behaviors.some(b => b.includes('Inactive') || b.includes('Churn'))).length,
                  color: theme.palette.error.main
                },
                { 
                  name: 'High Value', 
                  description: 'Customers with high lifetime value',
                  behaviors: ['High Spender', 'Premium Member'],
                  count: customers.filter(c => c.behaviors.some(b => b.includes('High') || b.includes('Premium'))).length,
                  color: theme.palette.primary.main
                },
                { 
                  name: 'New Customers', 
                  description: 'Recently acquired customers',
                  behaviors: ['First-time Buyer', 'New Customer'],
                  count: customers.filter(c => c.behaviors.some(b => b.includes('First') || b.includes('New'))).length,
                  color: theme.palette.secondary.main
                }
              ].map((segment, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: `4px solid ${segment.color}`,
                      '&:hover': {
                        boxShadow: theme.shadows[2],
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {segment.name}
                        </Typography>
                        <Chip 
                          label={`${segment.count}`} 
                          size="small" 
                          color="default"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {segment.description}
                      </Typography>
                      <Box sx={{ mt: 'auto' }}>
                        <Typography variant="caption" color="textSecondary">Key Behaviors:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {segment.behaviors.map((behavior, i) => (
                            <Chip
                              key={i}
                              label={behavior}
                              size="small"
                              sx={{ 
                                height: '20px',
                                '& .MuiChip-label': { px: 1 },
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                fontSize: '0.65rem'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Behavior Patterns</Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { 
                          name: 'Frequent Purchaser', 
                          'Single Purchase': 25, 
                          '2-5 Purchases': 45, 
                          '6+ Purchases': 30 
                        },
                        { 
                          name: 'Discount Seeker', 
                          'Single Purchase': 60, 
                          '2-5 Purchases': 30, 
                          '6+ Purchases': 10 
                        },
                        { 
                          name: 'Mobile User', 
                          'Single Purchase': 20, 
                          '2-5 Purchases': 40, 
                          '6+ Purchases': 40 
                        },
                        { 
                          name: 'Abandoned Cart', 
                          'Single Purchase': 70, 
                          '2-5 Purchases': 25, 
                          '6+ Purchases': 5 
                        },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <RechartsLegend />
                      <Bar dataKey="Single Purchase" stackId="a" fill="#8884d8" />
                      <Bar dataKey="2-5 Purchases" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="6+ Purchases" stackId="a" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Behavior Sequence Analysis</Typography>
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">
                    Customer journey and behavior sequence visualization will be displayed here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Behavior Filters</Typography>
                <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Select behaviors to filter:
                  </Typography>
                  <FormGroup>
                    {allBehaviors.map((behavior) => (
                      <FormControlLabel
                        key={behavior}
                        control={
                          <Checkbox
                            checked={selectedBehaviors.includes(behavior)}
                            onChange={() => toggleBehavior(behavior)}
                            size="small"
                            color="primary"
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '2px', 
                                bgcolor: getBehaviorColor(behavior),
                                mr: 1
                              }} 
                            />
                            <Typography variant="body2">
                              {behavior}
                            </Typography>
                          </Box>
                        }
                        sx={{ 
                          m: 0, 
                          py: 0.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderRadius: 1
                          }
                        }}
                      />
                    ))}
                  </FormGroup>
                </Box>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 2 }}
                  onClick={() => setSelectedBehaviors([])}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Behavior Insights</Typography>
                <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
                  {[
                    {
                      title: 'Top Behavior Combination',
                      value: 'Mobile User + Discount Seeker',
                      description: 'Appears in 42% of customer profiles',
                      color: theme.palette.info.main
                    },
                    {
                      title: 'Most Common Sequence',
                      value: 'First Purchase → Abandoned Cart → Purchase',
                      description: 'Occurs in 28% of customer journeys',
                      color: theme.palette.warning.main
                    },
                    {
                      title: 'Conversion Opportunity',
                      value: '35% of Abandoned Cart users',
                      description: 'Make a purchase within 7 days when retargeted',
                      color: theme.palette.success.main
                    },
                    {
                      title: 'At Risk Segment',
                      value: '22% of customers',
                      description: 'No activity in the last 60 days',
                      color: theme.palette.error.main
                    }
                  ].map((insight, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1, 
                        bgcolor: 'background.paper',
                        borderLeft: `3px solid ${insight.color}`,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          cursor: 'pointer'
                        }
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        {insight.title}
                      </Typography>
                      <Typography variant="subtitle2">
                        {insight.value}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {insight.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tag Distribution</Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tagDistribution}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        scale="band"
                        width={150}
                      />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tag Co-occurrence</Typography>
                <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">
                    Tag co-occurrence matrix will be displayed here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tag Cloud</Typography>
                <Box sx={{ 
                  height: 400, 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  alignContent: 'flex-start',
                  gap: 1,
                  p: 2
                }}>
                  {allTags.map((tag, index) => {
                    const count = tagDistribution.find(t => t.name === tag)?.count || 0;
                    const size = Math.min(24, Math.max(12, Math.ceil(count / 2) + 8));
                    const color = `hsl(${index * 137.508}, 70%, 60%)`;
                    
                    return (
                      <Box
                        key={tag}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: `${color}15`,
                          border: `1px solid ${color}30`,
                          '&:hover': {
                            bgcolor: `${color}25`,
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: `${size}px`,
                            color: color,
                            lineHeight: 1,
                            fontWeight: 'medium'
                          }}
                        >
                          {tag}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            textAlign: 'center',
                            color: 'text.secondary',
                            mt: 0.5
                          }}
                        >
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BehavioralAnalysis;
