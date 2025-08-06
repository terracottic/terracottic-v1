import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  Paper
} from '@mui/material';
import { Save as SaveIcon, Image as ImageIcon, Link as LinkIcon } from '@mui/icons-material';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { useSnackbar } from 'notistack';

const POPUP_TYPES = {
  GUEST: 'guest',
  USER: 'user'
};

const PopupManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [popupType, setPopupType] = useState(POPUP_TYPES.GUEST);
  const [popupData, setPopupData] = useState({
    title: '',
    message: '',
    description: '',
    buttonText: 'Learn More',
    buttonLink: '#',
    secondaryButtonText: 'Dismiss',
    buttonLink2: '',
    badge: 'New',
    isActive: true,
    imageUrl: '',
    imageLink: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchPopupData = async () => {
      try {
        const docRef = doc(db, 'popups', popupType === POPUP_TYPES.USER ? 'userAnnouncement' : 'guestAnnouncement');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPopupData(prev => ({
            ...prev,
            ...data,
          }));
          if (data.imageUrl) {
            setImagePreview(data.imageUrl);
            setImageUrl(data.imageUrl);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${popupType} popup data:`, error);
        enqueueSnackbar(`Failed to load ${popupType} popup data`, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPopupData();
  }, [popupType, enqueueSnackbar]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setPopupData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      enqueueSnackbar('Please select a valid image file', { variant: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      enqueueSnackbar('Image size should be less than 2MB', { variant: 'error' });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // If popup is inactive, we can save with minimal data
      if (!popupData.isActive) {
        const dataToSave = {
          isActive: false,
          lastUpdated: serverTimestamp(),
          date: popupData.date || new Date().toISOString(),
          // Preserve existing data if available
          ...popupData
        };
        
        const docRef = doc(db, 'popups', popupType === POPUP_TYPES.USER ? 'userAnnouncement' : 'guestAnnouncement');
        await setDoc(docRef, dataToSave, { merge: true });
        enqueueSnackbar(`${popupType === POPUP_TYPES.USER ? 'User' : 'Guest'} popup has been deactivated.`, { 
          variant: 'success' 
        });
        return;
      }

      // For active popups, validate required fields
      if (!popupData.title || !popupData.message || !popupData.buttonText || !popupData.buttonLink) {
        enqueueSnackbar('Please fill in all required fields for an active popup', { variant: 'error' });
        setSaving(false);
        return;
      }

      // Upload image if new file is selected
      let imageUrlToSave = popupData.imageUrl;
      if (imageFile) {
        const storageRef = ref(storage, `popups/${popupType}_${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrlToSave = await getDownloadURL(storageRef);
      } else if (imageUrl && activeTab === 1) {
        imageUrlToSave = imageUrl;
      }

      const dataToSave = {
        ...popupData,
        imageUrl: imageUrlToSave,
        lastUpdated: serverTimestamp(),
        date: popupData.date || new Date().toISOString(),
      };

      // Save to Firestore
      const docRef = doc(db, 'popups', popupType === POPUP_TYPES.USER ? 'userAnnouncement' : 'guestAnnouncement');
      await setDoc(docRef, dataToSave, { merge: true });
      
      enqueueSnackbar(`${popupType === POPUP_TYPES.USER ? 'User' : 'Guest'} popup saved successfully!`, { 
        variant: 'success' 
      });

    } catch (error) {
      console.error(`Error saving ${popupType} popup:`, error);
      enqueueSnackbar(`Failed to save ${popupType} popup`, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePopupTypeChange = (event, newType) => {
    setPopupType(newType);
    setLoading(true);
    // Reset form when switching between popup types
    setPopupData({
      title: '',
      message: '',
      description: '',
      buttonText: newType === POPUP_TYPES.USER ? 'Explore Now' : 'Learn More',
      buttonLink: '#',
      secondaryButtonText: 'Dismiss',
      buttonLink2: '',
      badge: 'New',
      isActive: true,
      imageUrl: '',
      imageLink: ''
    });
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Popup Manager</Typography>
        <Tabs 
          value={popupType} 
          onChange={handlePopupTypeChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Guest Popup" value={POPUP_TYPES.GUEST} />
          <Tab label="User Popup" value={POPUP_TYPES.USER} />
        </Tabs>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={popupData.isActive}
                      onChange={(e) => {
                        const newActiveState = e.target.checked;
                        setPopupData(prev => ({
                          ...prev,
                          isActive: newActiveState,
                          // Set default values if activating
                          ...(!prev.title && newActiveState ? { 
                            title: popupType === POPUP_TYPES.USER ? 'Welcome Back!' : 'Special Offer!',
                            message: popupType === POPUP_TYPES.USER 
                              ? 'Check out our latest collection exclusively for you!' 
                              : 'Sign up now and get 10% off your first order!',
                            buttonText: popupType === POPUP_TYPES.USER ? 'Explore Now' : 'Sign Up Now',
                            buttonLink: popupType === POPUP_TYPES.USER ? '/products' : '/signup'
                          } : {})
                        }));
                      }}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography component="span" display="block">
                        {popupData.isActive ? 'Active' : 'Inactive'} - {popupData.isActive ? 'Popup is visible' : 'Popup is hidden'}
                      </Typography>
                      {!popupData.isActive && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          You can save without filling in the fields when popup is inactive
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={popupData.title}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  value={popupData.message}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  variant="outlined"
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  name="description"
                  value={popupData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Button Text"
                  name="buttonText"
                  value={popupData.buttonText}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Button Link"
                  name="buttonLink"
                  value={popupData.buttonLink}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Badge Text"
                  name="badge"
                  value={popupData.badge}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Popup Image
                </Typography>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  sx={{ mb: 2 }}
                >
                  <Tab label="Upload Image" />
                  <Tab label="Image URL" />
                </Tabs>
                
                {activeTab === 0 ? (
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="popup-image-upload"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="popup-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<ImageIcon />}
                        sx={{ mb: 2 }}
                      >
                        Choose Image
                      </Button>
                    </label>
                    {imagePreview && (
                      <Box mt={2}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LinkIcon /></InputAdornment>,
                    }}
                  />
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PopupManager;
