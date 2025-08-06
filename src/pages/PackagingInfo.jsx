import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

const PackagingInfo = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <CardGiftcardIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Packaging Information
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Our Packaging Philosophy
          </Typography>
          <Typography paragraph>
            At Terracottic, we take great care in packaging your terracotta products to ensure they reach you in perfect condition.
            Each item is hand-wrapped with eco-friendly materials that provide maximum protection while being kind to the environment.
          </Typography>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Packaging Options
          </Typography>
          <ul>
            <li><strong>Standard Packaging:</strong> Basic protective packaging included with every order</li>
            <li><strong>Premium Packaging:</strong> Extra protection with additional padding and cushioning</li>
            <li><strong>Gift Wrapping:</strong> Beautiful gift wrapping available at checkout</li>
          </ul>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Eco-Friendly Commitment
          </Typography>
          <Typography paragraph>
            We're committed to sustainability. Our packaging materials are:
          </Typography>
          <ul>
            <li>100% Recyclable and biodegradable</li>
            <li>Plastic-free and compostable</li>
            <li>Made from recycled materials</li>
          </ul>
        </Box>
      </Paper>
    </Container>
  );
};

export default PackagingInfo;
