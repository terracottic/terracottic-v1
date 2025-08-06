import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from './AuthContext';

// Exchange rates (you might want to fetch these from an API in production)
const EXCHANGE_RATES = {
  USD: 0.12,  // 1 INR = 0.12 USD
  EUR: 0.11,  // 1 INR = 0.11 EUR
  GBP: 0.095, // 1 INR = 0.095 GBP
  JPY: 1.76,   // 1 INR = 1.76 JPY
  AUD: 0.18,  // 1 INR = 0.18 AUD
  CAD: 0.16,  // 1 INR = 0.16 CAD
  CNY: 0.086,  // 1 INR = 0.086 CNY
  AED: 0.044,  // 1 INR = 0.044 AED
  SGD: 0.16,  // 1 INR = 0.16 SGD
  INR: 1,      // 1 INR = 1 INR
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);

  // Load user's preferred currency or default to INR
  useEffect(() => {
    const loadUserCurrency = async () => {
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // First try to get the user document
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // If user document exists, set the currency if available
          const userData = userDoc.data();
          if (userData.preferredCurrency) {
            setCurrency(userData.preferredCurrency);
          } else {
            // If preferredCurrency doesn't exist, update the document
            const defaultCurrency = 'INR';
            try {
              await setDoc(userDocRef, { preferredCurrency: defaultCurrency }, { merge: true });
              setCurrency(defaultCurrency);
            } catch (updateError) {
              console.error('Error updating user currency:', updateError);
              setCurrency('INR');
            }
          }
        } else {
          // If user document doesn't exist, create it with default currency
          const defaultCurrency = 'INR';
          try {
            await setDoc(userDocRef, { 
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              role: 'user',
              preferredCurrency: defaultCurrency,
              emailVerified: currentUser.emailVerified || false,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            }, { merge: true });
            setCurrency(defaultCurrency);
          } catch (createError) {
            console.error('Error creating user document:', createError);
            setCurrency('INR');
          }
        }
      } catch (error) {
        console.error('Error in loadUserCurrency:', error);
        // Set default currency in case of error
        setCurrency('INR');
      } finally {
        setLoading(false);
      }
    };

    loadUserCurrency();
  }, [currentUser]);

  // Save user's preferred currency to their profile
  const updateCurrency = async (newCurrency) => {
    try {
      setCurrency(newCurrency);
      
      if (currentUser) {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          { preferredCurrency: newCurrency },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  // Convert price from INR to selected currency
  const convertPrice = (priceInr) => {
    if (!priceInr || isNaN(priceInr)) return '0.00';
    const converted = priceInr * (EXCHANGE_RATES[currency] || 1);
    return converted.toFixed(2);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
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
    return symbols[currency] || '₹';
  };

  // Format price with currency symbol
  const formatPrice = (priceInr) => {
    const convertedPrice = convertPrice(priceInr);
    const symbol = getCurrencySymbol();
    
    // For right-to-left currencies like AED
    if (['AED'].includes(currency)) {
      return `${convertedPrice} ${symbol}`;
    }
    
    return `${symbol}${convertedPrice}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: updateCurrency,
        convertPrice,
        formatPrice,
        getCurrencySymbol,
        loading,
      }}
    >
      {!loading && children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
