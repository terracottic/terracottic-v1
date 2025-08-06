/**
 * Utility functions for managing recently viewed products with expiration
 */

const RECENT_VIEWED_KEY = 'recentlyViewedProducts';
const MAX_ITEMS = 5; // Maximum number of recently viewed items to store
const EXPIRATION_DAYS = 7; // Number of days before items expire

/**
 * Clean up expired items from the recently viewed list
 * @param {Array} items - Array of recently viewed items
 * @returns {Array} Filtered array with non-expired items
 */
const cleanExpiredItems = (items) => {
  if (!Array.isArray(items)) return [];
  
  const now = Date.now();
  return items.filter(item => {
    // If item doesn't have a timestamp, keep it (for backward compatibility)
    if (!item.viewedAt) return true;
    
    // Check if item is older than EXPIRATION_DAYS
    const itemAgeInDays = (now - item.viewedAt) / (1000 * 60 * 60 * 24);
    return itemAgeInDays <= EXPIRATION_DAYS;
  });
};

/**
 * Add a product to the recently viewed list
 * @param {Object} product - The product to add
 */
export const addToRecentlyViewed = (product) => {
  if (!product || !product.id) return;
  
  try {
    // Get existing items from localStorage or initialize empty array
    const existingItems = JSON.parse(localStorage.getItem(RECENT_VIEWED_KEY) || '[]');
    
    // Clean expired items
    const validItems = cleanExpiredItems(existingItems);
    
    // Remove if product already exists to avoid duplicates
    const filteredItems = validItems.filter(item => item.id !== product.id);
    
    // Process images and add timestamp to the product
    const processImage = (img) => {
      if (!img) return '';
      if (typeof img === 'string') return img;
      return img.url || img.src || img || '';
    };

    // Get the secondary image from the product's images array if available
    const secondaryImage = Array.isArray(product.images) && product.images.length > 1 
      ? product.images[1] 
      : product.secondaryImage || '';

    const productWithTimestamp = {
      ...product,
      // Process primary image
      image: processImage(product.images?.[0] || product.image || ''),
      // Process secondary image if it exists
      secondaryImage: processImage(secondaryImage),
      viewedAt: Date.now()
    };
    
    // Add new product to the beginning of the array and limit to MAX_ITEMS
    const updatedItems = [productWithTimestamp, ...filteredItems].slice(0, MAX_ITEMS);
    
    // Save back to localStorage
    localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
};

/**
 * Get the list of recently viewed products
 * @returns {Array} Array of recently viewed products with non-expired items
 */
export const getRecentlyViewed = () => {
  try {
    const items = JSON.parse(localStorage.getItem(RECENT_VIEWED_KEY) || '[]');
    const validItems = cleanExpiredItems(items);
    
    // Update localStorage with cleaned items
    if (validItems.length !== items.length) {
      localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(validItems));
    }
    
    return validItems;
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(RECENT_VIEWED_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};
