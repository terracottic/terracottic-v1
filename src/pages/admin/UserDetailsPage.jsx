import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Avatar, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  VerifiedUser as VerifiedUserIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';
import { ROLES } from '@/constants/roles';

const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: 'Admin',
    color: 'error',
  },
  [ROLES.USER]: {
    label: 'User',
    color: 'default',
  },
};

const UserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          setUser({
            id: userDoc.id,
            ...userDoc.data(),
            // Ensure dates are properly formatted
            createdAt: userDoc.data().createdAt?.toDate(),
            lastLogin: userDoc.data().lastLogin?.toDate(),
          });
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={3}>
        <Typography>User not found</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/admin/users')}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">User Details</Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} display="flex" justifyContent="center">
            <Avatar 
              src={user.photoURL} 
              alt={user.displayName}
              sx={{ width: 150, height: 150, fontSize: '3rem' }}
            >
              {user.displayName?.charAt(0) || 'U'}
            </Avatar>
          </Grid>
          <Grid item xs={12} md={9}>
            <Box mb={2} display="flex" alignItems="center">
              <Typography variant="h4" component="h1" sx={{ mr: 2 }}>
                {user.displayName || 'No Name'}
              </Typography>
              <Chip 
                label={ROLE_CONFIG[user.role]?.label || user.role}
                color={ROLE_CONFIG[user.role]?.color || 'default'}
                size="small"
              />
            </Box>
            
            <Box mb={2}>
              <Box display="flex" alignItems="center" mb={1}>
                <EmailIcon color="action" sx={{ mr: 1 }} />
                <Typography>{user.email || 'No email'}</Typography>
              </Box>
              {user.phoneNumber && (
                <Box display="flex" alignItems="center" mb={1}>
                  <PhoneIcon color="action" sx={{ mr: 1 }} />
                  <Typography>{user.phoneNumber}</Typography>
                </Box>
              )}
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon color="action" sx={{ mr: 1 }} />
                <Typography>User ID: {user.id}</Typography>
              </Box>
              {user.createdAt && (
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarIcon color="action" sx={{ mr: 1 }} />
                  <Typography>
                    Member since: {format(user.createdAt, 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
              {user.emailVerified && (
                <Box display="flex" alignItems="center" mb={1}>
                  <VerifiedUserIcon color="success" sx={{ mr: 1 }} />
                  <Typography>Email Verified</Typography>
                </Box>
              )}
              {user.status === 'blocked' && (
                <Box display="flex" alignItems="center" mb={1}>
                  <BlockIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="error">Account Blocked</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => navigate(-1)}
        >
          Back to Users
        </Button>
        {user.role !== ROLES.ADMIN && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate(`/admin/users/${userId}/edit`)}
          >
            Edit User
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default UserDetailsPage;
