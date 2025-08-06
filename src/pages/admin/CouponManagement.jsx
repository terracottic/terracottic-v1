import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Paper, TextField, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, 
  Grid, Box, Chip, TextField as MuiTextField, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
  LocalShipping as ShippingIcon, Inventory as PackageIcon, 
  Percent as PercentIcon, CardGiftcard as GiftIcon,
  Event as EventIcon, Person as PersonIcon, Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from 'react-toastify';

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage Discount', icon: <PercentIcon /> },
  { value: 'fixed', label: 'Fixed Amount', icon: '₹' },
  { value: 'free_shipping', label: 'Free Shipping', icon: <ShippingIcon /> },
  { value: 'free_packaging', label: 'Free Packaging', icon: <PackageIcon /> },
  { value: 'bogo', label: 'Buy One Get One', icon: <GiftIcon /> },
];

const COUPONS_COLLECTION = 'coupons';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    isActive: true,
    usageLimit: '',
    expirationDate: null,
    timesUsed: 0,
    createdAt: new Date().toISOString()
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) result += '-';
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, COUPONS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const couponsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date if needed
        expirationDate: doc.data().expirationDate?.toDate ? doc.data().expirationDate.toDate() : doc.data().expirationDate,
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      }));
      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const couponData = {
        ...formData,
        updatedAt: new Date().toISOString(),
        // Ensure timesUsed is a number
        timesUsed: Number(formData.timesUsed) || 0,
        // Ensure numeric fields are numbers
        value: formData.value ? Number(formData.value) : null,
        minPurchase: formData.minPurchase ? Number(formData.minPurchase) : null,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
      };

      if (editingId) {
        // Update existing coupon
        await updateDoc(doc(db, COUPONS_COLLECTION, editingId), couponData);
        toast.success('Coupon updated successfully');
      } else {
        // Create new coupon
        await addDoc(collection(db, COUPONS_COLLECTION), {
          ...couponData,
          createdAt: new Date().toISOString(),
          timesUsed: 0 // Initialize timesUsed to 0 for new coupons
        });
        toast.success('Coupon created successfully');
      }
      
      // Reset form and refresh data
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(`Failed to ${editingId ? 'update' : 'create'} coupon`);
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      ...coupon,
      // Ensure numeric fields are strings for the form
      value: coupon.value?.toString() || '',
      minPurchase: coupon.minPurchase?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      timesUsed: coupon.timesUsed?.toString() || '0'
    });
    setEditingId(coupon.id);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minPurchase: '',
      maxDiscount: '',
      isActive: true,
      usageLimit: '',
      expirationDate: null,
      timesUsed: 0,
      createdAt: new Date().toISOString()
    });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, COUPONS_COLLECTION, id));
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        toast.error('Failed to delete coupon');
      }
    }
  };

  const toggleStatus = async (coupon) => {
    const newStatus = !coupon.isActive;
    try {
      await updateDoc(doc(db, COUPONS_COLLECTION, coupon.id), {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Coupon ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon status:', error);
      toast.error('Failed to update coupon status');
    }
  };

  const formatCouponValue = (coupon) => {
    switch(coupon.type) {
      case 'percentage': return `${coupon.value}% off`;
      case 'fixed': return `₹${coupon.value} off`;
      case 'free_shipping': return 'Free Shipping';
      case 'free_packaging': return 'Free Packaging';
      case 'bogo': return 'Buy One Get One';
      default: return coupon.value;
    }
  };

  if (loading && coupons.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Coupon Management</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingId ? 'Edit Coupon' : 'Create Coupon'}
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button onClick={generateCode} fullWidth sx={{ mt: 2 }}>
                    Generate
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Coupon Type</InputLabel>
                    <Select name="type" value={formData.type} onChange={handleChange} label="Coupon Type">
                      {COUPON_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {type.icon}
                            {type.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {['percentage', 'fixed'].includes(formData.type) && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={formData.type === 'fixed' ? 'Discount Amount (₹)' : 'Discount %'}
                      name="value"
                      type="number"
                      value={formData.value}
                      onChange={handleChange}
                      required
                      margin="normal"
                    />
                  </Grid>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Min. Purchase (₹)"
                      name="minPurchase"
                      type="number"
                      value={formData.minPurchase}
                      onChange={handleChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Usage Limit"
                      name="usageLimit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={handleChange}
                      margin="normal"
                      helperText="Leave empty for unlimited uses"
                      InputProps={{
                        startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                </Grid>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Expiration Date"
                    value={formData.expirationDate}
                    onChange={(date) => setFormData({...formData, expirationDate: date})}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        margin="normal"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <EventIcon color="action" sx={{ mr: 1 }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          endAdornment: formData.expirationDate && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({...formData, expirationDate: null});
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>

                <Grid item xs={12}>
                  <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} startIcon={<AddIcon />}>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Min. Purchase</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell><strong>{coupon.code}</strong></TableCell>
                    <TableCell>{coupon.type.replace('_', ' ')}</TableCell>
                    <TableCell>{formatCouponValue(coupon)}</TableCell>
                    <TableCell>{coupon.minPurchase ? `₹${coupon.minPurchase}` : 'None'}</TableCell>
                    <TableCell>
                      <Tooltip title={`${coupon.timesUsed || 0} of ${coupon.usageLimit || '∞'} uses`}>
                        <Chip 
                          icon={<PersonIcon fontSize="small" />}
                          label={`${coupon.timesUsed || 0}${coupon.usageLimit ? `/${coupon.usageLimit}` : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {coupon.expirationDate 
                        ? new Date(coupon.expirationDate).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={coupon.isActive ? 'Active' : 'Inactive'} 
                        color={coupon.isActive ? 'success' : 'default'} 
                        size="small"
                        onClick={() => toggleStatus(coupon.id)}
                        variant={!coupon.isActive || 
                                (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) ||
                                (coupon.expirationDate && new Date(coupon.expirationDate) < new Date())
                                ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleEdit(coupon)}><EditIcon /></Button>
                      <Button size="small" color="error" onClick={() => handleDelete(coupon.id)}><DeleteIcon /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CouponManagement;
