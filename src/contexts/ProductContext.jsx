import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';

const ProductContext = createContext();

// Move the timestamp conversion function outside the component
const convertFirestoreTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  // If it's a Firestore Timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // If it's a Firestore timestamp object with seconds
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  // If it's already a Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // Default to current date
  return new Date();
};

// Helper function to compare products
const areProductsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.price === b.price &&
    a.stock === b.stock &&
    a.category === b.category &&
    a.rating === b.rating &&
    a.updatedAt?.getTime() === b.updatedAt?.getTime()
  );
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Get a single product by ID
  const getProductById = useCallback(async (id) => {
    try {
      const productDoc = await getDoc(doc(db, 'products', id));
      if (productDoc.exists()) {
        const data = productDoc.data();
        return {
          id: productDoc.id,
          ...data,
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt)
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    products,
    loading,
    error,
    getProductById,
    lastUpdated
  }), [products, loading, error, getProductById, lastUpdated]);

  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const productsQuery = query(productsCollection, orderBy('updatedAt', 'desc'));

        // Set up real-time listener
        const unsubscribe = onSnapshot(
          productsQuery,
          (snapshot) => {
            if (!isMounted) return;
            
            try {
              const productsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  createdAt: convertFirestoreTimestamp(data.createdAt),
                  updatedAt: convertFirestoreTimestamp(data.updatedAt)
                };
              });

              // Only update state if the data has actually changed
              setProducts(prevProducts => {
                // If the number of products is different, update
                if (prevProducts.length !== productsData.length) {
                  setLastUpdated(Date.now());
                  return productsData;
                }

                // Check if any product has changed
                const hasChanges = productsData.some((newProduct, index) => {
                  const oldProduct = prevProducts[index];
                  if (!oldProduct) return true;
                  return !areProductsEqual(newProduct, oldProduct);
                });

                if (hasChanges) {
                  setLastUpdated(Date.now());
                  return productsData;
                }
                
                return prevProducts;
              });
              
              setError(null);
            } catch (err) {
              console.error('Error processing products:', err);
              setError('Error processing product data');
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            if (!isMounted) return;
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again later.');
            setLoading(false);
          }
        );

        // Clean up listener on unmount
        return () => {
          isMounted = false;
          unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up product listener:', err);
        setError('Failed to set up product listener');
        setLoading(false);
      }
    };

    loadProducts();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
