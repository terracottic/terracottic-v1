import React from 'react';
import { useParams } from 'react-router-dom';
import { useProducts } from '@/contexts/ProductContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import TerracottaProductDetail from '@/components/products/TerracottaProductDetail';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { getProductById } = useProducts();
  const [product, setProduct] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        if (data) {
          setProduct(data);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, getProductById]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          {error || 'Product not found'}
        </Typography>
      </Box>
    );
  }

  return <TerracottaProductDetail product={product} />;
};

export default ProductDetailPage;
