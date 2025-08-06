import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  LinearProgress,
  useTheme,
  Paper,
  TextField
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Mock data - in a real app, this would come from your API
const generateMockSalesData = (days = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'MMM dd'),
      sales: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 100) + 20,
      visitors: Math.floor(Math.random() * 500) + 200,
    });
  }
  
  return data;
};

const categoryData = [
  { name: 'Handicrafts', value: 35 },
  { name: 'Home Decor', value: 25 },
  { name: 'Jewelry', value: 20 },
  { name: 'Clothing', value: 15 },
  { name: 'Others', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SalesAnalytics = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('30days');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      // In a real app, you would fetch this data from your API
      // const response = await api.get(`/api/analytics/sales?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      // setSalesData(response.data);
      
      // For demo purposes, generate mock data
      setTimeout(() => {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        setSalesData(generateMockSalesData(days));
        setLoading(false);
      }, 800);
    };

    fetchData();
  }, [timeRange, startDate, endDate]);

  const handleTimeRangeChange = (event) => {
    const value = event.target.value;
    setTimeRange(value);
    
    const today = new Date();
    switch (value) {
      case '7days':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case '30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case '90days':
        setStartDate(subDays(today, 90));
        setEndDate(today);
        break;
      case 'custom':
        // Custom date range will be handled by the date pickers
        break;
      default:
        setStartDate(subDays(today, 30));
        setEndDate(today);
    }
  };

  // Calculate summary metrics
  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const avgOrderValue = totalSales / (totalOrders || 1);
  const totalVisitors = salesData.reduce((sum, day) => sum + day.visitors, 0);
  const conversionRate = ((totalOrders / (totalVisitors || 1)) * 100).toFixed(2);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Analytics
      </Typography>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {timeRange === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    maxDate={endDate}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={startDate}
                    maxDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Sales</Typography>
              <Typography variant="h5">${totalSales.toLocaleString()}</Typography>
              <Typography variant="body2" color="success.main">
                +12% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Orders</Typography>
              <Typography variant="h5">{totalOrders.toLocaleString()}</Typography>
              <Typography variant="body2" color="success.main">
                +8% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Avg. Order Value</Typography>
              <Typography variant="h5">${avgOrderValue.toFixed(2)}</Typography>
              <Typography variant="body2" color="error.main">
                -2% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Conversion Rate</Typography>
              <Typography variant="h5">{conversionRate}%</Typography>
              <Typography variant="body2" color="success.main">
                +3% from last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Trend Chart */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>Sales Trend</Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                name="Sales ($)" 
                stroke={theme.palette.primary.main} 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                name="Orders" 
                stroke={theme.palette.secondary.main} 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* Sales by Category */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Sales by Category</Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recent Orders</Typography>
            <Box sx={{ height: 300, overflow: 'auto' }}>
              {Array(5).fill().map((_, i) => (
                <Box key={i} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}>
                  <Box>
                    <Typography>Order #{Math.floor(1000 + Math.random() * 9000)}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {Math.floor(1 + Math.random() * 3)} items • ${(Math.random() * 200 + 20).toFixed(2)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={['Pending', 'Processing', 'Shipped', 'Delivered'][Math.floor(Math.random() * 4)]}
                    color={
                      ['warning', 'info', 'primary', 'success'][Math.floor(Math.random() * 4)]
                    }
                    size="small"
                  />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesAnalytics;
