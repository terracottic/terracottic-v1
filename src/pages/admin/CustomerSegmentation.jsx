import { Box, Container, Typography } from '@mui/material';
import CustomerSegmentation from '@/components/admin/analytics/CustomerSegmentation';

const CustomerSegmentationPage = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom>
          Customer Segmentation
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Analyze and manage customer segments based on RFM analysis and behavioral patterns
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <CustomerSegmentation />
        </Box>
      </Container>
    </Box>
  );
};

export default CustomerSegmentationPage;
