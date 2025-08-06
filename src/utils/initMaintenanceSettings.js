import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initMaintenanceSettings = async () => {
  try {
    const maintenanceRef = doc(db, 'settings', 'maintenance');
    
    await setDoc(maintenanceRef, {
      enabled: false, // Set to true to enable maintenance mode
      message: 'We are currently performing maintenance. Please check back soon.',
      updatedAt: new Date().toISOString(),
      estimatedCompletion: '2 hours',
      additionalInfo: 'We apologize for the inconvenience.'
    }, { merge: true });
    
    console.log('Maintenance settings initialized successfully!');
  } catch (error) {
    console.error('Error initializing maintenance settings:', error);
  }
};

export default initMaintenanceSettings;
