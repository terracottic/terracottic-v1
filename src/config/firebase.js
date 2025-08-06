import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp
} from 'firebase/firestore';
import { getAnalytics, isSupported, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

// Environment variable fallbacks for development
const ENV = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDFZsVjDKVseU8zj6RQilaqB_1F1MNzieg',
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mitticraft-4d48d.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mitticraft-4d48d',
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mitticraft-4d48d.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '899072957219',
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '1:899072957219:web:be35c82c1240ab9edf8a96',
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-SQ96TND5EE'
};

// Check for missing environment variables in production
if (import.meta.env.PROD) {
  Object.entries(ENV).forEach(([key, value]) => {
    if (!value && key.startsWith('VITE_')) {
      console.error(`Missing required environment variable: ${key}`);
    }
  });
}

// Firebase configuration
const firebaseConfig = {
  apiKey: ENV.VITE_FIREBASE_API_KEY,
  authDomain: ENV.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: ENV.VITE_FIREBASE_PROJECT_ID,
  storageBucket: ENV.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.VITE_FIREBASE_APP_ID,
  measurementId: ENV.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

// Firestore instance will be initialized below

// Store the initialization promise to prevent multiple initializations
let firestoreInitPromise = null;

const initFirestore = async () => {
  // If already initialized, return the existing instance
  if (db) return db;
  
  // If initialization is in progress, return the existing promise
  if (firestoreInitPromise) return firestoreInitPromise;
  
  // Create a new initialization promise
  firestoreInitPromise = (async () => {
    try {
      // Try to initialize with offline persistence
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('Firestore initialized with offline persistence');
    } catch (error) {
      console.error('Error initializing Firestore with offline persistence:', error);
      // Fallback to default Firestore if initialization fails
      db = getFirestore(app);
      console.log('Firestore initialized with default settings');
    }
    return db;
  })();
  return db;
};

// Initialize Firestore with proper configuration
let db;

initFirestore().then(firestoreDb => {
  db = firestoreDb;
});

// Set auth persistence
const initAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('Auth persistence set to LOCAL');
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    // Fallback to session persistence if local fails
    try {
      await setPersistence(auth, browserSessionPersistence);
      console.log('Auth persistence set to SESSION');
    } catch (error) {
      console.error('Error setting session persistence, using in-memory:', error);
      await setPersistence(auth, inMemoryPersistence);
    }
  }
};

// Initialize Analytics with enhanced error handling and privacy controls
const initAnalytics = async () => {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    console.log('Analytics: Not initializing (SSR)');
    return null;
  }

  // Check if analytics should be disabled
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  const isDoNotTrack = window.doNotTrack === '1' || 
                      navigator.doNotTrack === '1' || 
                      navigator.doNotTrack === 'yes' ||
                      navigator.msDoNotTrack === '1';

  if (isLocalhost || isDoNotTrack || !ENV.VITE_FIREBASE_MEASUREMENT_ID) {
    console.log('Analytics: Disabled (localhost, DNT enabled, or missing measurement ID)');
    return null;
  }
  
  try {
    const isAnalyticsSupported = await isSupported();
    if (!isAnalyticsSupported) {
      console.log('Analytics: Not supported in this environment');
      return null;
    }
    
    const analytics = getAnalytics(app);
    
    // Configure analytics with privacy-focused settings
    setAnalyticsCollectionEnabled(analytics, true);
    
    // Set default event parameters
    analytics.setDefaultEventParameters({
      app_name: 'MittiCraft',
      app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    });
    
    console.log('Analytics initialized successfully');
    return analytics;
  } catch (error) {
    console.error('Analytics initialization failed:', error);
    return null;
  }
};

// Initialize Firebase services when in browser
if (typeof window !== 'undefined') {
  const initFirebase = async () => {
    try {
      console.log('Initializing Firebase services...');
      
      // Check if Firebase app is already initialized
      if (window.firebase) {
        console.log('Firebase is already initialized in window.firebase');
      }
      
      // Initialize auth persistence
      try {
        await initAuthPersistence();
        console.log('Firebase Auth persistence initialized');
      } catch (authError) {
        console.error('Error initializing Auth persistence:', authError);
        // Don't throw here, as we want to continue with other services
      }
      
      // Initialize analytics
      try {
        await initAnalytics();
        console.log('Firebase Analytics initialized');
      } catch (analyticsError) {
        console.warn('Analytics initialization warning:', analyticsError.message);
        // Analytics is not critical, so we don't throw
      }
      
      console.log('Firebase services initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
      // Rethrow to be caught by the outer catch
      throw error;
    }
  };
  
  // Initialize Firebase with error handling
  initFirebase().catch(error => {
    console.error('Failed to initialize Firebase:', error);
    // Show a user-friendly message or take appropriate action
  });
}

// Export the initialization function
export const initializeFirebase = async () => {
  await initAuthPersistence();
  await initAnalytics();
  return { auth, db, storage };
};

// Export individual services
export { 
  app,
  auth, 
  db, 
  storage, 
  serverTimestamp 
};

export default {
  app,
  auth,
  db,
  storage,
  serverTimestamp,
  initializeFirebase
};
