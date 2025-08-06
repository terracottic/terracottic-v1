import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Custom hook for fetching Firestore data with pagination and real-time updates
 * @param {string} collectionName - Name of the Firestore collection
 * @param {Object} options - Configuration options
 * @param {Array} options.filters - Array of filter conditions [field, operator, value]
 * @param {string} options.orderByField - Field to order by
 * @param {string} options.orderDirection - 'asc' or 'desc'
 * @param {number} options.pageSize - Number of items per page
 * @param {boolean} options.realTime - Whether to subscribe to real-time updates
 * @returns {Object} - { data, loading, error, hasMore, loadMore, refresh }
 */
export const useFirestoreQuery = (collectionName, {
  filters = [],
  orderByField = 'createdAt',
  orderDirection = 'desc',
  pageSize = 10,
  realTime = false
} = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Create base query
  const createQuery = useCallback(({ startAfterDoc = null, limitSize = pageSize } = {}) => {
    let q = query(collection(db, collectionName));
    
    // Apply filters
    filters.forEach(([field, operator, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        q = query(q, where(field, operator, value));
      }
    });
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    // Apply pagination
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    q = query(q, limit(limitSize));
    
    return q;
  }, [collectionName, filters, orderByField, orderDirection, pageSize]);

  // Fetch data function
  const fetchData = useCallback(async ({ reset = false } = {}) => {
    try {
      setLoading(true);
      
      if (reset) {
        lastDocRef.current = null;
        setData([]);
      }
      
      const q = createQuery({
        startAfterDoc: reset ? null : lastDocRef.current,
        limitSize: reset ? pageSize : undefined
      });
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        return [];
      }
      
      // Update last document reference for pagination
      lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      const newData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return newData;
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [collectionName, createQuery, pageSize]);

  // Initial data load
  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      const newData = await fetchData({ reset: true });
      if (mounted) {
        setData(newData);
        setHasMore(newData.length === pageSize);
      }
    };
    
    loadInitialData();
    
    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [fetchData, pageSize]);
  
  // Load more data (for pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const newData = await fetchData();
    if (newData.length > 0) {
      setData(prev => [...prev, ...newData]);
      setHasMore(newData.length === pageSize);
    }
  }, [fetchData, hasMore, loading, pageSize]);
  
  // Refresh data
  const refresh = useCallback(async () => {
    const newData = await fetchData({ reset: true });
    setData(newData);
    setHasMore(newData.length === pageSize);
  }, [fetchData, pageSize]);
  
  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

/**
 * Optimized hook for single document fetches
 */
export const useFirestoreDoc = (collectionName, docId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }
    
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setData(null);
        }
      } catch (err) {
        console.error(`Error fetching document ${docId} from ${collectionName}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoc();
  }, [collectionName, docId]);
  
  return { data, loading, error };
};
