import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Alert, 
  CircularProgress, 
  TextField,
  Snackbar,
  Paper,
  Grid
} from '@mui/material';
import { CloudDownload, Save, Warning } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function MaintenanceSettings() {
  const { currentUser } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('2 hours');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const db = getFirestore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'maintenance');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMaintenanceMode(data.enabled || false);
          setMaintenanceMessage(data.message || '');
          setEstimatedCompletion(data.estimatedCompletion || '2 hours');
        } else {
          // Initialize maintenance settings if they don't exist
          await updateDoc(docRef, {
            enabled: false,
            message: 'We are currently performing maintenance. Please check back soon.',
            estimatedCompletion: '2 hours',
            updatedBy: currentUser.uid,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error fetching maintenance settings:', err);
        setError('Failed to load maintenance settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [db, currentUser]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'settings', 'maintenance'), {
        enabled: maintenanceMode,
        message: maintenanceMessage,
        estimatedCompletion: estimatedCompletion,
        updatedBy: currentUser.uid,
        updatedAt: new Date().toISOString()
      });
      setSuccess('Maintenance settings saved successfully');
    } catch (err) {
      console.error('Error saving maintenance settings:', err);
      setError('Failed to save maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      setLoading(true);
      // Here you would typically fetch and prepare your data for export
      // This is a simplified example
      const collections = ['products', 'categories', 'users', 'orders'];
      let allData = {};
      
      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        allData[collectionName] = querySnapshot.docs.map(doc => doc.data());
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
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Maintenance Settings</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maintenance Mode
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    color="primary"
                  />
                }
                label={maintenanceMode ? "Maintenance Mode is ON" : "Maintenance Mode is OFF"}
              />
              
              <Typography variant="body2" color="textSecondary" paragraph sx={{ mt: 2 }}>
                When maintenance mode is enabled, only administrators will be able to access the site.
                All other users will see the maintenance page.
              </Typography>
              
              <TextField
                fullWidth
                label="Maintenance Message"
                multiline
                rows={3}
                variant="outlined"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                margin="normal"
                placeholder="Enter a message to display to users during maintenance"
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
              
              <Box mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Export
              </Typography>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                Export all site data as a JSON backup file. This includes products, categories, users, and orders.
              </Typography>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudDownload />}
                onClick={exportData}
                disabled={loading}
                fullWidth
              >
                Export All Data
              </Button>
              
              <Box mt={3}>
                <Alert severity="warning" icon={<Warning />}>
                  <Typography variant="body2">
                    <strong>Note:</strong> This will export all site data. Large exports may take some time to process.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
