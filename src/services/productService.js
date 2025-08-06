import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Create axios instance with base URL and common headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get recently viewed products for authenticated user
export const getRecentlyViewed = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/recently-viewed`)
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching recently viewed products:', error);
      throw error;
    });
    return response;
  } catch (error) {
    console.error('Error fetching recently viewed products:', error);
    return [];
  }
};


// Track product view (for recently viewed functionality)
export const trackProductView = async (userId, productId) => {
  try {
    await api.post(`/products/${productId}/view`, { userId });
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
};

// Admin: Update product's featured status
export const updateProductFeaturedStatus = async (productId, isFeatured, authToken) => {
  try {
    const response = await api.patch(
      `/admin/products/${productId}/featured`,
      { isFeatured },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    )
    .then(response => response.data)
    .catch(error => {
      console.error('Error updating featured status:', error);
      throw error;
    });
    return response;
  } catch (error) {
    console.error('Error updating product featured status:', error);
  }
};

// Admin: Update product's trending status
export const updateProductTrendingStatus = async (productId, isTrending, authToken) => {
  try {
    const response = await api.patch(
      `/admin/products/${productId}/trending`,
      { isTrending },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    )
    .then(response => response.data)
    .catch(error => {
      console.error('Error updating trending status:', error);
      throw error;
    });
    return response;
  } catch (error) {
    console.error('Error updating product trending status:', error);
  }
};

// Admin: Update product's sale information
export const updateProductSaleInfo = async (productId, saleData, authToken) => {
  try {
    const response = await api.patch(
      `/admin/products/${productId}/sale`,
      saleData,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    )
      .then(response => response.data)
      .catch(error => {
        console.error('Error updating sale information:', error);
        throw error;
      });
    return response;
  } catch (error) {
    console.error('Error updating product sale info:', error);
    throw error;
  }
};
