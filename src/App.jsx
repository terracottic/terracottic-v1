import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ContentProtection from '@/components/common/ContentProtection';
import { ProductProvider } from '@/contexts/ProductContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from '@/components/common/ScrollToTop';
import ProductDetailPage from '@/pages/ProductDetailPage';

// Performance Monitoring
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { ServiceWorkerUpdater, OfflineStatus } from '@/hooks/useServiceWorker.jsx';
import reportWebVitals from '@/utils/reportWebVitals';
import analytics from '@/utils/analytics';
import { preloadRoute } from '@/utils/lazyLoad.jsx';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Initialize analytics
if (process.env.NODE_ENV === 'production') {
  analytics.initialize();
  
  // Report web vitals
  reportWebVitals((metric) => {
    analytics.trackEvent({
      category: 'Web Vitals',
      action: metric.name,
      value: metric.value,
      label: metric.id,
      nonInteraction: true,
    });
  });
}

// Public Pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPassword from '@/pages/ForgotPassword';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
// import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import ProfilePage from '@/pages/ProfilePage';
import OrderComplete from '@/pages/OrderComplete';
import UserOrderDetails from '@/pages/UserOrderDetails';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import NotFoundPage from '@/pages/NotFoundPage';
import FoundersPage from '@/pages/FoundersPage';
import WorkshopPage from '@/pages/WorkshopPage';
import ShippingInfo from '@/pages/ShippingInfo';
import PackagingInfo from '@/pages/PackagingInfo';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsAndConditions from '@/pages/TermsAndConditions';
import SupportPage from '@/pages/SupportPage';
import BlogPage from '@/pages/BlogPage';
import FaqPage from '@/pages/FaqPage';
import OrderTrackingPage from '@/pages/OrderTrackingPage';

// Lazy load admin components
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrdersPage'));

const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const UserDetailsPage = lazy(() => import('@/pages/admin/UserDetailsPage'));
const SliderManagement = lazy(() => import('@/pages/admin/SliderManagement'));
const CustomerSegmentation = lazy(() => import('@/pages/admin/CustomerSegmentation'));
const NewsletterSubscribers = lazy(() => import('@/pages/admin/NewsletterSubscribers'));
const AdminWorkshop = lazy(() => import('@/pages/admin/AdminWorkshop'));
const AdminProfile = lazy(() => import('@/pages/admin/AdminProfile'));
const AdminPopupManager = lazy(() => import('@/pages/admin/AdminPopupManager'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const OutOfStockWaitlist = lazy(() => import('@/pages/admin/OutOfStockWaitlist'));
const CouponManagement = lazy(() => import('@/pages/admin/CouponManagement'));
const OrderDetailPage = lazy(() => import('@/pages/admin/OrderDetailPage'));
const ImageUploadTest = lazy(() => import('@/components/ImageUploadTest'));

// Loading component for admin routes
const AdminLoading = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <CircularProgress size={60} />
    <Typography variant="h6" sx={{ mt: 2 }}>Loading...</Typography>
  </Box>
);

// Create and configure theme with enhanced colors and typography
const theme = responsiveFontSizes(
  createTheme({
    palette: {
      primary: {
        main: '#8B4513', // Saddle Brown
        light: '#A0522D', // Sienna
        dark: '#654321', // Dark Brown
        contrastText: '#FFF8E1',
      },
      secondary: {
        main: '#D2691E', // Chocolate
        light: '#CD853F', // Peru
        dark: '#A0522D', // Sienna
        contrastText: '#FFF',
      },
      background: {
        default: '#FFF8F0', // Floral White
        paper: '#FFFFFF',
      },
      text: {
        primary: '#3E2723', // Dark Brown
        secondary: '#5D4037', // Brown
        disabled: '#BCAAA4', // Light Brown
      },
      divider: '#D7CCC8', // Light Brown
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.5px',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.5px',
      },
      h3: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  })
);

// useAuth hook is imported from AuthContext.jsx

// Protected Route Component - For admin routes
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        // Not authenticated
        setIsAuthorized(false);
        setIsChecking(false);
      } else {
        // Get user role from Firestore
        const getUserRole = async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData.role || 'user';
              setUserRole(role);
              
              if (adminOnly) {
                setIsAuthorized(role === 'admin');
              } else {
                setIsAuthorized(true);
              }
            } else {
              setIsAuthorized(!adminOnly);
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setIsAuthorized(false);
          } finally {
            setIsChecking(false);
          }
        };
        
        getUserRole();
      }
    }
  }, [currentUser, authLoading, adminOnly]);

  // Show loading state
  if (authLoading || isChecking) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For admin routes, check if user is authorized
  if (adminOnly && !isAuthorized) {
    console.log('Access denied - Admin role required');
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
};

// Auth Required Route - For routes that require authentication
const AuthRequiredRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  if (loading || isChecking) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
};

// Admin Route Component
const AdminRoute = ({ children }) => (
  <ProtectedRoute adminOnly>
    {children}
  </ProtectedRoute>
);

function AppContent() {
  const { loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Handle initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading during initial auth check
  if (authLoading) {
    return (
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScrollToTop />
      <ContentProtection /> 
        <ProductProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Public Routes with Main Layout */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/founders" element={<FoundersPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/workshops" element={<WorkshopPage />} />
                  <Route path="/shipping-info" element={<ShippingInfo />} />
                  <Route path="/packaging-info" element={<PackagingInfo />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/track-order" element={<OrderTrackingPage />} />
                </Route>

                {/* Protected Routes - Require Authentication */}
                <Route element={
                  <AuthRequiredRoute>
                    <MainLayout />
                  </AuthRequiredRoute>
                }>
                  <Route path="profile">
                    <Route index element={<ProfilePage />} />
                    <Route path="orders/:orderId" element={<UserOrderDetails />} />
                  </Route>
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="ordercomplete" element={<OrderComplete />} />
                </Route>

                {/* Admin Routes - Only accessible to admin users */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={
                    <Suspense fallback={<AdminLoading />}>
                      <AdminRoute><AdminDashboard /></AdminRoute>
                    </Suspense>
                  } />
                  <Route 
                    path="dashboard" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminRoute><AdminDashboard /></AdminRoute>
                      </Suspense>
                    } 
                  />
                  <Route path="workshops" element={
                    <Suspense fallback={<AdminLoading />}>
                      <AdminRoute><AdminWorkshop /></AdminRoute>
                    </Suspense>
                  } />
                  <Route 
                    path="products" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminProducts />
                      </Suspense>
                    } 
                  >
                    <Route path=":id" element={null} />
                  </Route>
                  <Route 
                    path="categories" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminCategories />
                      </Suspense>
                    } 
                  />
                  <Route path="orders">
                    <Route path=":orderId" element={
                      <Suspense fallback={<AdminLoading />}>
                        <OrderDetailPage />
                      </Suspense>
                    } />
                    <Route 
                      index 
                      element={
                        <Suspense fallback={<AdminLoading />}>
                          <AdminOrders />
                        </Suspense>
                      } 
                    />

                  </Route>
                  <Route 
                    path="users" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminUsers />
                      </Suspense>
                    }
                  >
                    <Route path=":userId" element={<UserDetailsPage />} />
                  </Route>
                  <Route 
                    path="slider" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <SliderManagement />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="customer-segmentation" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <CustomerSegmentation />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="newsletter" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <NewsletterSubscribers />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="workshop" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminWorkshop />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="analytics" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminAnalytics />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="test" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <ImageUploadTest />
                      </Suspense>
                    } 
                  />

                  <Route 
                    path="popup" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminPopupManager />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="out-of-stock-waitlist" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminRoute><OutOfStockWaitlist /></AdminRoute>
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="coupons" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminRoute><CouponManagement /></AdminRoute>
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="showcase"
                  />
                  <Route 
                    path="profile" 
                    element={
                      <Suspense fallback={<AdminLoading />}>
                        <AdminProfile />
                      </Suspense>
                    } 
                  />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/test-upload" element={<ImageUploadTest />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </ProductProvider>
      </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
