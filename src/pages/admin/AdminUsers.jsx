import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  limit,
  getCountFromServer,
  startAfter,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { ROLES } from '@/constants/roles';
import { format, formatDistanceToNow, parseISO, isAfter, subDays } from 'date-fns';
import ExcelJS from 'exceljs';

// Format a timestamp to a relative time string (e.g., '2 hours ago')
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Never';
  
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid date';
  }
};
import { db } from '@/config/firebase';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Shield as ModeratorIcon,
  Person as PersonIcon,
  PersonOutline as UserIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  PauseCircleOutline as PauseCircleOutlineIcon,
  Block as BlockIcon,
  HelpOutline as HelpOutlineIcon,
  FileDownload as FileDownloadIcon,
  CalendarToday as CalendarTodayIcon,
  Update as UpdateIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

// Role configuration with metadata for UI and permissions
const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: 'Admin',
    icon: <AdminIcon sx={{ color: 'error.main' }} />,
    color: 'error',
    description: 'Full system access',
    canManage: [ROLES.ADMIN, ROLES.USER]
  },
  [ROLES.USER]: {
    label: 'User',
    icon: <UserIcon sx={{ color: 'text.secondary' }} />,
    color: 'default',
    description: 'Regular user with basic permissions',
    canManage: []
  }
};

// Status options for user accounts
const STATUS_OPTIONS = [
  { 
    value: 'active', 
    label: 'Active',
    icon: <CheckCircleIcon color="success" />,
    description: 'Account is active and can access the system'
  },
  { 
    value: 'inactive', 
    label: 'Inactive',
    icon: <PauseCircleOutlineIcon color="warning" />,
    description: 'Account is temporarily disabled'
  },
  { 
    value: 'suspended', 
    label: 'Suspended',
    icon: <BlockIcon color="error" />,
    description: 'Account is suspended due to policy violation'
  },
];

// Get status configuration
const getStatusConfig = (status) => {
  return STATUS_OPTIONS.find(s => s.value === status) || {
    value: status,
    label: status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Unknown',
    icon: <HelpOutlineIcon color="action" />,
    description: 'Unknown status'
  };
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentAuthUser, hasRole } = useAuth();
  
  // Component state
  const [state, setState] = useState({
    users: [],
    filteredUsers: [],
    loading: true,
    error: null,
    searchTerm: '',
    selectedRole: null,
    selectedStatus: 'active',
    pagination: {
      page: 0,
      rowsPerPage: 10,
      count: 0
    },
    dialogs: {
      edit: { open: false, user: null },
      delete: { open: false, userId: null },
      view: { open: false, user: null }
    },
    sortConfig: { field: 'createdAt', direction: 'desc' },
    snackbar: { open: false, message: '', severity: 'success' },
    previewUser: null // Store the user being previewed
  });

  // Derived state
  const { 
    users, 
    filteredUsers, 
    loading, 
    error, 
    searchTerm, 
    selectedRole, 
    selectedStatus,
    pagination,
    dialogs,
    snackbar
  } = state;

  const { page, rowsPerPage } = pagination;

  // Fetch users from Firestore
  const fetchUsers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('Fetching users from Firestore...');
      const usersRef = collection(db, 'users');
      
      // First, get the total count of users
      const countSnapshot = await getCountFromServer(usersRef);
      const totalCount = countSnapshot.data().count;
      
      // Create the paginated query
      let q = query(
        usersRef, 
        orderBy('createdAt', 'desc'),
        limit(rowsPerPage)
      );
      
      // If not on the first page, adjust the query to start after the last document from the previous page
      if (page > 0) {
        // Get the last document from the previous page to use for pagination
        const first = query(usersRef, orderBy('createdAt', 'desc'), limit(page * rowsPerPage));
        const documentSnapshots = await getDocs(first);
        const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        
        if (lastVisible) {
          q = query(
            usersRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(rowsPerPage)
          );
        }
      }
      
      // Then get the paginated results
      const querySnapshot = await getDocs(q);
      
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Helper function to safely convert Firestore Timestamp to Date
        const toDate = (timestamp) => {
          if (!timestamp) return null;
          // If it's a Firestore Timestamp
          if (typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          // If it's already a Date or can be converted to one
          try {
            return new Date(timestamp);
          } catch (e) {
            console.warn('Could not parse date:', timestamp);
            return null;
          }
        };

        usersList.push({ 
          id: doc.id, 
          ...userData,
          // Ensure required fields have default values
          displayName: userData.displayName || 'No Name',
          email: userData.email || 'No Email',
          role: userData.role || 'user',
          status: userData.status || 'active',
          createdAt: toDate(userData.createdAt) || new Date(),
          lastLogin: toDate(userData.lastLogin)
        });
      });
      
      console.log(`Fetched ${usersList.length} users`, usersList);
      
      setState(prev => ({
        ...prev,
        users: usersList,
        filteredUsers: usersList,
        loading: false,
        error: null,
        pagination: {
          ...prev.pagination,
          count: totalCount
        }
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.code === 'permission-denied' 
        ? 'You do not have permission to view users.'
        : 'Failed to load users. Please try again later.';
        
      enqueueSnackbar(errorMessage, { variant: 'error' });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        users: [],
        filteredUsers: []
      }));
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search and filtering
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = 
        !searchTerm || 
        [user.displayName, user.email, user.phoneNumber, user.role, user.status]
          .some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = !selectedRole || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    setState(prev => ({
      ...prev,
      filteredUsers: filtered,
      pagination: {
        ...prev.pagination,
        page: 0,
        count: filtered.length
      }
    }));
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: newPage
      }
    }));
  };

  const handleChangeRowsPerPage = (event) => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        rowsPerPage: parseInt(event.target.value, 10),
        page: 0
      }
    }));
  };

  // Handle user role update
  const handleRoleUpdate = async (userId, newRole) => {
    if (!userId || !newRole) return;
    
    try {
      enqueueSnackbar('Updating user role...', { variant: 'info' });
      
      const userRef = doc(db, 'users', userId);
      const currentUser = getAuth().currentUser;
      
      // Prevent users from changing their own role
      if (currentUser && currentUser.uid === userId) {
        throw new Error('You cannot change your own role');
      }
      
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ),
        filteredUsers: prev.filteredUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      }));
      
      enqueueSnackbar('Role updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating role:', error);
      enqueueSnackbar(error.message || 'Failed to update role', { variant: 'error' });
    }
  };

  // Helper function to safely format Firestore timestamps
  const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Check if it's a Firestore timestamp and has toDate method
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'PPpp');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to format address for export
  const formatAddressForExport = (address) => {
    if (!address) return 'N/A';
    const parts = [
      address.line1,
      address.line2,
      address.city ? `${address.city}, ${address.state || ''} ${address.postalCode || ''}`.trim() : '',
      address.country
    ];
    return parts.filter(Boolean).join('\n');
  };

  // Export users data to Excel
  const exportToExcel = async () => {
    try {
      // Create a new workbook and add a worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      // Define the headers
      const headers = [
        'Name', 'Email', 'Phone', 'Role', 'Status', 'Created At', 'Last Sign In', 
        'Email Verified', 'Delivery Address', 'Address Line 1', 'Address Line 2',
        'City', 'State', 'Postal Code', 'Country', 'User ID'
      ];

      // Add headers to the worksheet
      worksheet.addRow(headers);

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Add data rows
      filteredUsers.forEach(user => {
        worksheet.addRow([
          user.displayName || 'N/A',
          user.email || 'N/A',
          user.phoneNumber || 'N/A',
          ROLE_CONFIG[user.role]?.label || user.role || 'N/A',
          getStatusConfig(user.status).label,
          formatFirestoreTimestamp(user.createdAt),
          user.lastSignInTime ? formatFirestoreTimestamp(user.lastSignInTime) : 'Never',
          user.emailVerified ? 'Yes' : 'No',
          formatAddressForExport(user.address),
          user.address?.line1 || 'N/A',
          user.address?.line2 || 'N/A',
          user.address?.city || 'N/A',
          user.address?.state || 'N/A',
          user.address?.postalCode || 'N/A',
          user.address?.country || 'N/A',
          user.id || 'N/A'
        ]);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 0;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Generate Excel file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      setState(prev => ({
        ...prev,
        snackbar: {
          open: true,
          message: 'Export to Excel completed successfully',
          severity: 'success'
        }
      }));
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setState(prev => ({
        ...prev,
        snackbar: {
          open: true,
          message: 'Failed to export data to Excel',
          severity: 'error'
        }
      }));
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!userId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const currentUser = getAuth().currentUser;
      if (currentUser && currentUser.uid === userId) {
        throw new Error('You cannot delete your own account');
      }
      
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      // Update local state
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.id !== userId),
        filteredUsers: prev.filteredUsers.filter(user => user.id !== userId),
        loading: false,
        pagination: {
          ...prev.pagination,
          count: prev.pagination.count - 1
        },
        dialogs: {
          ...prev.dialogs,
          delete: { open: false, userId: null }
        }
      }));
      
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting user:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        snackbar: {
          open: true,
          message: error.message || 'Failed to delete user',
          severity: 'error'
        }
      }));
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'N/A';
      
      let date;
      if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        console.warn('Unsupported timestamp format:', timestamp);
        return 'N/A';
      }
      
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Calculate pagination
  const startIndex = pagination.page * pagination.rowsPerPage;
  const endIndex = startIndex + pagination.rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Handle user row click
  const handleUserClick = (user) => {
    setState(prev => ({
      ...prev,
      previewUser: user
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">User Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            disabled={loading || users.length === 0}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search users"
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Select
              value={selectedRole || ''}
              onChange={(e) => setState(prev => ({ ...prev, selectedRole: e.target.value || null }))}
              displayEmpty
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Roles</MenuItem>
              {Object.entries(ROLE_CONFIG).map(([value, config]) => (
                <MenuItem key={value} value={value}>
                  {config.label}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={selectedStatus}
              onChange={(e) => setState(prev => ({ ...prev, selectedStatus: e.target.value }))}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm || selectedRole || selectedStatus !== 'all' 
                        ? 'No matching users found' 
                        : 'No users found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    hover 
                    onClick={() => handleUserClick(user)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.photoURL} alt={user.displayName} />
                        <Box>
                          <Typography variant="subtitle2">{user.displayName || 'N/A'}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.phoneNumber || 'No phone'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_CONFIG[user.role]?.label || user.role}
                        icon={ROLE_CONFIG[user.role]?.icon}
                        color={ROLE_CONFIG[user.role]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusConfig(user.status).label}
                        icon={getStatusConfig(user.status).icon}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatDate(user.lastSignInTime || user.metadata?.lastSignInTime)}>
                        <span>{formatTimeAgo(user.lastSignInTime || user.metadata?.lastSignInTime)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit role">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                dialogs: {
                                  ...prev.dialogs,
                                  edit: { open: true, user }
                                }
                              }));
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                dialogs: {
                                  ...prev.dialogs,
                                  delete: { open: true, userId: user.id }
                                }
                              }));
                            }}
                            disabled={currentAuthUser?.uid === user.id}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Edit Role Dialog */}
      <Dialog 
        open={dialogs.edit.open} 
        onClose={() => setState(prev => ({
          ...prev,
          dialogs: { ...prev.dialogs, edit: { ...prev.dialogs.edit, open: false } }
        }))}
      >
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          {dialogs.edit.user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {dialogs.edit.user.displayName || dialogs.edit.user.email}
              </Typography>
              <Select
                value={dialogs.edit.user.role || 'user'}
                onChange={(e) => handleRoleUpdate(dialogs.edit.user.id, e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
              >
                {Object.entries(ROLE_CONFIG).map(([value, config]) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {config.icon}
                      {config.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setState(prev => ({
              ...prev,
              dialogs: { ...prev.dialogs, edit: { ...prev.dialogs.edit, open: false } }
            }))}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={dialogs.delete.open} 
        onClose={() => setState(prev => ({
          ...prev,
          dialogs: { ...prev.dialogs, delete: { ...prev.dialogs.delete, open: false } }
        }))}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setState(prev => ({
              ...prev,
              dialogs: { ...prev.dialogs, delete: { ...prev.dialogs.delete, open: false } }
            }))}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteUser(dialogs.delete.userId)}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setState(prev => ({ ...prev, snackbar: { ...prev.snackbar, open: false } }))}
      >
        <Alert 
          onClose={() => setState(prev => ({ ...prev, snackbar: { ...prev.snackbar, open: false } }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* User Preview Dialog */}
      <Dialog
        open={!!state.previewUser}
        onClose={() => setState(prev => ({ ...prev, previewUser: null }))}
        maxWidth="md"
        fullWidth
      >
        {state.previewUser && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar 
                  src={state.previewUser.photoURL} 
                  alt={state.previewUser.displayName}
                  sx={{ width: 64, height: 64 }}
                />
                <Box>
                  <Typography variant="h6">{state.previewUser.displayName || 'N/A'}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {state.previewUser.email}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Account Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Display Name" 
                        secondary={state.previewUser.displayName || 'Not set'} 
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={state.previewUser.email || 'Not set'} 
                        secondaryTypographyProps={{ style: { wordBreak: 'break-word' } }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Phone" 
                        secondary={state.previewUser.phoneNumber || 'Not set'} 
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Role" 
                        secondary={ROLE_CONFIG[state.previewUser.role]?.label || state.previewUser.role || 'Not set'} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Activity</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CalendarTodayIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Account Created" 
                        secondary={formatFirestoreTimestamp(state.previewUser.createdAt)} 
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon><UpdateIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Last Active" 
                        secondary={state.previewUser.lastSignInTime 
                          ? formatFirestoreTimestamp(state.previewUser.lastSignInTime) 
                          : 'Never'} 
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon>
                        {state.previewUser.emailVerified 
                          ? <CheckCircleIcon color="success" /> 
                          : <CancelIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email Verified" 
                        secondary={state.previewUser.emailVerified ? 'Yes' : 'No'} 
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <Chip
                          label={getStatusConfig(state.previewUser.status).label}
                          icon={getStatusConfig(state.previewUser.status).icon}
                          size="small"
                          variant="outlined"
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Account Status" 
                        secondary={getStatusConfig(state.previewUser.status).description} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Delivery Address</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {state.previewUser.address ? (
                      <Typography>
                        {state.previewUser.address.line1}<br />
                        {state.previewUser.address.line2 && <>{state.previewUser.address.line2}<br /></>}
                        {state.previewUser.address.city && `${state.previewUser.address.city}, `}
                        {state.previewUser.address.state}<br />
                        {state.previewUser.address.postalCode && `${state.previewUser.address.postalCode}<br />`}
                        {state.previewUser.address.country}
                      </Typography>
                    ) : (
                      <Typography color="textSecondary">N/A - No delivery address set</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setState(prev => ({ ...prev, previewUser: null }))}
                color="primary"
              >
                Close
              </Button>
              {/* <Button 
                onClick={() => {
                  setState(prev => ({ ...prev, previewUser: null }));
                  navigate(`/admin/users/${state.previewUser.id}`);
                }}
                color="primary"
                variant="contained"
              >
                Edit User
              </Button> */}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
