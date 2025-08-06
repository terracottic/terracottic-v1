import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

const TermsAndConditions = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <GavelIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Terms & Conditions
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="body1" paragraph>
            Last Updated: August 6, 2024
          </Typography>
          <Typography paragraph>
            Please read these Terms and Conditions carefully before using the Terracottic website and making any purchases.
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Orders and Payment
          </Typography>
          <Typography paragraph>
            By placing an order through our website, you agree to pay all charges and applicable taxes. We accept various 
            payment methods as indicated during the checkout process.
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Shipping and Delivery
          </Typography>
          <Typography paragraph>
            We aim to process and ship orders within 1-2 business days. Delivery times may vary based on your location 
            and the shipping method selected. Please refer to our Shipping Information page for more details.
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Returns and Refunds
          </Typography>
          <Typography paragraph>
            We accept returns within 7 days of delivery. Items must be in their original condition with all tags attached. 
            Please contact our customer service to initiate a return.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Contact Information
          </Typography>
          <Typography paragraph>
            For any questions about these Terms, please contact us at terracottic@gmail.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
