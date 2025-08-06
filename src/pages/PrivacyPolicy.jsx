import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <PrivacyTipIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Privacy Policy
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="body1" paragraph>
            Last Updated: August 6, 2024
          </Typography>
          <Typography paragraph>
            At Terracottic, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, 
            disclose, and safeguard your information when you visit our website or make a purchase from us.
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Information We Collect
          </Typography>
          <Typography paragraph>
            We collect information that you provide directly to us, such as when you create an account, make a purchase, 
            or contact us. This may include:
          </Typography>
          <ul>
            <li>Name, email address, and contact information</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information (processed securely through our payment gateway)</li>
            <li>Order history and preferences</li>
          </ul>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the information we collect to:
          </Typography>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your orders and account</li>
            <li>Improve our products and services</li>
            <li>Send promotional communications (with your consent)</li>
          </ul>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Contact Us
          </Typography>
          <Typography paragraph>
            If you have any questions about this Privacy Policy, please contact us at terracottic@gmail.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
