import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const ShippingInfo = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <LocalShippingIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Shipping Information
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Delivery Partners
          </Typography>
          <Typography paragraph>
            We've partnered with <strong>Shiprocket</strong> to ensure fast and reliable delivery across India. 
            Our shipping network covers all major cities and towns with real-time tracking for all orders.
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Shipping Rates & Delivery Time
          </Typography>
          <ul>
            <li><strong>Standard Shipping:</strong> 3-7 business days (Free on orders above ₹999)</li>
            <li><strong>Express Shipping:</strong> 1-3 business days (Additional charges apply)</li>
            <li><strong>Same Day Delivery:</strong> Available in select cities (Order before 12 PM)</li>
          </ul>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Order Processing
          </Typography>
          <Typography paragraph>
            Orders are processed within 24-48 hours on business days (Monday-Saturday, excluding public holidays).
            You'll receive a confirmation email with tracking information once your order is shipped.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            International Shipping
          </Typography>
          <Typography paragraph>
            Currently, we only ship within India. For international orders, please contact our customer support.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ShippingInfo;
