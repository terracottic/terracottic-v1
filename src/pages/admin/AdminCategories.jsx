import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '@/services/api';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Fetch all categories from Firestore
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const db = getFirestore();
            const categoriesRef = collection(db, 'categories');
            const snapshot = await getDocs(categoriesRef);

            const categoriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCategories(categoriesList);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories');
            showSnackbar('Failed to fetch categories. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenDialog = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
        } else {
            setEditingCategory(null);
            setCategoryName('');
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCategory(null);
        setCategoryName('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            setError('Category name is required');
            return;
        }

        try {
            const db = getFirestore();
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('User not authenticated');
            }

            const categoryData = {
                name: categoryName.trim(),
                createdAt: new Date().toISOString(),
                createdBy: user.uid,
                updatedAt: new Date().toISOString()
            };

            if (editingCategory) {
                // Update existing category
                const categoryRef = doc(db, 'categories', editingCategory.id);
                await updateDoc(categoryRef, {
                    ...categoryData,
                    updatedAt: new Date().toISOString()
                });
                showSnackbar('Category updated successfully', 'success');
            } else {
                // Create new category
                await addDoc(collection(db, 'categories'), categoryData);
                showSnackbar('Category created successfully', 'success');
            }

            fetchCategories();
            handleCloseDialog();
        } catch (err) {
            console.error('Error saving category:', err);
            const errorMsg = err.message || 'Failed to save category. Please try again.';
            setError(errorMsg);
            showSnackbar(errorMsg, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            try {
                const db = getFirestore();
                await deleteDoc(doc(db, 'categories', id));
                showSnackbar('Category deleted successfully', 'success');
                fetchCategories();
            } catch (err) {
                console.error('Error deleting category:', err);
                const errorMsg = err.message || 'Failed to delete category. Please try again.';
                showSnackbar(errorMsg, 'error');
            }
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">Categories</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add Category
                </Button>
            </Box>

            <Card>
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : categories.length === 0 ? (
                        <Typography>No categories found</Typography>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {category.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {formatDate(category.createdAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={1}>
                                                    <IconButton
                                                        onClick={() => handleOpenDialog(category)}
                                                        size="small"
                                                        title="Edit category"
                                                        sx={{ '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}
                                                    >
                                                        <EditIcon color="primary" fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleDelete(category.id)}
                                                        size="small"
                                                        title="Delete category"
                                                        sx={{ '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.08)' } }}
                                                    >
                                                        <DeleteIcon color="error" fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Category Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        p: 2
                    }
                }}
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{
                        p: 3,
                        pb: 1,
                        fontWeight: 600,
                        fontSize: '1.25rem'
                    }}>
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, pt: 2 }}>
                        <TextField
                            autoFocus
                            margin="normal"
                            label="Category Name"
                            fullWidth
                            variant="outlined"
                            value={categoryName}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                if (error) setError('');
                            }}
                            error={!!error}
                            helperText={error}
                            sx={{ mb: 2 }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                style: { fontSize: '0.9375rem' }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button
                            onClick={handleCloseDialog}
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1,
                                px: 3,
                                py: 1
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            variant="contained"
                            sx={{
                                textTransform: 'none',
                                borderRadius: 1,
                                px: 3,
                                py: 1,
                                '&:hover': {
                                    backgroundColor: 'primary.dark'
                                }
                            }}
                        >
                            {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminCategories;
