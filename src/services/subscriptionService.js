import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  updateDoc, 
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const SUBSCRIPTIONS_COLLECTION = 'newsletterSubscriptions';

/**
 * Subscribe a new email to the newsletter
 * @param {string} email - The email to subscribe
 * @returns {Promise<{success: boolean, id: string}>}
 */
export const subscribeToNewsletter = async (email) => {
  try {
    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Check if email already exists
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION), 
      where('email', '==', email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Return success even if already subscribed, but don't create duplicate
      const existingDoc = querySnapshot.docs[0];
      return { 
        success: true, 
        id: existingDoc.id,
        message: 'This email is already subscribed.'
      };
    }
    
    // Add new subscription with required fields matching Firestore rules
    const subscriptionData = {
      email: email.toLowerCase().trim(),
      createdAt: serverTimestamp(),
      isActive: true,
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), subscriptionData);
    
    return { 
      success: true, 
      id: docRef.id,
      message: 'Thank you for subscribing!'
    };
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw new Error(error.message || 'Failed to subscribe. Please try again.');
  }
};

/**
 * Get all newsletter subscriptions
 * @returns {Promise<Array>} Array of subscription objects
 */
export const getAllSubscriptions = async () => {
  try {
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      orderBy('subscribedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const subscriptions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      subscriptions.push({
        id: doc.id,
        email: data.email || '',
        subscribedAt: data.subscribedAt?.toDate() || new Date(),
        isActive: data.isActive !== false,
        updatedAt: data.updatedAt?.toDate()
      });
    });
    
    return subscriptions;
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    throw new Error('Failed to load subscriptions. Please try again.');
  }
};

/**
 * Update subscription status
 * @param {string} subscriptionId - The ID of the subscription to update
 * @param {boolean} isActive - The new status
 * @returns {Promise<{success: boolean}>}
 */
export const updateSubscriptionStatus = async (subscriptionId, isActive) => {
  try {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Subscription not found');
    }

    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp()
    });
    
    return { 
      success: true,
      message: 'Subscription updated successfully'
    };
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw new Error(error.message || 'Failed to update subscription');
  }
};
