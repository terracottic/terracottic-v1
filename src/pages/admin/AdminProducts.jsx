import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import ExcelJS from 'exceljs';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, writeBatch, serverTimestamp, Timestamp, onSnapshot, setDoc } from 'firebase/firestore';
import { fileStorage } from '@/utils/fileStorage';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Chip,
  Grid,
  Avatar,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  DeleteForever as DeleteForeverIcon,
  Publish as PublishIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

const mockProducts = [
  {
    id: 1,
    name: 'Handmade Pot',
    category: 'Pottery',
    price: 29.99,
    stock: 15,
    image: '/placeholder-product.jpg',
    discount: 10,
    makingCost: 15.00
  },
  // Add more mock products as needed
];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    widthInches: '',
    heightInches: '',
    depthInches: '',
    widthCm: '',
    heightCm: '',
    depthCm: '',
    weight: ''
  });
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState({
    success: 0,
    error: 0,
    total: 0,
    current: 0,
    currentProduct: '',
    errors: []
  });
  const [showImportResult, setShowImportResult] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleOpenDialog = (product = null) => {
    if (product) {
      // Editing existing product
      setEditingProduct(product);
      setFormData({
        ...product,
        // Ensure all fields have default values if not present
        name: product.name || '',
        category: product.category || '',
        price: product.price || '',
        discountedPrice: product.discountedPrice || '',
        stock: product.stock || 0,
        description: product.description || '',
        makingCost: product.makingCost || '',
        packagingPrice: product.packagingPrice || '',
        weight: product.weight || '',
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        featured: product.featured || false,
        dimensions: {
          widthInches: product.dimensions?.widthInches || '',
          heightInches: product.dimensions?.heightInches || '',
          depthInches: product.dimensions?.depthInches || '',
          widthCm: product.dimensions?.widthCm || '',
          heightCm: product.dimensions?.heightCm || '',
          depthCm: product.dimensions?.depthCm || ''
        }
      });
      setProductImages(product.images || []);
    } else {
      // Adding new product
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        discountedPrice: '',
        stock: 0,
        description: '',
        makingCost: '',
        packagingPrice: '',
        weight: '',
        rating: 0,
        reviewCount: 0,
        featured: false,
        dimensions: {
          widthInches: '',
          heightInches: '',
          depthInches: '',
          widthCm: '',
          heightCm: '',
          depthCm: ''
        }
      });
      setProductImages([]);
    }
    setOpenDialog(true);
  };

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const isModerator = currentUser?.role === 'moderator';
  const navigate = useNavigate();

  const loadProducts = useCallback(async (forceRefresh = false) => {
    // If not forcing refresh and we have products, don't reload
    if (!forceRefresh && products.length > 0 && !loading) return Promise.resolve(products);
    if (!currentUser) return Promise.resolve([]);

    try {
      setLoading(true);
      const db = getFirestore();
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const productsData = [];
      querySnapshot.forEach((doc) => {
        if (doc.exists()) {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            ...data,
            // Ensure timestamps are properly converted
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
          });
        }
      });

      // Always update the products state to ensure we have the latest data
      setProducts(productsData);

      return productsData;
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock data in case of error
      setProducts(prev => prev.length ? prev : mockProducts);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]); // Only depend on user ID instead of entire user object

  const fetchData = useCallback(async () => {
    if (!currentUser) return [];

    try {
      const db = getFirestore();

      // Fetch categories from Firestore
      const categoriesRef = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categoriesList = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Only update if categories have actually changed
      setCategories(prevCategories => {
        if (JSON.stringify(prevCategories) !== JSON.stringify(categoriesList)) {
          return categoriesList;
        }
        return prevCategories;
      });

      return categoriesList;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }, [currentUser?.uid]); // Only depend on user ID

  // Load data when component mounts
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProducts = () => {};
    let unsubscribeCategories = () => {};

    const initialize = async () => {
      if (!currentUser) return;

      try {
        // Set auth persistence (non-blocking)
        try {
          const auth = getAuth();
          await setPersistence(auth, browserLocalPersistence);
        } catch (error) {
          console.error('Error setting auth persistence:', error);
        }

        // Initial load
        await loadProducts(true); // Force refresh on initial load
        await fetchData();

        // Set up real-time listeners
        const db = getFirestore();

        // Products listener with error handling
        const productsQuery = query(collection(db, 'products'), orderBy('updatedAt', 'desc'));
        unsubscribeProducts = onSnapshot(
          productsQuery,
          (snapshot) => {
            if (!isMounted) return;

            const updatedProducts = [];
            snapshot.forEach((doc) => {
              if (doc.exists()) {
                const data = doc.data();
                updatedProducts.push({
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                  updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
                });
              }
            });

            setProducts(updatedProducts);
          },
          (error) => {
            console.error('Error in products listener:', error);
          }
        );

        // Categories listener
        const categoriesQuery = collection(db, 'categories');
        unsubscribeCategories = onSnapshot(categoriesQuery, async () => {
          if (isMounted) {
            await fetchData();
          }
        });

      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        if (isMounted) {
          setAuthInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      try {
        if (typeof unsubscribeProducts === 'function') unsubscribeProducts();
        if (typeof unsubscribeCategories === 'function') unsubscribeCategories();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [currentUser?.uid]); // Only depend on user ID

  // Handle unauthorized access
  useEffect(() => {
    if (authInitialized && currentUser && !isAdmin && !isModerator) {
      console.log('User is not authorized for this section, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [isAdmin, isModerator, navigate, authInitialized, currentUser]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

 
  const handleCloseDialog = () => {
    if (!uploading) {
      setOpenDialog(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        price: '',
        discountedPrice: '',
        stock: 0,
        description: '',
        makingCost: '',
        packagingPrice: '',
        weight: '',
        rating: 0,
        reviewCount: 0,
        featured: false,
        dimensions: {
          widthInches: '',
          heightInches: '',
          depthInches: '',
          widthCm: '',
          heightCm: '',
          depthCm: ''
        }
      });
      setProductImages([]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      // In a real app, this would be an API call
      setProducts(products.filter(product => product.id !== id));
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddImageFromUrl = async () => {
    if (!imageUrlInput || !isValidUrl(imageUrlInput)) return;

    try {
      setUploading(true);

      const newImage = {
        id: `url-${Date.now()}`,
        preview: imageUrlInput,
        isNew: true,
        url: imageUrlInput,
        name: `image-${Date.now()}.jpg`,
        size: 0, // Size not available for URLs
        type: 'image/jpeg',
        isPrimary: productImages.length === 0 // First image is primary by default
      };

      setProductImages(prev => [...prev, newImage]);
      setImageUrlInput(''); // Clear the input after adding
    } catch (error) {
      console.error('Error adding image:', error);
      alert(`Failed to add image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Keep the original handleImageUpload for backward compatibility
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);

    try {
      setUploading(true);

      for (const file of files) {
        try {
          // Upload file using our fileStorage service
          const uploadedFile = await fileStorage.upload(file, 'products');

          const newImage = {
            id: uploadedFile.id,
            preview: uploadedFile.url,
            isNew: true,
            url: uploadedFile.url,
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            isPrimary: productImages.length === 0 // First image is primary by default
          };

          setProductImages(prev => [...prev, newImage]);
        } catch (error) {
          console.error('Upload error:', error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id) => {
    try {
      setUploading(true);
      const imageToRemove = productImages.find(img => img.id === id);

      if (imageToRemove?.isNew) {
        // Only delete from storage if it's a newly uploaded image
        await fileStorage.delete(imageToRemove.id);
      }

      // Remove from local state
      setProductImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        // If we removed the primary image, make sure another image is marked as primary
        if (imageToRemove?.isPrimary && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const processImages = () => {
    return productImages.map(img => ({
      id: img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: img.url,
      isPrimary: img.isPrimary || false,
      name: img.name || `image-${Date.now()}.jpg`,
      size: img.size || 0,
      type: img.type || 'image/jpeg'
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // Conversion factors
    const INCH_TO_CM = 2.54;
    const CM_TO_INCH = 0.393701;

    // Handle inch to cm conversion
    if (name === 'widthInches' && value !== '') {
      const inches = parseFloat(value);
      if (!isNaN(inches)) {
        newFormData.widthCm = (inches * INCH_TO_CM).toFixed(2);
      }
    } else if (name === 'heightInches' && value !== '') {
      const inches = parseFloat(value);
      if (!isNaN(inches)) {
        newFormData.heightCm = (inches * INCH_TO_CM).toFixed(2);
      }
    } else if (name === 'depthInches' && value !== '') {
      const inches = parseFloat(value);
      if (!isNaN(inches)) {
        newFormData.depthCm = (inches * INCH_TO_CM).toFixed(2);
      }
    }

    // Handle cm to inch conversion
    if (name === 'widthCm' && value !== '') {
      const cm = parseFloat(value);
      if (!isNaN(cm)) {
        newFormData.widthInches = (cm * CM_TO_INCH).toFixed(2);
      }
    } else if (name === 'heightCm' && value !== '') {
      const cm = parseFloat(value);
      if (!isNaN(cm)) {
        newFormData.heightInches = (cm * CM_TO_INCH).toFixed(2);
      }
    } else if (name === 'depthCm' && value !== '') {
      const cm = parseFloat(value);
      if (!isNaN(cm)) {
        newFormData.depthInches = (cm * CM_TO_INCH).toFixed(2);
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one image is uploaded
    if (productImages.length === 0) {
      alert('Please upload at least one image for the product');
      return;
    }

    // Basic form validation
    const { name, category, price, stock, discountedPrice } = formData;

    if (!name || !category || isNaN(price) || isNaN(stock)) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    // Calculate discount percentage if discounted price is provided
    let discount = 0;
    if (discountedPrice && parseFloat(discountedPrice) > 0 && parseFloat(price) > 0) {
      const discountValue = parseFloat(price) - parseFloat(discountedPrice);
      discount = Math.round((discountValue / parseFloat(price)) * 100);
    }

    setUploading(true);

    try {
      const db = getFirestore();
      const productId = editingProduct?.id || uuidv4();
      const productRef = doc(db, 'products', productId);

      // Process images - ensure all images have required fields
      const processedImages = productImages.map(img => ({
        id: img.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: img.url,
        isPrimary: img.isPrimary || false,
        name: img.name || `image-${Date.now()}.jpg`,
        size: img.size || 0,
        type: img.type || 'image/jpeg'
      }));

      // Ensure at least one primary image
      if (processedImages.length > 0 && !processedImages.some(img => img.isPrimary)) {
        processedImages[0].isPrimary = true;
      }

      const productData = {
        id: productId,
        name: name.trim(),
        category: category.trim(),
        price: parseFloat(price),
        discount: discount,
        stock: parseInt(stock, 10),
        description: formData.description || '',
        makingCost: isAdmin && formData.makingCost ? parseFloat(formData.makingCost) : 0,
        packagingPrice: isAdmin && formData.packagingPrice ? parseFloat(formData.packagingPrice) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        source: formData.source || '',
        rating: parseFloat(formData.rating) || 0,
        reviewCount: parseInt(formData.reviewCount, 10) || 0,
        featured: formData.featured || false,
        dimensions: {
          widthInches: formData.widthInches ? parseFloat(formData.widthInches) : null,
          heightInches: formData.heightInches ? parseFloat(formData.heightInches) : null,
          depthInches: formData.depthInches ? parseFloat(formData.depthInches) : null,
          widthCm: formData.widthCm ? parseFloat(formData.widthCm) : null,
          heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
          depthCm: formData.depthCm ? parseFloat(formData.depthCm) : null
        },
        images: processedImages,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid || 'system'
      };

      // Save to Firestore
      await setDoc(productRef, productData, { merge: true });

      // Update local state
      setProducts(prevProducts => {
        if (editingProduct) {
          return prevProducts.map(p => p.id === productId ? productData : p);
        } else {
          return [...prevProducts, productData];
        }
      });

      // Show success message
      alert(`Product ${editingProduct ? 'updated' : 'added'} successfully!`);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`Error saving product: ${error.message || 'Please try again'}`);
    } finally {
      setUploading(false);
    }
  };

  // Helper function to parse various number formats including percentages and currency
  const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;

    // Handle percentage
    if (typeof value === 'string' && value.endsWith('%')) {
      return parseFloat(value) / 100;
    }

    // Remove any non-numeric characters except decimal point and negative sign
    const numStr = String(value).replace(/[^0-9.-]+/g, '');
    return parseFloat(numStr) || 0;
  };

  // Helper to process image URLs
  const processImageUrls = (urls, primaryIndex = 0) => {
    if (!urls) return [];

    const urlList = String(urls).split(',').map(url => url.trim()).filter(Boolean);
    return urlList.map((url, index) => ({
      id: `img-${Date.now()}-${index}`,
      url: url,
      isPrimary: index === parseInt(primaryIndex, 10),
      name: url.split('/').pop() || `image-${index}.jpg`,
      size: 0,
      type: 'image/jpeg'
    }));
  };

  // Function to validate product data row
  const validateProductRow = (row, index) => {
    const errors = [];
    const rowNumber = index + 1;

    // Required fields
    if (!row.name || String(row.name).trim() === '') {
      errors.push(`Row ${rowNumber}: Product name is required`);
    }

    // Price validation
    if (row.price === undefined || row.price === null || row.price === '') {
      errors.push(`Row ${rowNumber}: Price is required`);
    } else {
      const price = parseNumber(row.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNumber}: Invalid price '${row.price}' - must be a positive number`);
      }
    }

    // Stock validation
    if (row.stock !== undefined && row.stock !== null && row.stock !== '') {
      const stock = parseInt(row.stock, 10);
      if (isNaN(stock) || stock < 0) {
        errors.push(`Row ${rowNumber}: Invalid stock '${row.stock}' - must be a non-negative integer`);
      }
    }

    // Discount validation
    if (row.discount !== undefined && row.discount !== null && row.discount !== '') {
      const discount = parseNumber(row.discount);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        errors.push(`Row ${rowNumber}: Invalid discount '${row.discount}' - must be between 0 and 100`);
      }
    }

    // Image URLs validation
    if (row['image urls']) {
      const urls = String(row['image urls']).split(',').map(url => url.trim()).filter(Boolean);
      if (urls.length > 0) {
        const invalidUrls = urls.filter(url => !isValidUrl(url));
        if (invalidUrls.length > 0) {
          errors.push(`Row ${rowNumber}: Invalid image URLs: ${invalidUrls.join(', ')}`);
        }
      }
    }

    return errors;
  };

  // Function to read and parse Excel file with validation
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided for import'));
        return;
      }

      // Check file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        reject(new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new Error('No worksheets found in the Excel file'));
            return;
          }

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          if (!worksheet) {
            reject(new Error(`Could not find worksheet: ${worksheetName}`));
            return;
          }

          // Convert to array of objects
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!jsonData || jsonData.length === 0) {
            reject(new Error('No data found in the Excel file'));
            return;
          }

          // Validate required columns
          const requiredColumns = ['name', 'price'];
          const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
          const missingColumns = requiredColumns.filter(col =>
            !headerRow.some(header =>
              String(header).toLowerCase().trim() === col.toLowerCase()
            )
          );

          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
            return;
          }

          // Validate each row
          const validationErrors = [];
          const validRows = [];

          jsonData.forEach((row, index) => {
            const rowErrors = validateProductRow(row, index);
            if (rowErrors.length > 0) {
              validationErrors.push(...rowErrors);
            } else {
              validRows.push(row);
            }
          });

          if (validationErrors.length > 0) {
            // If all rows have errors, reject with all errors
            if (validRows.length === 0) {
              reject(new Error(validationErrors.join('\n')));
              return;
            }

            // If some rows are valid, continue but include warnings
            console.warn('Some rows had validation errors:', validationErrors);
          }

          if (validRows.length === 0) {
            reject(new Error('No valid rows found in the Excel file'));
            return;
          }

          resolve({
            validRows,
            validationWarnings: validationErrors
          });

        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(new Error(`Error parsing Excel file: ${error.message || 'Invalid file format'}`));
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error(`Error reading file: ${error.message || 'File could not be read'}`));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Handle Excel file import
  const handleImportExcel = async () => {
    if (!importFile) {
      setImportStatus({
        success: 0,
        error: 0,
        total: 0,
        current: 0,
        currentProduct: '',
        errors: ['No file selected for import. Please select an Excel file.'],
        completed: true
      });
      setShowImportResult(true);
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportStatus({
      success: 0,
      error: 0,
      total: 0,
      current: 0,
      currentProduct: '',
      errors: [],
      warnings: []
    });
    setShowImportResult(false);

    try {
      // Read and validate the Excel file
      const { validRows, validationWarnings = [] } = await readExcelFile(importFile);

      if (!validRows || validRows.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }

      // Add validation warnings to status
      if (validationWarnings.length > 0) {
        setImportStatus(prev => ({
          ...prev,
          warnings: validationWarnings,
          total: validRows.length
        }));
      } else {
        setImportStatus(prev => ({
          ...prev,
          total: validRows.length
        }));
      }

      const db = getFirestore();
      const productsCollection = collection(db, 'products');
      let batch = writeBatch(db);
      const BATCH_SIZE = 400; // Firestore batch limit is 500, using 400 to be safe
      let batchCount = 0;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process each valid row in the Excel file
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const currentRow = i + 1;
        const productName = row.name || `Row ${currentRow}`;

        // Update current product being processed
        setImportStatus(prev => ({
          ...prev,
          current: currentRow,
          currentProduct: productName
        }));

        try {
          // Process dimensions
          const dimensions = {
            widthInches: parseNumber(row['width (in)']) || null,
            heightInches: parseNumber(row['height (in)']) || null,
            depthInches: parseNumber(row['depth (in)']) || null,
            widthCm: parseNumber(row['width (cm)']) || null,
            heightCm: parseNumber(row['height (cm)']) || null,
            depthCm: parseNumber(row['depth (cm)']) || null,
          };

          // Process product data with proper type conversion
          const productData = {
            name: String(row.name || '').trim(),
            description: String(row.description || '').trim(),
            price: parseNumber(row.price) || 0,
            discount: Math.min(100, Math.max(0, parseNumber(row.discount) || 0)), // Clamp between 0-100
            stock: Math.max(0, parseInt(row.stock, 10) || 0), // Ensure non-negative
            category: String(row.category || 'Uncategorized').trim(),
            makingCost: Math.max(0, parseNumber(row.makingCost) || 0),
            weightGrams: row['weight (g)'] !== undefined ? Math.max(0, parseNumber(row['weight (g)'])) : null,
            dimensions: dimensions,
            featured: ['true', 'yes', '1', 1, true].includes(
              row.featured?.toString().toLowerCase()
            ),
            images: processImageUrls(
              row['image urls'],
              parseInt(row['primary image index'], 10) || 0
            ),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || 'import-script',
            status: 'active', // Default status
            sku: row.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };

          // Validate required fields
          if (!productData.name) {
            throw new Error('Product name is required');
          }
          if (isNaN(productData.price) || productData.price <= 0) {
            throw new Error('Price must be a positive number');
          }

          const newDocRef = doc(productsCollection);
          batch.set(newDocRef, productData);
          successCount++;
          batchCount++;

          // Update progress
          const progress = Math.round(((i + 1) / validRows.length) * 100);
          setImportProgress(progress);

          setImportStatus(prev => ({
            ...prev,
            success: successCount,
            error: errorCount,
            errors: [...errors],
            warnings: [...(prev.warnings || [])]
          }));

          // Commit batch when reaching batch size
          if (batchCount >= BATCH_SIZE) {
            try {
              await batch.commit();
              batch = writeBatch(db);
              batchCount = 0;
            } catch (batchError) {
              console.error('Error committing batch:', batchError);
              throw new Error(`Batch commit failed: ${batchError.message}`);
            }
          }
        } catch (error) {
          const errorMessage = `Row ${currentRow} (${row.name || 'No name'}): ${error.message || 'Unknown error'}`;
          console.error(errorMessage, error);
          errors.push(errorMessage);
          errorCount++;

          setImportStatus(prev => ({
            ...prev,
            error: errorCount,
            errors: [...errors],
            warnings: [...(prev.warnings || [])]
          }));

          // If we have too many errors, abort the import
          if (errorCount >= 10 && errorCount > (successCount * 0.5)) {
            throw new Error('Too many errors during import. Please check your data and try again.');
          }
        }
      }

      // Commit any remaining operations
      if (batchCount > 0) {
        try {
          await batch.commit();
        } catch (error) {
          console.error('Error committing final batch:', error);
          throw new Error(`Failed to commit final batch: ${error.message}`);
        }
      }

      // Update status with final counts
      setImportStatus(prev => ({
        ...prev,
        success: successCount,
        error: errorCount,
        completed: true,
        current: validRows.length,
        currentProduct: ''
      }));

      // Refresh product list after import
      try {
        await loadProducts(true);
      } catch (error) {
        console.error('Error refreshing product list:', error);
      }
    
    setShowImportResult(true);
  } catch (error) {
    console.error('Error in import process:', error);
    setImportStatus(prev => ({
      ...prev,
      error: errorCount + 1,
      errors: [...prev.errors, `Import completed with issues: ${error.message || 'Unknown error'}`],
      completed: true
    }));
    setShowImportResult(true);
  } finally {
    setImporting(false);
  }
};

// Helper function to safely format dates from Firestore
const formatFirestoreDate = (dateValue) => {
  if (!dateValue) return '';
  try {
    // If it's a Firestore Timestamp
    if (dateValue.toDate) {
      return format(dateValue.toDate(), 'yyyy-MM-dd HH:mm');
    }
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return format(dateValue, 'yyyy-MM-dd HH:mm');
    }
    // If it's a string that can be parsed as a date
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM-dd HH:mm');
    }
    return String(dateValue);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(dateValue);
  }
};

// Helper to format date for export
const formatDateForExport = (dateValue) => {
  if (!dateValue) return '';
  try {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    return format(date, 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.error('Error formatting date for export:', error);
    return String(dateValue || '');
  }
};

const handleExportProducts = async () => {
  try {
    setExporting(true);

    // Get all products
    const db = getFirestore();
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const productsData = [];
    querySnapshot.forEach((doc) => {
      const product = doc.data();
      const dimensions = product.dimensions || {};
      const images = Array.isArray(product.images) ? product.images : [];

      productsData.push({
        'Product ID': doc.id,
        'Name': product.name || '',
        'Description': product.description || '',
        'Price': product.price || 0,
        'Discount': product.discount ? `${product.discount * 100}%` : '0%',
        'Stock': product.stock || 0,
        'Category': product.category || 'Uncategorized',
        'Making Cost': product.makingCost || 0,
        'Weight (g)': product.weightGrams || '',
        'Width (cm)': dimensions.widthCm || '',
        'Height (cm)': dimensions.heightCm || '',
        'Depth (cm)': dimensions.depthCm || '',
        'Width (in)': dimensions.widthInches || '',
        'Height (in)': dimensions.heightInches || '',
        'Depth (in)': dimensions.depthInches || '',
        'Featured': product.featured ? 'Yes' : 'No',
        'Image URLs': images.map(img => img.url).join(', '),
        'Primary Image Index': images.findIndex(img => img.isPrimary) >= 0
          ? images.findIndex(img => img.isPrimary)
          : 0,
        'Created At': formatDateForExport(product.createdAt),
        'Updated At': formatDateForExport(product.updatedAt),
        'Updated By': product.updatedBy || ''
      });
    });

    if (productsData.length === 0) {
      alert('No products found to export');
      return;
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Define headers
    const headers = [
      'ID', 'Name', 'Description', 'Price', 'Stock', 'Category', 
      'Featured', 'Created At', 'Updated At', 'Updated By'
    ];

    // Add headers to the worksheet
    const headerRow = worksheet.addRow(headers);

    // Style the header row
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' }
    };
    headerRow.alignment = { horizontal: 'center' };

    // Add data rows
    productsData.forEach(product => {
      worksheet.addRow([
        product['ID'],
        product['Name'],
        product['Description'],
        product['Price'],
        product['Stock'],
        product['Category'],
        product['Featured'],
        product['Created At'],
        product['Updated At'],
        product['Updated By']
      ]);
    });

    // Auto-size columns
    worksheet.columns = [
      { key: 'ID', width: 28 },
      { key: 'Name', width: 30 },
      { key: 'Description', width: 50 },
      { key: 'Price', width: 10 },
      { key: 'Stock', width: 10 },
      { key: 'Category', width: 20 },
      { key: 'Featured', width: 10 },
      { key: 'Created At', width: 20 },
      { key: 'Updated At', width: 20 },
      { key: 'Updated By', width: 20 }
    ];

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting products:', error);
    alert('Failed to export products. Please try again.');
  } finally {
    setExporting(false);
  }
};

if (loading || !authInitialized) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
  );
}

if (!currentUser || !isAdmin) {
  return null; // Will be redirected by the effect
}

return (
  <Box>
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      <Typography variant="h4" component="h1">
        Products
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
          onClick={handleExportProducts}
          disabled={exporting || products.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export Excel'}
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={() => setImportOpen(true)}
          disabled={exporting}
        >
          Import Excel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          disabled={exporting}
        >
          Add Product
        </Button>
      </Box>
    </Box>

    <Card>
      <CardContent>
        <Box mb={3}>
          <Grid container spacing={2}>
            {/* ... */}
          </Grid>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Weight (kg)</TableCell>
                {/* <TableCell>Source</TableCell> */}
                <TableCell>Rating</TableCell>
                <TableCell>Reviews</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell>Images</TableCell>
                {isAdmin && <TableCell>Making Cost</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box width={50} height={50} bgcolor="#f5f5f5" display="flex" alignItems="center" justifyContent="center">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageIcon color="disabled" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ textDecoration: product.discount > 0 ? 'line-through' : 'none', color: product.discount > 0 ? 'text.secondary' : 'inherit' }}>
                          ₹{product.price?.toFixed(2) || '0.00'}
                        </span>
                      </Box>
                      {product.discount > 0 && (
                        <Box sx={{ fontSize: '0.875rem', color: 'success.main', fontWeight: 500 }}>
                          ₹{((product.price || 0) * (1 - (product.discount || 0) / 100)).toFixed(2)}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {product.discount > 0 ? (
                      <Chip
                        label={`${product.discount}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{product.stock || 0}</span>
                      {product.stock < 10 && product.stock > 0 && (
                        <Box sx={{ 
                          display: 'inline-block', 
                          bgcolor: 'warning.light', 
                          color: 'warning.contrastText', 
                          px: 0.5, 
                          py: 0.1, 
                          borderRadius: 1,
                          width: 'fit-content'
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>
                            Low Stock
                          </Typography>
                        </Box>
                      )}
                      {product.stock === 0 && (
                        <Box sx={{ 
                          display: 'inline-block', 
                          bgcolor: 'error.light', 
                          color: 'error.contrastText', 
                          px: 0.5, 
                          py: 0.1, 
                          borderRadius: 1,
                          width: 'fit-content'
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>
                            Out of Stock
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{product.weight ? `${product.weight} kg` : '-'}</TableCell>
                  {/* <TableCell>{product.source || '-'}</TableCell> */}
                  <TableCell>
                    {product.rating > 0 ? (
                      <Box display="flex" alignItems="center">
                        <Box sx={{
                          bgcolor: 'success.light',
                          color: 'success.contrastText',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 1,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          {product.rating?.toFixed(1) || '0.0'}
                          <StarIcon sx={{ fontSize: '0.9rem', ml: 0.25 }} />
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">No rating</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.reviewCount > 0 ? (
                      <Typography variant="body2">
                        {product.reviewCount?.toLocaleString()}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="textSecondary">No reviews</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={product.featured ? "Remove from featured" : "Add to featured"}>
                      <IconButton
                        onClick={async () => {
                          try {
                            const db = getFirestore();
                            const productRef = doc(db, 'products', product.id);
                            await setDoc(productRef, {
                              ...product,
                              featured: !product.featured
                            }, { merge: true });

                            // Update local state
                            setProducts(products.map(p =>
                              p.id === product.id
                                ? { ...p, featured: !p.featured }
                                : p
                            ));
                          } catch (error) {
                            console.error('Error updating featured status:', error);
                          }
                        }}
                      >
                        {product.featured ? (
                          <StarIcon color="primary" />
                        ) : (
                          <StarBorderIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {product.images?.slice(0, 3).map((img, idx) => (
                        <Avatar
                          key={img.id || idx}
                          src={img.url}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                      ))}
                      {product.images?.length > 3 && (
                        <Avatar sx={{ width: 40, height: 40 }}>+{product.images.length - 3}</Avatar>
                      )}
                    </Box>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>₹{product.makingCost?.toFixed(2) || '0.00'}</TableCell>
                  )}
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpenDialog(product)}>
                        <EditIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(product.id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>

    {/* Add/Edit Product Dialog */}
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={uploading}
    >
      <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box mb={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Product Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
                {loading ? (
                  <TextField
                    fullWidth
                    label="Loading categories..."
                    disabled
                    margin="normal"
                    InputProps={{
                      endAdornment: <CircularProgress size={20} />
                    }}
                  />
                ) : (
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
                    required
                    margin="normal"
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </TextField>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={handleInputChange}
                      required
                      margin="normal"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Box display="flex" alignItems="flex-end">
                        <TextField
                          fullWidth
                          label="Discounted Price (₹)"
                          name="discountedPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discountedPrice || ''}
                          onChange={handleInputChange}
                          margin="normal"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                        {formData.price && formData.discountedPrice && formData.discountedPrice < formData.price && (
                          <Box ml={2} mb={1.5}>
                            <Chip 
                              label={`${Math.round((1 - (parseFloat(formData.discountedPrice) / parseFloat(formData.price))) * 100)}% OFF`}
                              color="success"
                              size="small"
                              style={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {formData.discountedPrice ? 'Clear the field to remove discount' : 'Leave empty for no discount'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  value={formData.stock || 0}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      fullWidth
                      label="Rating"
                      name="rating"
                      value={formData.rating || 0}
                      onChange={(e) => {
                        // Convert string value to number
                        const value = parseFloat(e.target.value);
                        handleInputChange({
                          target: {
                            name: 'rating',
                            value: isNaN(value) ? 0 : value
                          }
                        });
                      }}
                      margin="normal"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(value => (
                        <option key={value} value={value}>
                          {value === 0 ? 'No rating' : `${value} ★`}
                        </option>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Review Count"
                      name="reviewCount"
                      type="number"
                      value={formData.reviewCount || 0}
                      onChange={handleInputChange}
                      margin="normal"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>

                {isAdmin && (
                  <>
                    <TextField
                      fullWidth
                      label="Making Cost"
                      name="makingCost"
                      type="number"
                      step="0.01"
                      value={formData.makingCost || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Essential Packaging Price"
                      name="packagingPrice"
                      type="number"
                      step="0.01"
                      value={formData.packagingPrice || ''}
                      onChange={handleInputChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      helperText="Additional cost for essential packaging"
                    />
                  </>
                )}

                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  margin="normal"
                />

                <Box mt={3} mb={2} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="h6" gutterBottom>Dimensions</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Inches (1 inch = 2.54 cm)
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Width (in)"
                        name="widthInches"
                        type="number"
                        step="0.01"
                        value={formData.widthInches || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Height (in)"
                        name="heightInches"
                        type="number"
                        step="0.01"
                        value={formData.heightInches || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Depth (in)"
                        name="depthInches"
                        type="number"
                        step="0.01"
                        value={formData.depthInches || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Centimeters (1 cm = 0.39 inches)
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Width (cm)"
                        name="widthCm"
                        type="number"
                        step="0.1"
                        value={formData.widthCm || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Height (cm)"
                        name="heightCm"
                        type="number"
                        step="0.1"
                        value={formData.heightCm || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Depth (cm)"
                        name="depthCm"
                        type="number"
                        step="0.1"
                        value={formData.depthCm || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        &nbsp;
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Weight (kg)"
                        name="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight || ''}
                        onChange={handleInputChange}
                        margin="normal"
                        size="small"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box mt={2}>
                  <Box mb={2}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Image URL"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrlInput || ''}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (imageUrlInput && isValidUrl(imageUrlInput)) {
                            handleAddImageFromUrl();
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              variant="contained"
                              color="primary"
                              disabled={!imageUrlInput || !isValidUrl(imageUrlInput) || uploading}
                              onClick={handleAddImageFromUrl}
                              sx={{ ml: 1 }}
                            >
                              Add
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {imageUrlInput && !isValidUrl(imageUrlInput) && (
                      <Typography variant="caption" color="error" display="block">
                        Please enter a valid URL
                      </Typography>
                    )}
                  </Box>

                  {imageUrlInput && isValidUrl(imageUrlInput) && (
                    <Box mb={2} border={1} borderColor="divider" borderRadius={1} p={1}>
                      <Typography variant="subtitle2" gutterBottom>
                        Image Preview:
                      </Typography>
                      <Box
                        component="img"
                        src={imageUrlInput}
                        alt="Preview"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                        }}
                        sx={{
                          width: '100%',
                          maxHeight: 200,
                          objectFit: 'contain',
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  )}

                  {uploading && (
                    <Box mt={2} mb={2}>
                      <Typography variant="body2" color="primary" gutterBottom>
                        Uploading {productImages.filter(img => img.isNew).length} images...
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CircularProgress size={24} />
                        <Typography variant="caption" color="textSecondary">
                          Please wait...
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Product Images ({productImages.length})
                    </Typography>
                    <Grid container spacing={1}>
                      {productImages.map((image) => (
                        <Grid item key={image.id} xs={6} sm={4}>
                          <Box
                            position="relative"
                            sx={{
                              pt: '100%',
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Box
                              component="img"
                              src={image.url}
                              alt="Preview"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                              }}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => removeImage(image.id)}
                              disabled={uploading}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                },
                                '&.Mui-disabled': {
                                  color: 'rgba(255,255,255,0.5)',
                                  backgroundColor: 'rgba(0,0,0,0.3)'
                                }
                              }}
                            >
                              {uploading ? <CircularProgress size={16} color="inherit" /> : <CloseIcon fontSize="small" />}
                            </IconButton>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={image.isPrimary}
                                  onChange={() => {
                                    setProductImages(prev =>
                                      prev.map(img => ({
                                        ...img,
                                        isPrimary: img.id === image.id
                                      }))
                                    );
                                  }}
                                />
                              }
                              label="Primary"
                              labelPlacement="start"
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                m: 0,
                                p: 0.5,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '0.7rem',
                                  color: 'white',
                                },
                              }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    {productImages.length === 0 && (
                      <Typography variant="caption" color="textSecondary">
                        No images uploaded yet
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={uploading || productImages.length === 0}
            sx={{ minWidth: 150 }}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : editingProduct ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>

    {/* Import Products Dialog */}
    <Dialog
      open={importOpen}
      onClose={() => !importing && setImportOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Import Products from Excel</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Upload an Excel file (.xlsx) containing product data. The file should include columns for name, category, price, etc.
          Download the template for the correct format.
        </DialogContentText>

        <Box sx={{ mt: 2, mb: 3 }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // Reset import status when a new file is selected
                setImportStatus({
                  success: 0,
                  error: 0,
                  total: 0,
                  current: 0,
                  currentProduct: '',
                  errors: [],
                  completed: false
                });
                setImportFile(file);
                setShowImportResult(false);
              } else {
                setImportFile(null);
              }
            }}
            disabled={importing}
            ref={fileInputRef}
            style={{ display: 'none' }}
            key={importFile ? 'file-selected' : 'no-file'} // Force re-render when file is cleared
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={importing}
            fullWidth
            sx={{ mb: 2 }}
          >
            {importFile ? importFile.name : 'Select Excel File'}
            <input
              type="file"
              hidden
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              accept=".xlsx,.xls"
            />
          </Button>

          {importing || showImportResult ? (
            <Box sx={{ mt: 2 }}>
              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {importStatus.current} of {importStatus.total} products processed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {importProgress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={importProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 1
                  }}
                />

                {/* Current Status */}
                {importStatus.currentProduct && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Processing: {importStatus.currentProduct}
                  </Typography>
                )}

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip
                    label={`✅ ${importStatus.success} Succeeded`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`❌ ${importStatus.error} Failed`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                  <Chip
                    label={`⏳ ${importStatus.total - importStatus.current} Remaining`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Error List */}
              {importStatus.errors.length > 0 && (
                <Box sx={{ mt: 2, maxHeight: 150, overflow: 'auto', p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Errors ({importStatus.errors.length}):
                  </Typography>
                  {importStatus.errors.map((error, index) => (
                    <Typography key={index} variant="caption" component="div" color="error" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', mb: 0.5 }}>
                      • {error}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Completion Message */}
              {importStatus.completed && (
                <Box>
                  <Alert
                    severity={importStatus.error === 0 ? 'success' : 'warning'}
                    sx={{
                      mt: 2,
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {importStatus.error === 0
                          ? `✅ Successfully imported ${importStatus.success} products`
                          : `⚠️ Import completed with ${importStatus.error} error(s) out of ${importStatus.total} products`}
                      </Typography>
                      {importStatus.errors.length > 0 && (
                        <Box sx={{ maxHeight: 150, overflowY: 'auto', mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="caption" component="div" color="error">
                            <strong>Errors:</strong>
                          </Typography>
                          {importStatus.errors.map((error, index) => (
                            <Typography key={index} variant="caption" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              • {error}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setShowImportResult(false);
                            setImportOpen(false);
                            // Reset import status
                            setImportStatus({
                              success: 0,
                              error: 0,
                              total: 0,
                              current: 0,
                              currentProduct: '',
                              errors: []
                            });
                          }}
                        >
                          Close
                        </Button>
                      </Box>
                    </Box>
                  </Alert>
                </Box>
              )}
            </Box>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setImportOpen(false);
            setShowImportResult(false);
            setImportProgress(0);
            setImportStatus({
              success: 0,
              error: 0,
              total: 0,
              current: 0,
              currentProduct: '',
              errors: []
            });
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          disabled={importing}
        >
          {importing ? 'Close' : 'Cancel'}
        </Button>
        <Button
          onClick={handleImportExcel}
          variant="contained"
          color="primary"
          disabled={!importFile || importing}
          startIcon={importing ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {importing ? 'Importing...' : 'Import Products'}
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);
};

export default AdminProducts;
