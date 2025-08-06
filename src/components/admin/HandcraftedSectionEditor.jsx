import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon } from '@mui/icons-material';

const HandcraftedSectionEditor = () => {
  const [sectionData, setSectionData] = useState({
    title: 'Handcrafted with Love',
    description: 'Discover our unique collection of handcrafted pottery, each piece telling its own story through traditional craftsmanship.'
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Initialize with default values first
  useEffect(() => {
    setSectionData({
      title: 'Handcrafted with Love',
      description: 'Discover our unique collection of handcrafted pottery, each piece telling its own story through traditional craftsmanship.'
    });
    
    // Load data from Firestore
    const loadData = async () => {
      try {
        const docRef = doc(db, 'homepageSections', 'handcraftedSection');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSectionData(prev => ({
            ...prev,
            ...docSnap.data()
          }));
        }
      } catch (error) {
        console.error('Error loading section data:', error);
        // Don't show error to user, just use default values
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSectionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!sectionData.title?.trim() || !sectionData.description?.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'homepageSections', 'handcraftedSection');
      
      await setDoc(docRef, {
        title: sectionData.title.trim(),
        description: sectionData.description.trim(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      setSnackbar({
        open: true,
        message: 'Section updated successfully!',
        severity: 'success'
      });
      setEditing(false);
    } catch (error) {
      console.error('Error saving section data:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to save section data'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && !editing) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Handcrafted Section Editor
        </Typography>
        {editing ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            Save Changes
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      {editing ? (
        <Box>
          <TextField
            fullWidth
            label="Section Title"
            name="title"
            value={sectionData.title}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Section Description"
            name="description"
            value={sectionData.description}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            multiline
            rows={4}
          />
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" gutterBottom>
            {sectionData.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {sectionData.description}
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default HandcraftedSectionEditor;
