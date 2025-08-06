import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Grid, 
  Paper, 
  IconButton, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/config/firebase';
// Import for image URL handling

const WorkshopSectionEditor = () => {
  const [workshopData, setWorkshopData] = useState({
    title: '',
    description: '',
    buttonText: 'Learn More',
    buttonLink: '/workshops',
    slides: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [currentSlide, setCurrentSlide] = useState({
    imageUrl: '',
    alt: ''
  });
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  // State for image URL input

  // Load workshop data
  useEffect(() => {
    const loadWorkshopData = async () => {
      try {
        const docRef = doc(db, 'homepageSections', 'workshopSection');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setWorkshopData(docSnap.data());
        } else {
          // Initialize with default data if document doesn't exist
          const defaultData = {
            title: 'Join Our Workshop',
            description: 'Learn the art of pottery from our master craftsmen. Create beautiful pieces with your own hands.',
            buttonText: 'Book Now',
            buttonLink: '/workshops',
            slides: [
              {
                imageUrl: 'https://images.unsplash.com/photo-1587351021112-16bafbc6abf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
                alt: 'Pottery Workshop'
              }
            ]
          };
          
          // Use setDoc with merge: true to create the document if it doesn't exist
          await setDoc(docRef, defaultData, { merge: true });
          setWorkshopData(defaultData);
        }
      } catch (error) {
        console.error('Error loading workshop data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load workshop data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadWorkshopData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWorkshopData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSlideInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSlide(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUrlChange = (e) => {
    const { value } = e.target;
    setCurrentSlide(prev => ({
      ...prev,
      imageUrl: value
    }));
  };

  const openSlideDialog = (slide = null, index = null) => {
    if (slide) {
      setCurrentSlide({ ...slide });
      setEditingIndex(index);
    } else {
      setCurrentSlide({
        imageUrl: '',
        alt: ''
      });
      setEditingIndex(null);
    }
    setSlideDialogOpen(true);
  };

  const closeSlideDialog = () => {
    setSlideDialogOpen(false);
    setCurrentSlide({
      imageUrl: '',
      alt: ''
    });
    setEditingIndex(null);
  };

  const saveSlide = async () => {
    if (!currentSlide.imageUrl || !currentSlide.alt) {
      setSnackbar({
        open: true,
        message: 'Please provide both image URL and alt text',
        severity: 'warning'
      });
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, 'homepageSections', 'workshopSection');
      
      // First, ensure the document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { slides: [] }, { merge: true });
      }
      
      if (editingIndex !== null) {
        // Update existing slide
        const updatedSlides = [...workshopData.slides];
        updatedSlides[editingIndex] = { ...currentSlide };
        
        await updateDoc(docRef, {
          slides: updatedSlides
        });
        
        setWorkshopData(prev => ({
          ...prev,
          slides: updatedSlides
        }));
      } else {
        // Add new slide
        await updateDoc(docRef, {
          slides: arrayUnion({ ...currentSlide })
        });
        
        setWorkshopData(prev => ({
          ...prev,
          slides: [...prev.slides, { ...currentSlide }]
        }));
      }
      
      setSnackbar({
        open: true,
        message: `Slide ${editingIndex !== null ? 'updated' : 'added'} successfully`,
        severity: 'success'
      });
      
      closeSlideDialog();
    } catch (error) {
      console.error('Error saving slide:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save slide',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSlide = async (index) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        setSaving(true);
        const docRef = doc(db, 'homepageSections', 'workshopSection');
        const updatedSlides = [...workshopData.slides];
        const [deletedSlide] = updatedSlides.splice(index, 1);
        
        // Ensure we don't end up with an empty slides array (Firestore doesn't allow empty arrays in updates)
        if (updatedSlides.length === 0) {
          await setDoc(docRef, { slides: [] }, { merge: true });
        } else {
          await updateDoc(docRef, {
            slides: arrayRemove(deletedSlide)
          });
        }
        
        setWorkshopData(prev => ({
          ...prev,
          slides: updatedSlides
        }));
        
        setSnackbar({
          open: true,
          message: 'Slide deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting slide:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete slide',
          severity: 'error'
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const saveSection = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'homepageSections', 'workshopSection');
      
      // First, ensure the document exists with current data
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          title: workshopData.title,
          description: workshopData.description,
          buttonText: workshopData.buttonText,
          buttonLink: workshopData.buttonLink,
          slides: workshopData.slides || []
        }, { merge: true });
      } else {
        await updateDoc(docRef, {
          title: workshopData.title,
          description: workshopData.description,
          buttonText: workshopData.buttonText,
          buttonLink: workshopData.buttonLink
        });
      }
      
      setSnackbar({
        open: true,
        message: 'Workshop section updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating workshop section:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update workshop section',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Workshop Section Editor
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Section Content
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={workshopData.title}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              name="description"
              value={workshopData.description}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Button Text"
                  name="buttonText"
                  value={workshopData.buttonText}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Button Link"
                  name="buttonLink"
                  value={workshopData.buttonLink}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={saveSection}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              border: '1px dashed', 
              borderColor: 'divider', 
              borderRadius: 1, 
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200
            }}>
              <Typography variant="body2" color="textSecondary" align="center">
                Preview of how the section will look on the home page
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                {workshopData.title || 'Workshop Title'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                {workshopData.description || 'Workshop description will appear here'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Workshop Slides
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openSlideDialog()}
          >
            Add Slide
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {workshopData.slides.map((slide, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  height="160"
                  image={slide.imageUrl}
                  alt={slide.alt}
                />
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => openSlideDialog(slide, index)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteSlide(index)}
                    disabled={workshopData.slides.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
          
          {workshopData.slides.length === 0 && (
            <Grid item xs={12}>
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No slides added yet. Click "Add Slide" to get started.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Add/Edit Slide Dialog */}
      <Dialog open={slideDialogOpen} onClose={closeSlideDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="imageUrl"
                  value={currentSlide.imageUrl || ''}
                  onChange={handleImageUrlChange}
                  margin="normal"
                  variant="outlined"
                  required
                  helperText="Enter the full URL of the image"
                />
                
                {currentSlide.imageUrl && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img 
                      src={currentSlide.imageUrl} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        borderRadius: '4px',
                        margin: '0 auto',
                        display: 'block'
                      }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+not+found';
                      }}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      Image Preview
                    </Typography>
                  </Box>
                )}
              </Box>
            
            <TextField
              fullWidth
              label="Image Alt Text"
              name="alt"
              value={currentSlide.alt}
              onChange={handleSlideInputChange}
              margin="normal"
              variant="outlined"
              required
            />
            
            <TextField
              fullWidth
              label="Image Alt Text"
              name="alt"
              value={currentSlide.alt || ''}
              onChange={handleSlideInputChange}
              margin="normal"
              variant="outlined"
              required
              helperText="Enter a descriptive text for the image (for accessibility)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSlideDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={saveSlide} 
            color="primary" 
            variant="contained"
            disabled={!currentSlide.imageUrl || !currentSlide.alt || saving}
          >
            {saving ? 'Saving...' : 'Save Slide'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WorkshopSectionEditor;
