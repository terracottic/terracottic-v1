import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Container, 
  CircularProgress, 
  Button,
  Alert,
  AlertTitle,
  Snackbar
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  ShoppingCart as OrdersIcon,
  Store as ProductsIcon,
  People as UsersIcon,
  MonetizationOn as RevenueIcon,
  Person as CustomerIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  MoreVert as MoreVertIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  PeopleAltOutlined as PeopleAltOutlinedIcon,
  ReceiptOutlined as ReceiptOutlinedIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  Construction as ConstructionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Format currency helper function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const StatCard = ({ title, value, icon: Icon, color, subValue, trend, trendValue }) => {
  const trendColor = trend === 'up' ? 'success.main' : 'error.main';
  const trendIcon = trend === 'up' ? '↑' : '↓';
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          borderColor: 'transparent'
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography 
            variant="h5" 
            component="div" 
            fontWeight={600} 
            sx={{ 
              fontSize: '1.75rem',
              lineHeight: 1.2,
              mb: 0.5
            }}
          >
            {value}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          {subValue && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                mt: 0.5,
                color: 'text.secondary'
              }}
            >
              {subValue}
            </Typography>
          )}
        </Box>
        
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.main`,
            borderRadius: '12px',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon fontSize="medium" />
        </Box>
      </Box>
      
      {trend && (
        <Box 
          sx={{ 
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            color: trendColor
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.75rem'
            }}
          >
            {trendIcon} {trendValue}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            vs last period
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

const AdminDashboard = () => {
  const { hasRole, ROLES, currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    newCustomers: 0,
    // Add fields for previous period data
    prevTotalOrders: 0,
    prevTotalRevenue: 0,
    prevActiveCustomers: 0,
    prevNewCustomers: 0,
    // Add fields for trends
    ordersTrend: 0,
    revenueTrend: 0,
    activeCustomersTrend: 0,
    newCustomersTrend: 0,
    aovTrend: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  // Helper function to calculate trend percentage
  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Format trend value for display
  const formatTrend = (value) => {
    if (isNaN(value) || !isFinite(value)) return '0%';
    const trendValue = Math.abs(Math.round(value * 10) / 10);
    return `${trendValue}%`;
  };

  const updateStats = useCallback((updates) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        ...updates,
        totalRevenue: updates.totalRevenue !== undefined 
          ? parseFloat(updates.totalRevenue).toFixed(2) 
          : prev.totalRevenue
      };
      
      // Calculate trends
      if (updates.prevTotalOrders !== undefined && updates.totalOrders !== undefined) {
        newStats.ordersTrend = calculateTrend(updates.totalOrders, updates.prevTotalOrders);
      }
      
      if (updates.prevTotalRevenue !== undefined && updates.totalRevenue !== undefined) {
        newStats.revenueTrend = calculateTrend(updates.totalRevenue, updates.prevTotalRevenue);
      }
      
      if (updates.prevActiveCustomers !== undefined && updates.activeCustomers !== undefined) {
        newStats.activeCustomersTrend = calculateTrend(updates.activeCustomers, updates.prevActiveCustomers);
      }
      
      if (updates.prevNewCustomers !== undefined && updates.newCustomers !== undefined) {
        newStats.newCustomersTrend = calculateTrend(updates.newCustomers, updates.prevNewCustomers);
      }
      
      // Calculate AOV trend
      if (updates.totalOrders > 0 && updates.prevTotalOrders > 0) {
        const currentAOV = updates.totalRevenue / updates.totalOrders;
        const prevAOV = updates.prevTotalRevenue / updates.prevTotalOrders;
        newStats.aovTrend = calculateTrend(currentAOV, prevAOV);
      }
      
      return newStats;
    });
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!currentUser || !hasRole(ROLES.ADMIN)) {
      navigate('/unauthorized');
      return;
    }

    let isMounted = true;
    const unsubscribeFunctions = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const setupListeners = async () => {
      try {
        setLoading(true);
        
        // Fetch orders data with real-time listener
        const q = query(collection(db, 'orders'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          let totalRevenue = 0;
          let prevPeriodRevenue = 0;
          const orderCount = querySnapshot.size;
          let prevPeriodOrderCount = 0;
          
          const now = new Date();
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          const sixtyDaysAgo = new Date(now);
          sixtyDaysAgo.setDate(now.getDate() - 60);
          
          querySnapshot.forEach((doc) => {
            const order = doc.data();
            const orderDate = order.createdAt?.toDate() || new Date(0);
            
            // Current period (last 30 days)
            if (orderDate >= thirtyDaysAgo) {
              totalRevenue += order.totalPrice || 0;
            }
            
            // Previous period (30-60 days ago)
            if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) {
              prevPeriodRevenue += order.totalPrice || 0;
              prevPeriodOrderCount++;
            }
          });
          
          updateStats({
            totalOrders: orderCount,
            totalRevenue: totalRevenue,
            prevTotalOrders: prevPeriodOrderCount,
            prevTotalRevenue: prevPeriodRevenue
          });
        });
        
        unsubscribeFunctions.push(unsubscribe);

        // Fetch products count with real-time listener
        const q2 = query(collection(db, 'products'));
        
        const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
          let activeCount = 0;
          let inactiveCount = 0;
          
          querySnapshot.forEach((doc) => {
            const product = doc.data();
            if (product.status === 'active') {
              activeCount++;
            } else {
              inactiveCount++;
            }
          });
          
          updateStats({
            totalProducts: querySnapshot.size,
            activeProducts: activeCount,
            inactiveProducts: inactiveCount
          });
        });
        
        unsubscribeFunctions.push(unsubscribe2);

        // Fetch only real users with role 'user'
        const q3 = query(collection(db, 'users'), 
          where('role', '==', 'user')
        );
        
        const unsubscribe3 = onSnapshot(q3, (querySnapshot) => {
          const now = new Date();
          const activeThreshold = new Date(now);
          activeThreshold.setDate(now.getDate() - 30);
          
          const newThreshold = new Date(now);
          newThreshold.setDate(now.getDate() - 7);
          
          // Previous period thresholds
          const prevActiveThreshold = new Date(now);
          prevActiveThreshold.setDate(now.getDate() - 60);
          
          const prevNewThreshold = new Date(now);
          prevNewThreshold.setDate(now.getDate() - 14);
          
          let activeCount = 0;
          let newCount = 0;
          let prevActiveCount = 0;
          let prevNewCount = 0;
          
          querySnapshot.forEach((doc) => {
            const user = doc.data();
            // Safely convert Firestore Timestamp to Date
            const convertToDate = (timestamp) => {
              if (!timestamp) return new Date(0);
              if (typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
              }
              // If it's already a Date or a string that can be parsed as a Date
              return new Date(timestamp);
            };
            
            const lastActive = convertToDate(user.lastActive);
            const createdAt = convertToDate(user.createdAt);
            
            // Current period counts
            if (lastActive >= activeThreshold) {
              activeCount++;
            }
            
            if (createdAt >= newThreshold) {
              newCount++;
            }
            
            // Previous period counts
            if (lastActive >= prevActiveThreshold && lastActive < activeThreshold) {
              prevActiveCount++;
            }
            
            if (createdAt >= prevNewThreshold && createdAt < newThreshold) {
              prevNewCount++;
            }
          });
          
          updateStats({
            totalCustomers: querySnapshot.size,
            activeCustomers: activeCount,
            newCustomers: newCount,
            prevActiveCustomers: prevActiveCount,
            prevNewCustomers: prevNewCount
          });
        });
        
        unsubscribeFunctions.push(unsubscribe3);
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser, hasRole, navigate, ROLES.ADMIN, updateStats]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh">
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" color="textSecondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!hasRole('admin')) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            You don't have permission to view this page.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Error
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Paper>
      </Container>
    );
  }



  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth={false}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Dashboard Overview
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2
          }}>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setLastUpdated(new Date())}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Orders"
              value={stats.totalOrders.toLocaleString()}
              icon={OrdersIcon}
              color="primary"
              trend={stats.ordersTrend >= 0 ? "up" : "down"}
              trendValue={formatTrend(stats.ordersTrend)}
              subValue={`vs previous period`}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Products"
              value={stats.totalProducts.toLocaleString()}
              icon={ProductsIcon}
              color="success"
              subValue={`${stats.activeProducts || 0} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Users"
              value={stats.totalCustomers.toLocaleString()}
              icon={UsersIcon}
              color="warning"
              trend={stats.activeCustomersTrend >= 0 ? "up" : "down"}
              trendValue={formatTrend(stats.activeCustomersTrend)}
              subValue={`${stats.activeCustomers} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={RevenueIcon}
              color="info"
              trend={stats.revenueTrend >= 0 ? "up" : "down"}
              trendValue={formatTrend(stats.revenueTrend)}
              subValue={`vs previous period`}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard
              title="Active Users"
              value={stats.activeCustomers?.toLocaleString() || '0'}
              icon={CustomerIcon}
              color="secondary"
              trend={stats.activeCustomersTrend >= 0 ? "up" : "down"}
              trendValue={formatTrend(stats.activeCustomersTrend)}
              subValue="Last 30 days"
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <StatCard
              title="New Users"
              value={stats.newCustomers?.toLocaleString() || '0'}
              icon={PersonAddIcon}
              color="success"
              trend={stats.newCustomersTrend >= 0 ? "up" : "down"}
              trendValue={formatTrend(stats.newCustomersTrend)}
              subValue="Last 7 days"
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <StatCard
              title="Average Order Value"
              value={stats.totalOrders > 0 ? formatCurrency(stats.totalRevenue / stats.totalOrders) : formatCurrency(0)}
              icon={RevenueIcon}
              color="info"
              trend={stats.aovTrend >= 0 ? "up" : "down"}
              trendValue={formatTrend(stats.aovTrend)}
              subValue="vs previous period"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Button 
                  size="small" 
                  color="primary"
                  endIcon={<ArrowForwardIosIcon fontSize="small" />}
                >
                  View All
                </Button>
              </Box>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Activity chart will be displayed here
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <MoreVertIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { icon: <AddCircleOutlineIcon color="primary" />, text: 'Add New Product' , onClick: () => navigate('/admin/products/new')},
                  { icon: <PeopleAltOutlinedIcon color="secondary" />, text: 'Manage Users' , onClick: () => navigate('/admin/users')},
                  { icon: <ReceiptOutlinedIcon color="success" />, text: 'View Orders' , onClick: () => navigate('/admin/orders')},
                  { icon: <BarChartOutlinedIcon color="info" />, text: 'View Reports' , onClick: () => navigate('/admin/reports')},
                  { icon: <SettingsOutlinedIcon color="action" />, text: 'Store Settings' , onClick: () => navigate('/admin/settings')},
                ].map((action, index) => (
                  <Button
                    key={index}
                    startIcon={action.icon}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1.5,
                      px: 2,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    {action.text}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Grid>

        </Grid>


      </Container>
    </Box>
  );
};

export default AdminDashboard;