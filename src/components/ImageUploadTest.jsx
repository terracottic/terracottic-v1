import { useState } from 'react';
import { fileStorage } from '@/utils/fileStorage';
import { Button, Box, Typography, CircularProgress, Paper } from '@mui/material';

export const ImageUploadTest = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // Upload the file
      const result = await fileStorage.upload(file, 'test-uploads');
      
      // Add to our list of uploaded images
      setUploadedImages(prev => [
        ...prev, 
        { id: result.id, url: result.url, name: result.name }
      ]);
      
      console.log('Upload successful:', result);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await fileStorage.delete(id);
      setUploadedImages(prev => prev.filter(img => img.id !== id));
      console.log('Image deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete image');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom>
        Image Upload Test
      </Typography>
      
      <Box mb={3}>
        <Button
          variant="contained"
          component="label"
          disabled={uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : null}
        >
          {uploading ? 'Uploading...' : 'Choose Image'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </Button>
      </Box>

      {error && (
        <Typography color="error" gutterBottom>
          Error: {error}
        </Typography>
      )}

      <Box mt={3}>
        <Typography variant="subtitle1" gutterBottom>
          Uploaded Images ({uploadedImages.length}):
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
          {uploadedImages.map((img) => (
            <Box 
              key={img.id} 
              position="relative"
              sx={{ 
                width: 150, 
                height: 150,
                border: '1px solid #ddd',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <img
                src={img.url}
                alt={img.name}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                onClick={() => handleDelete(img.id)}
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Delete image"
              >
                ×
              </button>
            </Box>
          ))}
          
          {uploadedImages.length === 0 && (
            <Typography color="textSecondary">
              No images uploaded yet
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ImageUploadTest;
