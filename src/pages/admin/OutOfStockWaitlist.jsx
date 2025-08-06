import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Button
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { db } from '../../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OutOfStockWaitlist = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const waitlistRef = collection(db, 'outOfStockWaitlist');
      const q = query(waitlistRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      setWaitlist(data);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'outOfStockWaitlist', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setWaitlist(waitlist.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
      
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this waitlist entry?')) {
      try {
        await deleteDoc(doc(db, 'outOfStockWaitlist', id));
        setWaitlist(waitlist.filter(item => item.id !== id));
        toast.success('Entry deleted successfully');
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry');
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'notified':
        return <Chip label="Notified" color="info" size="small" />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Filter waitlist based on search and filters
  const filteredWaitlist = useMemo(() => {
    return waitlist.filter(item => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerPhone?.includes(searchQuery);
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      // Filter by date range
      let matchesDateRange = true;
      if (dateRange.startDate || dateRange.endDate) {
        const itemDate = new Date(item.createdAt?.seconds * 1000 || item.createdAt);
        if (dateRange.startDate) {
          const start = new Date(dateRange.startDate);
          start.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && itemDate >= start;
        }
        if (dateRange.endDate) {
          const end = new Date(dateRange.endDate);
          end.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && itemDate <= end;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [waitlist, searchQuery, statusFilter, dateRange]);
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRange({ startDate: null, endDate: null });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" component="h1">
            Out of Stock Waitlist
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {(statusFilter !== 'all' || dateRange.startDate || dateRange.endDate) && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleResetFilters}
                color="error"
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Filters Panel */}
        {showFilters && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="notified">Notified</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="From Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="To Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredWaitlist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No waitlist entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWaitlist
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2">{item.productName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {item.productId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{item.customerName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.customerEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.customerPhone}</TableCell>
                        <TableCell>{getStatusChip(item.status || 'pending')}</TableCell>
                        <TableCell>
                          {new Date(item.createdAt?.seconds * 1000 || item.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Mark as Notified">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => handleStatusChange(item.id, 'notified')}
                              disabled={item.status === 'notified'}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Mark as Completed">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleStatusChange(item.id, 'completed')}
                              disabled={item.status === 'completed'}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredWaitlist.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default OutOfStockWaitlist;
