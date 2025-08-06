import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Select,
    MenuItem, FormControl, InputLabel, CircularProgress,
    TextField, Tabs, Tab, Paper, Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, query, where, getDocs, getFirestore, Timestamp, orderBy } from 'firebase/firestore';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, addDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

// Icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';

// Helper function to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const GST_RATE = 0.05; // 5% GST
const PACKAGING_COST_PER_ORDER = 50;
const SHIPPING_COST_PER_ORDER = 100;

const AdminAnalytics = () => {
    const [timeRange, setTimeRange] = useState('month');
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        // Sales Metrics
        totalSales: 0,          // Total revenue from all orders
        totalOrders: 0,         // Total number of orders
        totalCustomers: 0,      // Unique customers
        avgOrderValue: 0,       // Average order value

        // Cost Metrics
        totalProductCost: 0,    // Total cost of products
        totalPackagingCost: 0,  // Total packaging cost
        totalShippingCost: 0,   // Total shipping cost

        // Tax & Profit
        totalTax: 0,            // Total GST collected
        grossProfit: 0,         // Sales - Product Cost
        netProfit: 0,           // Sales - All Costs - Tax
        profitMargin: 0,        // (Net Profit / Total Sales) * 100

        // Charts Data
        salesData: [],
        topProducts: []
    });

    // Fetch data from Firestore
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getFirestore();

                // Get date range based on selection
                let startDate, endDate;
                const today = new Date();

                switch (timeRange) {
                    case 'week':
                        startDate = subDays(today, 7);
                        endDate = today;
                        break;
                    case 'year':
                        startDate = new Date(today.getFullYear(), 0, 1);
                        endDate = today;
                        break;
                    case 'month':
                    default:
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        endDate = today;
                }

                // Fetch orders within date range
                const ordersQuery = query(
                    collection(db, 'orders'),
                    where('createdAt', '>=', Timestamp.fromDate(startDate)),
                    where('createdAt', '<=', Timestamp.fromDate(endDate))
                );

                const ordersSnapshot = await getDocs(ordersQuery);
                const orders = [];
                let totalSales = 0;
                let totalProductCost = 0;
                const productSales = {};
                const customerSet = new Set();

                // Process orders
                ordersSnapshot.forEach(doc => {
                    const order = { id: doc.id, ...doc.data() };
                    orders.push(order);

                    // Track unique customers
                    if (order.userId) customerSet.add(order.userId);

                    // Calculate order total
                    const orderTotal = order.items.reduce((sum, item) => {
                        const itemPrice = item.price * (1 - (item.discount / 100)) * (item.quantity || 1);
                        const itemCost = (item.costPrice || 0) * (item.quantity || 1);

                        // Track product sales
                        if (!productSales[item.productId]) {
                            productSales[item.productId] = {
                                name: item.name,
                                sales: 0,
                                quantity: 0,
                                cost: 0
                            };
                        }

                        productSales[item.productId].sales += itemPrice;
                        productSales[item.productId].quantity += (item.quantity || 1);
                        productSales[item.productId].cost += itemCost;

                        totalProductCost += itemCost;
                        return sum + itemPrice;
                    }, 0);

                    totalSales += orderTotal;
                });

                // Calculate metrics
                const totalOrders = orders.length;
                const totalCustomers = customerSet.size;
                const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

                // Calculate costs
                const totalPackagingCost = totalOrders * PACKAGING_COST_PER_ORDER;
                const totalShippingCost = totalOrders * SHIPPING_COST_PER_ORDER;

                // Calculate tax and profits
                const totalTax = totalSales * GST_RATE;
                const totalCosts = totalProductCost + totalPackagingCost + totalShippingCost + totalTax;
                const grossProfit = totalSales - totalProductCost;
                const netProfit = totalSales - totalCosts;
                const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

                // Prepare top products data
                const topProducts = Object.values(productSales)
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 5)
                    .map(item => ({
                        name: item.name,
                        value: item.sales,
                        quantity: item.quantity,
                        profit: item.sales - item.cost
                    }));

                // Update state with calculated data
                setAnalytics({
                    totalSales,
                    totalOrders,
                    totalCustomers,
                    avgOrderValue,
                    totalProductCost,
                    totalPackagingCost,
                    totalShippingCost,
                    totalTax,
                    grossProfit,
                    netProfit,
                    profitMargin,
                    salesData: [
                        { month: 'Jan', sales: totalSales * 0.3 },
                        { month: 'Feb', sales: totalSales * 0.2 },
                        { month: 'Mar', sales: totalSales * 0.4 },
                        { month: 'Apr', sales: totalSales * 0.1 },
                    ],
                    topProducts: topProducts.length > 0 ? topProducts : [
                        { name: 'Terracotta Vase', value: 40, quantity: 10, profit: 2000 },
                        { name: 'Clay Pot', value: 30, quantity: 8, profit: 1500 },
                        { name: 'Wall Hanging', value: 20, quantity: 5, profit: 1000 },
                        { name: 'Sculpture', value: 10, quantity: 3, profit: 500 },
                    ]
                });

            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    // Format currency helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const StatCard = ({ title, value, icon, color, isCurrency = false, suffix = '' }) => (
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {isCurrency ? formatCurrency(value) : value}{suffix}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}20`,
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    // Chart colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <Box p={3}>
            {/* Header and Date Range Selector */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h5" fontWeight="bold">Analytics Dashboard</Typography>

                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            label="Time Range"
                        >
                            <MenuItem value="week">Last 7 Days</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="year">This Year</MenuItem>
                            <MenuItem value="custom">Custom Range</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} mb={4}>
                {/* Total Revenue */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Revenue"
                        value={analytics.totalSales}
                        icon={<MonetizationOnIcon />}
                        color="#4CAF50"
                        isCurrency
                    />
                </Grid>

                {/* Total Orders */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Orders"
                        value={analytics.totalOrders}
                        icon={<ShoppingCartIcon />}
                        color="#2196F3"
                    />
                </Grid>

                {/* Total Customers */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Customers"
                        value={analytics.totalCustomers}
                        icon={<PeopleIcon />}
                        color="#9C27B0"
                    />
                </Grid>

                {/* Average Order Value */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Avg. Order Value"
                        value={analytics.avgOrderValue}
                        icon={<AttachMoneyIcon />}
                        color="#FF9800"
                        isCurrency
                    />
                </Grid>

                {/* Profit Cards */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Gross Profit"
                        value={analytics.grossProfit}
                        icon={<TrendingUpIcon />}
                        color="#4CAF50"
                        isCurrency
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Net Profit"
                        value={analytics.netProfit}
                        icon={<AccountBalanceWalletIcon />}
                        color="#4CAF50"
                        isCurrency
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Profit Margin"
                        value={analytics.profitMargin}
                        icon={<ShowChartIcon />}
                        color={analytics.profitMargin >= 0 ? "#4CAF50" : "#F44336"}
                        suffix="%"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Tax (5% GST)"
                        value={analytics.totalTax}
                        icon={<ReceiptIcon />}
                        color="#9C27B0"
                        isCurrency
                    />
                </Grid>

                {/* Cost Breakdown */}
                <Grid item xs={12}>
                    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Cost Breakdown</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="textSecondary">Product Cost</Typography>
                                    <Typography variant="h6">{formatCurrency(analytics.totalProductCost)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="textSecondary">Packaging Cost</Typography>
                                    <Typography variant="h6">{formatCurrency(analytics.totalPackagingCost)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="textSecondary">Shipping Cost</Typography>
                                    <Typography variant="h6">{formatCurrency(analytics.totalShippingCost)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" color="textSecondary">Total Costs</Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(
                                            analytics.totalProductCost +
                                            analytics.totalPackagingCost +
                                            analytics.totalShippingCost
                                        )}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Sales Overview</Typography>
                                <Tabs
                                    value={timeRange}
                                    onChange={(e, newValue) => setTimeRange(newValue)}
                                    textColor="primary"
                                    indicatorColor="primary"
                                    variant="scrollable"
                                    scrollButtons="auto"
                                >
                                    <Tab label="Week" value="week" />
                                    <Tab label="Month" value="month" />
                                    <Tab label="Year" value="year" />
                                </Tabs>
                            </Box>
                            <Box height={400}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.salesData}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="sales" name="Sales" fill="#4CAF50" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Top Products</Typography>
                            <Box height={400}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.topProducts}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {analytics.topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminAnalytics;
