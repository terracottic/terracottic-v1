import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/config/firebase';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from Firestore on auth state change
  useEffect(() => {
    const loadWishlist = async () => {
      if (!currentUser) {
        // For guests, try to load from localStorage
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
          setWishlist(Array.isArray(guestWishlist) ? guestWishlist : []);
        } catch (error) {
          console.error('Error parsing guest wishlist:', error);
          setWishlist([]);
        }
        setLoading(false);
        return;
      }

      try {
        const wishlistRef = doc(db, 'userWishlists', currentUser.uid);
        const wishlistDoc = await getDoc(wishlistRef);
        
        if (wishlistDoc.exists()) {
          const data = wishlistDoc.data();
          setWishlist(Array.isArray(data?.items) ? data.items : []);
        } else {
          // Initialize with empty array if no wishlist exists
          setWishlist([]);
          // Don't create the document here - it will be created when first adding an item
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
        // Fallback to localStorage if Firestore fails
        try {
          const fallbackWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
          setWishlist(Array.isArray(fallbackWishlist) ? fallbackWishlist : []);
        } catch (e) {
          console.error('Error parsing fallback wishlist:', e);
          setWishlist([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [currentUser]);

  // Add item to wishlist
  const addToWishlist = async (product) => {
    if (!product || !product.id) return { success: false, error: 'Invalid product' };
    
    // Check if product is already in wishlist
    if (wishlist.some(item => item.id === product.id)) {
      return { success: false, error: 'Product already in wishlist' };
    }
    
    // Optimistic update
    const updatedWishlist = [...wishlist, product];
    setWishlist(updatedWishlist);
    
    // Save to localStorage for guests
    if (!currentUser) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        return { success: true };
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        setWishlist(wishlist); // Revert on error
        return { success: false, error: 'Failed to update wishlist' };
      }
    }

    // For authenticated users, try to save to Firestore
    try {
      const wishlistRef = doc(db, 'userWishlists', currentUser.uid);
      await setDoc(wishlistRef, 
        { 
          items: updatedWishlist,
          updatedAt: new Date().toISOString()
        }, 
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // Revert on error
      setWishlist(wishlist);
      
      // Fallback to localStorage if Firestore fails
      try {
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      } catch (e) {
        console.error('Error falling back to localStorage:', e);
      }
      
      return { 
        success: false, 
        error: 'Failed to update wishlist. Changes saved locally.' 
      };
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    // Optimistic update
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    
    // Save to localStorage for guests
    if (!currentUser) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        return { success: true };
      } catch (error) {
        console.error('Error updating localStorage:', error);
        setWishlist(wishlist); // Revert on error
        return { success: false, error: 'Failed to update wishlist' };
      }
    }

    // For authenticated users, try to save to Firestore
    try {
      const wishlistRef = doc(db, 'userWishlists', currentUser.uid);
      await setDoc(wishlistRef, 
        { 
          items: updatedWishlist,
          updatedAt: new Date().toISOString()
        }, 
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // Revert on error
      setWishlist(wishlist);
      
      // Fallback to localStorage if Firestore fails
      try {
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      } catch (e) {
        console.error('Error falling back to localStorage:', e);
      }
      
      return { 
        success: false, 
        error: 'Failed to update wishlist. Changes saved locally.' 
      };
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  // Move item from wishlist to cart
  const moveToCart = async (product, cartContext) => {
    try {
      // Add to cart
      const addResult = await cartContext.addToCart(product);
      if (!addResult.success) throw new Error(addResult.error);
      
      // Remove from wishlist
      const removeResult = await removeFromWishlist(product.id);
      if (!removeResult.success) throw new Error(removeResult.error);
      
      return { success: true };
    } catch (error) {
      console.error('Error moving to cart:', error);
      return { success: false, error: error.message };
    }
  };

  // Clear wishlist
  const clearWishlist = async () => {
    if (!currentUser) {
      localStorage.removeItem('wishlist');
      setWishlist([]);
      return { success: true };
    }

    try {
      const wishlistRef = doc(db, 'wishlists', currentUser.uid);
      await updateDoc(wishlistRef, { items: [] });
      setWishlist([]);
      return { success: true };
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return { success: false, error: 'Failed to clear wishlist' };
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        moveToCart,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
