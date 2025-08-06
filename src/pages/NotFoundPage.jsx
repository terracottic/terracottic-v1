import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '600px',
        p: 3,
        textAlign: 'center'
      }}
    >
        <ErrorOutlineIcon
          sx={{
            fontSize: 100,
            color: 'error.main',
            mb: 3,
          }}
        />
        <Typography variant="h2" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Oops! The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          The requested URL was not found on this server. You may have mistyped the address or the
          page may have been moved.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
        >
          Go to Home
        </Button>
      </Box>
  );
};

export default NotFoundPage;
