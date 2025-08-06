import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useNotification } from './NotificationContext';
import Link from '@mui/material/Link';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [selectedPackaging, setSelectedPackaging] = useState('free');
  const { showNotification } = useNotification();

  // Load cart and coupon from Firestore on auth state change
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        // For guests, try to load from localStorage
        try {
          const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
          const savedPackaging = localStorage.getItem('selectedPackaging') || 'free';
          setCart(Array.isArray(guestCart) ? guestCart : []);
          setSelectedPackaging(['free', 'essential'].includes(savedPackaging) ? savedPackaging : 'free');
        } catch (error) {
          console.error('Error parsing guest data:', error);
          setCart([]);
          setSelectedPackaging('free');
        }
        setLoading(false);
        return;
      }
      
      // Load applied coupon
      const loadedCoupon = await loadCouponFromFirestore();
      if (loadedCoupon) {
        setAppliedCoupon(loadedCoupon);
      }

      try {
        const cartRef = doc(db, 'userCarts', currentUser.uid);
        const cartDoc = await getDoc(cartRef);
        
        if (cartDoc.exists()) {
          const data = cartDoc.data();
          setCart(Array.isArray(data?.items) ? data.items : []);
          
          // Load saved packaging selection if it exists
          if (data.selectedPackaging && ['free', 'essential'].includes(data.selectedPackaging)) {
            setSelectedPackaging(data.selectedPackaging);
          }
        } else {
          // Initialize with empty array if no cart exists
          setCart([]);
          // Don't create the document here - it will be created when first adding an item
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        // Fallback to localStorage if Firestore fails
        try {
          const fallbackCart = JSON.parse(localStorage.getItem('cart') || '[]');
          setCart(Array.isArray(fallbackCart) ? fallbackCart : []);
        } catch (e) {
          console.error('Error parsing fallback cart:', e);
          setCart([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    
    // Cleanup function
    return () => {
      setAppliedCoupon(null);
    };
  }, [currentUser]);

  // Save selectedPackaging to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      // For authenticated users, save to Firestore
      const savePackagingToFirestore = async () => {
        try {
          const cartRef = doc(db, 'userCarts', currentUser.uid);
          await setDoc(cartRef, { selectedPackaging }, { merge: true });
        } catch (error) {
          console.error('Error saving packaging to Firestore:', error);
        }
      };
      savePackagingToFirestore();
    } else {
      // For guests, save to localStorage
      try {
        localStorage.setItem('selectedPackaging', selectedPackaging);
      } catch (error) {
        console.error('Error saving packaging to localStorage:', error);
      }
    }
  }, [selectedPackaging, currentUser]);

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    if (!product || !product.id) return { success: false, error: 'Invalid product' };
    
    // Check if product is in stock
    // Check stock if product has stock information
    if (product.stock !== undefined) {
      const existingItem = cart.find(item => item.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const requestedQuantity = currentQuantity + quantity;
      
      // If no stock available
      if (product.stock <= 0) {
        return { 
          success: false, 
          error: 'This product is currently out of stock' 
        };
      }
      
      // If trying to add more than available
      if (requestedQuantity > product.stock) {
        const remainingStock = product.stock - currentQuantity;
        if (remainingStock > 0) {
          // If there's some stock left, suggest that amount
          return { 
            success: false, 
            error: `Only ${remainingStock} more item${remainingStock > 1 ? 's' : ''} available in stock`,
            suggestedQuantity: remainingStock
          };
        } else {
          // If no more can be added
          return { 
            success: false, 
            error: 'Maximum available quantity already in cart',
            maxReached: true
          };
        }
      }
    }
    
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    let updatedCart = [];
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      updatedCart = cart.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: (item.quantity || 1) + quantity }
          : item
      );
    } else {
      // Always use discounted price if available, otherwise use regular price
      const finalDiscountedPrice = parseFloat(
        (product.discountedPrice || product.price).toFixed(2)
      );
      
      // Create cart item with all product data and explicit image handling
      const cartItem = {
        // Core product info
        ...product,
        // Ensure these fields are properly formatted
        id: product.id,
        name: product.name,
        price: parseFloat(product.price.toFixed(2)),
        discountedPrice: finalDiscountedPrice,
        discount: product.discount || 0,
        // Ensure image data is properly included
        imageUrl: product.imageUrl || (product.images?.[0]?.url || ''),
        images: product.images || [],
        quantity,
        
      };
      
      // Clean up undefined values and non-serializable data
      Object.keys(cartItem).forEach(key => {
        // Preserve imageUrl and images fields
        if (key === 'imageUrl' || key === 'images') return;
        
        if (cartItem[key] === undefined || 
            typeof cartItem[key] === 'function' || 
            (typeof cartItem[key] === 'object' && cartItem[key] !== null && !Array.isArray(cartItem[key]) && !(cartItem[key] instanceof Date))) {
          delete cartItem[key];
        }
      });
      
      updatedCart = [...cart, cartItem];
    }
    
    // Optimistic update
    setCart(updatedCart);
    
    // Save to localStorage for guests
    if (!currentUser) {
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return { success: true };
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        setCart(cart); // Revert on error
        return { success: false, error: 'Failed to update cart' };
      }
    }

    // For authenticated users, try to save to Firestore
    try {
      const cartRef = doc(db, 'userCarts', currentUser.uid);
      await setDoc(cartRef, 
        { 
          items: updatedCart,
          updatedAt: new Date().toISOString()
        }, 
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Revert on error
      setCart(cart);
      
      // Fallback to localStorage if Firestore fails
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } catch (e) {
        console.error('Error falling back to localStorage:', e);
      }
      
      return { 
        success: false, 
        error: 'Failed to update cart. Changes saved locally.' 
      };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    // Optimistic update
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    
    // Save to localStorage for guests
    if (!currentUser) {
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return { success: true };
      } catch (error) {
        console.error('Error updating localStorage:', error);
        setCart(cart); // Revert on error
        return { success: false, error: 'Failed to update cart' };
      }
    }

    // For authenticated users, try to save to Firestore
    try {
      const cartRef = doc(db, 'userCarts', currentUser.uid);
      await setDoc(cartRef, 
        { 
          items: updatedCart,
          updatedAt: new Date().toISOString()
        }, 
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Revert on error
      setCart(cart);
      
      // Fallback to localStorage if Firestore fails
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } catch (e) {
        console.error('Error falling back to localStorage:', e);
      }
      
      return { 
        success: false, 
        error: 'Failed to update cart. Changes saved locally.' 
      };
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    
    // Find the item being updated
    const itemToUpdate = cart.find(item => item.id === productId);
    
    // Check if updating quantity would exceed available stock
    if (itemToUpdate?.stock !== undefined && quantity > itemToUpdate.stock) {
      return { 
        success: false, 
        error: `Only ${itemToUpdate.stock} items available in stock` 
      };
    }
    if (!itemToUpdate) return { success: false, error: 'Item not found in cart' };
    
    // Check if the requested quantity exceeds available stock
    if (itemToUpdate.stock !== undefined && quantity > itemToUpdate.stock) {
      return { 
        success: false, 
        error: `Only ${itemToUpdate.stock} items available in stock` 
      };
    }
    
    // Optimistic update
    const updatedCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    
    // Save to localStorage for guests
    if (!currentUser) {
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return { success: true };
      } catch (error) {
        console.error('Error updating localStorage:', error);
        setCart(cart); // Revert on error
        return { success: false, error: 'Failed to update cart' };
      }
    }

    // For authenticated users, try to save to Firestore
    try {
      const cartRef = doc(db, 'userCarts', currentUser.uid);
      await setDoc(cartRef, 
        { 
          items: updatedCart,
          updatedAt: new Date().toISOString()
        }, 
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      // Revert on error
      setCart(cart);
      
      // Fallback to localStorage if Firestore fails
      try {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      } catch (e) {
        console.error('Error falling back to localStorage:', e);
      }
      
      return { 
        success: false, 
        error: 'Failed to update quantity. Changes saved locally.' 
      };
    }
  };

  // Clear cart


  // Calculate cart subtotal using discounted price when available
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = (item.discountedPrice && item.discountedPrice < item.price) 
        ? item.discountedPrice 
        : item.price;
      return total + (price || 0) * (item.quantity || 1);
    }, 0);
  };

  // Calculate cart total after applying coupon if any
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    
    if (!appliedCoupon) return subtotal;
    
    switch (appliedCoupon.type) {
      case 'percentage': {
        const discount = subtotal * (appliedCoupon.value / 100);
        // Apply max discount if specified
        if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
          return subtotal - appliedCoupon.maxDiscount;
        }
        return subtotal - discount;
      }
      case 'fixed':
        return Math.max(0, subtotal - appliedCoupon.value);
      case 'free_shipping':
      case 'free_packaging':
        // These will be handled in the checkout process
        return subtotal;
      default:
        return subtotal;
    }
  };

  // Save applied coupon to Firestore
  const saveCouponToFirestore = async (coupon) => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'userCarts', currentUser.uid);
      await updateDoc(userDocRef, {
        appliedCoupon: coupon,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving coupon to Firestore:', error);
    }
  };

  // Load coupon from Firestore
  const loadCouponFromFirestore = async () => {
    if (!currentUser) return null;
    
    try {
      const userDocRef = doc(db, 'userCarts', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().appliedCoupon) {
        const coupon = userDoc.data().appliedCoupon;
        // Check if coupon is expired
        if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
          // Remove expired coupon
          await updateDoc(userDocRef, {
            appliedCoupon: null
          }, { merge: true });
          return null;
        }
        return coupon;
      }
      return null;
    } catch (error) {
      console.error('Error loading coupon from Firestore:', error);
      return null;
    }
  };

  // Apply coupon code
  const applyCoupon = async (code) => {
    try {
      setCouponError('');
      console.log('Attempting to apply coupon code:', code);
      
      // Query coupons collection where code matches
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('code', '==', code.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('Coupon not found in database');
        setCouponError('Invalid coupon code');
        return { success: false, error: 'Invalid coupon code' };
      }
      
      // Get the first matching coupon (should be only one since codes should be unique)
      const couponDoc = querySnapshot.docs[0];
      
      // Check if coupon is active
      if (couponDoc.data().isActive === false) {
        setCouponError('This coupon is no longer active');
        return { success: false, error: 'This coupon is no longer active' };
      }
      
      const couponData = couponDoc.data();
      console.log('Coupon data from Firestore:', JSON.stringify(couponData, null, 2));
      
      // Helper function to safely convert Firestore timestamps
      const toDate = (timestamp) => {
        if (!timestamp) return null;
        // If it's a Firestore timestamp
        if (typeof timestamp === 'object' && 'toDate' in timestamp) {
          return timestamp.toDate();
        }
        // If it's already a Date object or string
        return timestamp instanceof Date ? timestamp : new Date(timestamp);
      };
      
      const coupon = {
        id: couponDoc.id,
        code: couponData.code,
        type: couponData.type,
        value: couponData.value,
        maxDiscount: couponData.maxDiscount,
        minPurchase: couponData.minPurchase,
        validUntil: toDate(couponData.expirationDate), // Using expirationDate field
        createdAt: toDate(couponData.createdAt),
        isActive: couponData.isActive,
        usageLimit: couponData.usageLimit,
        timesUsed: couponData.timesUsed || 0
      };
      
      console.log('Processed coupon data:', JSON.stringify(coupon, null, 2));
      
      // Check if coupon is expired
      if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
        setCouponError('This coupon has expired');
        return { success: false, error: 'This coupon has expired' };
      }
      
      // Check if coupon is not yet valid
      if (coupon.createdAt && new Date(coupon.createdAt) > new Date()) {
        setCouponError('This coupon is not yet valid');
        return { success: false, error: 'This coupon is not yet valid' };
      }
      
      // Check minimum purchase amount
      const subtotal = calculateSubtotal();
      if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        setCouponError(`Minimum purchase of ₹${coupon.minPurchase} required`);
        return { 
          success: false, 
          error: `Minimum purchase of ₹${coupon.minPurchase} required` 
        };
      }
      
      // Check maximum usage limit
      const currentUsage = couponDoc.data().usageCount || 0;
      if (coupon.usageLimit && coupon.usageLimit <= currentUsage) {
        setCouponError('This coupon has reached its usage limit');
        return { success: false, error: 'This coupon has reached its usage limit' };
      }
      
      // Check per-user usage limit
      if (currentUser && coupon.perUserLimit) {
        const userUsageRef = doc(db, 'couponUsage', `${code}_${currentUser.uid}`);
        const userUsageDoc = await getDoc(userUsageRef);
        const userUsageCount = userUsageDoc.exists() ? userUsageDoc.data().count : 0;
        
        if (userUsageCount >= coupon.perUserLimit) {
          setCouponError('You have reached the maximum usage limit for this coupon');
          return { 
            success: false, 
            error: 'You have reached the maximum usage limit for this coupon' 
          };
        }
      }
      
      // Increment usage count
      const batch = writeBatch(db);
      const currentTimesUsed = couponDoc.data().timesUsed || 0;
      const updatedTimesUsed = currentTimesUsed + 1;
      
      const updatedCoupon = {
        ...coupon,
        timesUsed: updatedTimesUsed,
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Use the document ID from the query result
      const couponDocRef = doc(db, 'coupons', couponDoc.id);
      batch.update(couponDocRef, {
        timesUsed: updatedTimesUsed,
        lastUsedAt: updatedCoupon.lastUsedAt,
        updatedAt: updatedCoupon.updatedAt
      });
      
      // Track per-user usage
      if (currentUser) {
        const userUsageRef = doc(db, 'couponUsage', `${code}_${currentUser.uid}`);
        batch.set(userUsageRef, {
          couponCode: code,
          userId: currentUser.uid,
          count: 1,
          lastUsedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      await batch.commit();
      
      setAppliedCoupon(updatedCoupon);
      await saveCouponToFirestore(updatedCoupon);
      showNotification('Coupon applied successfully', 'success');
      return { success: true, coupon: updatedCoupon };
      
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('Failed to apply coupon');
      return { success: false, error: 'Failed to apply coupon' };
    }
  };
  
  // Remove applied coupon
  const removeCoupon = async () => {
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'userCarts', currentUser.uid);
        await updateDoc(userDocRef, {
          appliedCoupon: null
        }, { merge: true });
      } catch (error) {
        console.error('Error removing coupon from Firestore:', error);
      }
    }
    
    setAppliedCoupon(null);
    setCouponError('');
    showNotification('Coupon removed', 'info');
    return { success: true };
  };

  // Clear the entire cart
  const clearCart = async () => {
    // Optimistic update
    setCart([]);
    
    // Clear from localStorage for guests
    if (!currentUser) {
      try {
        localStorage.removeItem('cart');
        return { success: true };
      } catch (error) {
        console.error('Error clearing localStorage cart:', error);
        return { success: false, error: 'Failed to clear cart' };
      }
    }

    // For authenticated users, clear from Firestore
    try {
      const cartRef = doc(db, 'userCarts', currentUser.uid);
      await setDoc(cartRef, 
        { 
          items: [],
          updatedAt: new Date().toISOString()
        }
      );
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: 'Failed to clear cart' };
    }
  };

  // Calculate cart total
  const cartTotal = calculateTotal();
  const cartSubtotal = calculateSubtotal();
  
  // Calculate item count
  const itemCount = cart.reduce((count, item) => {
    return count + (item.quantity || 1);
  }, 0);
  
  // Get discount amount for a given subtotal
  const getDiscountAmount = (subtotal) => {
    if (!appliedCoupon) return 0;
    
    switch (appliedCoupon.type) {
      case 'percentage': {
        const discount = subtotal * (appliedCoupon.value / 100);
        return appliedCoupon.maxDiscount 
          ? Math.min(discount, appliedCoupon.maxDiscount)
          : discount;
      }
      case 'fixed':
        return Math.min(appliedCoupon.value, subtotal);
      default:
        return 0;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        cartSubtotal,
        itemCount,
        loading,
        appliedCoupon,
        couponError,
        setCouponError,
        getDiscountAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        selectedPackaging,
        setSelectedPackaging,
        shippingCost: 0, // Default shipping cost
        discountAmount: getDiscountAmount(cartSubtotal)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
