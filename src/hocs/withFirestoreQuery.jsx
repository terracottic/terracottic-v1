import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFirestoreQuery } from '@/utils/firebaseUtils';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Higher-Order Component that provides optimized Firestore query capabilities
 * to any admin page component.
 * 
 * @param {React.Component} WrappedComponent - The component to enhance
 * @param {Object} options - Configuration options
 * @param {string} options.collectionName - Name of the Firestore collection
 * @param {boolean} options.requireAuth - Whether authentication is required
 * @param {Array<string>} options.requiredRoles - Array of roles that can access this component
 * @returns {React.Component} - Enhanced component with Firestore query capabilities
 */
const withFirestoreQuery = (WrappedComponent, options = {}) => {
  const {
    collectionName = '',
    requireAuth = true,
    requiredRoles = ['admin', 'moderator'],
    ...queryOptions
  } = options;

  return function WithFirestoreQuery(props) {
    const { currentUser } = props.auth || {};
    const [initialLoad, setInitialLoad] = useState(true);
    const [queryParams, setQueryParams] = useState({
      filters: [],
      orderByField: 'createdAt',
      orderDirection: 'desc',
      pageSize: 10,
      ...queryOptions
    });

    // Initialize Firestore query
    const {
      data,
      loading,
      error,
      hasMore,
      loadMore,
      refresh
    } = useFirestoreQuery(collectionName, queryParams);

    // Handle initial load
    useEffect(() => {
      if (initialLoad && !loading) {
        setInitialLoad(false);
      }
    }, [loading, initialLoad]);

    const navigate = useNavigate();
    const location = useLocation();

    // Handle authentication and authorization
    useEffect(() => {
      // Only check auth if required
      if (!requireAuth) return;

      // If no current user, redirect to login
      if (!currentUser) {
        navigate('/admin/login', { 
          state: { from: location },
          replace: true 
        });
        return;
      }

      // If user doesn't have required role, redirect to home
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
        console.warn('Access denied: Insufficient permissions');
        navigate('/', { replace: true });
      }
    }, [currentUser, requireAuth, requiredRoles, navigate, location]);

    // Update query parameters
    const updateQuery = useCallback((updates) => {
      setQueryParams(prev => ({
        ...prev,
        ...updates,
        // Reset pagination when filters change
        ...(updates.filters || updates.orderByField || updates.orderDirection 
          ? { page: 0 } 
          : {})
      }));
    }, []);

    // Loading state
    if (initialLoad) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      );
    }

    // Error state
    if (error) {
      return (
        <Box textAlign="center" p={4}>
          <Typography color="error" gutterBottom>
            Error loading data: {error.message}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={refresh}
          >
            Retry
          </Button>
        </Box>
      );
    }

    // Render the wrapped component with additional props
    return (
      <WrappedComponent
        {...props}
        data={data || []}
        loading={loading}
        error={error}
        hasMore={hasMore}
        loadMore={loadMore}
        refresh={refresh}
        updateQuery={updateQuery}
        queryParams={queryParams}
        currentUser={currentUser}
        authLoading={authLoading}
      />
    );
  };
};

export default withFirestoreQuery;
