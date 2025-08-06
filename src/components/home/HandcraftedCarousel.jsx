import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Box, IconButton, useTheme, useMediaQuery, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos, Delete, AddPhotoAlternate } from '@mui/icons-material';

const HandcraftedCarousel = ({ isAdmin = false }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const slideInterval = useRef(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Auto-slide effect
  useEffect(() => {
    const startAutoSlide = () => {
      slideInterval.current = setInterval(() => {
        if (!isHovered && images.length > 0) {
          setCurrentIndex(prevIndex => 
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
          );
        }
      }, 5000); // Change slide every 5 seconds
    };

    startAutoSlide();
    
    // Cleanup interval on component unmount
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [images.length, isHovered]);

  // Fetch images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const q = query(collection(db, 'handcraftedImages'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      const imagesList = [];
      querySnapshot.forEach((doc) => {
        imagesList.push({ id: doc.id, ...doc.data() });
      });
      setImages(imagesList);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleDelete = async (id, imageUrl) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        // Delete from storage
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'handcraftedImages', id));
        
        // Update local state
        setImages(images.filter(img => img.id !== id));
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  // Handle mouse enter/leave for pausing auto-slide on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (loading) {
    return <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</Box>;
  }

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!imageUrl) return;

    try {
      // Basic URL validation
      try {
        new URL(imageUrl);
      } catch (e) {
        throw new Error('Please enter a valid URL');
      }

      // Add to Firestore
      await addDoc(collection(db, 'handcraftedImages'), {
        imageUrl,
        order: images.length,
        createdAt: new Date().toISOString(),
      });

      setSnackbar({ open: true, message: 'Image added successfully', severity: 'success' });
      setImageUrl('');
      setOpenDialog(false);
      fetchImages(); // Refresh the images list
    } catch (error) {
      console.error('Error adding image:', error);
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to add image', 
        severity: 'error' 
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (images.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 2,
        p: 2,
        textAlign: 'center'
      }}>
        <Box>No images found</Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternate />}
            onClick={() => setOpenDialog(true)}
          >
            Add Image
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        // 16:9 aspect ratio container
        paddingBottom: '56.25%', // 16:9 aspect ratio (height/width = 9/16 = 0.5625)
        height: 0,
        [theme.breakpoints.down('sm')]: {
          paddingBottom: '75%', // 4:3 aspect ratio for mobile
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          transition: 'transform 0.7s ease-in-out',
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {images.map((image, index) => (
          <Box
            key={index}
            component="img"
            src={image.imageUrl}
            alt={`Handcrafted ${index + 1}`}
            sx={{
              flexShrink: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              backgroundColor: theme.palette.grey[100],
            }}
            loading="lazy"
          />
        ))}
      </Box>
      
      {/* Dots indicator */}
      {images.length > 1 && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 2
        }}>
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: currentIndex === index ? 'primary.main' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  bgcolor: currentIndex === index ? 'primary.dark' : 'rgba(255,255,255,0.7)',
                }
              }}
            />
          ))}
        </Box>
      )}
      
      <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 1 }}>
        {isAdmin && images[currentIndex] && (
          <IconButton 
            onClick={() => handleDelete(images[currentIndex].id, images[currentIndex].imageUrl)}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <Delete fontSize="small" />
          </IconButton>
        )}
        {isAdmin && (
          <IconButton 
            onClick={() => setOpenDialog(true)}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            <AddPhotoAlternate fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Add Image Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Image by URL</DialogTitle>
        <form onSubmit={handleAddImage}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Image URL"
              type="url"
              fullWidth
              variant="outlined"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Add Image
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HandcraftedCarousel;
