import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const SliderManagement = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [newSlide, setNewSlide] = useState({ 
    imageUrl: '', 
    title: '', 
    subtitle: '', 
    buttonText: '',
    buttonRoute: '/products' // Default route
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch slides from Firestore
  const fetchSlides = async () => {
    try {
      setLoading(true);
      const slidesRef = collection(db, 'sliderImages');
      const q = query(slidesRef, orderBy('order'));
      const querySnapshot = await getDocs(q);
      
      const slidesList = [];
      querySnapshot.forEach((doc) => {
        slidesList.push({ id: doc.id, ...doc.data() });
      });
      
      setSlides(slidesList);
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSnackbar({ open: true, message: 'Failed to load slides', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // Open dialog for adding new slide
  const handleOpenAddDialog = () => {
    setEditingSlide(null);
    setNewSlide({ 
      imageUrl: '', 
      title: '', 
      subtitle: '', 
      buttonText: '',
      buttonRoute: '/products'
    });
    setOpenDialog(true);
  };

  // Open dialog for editing slide
  const handleOpenEditDialog = (slide) => {
    setEditingSlide(slide.id);
    setNewSlide({
      imageUrl: slide.imageUrl,
      title: slide.title,
      subtitle: slide.subtitle || '',
      buttonText: slide.buttonText || '',
      buttonRoute: slide.buttonRoute || '/products'
    });
    setOpenDialog(true);
  };

  // Save slide (add or update)
  const handleSaveSlide = async () => {
    try {
      const slidesRef = collection(db, 'sliderImages');
      const slideData = {
        ...newSlide,
        updatedAt: new Date().toISOString()
      };

      if (editingSlide) {
        // Update existing slide
        await updateDoc(doc(db, 'sliderImages', editingSlide), slideData);
        setSnackbar({ open: true, message: 'Slide updated successfully', severity: 'success' });
      } else {
        // Add new slide
        await addDoc(sliderRef, {
          ...slideData,
          order: slides.length,
          createdAt: new Date().toISOString()
        });
        setSnackbar({ open: true, message: 'Slide added successfully', severity: 'success' });
      }

      setOpenDialog(false);
      fetchSlides();
    } catch (error) {
      console.error('Error saving slide:', error);
      setSnackbar({ 
        open: true, 
        message: `Failed to ${editingSlide ? 'update' : 'add'} slide`, 
        severity: 'error' 
      });
    }
  };

  // Delete slide
  const handleDeleteSlide = async (id) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await deleteDoc(doc(db, 'sliderImages', id));
        fetchSlides();
        setSnackbar({ open: true, message: 'Slide deleted successfully', severity: 'success' });
      } catch (error) {
        console.error('Error deleting slide:', error);
        setSnackbar({ open: true, message: 'Failed to delete slide', severity: 'error' });
      }
    }
  };

  // Close dialog and reset form
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSlide(null);
    setNewSlide({ 
      imageUrl: '', 
      title: '', 
      subtitle: '', 
      buttonText: '',
      buttonRoute: '/products'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Manage Homepage Slider</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add New Slide
        </Button>
      </Box>

      <Grid container spacing={3}>
        {slides.map((slide) => (
          <Grid item xs={12} md={6} lg={4} key={slide.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={slide.imageUrl}
                alt={slide.title}
                sx={{ objectFit: 'cover' }}
              />
              <Box p={2}>
                <Typography variant="h6">{slide.title}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {slide.subtitle}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenEditDialog(slide)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteSlide(slide.id)}
                >
                  Delete
                </Button>
              </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Slide Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Image URL"
            value={newSlide.imageUrl}
            onChange={(e) => setNewSlide({ ...newSlide, imageUrl: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Title"
            value={newSlide.title}
            onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Subtitle"
            value={newSlide.subtitle}
            onChange={(e) => setNewSlide({ ...newSlide, subtitle: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Button Text (leave empty to hide button)"
            value={newSlide.buttonText}
            onChange={(e) => setNewSlide({ ...newSlide, buttonText: e.target.value })}
            margin="normal"
            helperText="If you want a button, enter button text here"
          />
          {newSlide.buttonText && (
            <TextField
              fullWidth
              label="Button Link"
              value={newSlide.buttonRoute}
              onChange={(e) => setNewSlide({ ...newSlide, buttonRoute: e.target.value })}
              margin="normal"
              placeholder="/products"
              helperText="Enter the URL path where the button should link to"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveSlide} variant="contained" color="primary">
            {editingSlide ? 'Update Slide' : 'Add Slide'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SliderManagement;
