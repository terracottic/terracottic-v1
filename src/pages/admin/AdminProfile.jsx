import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc, getFirestore, getDocs, collection, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Divider,
  Avatar,
  Grid,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Switch
} from '@mui/material';
import { 
  Lock as LockIcon, 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Build as BuildIcon,
  CloudDownload as CloudDownloadIcon,
  Warning as WarningIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const AdminProfile = () => {
  const { currentUser, updateUserProfile, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('2 hours');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    timezone: 'Asia/Kolkata',
    notifications: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    if (currentUser && !hasLoaded) {
      const fetchData = async () => {
        try {
          // Fetch user data
          const [userDoc, maintenanceDoc] = await Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            getDoc(doc(db, 'settings', 'maintenance'))
          ]);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileData(prev => ({
              ...prev,
              displayName: userData.displayName || currentUser.displayName || '',
              email: currentUser.email || '',
              phoneNumber: userData.phoneNumber || '',
              timezone: userData.timezone || 'Asia/Kolkata',
              notifications: userData.notifications !== undefined ? userData.notifications : true
            }));
          }
          
          // Set maintenance data
          if (maintenanceDoc.exists()) {
            const maintenanceData = maintenanceDoc.data();
            setMaintenanceMode(maintenanceData.enabled || false);
            setMaintenanceMessage(maintenanceData.message || 'We are currently performing maintenance. Please check back soon.');
            setEstimatedCompletion(maintenanceData.estimatedCompletion || '2 hours');
          }
          
          setHasLoaded(true);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load data');
        }
      };
      
      fetchData();
    }
  }, [currentUser, db]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const logCurrentSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'maintenance');
      const docSnap = await getDoc(docRef);
      console.log('Current Firestore maintenance settings:', docSnap.exists() ? docSnap.data() : 'No settings found');
    } catch (error) {
      console.error('Error logging settings:', error);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      setLoading(true);
      const maintenanceRef = doc(db, 'settings', 'maintenance');
      const newMode = !maintenanceMode;
      
      const updateData = {
        enabled: newMode,
        message: maintenanceMessage,
        estimatedCompletion: estimatedCompletion,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      };
      
      console.log('Saving maintenance settings:', updateData);
      await updateDoc(maintenanceRef, updateData, { merge: true });
      
      // Log current settings after update
      await logCurrentSettings();
      
      setMaintenanceMode(newMode);
      setSuccess(`Maintenance mode ${newMode ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      setError('Failed to update maintenance mode');
    } finally {
      setLoading(false);
    }
  };
  
  const exportData = async () => {
    try {
      setLoading(true);
      const collections = ['products', 'categories', 'users', 'orders'];
      let allData = {};
      
      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        allData[collectionName] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Create and trigger download
      const dataStr = JSON.stringify(allData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccess('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update profile in Firebase Auth
      if (profileData.displayName !== currentUser.displayName) {
        await updateUserProfile({
          displayName: profileData.displayName
        });
      }

      // Update additional profile data in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber,
        timezone: profileData.timezone,
        notifications: profileData.notifications,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate passwords
      if (profileData.newPassword !== profileData.confirmPassword) {
        throw new Error("New passwords don't match");
      }

      if (profileData.newPassword.length < 6) {
        throw new Error('Password should be at least 6 characters');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        profileData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, profileData.newPassword);

      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setSuccess('Password updated successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={undefined}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={undefined}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Button 
          variant={activeTab === 'profile' ? 'contained' : 'text'} 
          onClick={() => setActiveTab('profile')}
          sx={{ mr: 2, mb: -1 }}
        >
          Profile Settings
        </Button>
        <Button 
          variant={activeTab === 'maintenance' ? 'contained' : 'text'}
          onClick={() => setActiveTab('maintenance')}
          startIcon={<BuildIcon />}
          sx={{ mb: -1 }}
        >
          Maintenance
        </Button>
      </Box>
      
      {activeTab === 'profile' ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar
                    sx={{ width: 80, height: 80, mr: 2 }}
                    src={currentUser?.photoURL}
                  >
                    <PersonIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{profileData.displayName || 'Admin User'}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {currentUser?.email}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Admin
                    </Typography>
                  </Box>
                </Box>

                <form onSubmit={handleUpdateProfile}>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    margin="normal"
                    InputProps={{
                      startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    margin="normal"
                    placeholder="+91 XXXXXXXXXX"
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      name="timezone"
                      value={profileData.timezone}
                      onChange={handleInputChange}
                      label="Timezone"
                    >
                      <MenuItem value="Asia/Kolkata">India (IST - UTC+5:30)</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                      <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                      <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                      <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                    </Select>
                    <FormHelperText>Select your local timezone</FormHelperText>
                  </FormControl>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                
                <form onSubmit={handleChangePassword}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={profileData.currentPassword}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: <LockIcon color="action" sx={{ mr: 1 }} />
                    }}
                  />

                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={profileData.newPassword}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    helperText="At least 6 characters"
                  />

                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />

                  <Box sx={{ mt: 2 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      disabled={loading || !profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={profileData.notifications}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        notifications: e.target.checked
                      }))}
                      name="notifications"
                      color="primary"
                    />
                  }
                  label="Enable email notifications"
                />
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Receive email notifications for important updates and activities.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Maintenance Mode
                  </Typography>
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={maintenanceMode}
                      onChange={handleMaintenanceToggle}
                      color="warning"
                      disabled={loading}
                    />
                  }
                  label={
                    <Typography color={maintenanceMode ? 'error' : 'textPrimary'}>
                      {maintenanceMode ? 'Maintenance Mode is ON' : 'Maintenance Mode is OFF'}
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Maintenance Message"
                  multiline
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="Enter maintenance message to display to users"
                />
                
                <TextField
                  fullWidth
                  label="Estimated Completion Time"
                  variant="outlined"
                  value={estimatedCompletion}
                  onChange={(e) => setEstimatedCompletion(e.target.value)}
                  margin="normal"
                  placeholder="e.g., 2 hours, 30 minutes, Tomorrow"
                  helperText="This will be shown to users on the maintenance page"
                />
                
                <Box mt={2} display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleMaintenanceToggle}
                    disabled={loading}
                    startIcon={<BuildIcon />}
                  >
                    {maintenanceMode ? 'Disable' : 'Enable'} Maintenance Mode
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const maintenanceRef = doc(db, 'settings', 'maintenance');
                        const updateData = {
                          message: maintenanceMessage,
                          estimatedCompletion: estimatedCompletion,
                          // Keep the current enabled state when just saving settings
                          enabled: maintenanceMode,
                          updatedAt: new Date().toISOString(),
                          updatedBy: currentUser.uid
                        };
                        
                        console.log('Saving maintenance settings from button:', updateData);
                        await updateDoc(maintenanceRef, updateData, { merge: true });
                        
                        // Log current settings after update
                        await logCurrentSettings();
                        
                        setSuccess('Maintenance settings updated successfully');
                      } catch (error) {
                        console.error('Error updating maintenance settings:', error);
                        setError('Failed to update maintenance settings');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    startIcon={<SaveIcon />}
                  >
                    Save Settings
                  </Button>
                </Box>  
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Data Export
                </Typography>
                
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadIcon />}
                  onClick={exportData}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  Export Site Data
                </Button>
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  Export all site data as a JSON backup file. This includes products, categories, users, and orders.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminProfile;
