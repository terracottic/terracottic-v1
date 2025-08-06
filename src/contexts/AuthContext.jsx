import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as updateFirebaseProfile,
  getAuth
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Define default context value
const defaultContextValue = {
  currentUser: null,
  loading: true,
  error: '',
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  hasPermission: () => false,
  hasRole: () => false,
  ROLES: {},
  PERMISSIONS: {}
};

const AuthContext = createContext(defaultContextValue);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Define roles and permissions
  const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
  };

  const PERMISSIONS = {
    MANAGE_PRODUCTS: 'manage_products',
    MANAGE_ORDERS: 'manage_orders',
    MANAGE_USERS: 'manage_users',
    MANAGE_CATEGORIES: 'manage_categories'
  };

  const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
      PERMISSIONS.MANAGE_PRODUCTS,
      PERMISSIONS.MANAGE_ORDERS,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_CATEGORIES
    ],
    [ROLES.USER]: []
  };

  // Sign up function
  const signup = async (email, password, displayName) => {
    try {
      setError('');
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateFirebaseProfile(user, { displayName });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || '',
        role: ROLES.USER,
        preferredCurrency: 'INR',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

      // Send email verification
      await firebaseSendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true
      });

      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      let message = 'Failed to create an account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password).catch(error => {
        // Handle specific Firebase auth errors
        if (error.code === 'auth/user-not-found') {
          throw new Error('No account found with this email. Please register first.');
        } else if (error.code === 'auth/wrong-password') {
          throw new Error('Incorrect password. Please try again.');
        } else if (error.code === 'auth/too-many-requests') {
          throw new Error('Too many failed login attempts. Please try again later.');
        } else if (error.code === 'auth/user-disabled') {
          throw new Error('This account has been disabled. Please contact support.');
        } else {
          throw new Error('Login failed. Please try again.');
        }
      });
      
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification email.');
      }

      // Ensure user document exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          role: ROLES.USER,
          preferredCurrency: 'INR',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        // Update last login time with throttling
        const lastLogin = userDoc.data()?.lastLogin?.toDate?.() || 0;
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
        
        if (!lastLogin || lastLogin < tenMinutesAgo) {
          await updateDoc(userDocRef, {
            lastLogin: now.toISOString()
          });
        }
      }

      // Get user data from Firestore
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Get the Firebase ID token and store it in localStorage
      const idToken = await user.getIdToken();
      localStorage.setItem('token', idToken);
      
      // Set current user with permissions
      setCurrentUser({
        ...user,
        ...userData,
        permissions: ROLE_PERMISSIONS[userData?.role] || []
      });

      // Redirect based on role
      const from = location.state?.from?.pathname || '/';
      if (userData?.role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Failed to log in. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError('');
      setLoading(true);
      await signOut(auth);
      // Clear the token from localStorage
      localStorage.removeItem('token');
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      setError('');
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    console.log('[hasPermission] Checking permission:', {
      permission,
      currentUser: currentUser ? {
        uid: currentUser.uid,
        role: currentUser.role,
        permissions: currentUser.permissions
      } : 'No user',
      hasPermission: currentUser?.permissions?.includes(permission) || false
    });
    
    if (!currentUser) return false;
    return currentUser.permissions?.includes(permission) || false;
  };

  // Check if user has the specified role
  const hasRole = (role) => {
    if (!currentUser?.role) return false;
    return currentUser.role === role;
  };

  // Check if user is admin
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  // Set up auth state listener with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async (user) => {
      if (!isMounted) return;
      
      try {
        if (user) {
          // Only fetch user data if we don't already have it or if the user changed
          if (!currentUser || currentUser.uid !== user.uid) {
            // Get the Firebase ID token and store it in localStorage
            const idToken = await user.getIdToken();
            localStorage.setItem('token', idToken);
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            let userData = {};
            
            if (userDoc.exists()) {
              userData = userDoc.data();
              
              // Check if we need to update last login time (only once every 10 minutes)
              const lastLogin = userData.lastLogin?.toMillis?.() || 0;
              const now = Date.now();
              
              // Only update if more than 10 minutes (600,000 ms) have passed since last update
              if (now - lastLogin > 600000) {
                await updateDoc(userDocRef, {
                  lastLogin: serverTimestamp()
                });
                // Update local data with approximate timestamp
                userData.lastLogin = { toDate: () => new Date(now) };
              }
            } else {
              // Create user document if it doesn't exist
              userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                role: ROLES.USER,
                emailVerified: user.emailVerified,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              };
              await setDoc(userDocRef, userData);
            }
            
            // Only update user state if the component is still mounted
            if (isMounted) {
              const updatedUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || userData.displayName || '',
                emailVerified: user.emailVerified,
                role: userData.role || ROLES.USER,
                permissions: ROLE_PERMISSIONS[userData.role] || []
              };
              
              setCurrentUser(updatedUser);
              
              // Only redirect on initial auth state change, not on subsequent updates
              const isInitialAuth = !currentUser;
              if (isInitialAuth) {
                const from = location.state?.from?.pathname || '/';
                if (userData.role === ROLES.ADMIN && !from.startsWith('/admin')) {
                  navigate('/admin/dashboard', { replace: true });
                } else if (userData.role === ROLES.USER && from.startsWith('/admin')) {
                  navigate('/', { replace: true });
                }
              }
            }
          }
        } else {
          // User is signed out
          if (isMounted) {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      initializeAuth(user);
    });
    
    // Cleanup function
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser, location.state?.from?.pathname, navigate]); // Add dependencies to prevent unnecessary re-renders

    // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    hasPermission,
    hasRole,
    ROLES,
    PERMISSIONS
  }), [
    currentUser, 
    loading, 
    error,
    login,
    signup,
    logout,
    resetPassword,
    hasPermission,
    hasRole,
    ROLES,
    PERMISSIONS
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

// Export the context
// useAuth hook is already exported above
export { AuthContext };

export default AuthContext;