import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import WorkshopSectionEditor from '@/components/admin/WorkshopSectionEditor';

const AdminWorkshop = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Workshop Section Management
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage the workshop section content that appears on the home page.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <WorkshopSectionEditor />
        </Box>
      </Box>
    </Container>
  );
};

export default AdminWorkshop;
