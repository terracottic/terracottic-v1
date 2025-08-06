/**
 * Formats a number as a price string with Indian Rupee format
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted price string (e.g., "₹1,234.56")
 */
export const formatPrice = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }
  
  // Convert to number and round to 2 decimal places
  const numAmount = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  
  // Format with Indian numbering system (lakhs and crores)
  return '₹' + numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formats a date string into a more readable format
 * @param {string|Date} date - The date to format
 * @param {string} [locale='en-IN'] - The locale to use for formatting
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en-IN') => {
  if (!date) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString(locale, options);
};

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} [maxLength=100] - Maximum length before truncation
 * @returns {string} Truncated string with ellipsis if needed
 */
export const truncateText = (text = '', maxLength = 100) => {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

export default {
  formatPrice,
  formatDate,
  truncateText
};
