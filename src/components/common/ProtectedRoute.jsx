import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { 
  CircularProgress, 
  Box, 
  Typography, 
  Button, 
  Container,
  Paper,
  Fade
} from '@mui/material';
import { 
  Lock as LockIcon, 
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { Alert, Chip } from '@mui/material';

/**
 * ProtectedRoute component that handles authentication and role-based access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The child components to render if access is granted
 * @param {string} [props.requiredRole=null] - The role required to access the route
 * @param {boolean} [props.exactRole=false] - If true, the user's role must exactly match the requiredRole
 * @param {string[]} [props.roles=null] - An array of roles that can access the route
 * @param {boolean} [props.anyRole=false] - If true, the user can access if they have any of the roles in the roles array
 * @param {string} [props.redirectTo='/login'] - The path to redirect to if access is denied
 * @param {boolean} [props.showUnauthorized=true] - Whether to show an unauthorized message or just redirect
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole = null, 
  exactRole = false,
  roles = null,
  anyRole = false,
  redirectTo = '/login',
  showUnauthorized = true
}) {
  const { user, loading, error, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Show error messages
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  }, [error, enqueueSnackbar]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  if (loading || isRefreshing) {
    return (
      <Fade in={true} timeout={500}>
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="80vh"
          textAlign="center"
          p={3}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
            {isRefreshing ? 'Applying changes...' : 'Loading...'}
          </Typography>
        </Box>
      </Fade>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If no role is required, allow access
  if (!requiredRole && !roles) {
    return children;
  }

  // Check access based on role requirements
  let hasAccess = true;
  
  if (requiredRole) {
    hasAccess = exactRole 
      ? user.role === requiredRole 
      : hasRole(requiredRole);
  }
  
  // Check multiple roles if provided
  if (roles && roles.length > 0) {
    hasAccess = anyRole 
      ? hasAnyRole(roles)
      : hasRole(roles[0]); // If not anyRole, check first role in array
  }

  // If access is denied, show unauthorized or redirect
  if (!hasAccess) {
    if (!showUnauthorized) {
      return <Navigate to="/" replace />;
    }
    
    return (
      <Fade in={true}>
        <Container component="main" maxWidth="md" sx={{ py: 8 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 3, md: 6 }, 
                width: '100%', 
                maxWidth: 600,
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <LockIcon color="error" sx={{ fontSize: 60, mb: 3 }} />
              <Typography component="h1" variant="h4" gutterBottom>
                Access Denied
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                You don't have permission to access this page.
              </Typography>
              
              {requiredRole && (
                <Box 
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    p: 2,
                    borderRadius: 1,
                    mb: 3,
                    textAlign: 'left'
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Required Permission
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Chip 
                      label={requiredRole || roles?.join(' or ')} 
                      color="primary" 
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {!exactRole && (
                      <Typography variant="caption" color="textSecondary">
                        or higher
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => window.history.back()}
                  startIcon={<ArrowBackIcon />}
                >
                  Go Back
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleRefresh}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
                
                <Button 
                  variant="text" 
                  onClick={() => window.location.href = '/'}
                >
                  Go to Home
                </Button>
              </Box>
              
              {error && (
                <Box mt={3}>
                  <Alert severity="error">
                    {error}
                  </Alert>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      </Fade>
    );
  }

  return children;
};
