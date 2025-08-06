import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  CircularProgress,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Button
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import * as ExcelJS from 'exceljs';
import { collection, getDocs, getDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '@/contexts/AuthContext';

const NewsletterSubscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { currentUser } = useAuth();

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        console.error('No authenticated user');
        return;
      }

      // First, get the current user's role
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      if (userData?.role !== 'admin') {
        console.error('Unauthorized: Admin access required');
        return;
      }

      // Now fetch the subscriptions
      const q = query(
        collection(db, 'newsletterSubscriptions'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          email: docData.email || '',
          subscribedAt: docData.createdAt?.toDate() || new Date(),
          isActive: docData.isActive !== false // Default to true if not set
        });
      });
      
      setSubscribers(data);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSubscribers();
  };

  const handleExportToExcel = async () => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Subscribers');
      
      // Add headers
      worksheet.columns = [
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Subscription Date', key: 'date', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      
      // Add data rows
      filteredSubscribers.forEach(sub => {
        worksheet.addRow({
          email: sub.email,
          date: sub.subscribedAt.toLocaleDateString(),
          status: sub.isActive ? 'Active' : 'Inactive'
        });
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Set a reasonable max width
      });
      
      // Generate Excel file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export subscribers. Please try again.');
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSubscribers = filteredSubscribers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Newsletter Subscribers
        </Typography>
        <Box>
          <IconButton onClick={handleRefresh} color="primary" title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search subscribers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '250px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportToExcel}
            disabled={subscribers.length === 0}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Export to Excel
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Subscribed On</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubscribers.length > 0 ? (
                  paginatedSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell>{subscriber.email}</TableCell>
                      <TableCell>
                        {subscriber.subscribedAt ? subscriber.subscribedAt.toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box 
                          component="span" 
                          sx={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: subscriber.isActive ? 'success.main' : 'grey.500',
                            mr: 1
                          }}
                        />
                        {subscriber.isActive ? 'Active' : 'Inactive'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      {searchTerm ? 'No matching subscribers found' : 'No subscribers yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSubscribers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Container>
  );
};

export default NewsletterSubscribers;
