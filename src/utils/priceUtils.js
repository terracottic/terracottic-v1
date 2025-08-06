import { useCurrency } from '@/contexts/CurrencyContext';

export const usePriceFormatter = () => {
  const { formatPrice } = useCurrency();
  
  // Format a price with the selected currency
  const format = (price) => {
    if (price === null || price === undefined) return '';
    return formatPrice(price);
  };

  // Format a price range (min - max)
  const formatRange = (minPrice, maxPrice) => {
    if (minPrice === null || maxPrice === null) return '';
    return `${format(minPrice)} - ${format(maxPrice)}`;
  };

  // Format a price with discount
  const formatWithDiscount = (originalPrice, discountPercent) => {
    if (originalPrice === null || discountPercent === null) return '';
    const discountAmount = (originalPrice * discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;
    return {
      original: format(originalPrice),
      final: format(finalPrice),
      discount: `${discountPercent}%`,
      discountAmount: format(discountAmount)
    };
  };

  return {
    format,
    formatRange,
    formatWithDiscount
  };
};

// Helper function to format price without hook (for non-component usage)
export const formatPrice = (price, currency = 'INR') => {
  const exchangeRates = {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    JPY: 1.76,
    AUD: 0.018,
    CAD: 0.016,
    CNY: 0.086,
    AED: 0.044,
    SGD: 0.016,
    INR: 1,
  };

  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CNY: '¥',
    AED: 'د.إ',
    SGD: 'S$',
    INR: '₹',
  };

  const rate = exchangeRates[currency] || 1;
  const symbol = symbols[currency] || '₹';
  const convertedPrice = (price * rate).toFixed(2);
  
  // For right-to-left currencies like AED
  if (['AED'].includes(currency)) {
    return `${convertedPrice} ${symbol}`;
  }
  
  return `${symbol}${convertedPrice}`;
};
