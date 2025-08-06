import AuthDialog from '@/components/auth/AuthDialog';
import AnnouncementPopup from '@/components/home/AnnouncementPopup';
import MainSlider from '@/components/home/MainSlider';
import RecentlyViewedSection from '@/components/home/RecentlyViewedSection';
import UserAnnouncementPopup from '@/components/home/UserAnnouncementPopup';
import WorkshopSection from '@/components/home/WorkshopSection';
import QuickView from '@/components/products/QuickView';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getRecentlyViewed } from '@/utils/recentlyViewed';
import { keyframes } from '@emotion/react';
import {
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import StarIcon from '@mui/icons-material/Star';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Fab,
  Grid,
  IconButton,
  InputBase,
  Skeleton,
  Snackbar,
  Typography,
  useScrollTrigger,
  Zoom
} from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Animation keyframes
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`;

// Styled components
const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
  position: 'relative',
  overflow: 'visible',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
    zIndex: 0,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover:before': {
    opacity: 1,
  },
}));

const AnimatedBox = styled(Box)(({ theme }) => ({
  animation: `${floatAnimation} 6s ease-in-out infinite`,
}));

const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

// Sample categories data
const categories = [
  {
    name: 'Home Decor',
    image: 'https://i.ytimg.com/vi/nip0JVjmrxw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCof-Nu-b_3jDO0elMp4vVMVUtpYg',
    count: 42,
  },
  {
    name: 'Tiles',
    image: '/images/categories/pottery.jpg',
    count: 36,
  },
  {
    name: 'Jwellery',
    image: '/images/categories/sculptures.jpg',
    count: 28,
  },
];

// Sample product data (fallback in case Firestore is not available)
const sampleProducts = [
  {
    id: '1',
    name: 'Handcrafted Ceramic Vase',
    price: 2499,
    rating: 4.5,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1581655353749-d51488d9c739?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: true,
    category: 'Vases',
    description: 'Beautiful handcrafted ceramic vase perfect for home decor',
    colors: ['#8B4513', '#5D2906', '#D2B48C'],
    stock: 10,
    discount: 0,
    featured: true
  },
  {
    id: '2',
    name: 'Rustic Clay Pot Set',
    price: 3599,
    rating: 4.8,
    reviewCount: 256,
    image: 'https://images.unsplash.com/photo-1589984662646-e7f2ff17d58e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: true,
    category: 'Pots',
    description: 'Set of 3 rustic clay pots for your plants',
    colors: ['#8B4513', '#A0522D', '#CD853F'],
    stock: 15,
    discount: 10,
    featured: true
  },
  {
    id: '3',
    name: 'Terracotta Water Jug',
    price: 1799,
    rating: 4.6,
    reviewCount: 187,
    image: 'https://images.unsplash.com/photo-1605000796545-3a58d57c1d9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: false,
    category: 'Jugs',
    description: 'Traditional terracotta water jug for natural cooling',
    colors: ['#8B4513', '#5D2906'],
    stock: 8,
    discount: 5,
    featured: true
  },
  {
    id: '4',
    name: 'Hand-painted Bowl Set',
    price: 2899,
    rating: 4.7,
    reviewCount: 214,
    image: 'https://images.unsplash.com/photo-1589985449925-491d31a1f2c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: false,
    category: 'Tableware',
    description: 'Set of 4 hand-painted ceramic bowls',
    colors: ['#8B4513', '#D2691E', '#F4A460'],
    stock: 12,
    discount: 15,
    featured: true
  },
  {
    id: '5',
    name: 'Traditional Matka Set',
    price: 2199,
    rating: 4.9,
    reviewCount: 342,
    image: 'https://images.unsplash.com/photo-1605001011156-cbf07d10ed5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: true,
    isFavorite: false,
    category: 'Water Pots',
    description: 'Traditional clay matka set for water storage',
    colors: ['#8B4513', '#5D2906']
  },
  {
    id: 6,
    name: 'Blue Pottery Platter',
    price: 3299,
    rating: 4.8,
    reviewCount: 198,
    image: 'https://images.unsplash.com/photo-1589985437538-6f2f3dcc2f8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: true,
    isFavorite: false,
    category: 'Serving Ware',
    description: 'Hand-painted blue pottery platter',
    colors: ['#1E90FF', '#4682B4', '#87CEEB']
  },
  {
    id: 7,
    name: 'Hand-carved Diya Set',
    price: 1499,
    rating: 4.9,
    reviewCount: 312,
    image: 'https://images.unsplash.com/photo-1605000796545-3a58d57c1d9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: true,
    isFavorite: false,
    category: 'Religious',
    description: 'Set of 5 hand-carved clay diyas for puja and decoration',
    colors: ['#8B4513', '#5D2906', '#D2B48C']
  },
  {
    id: 8,
    name: 'Eco-friendly Coffee Mugs',
    price: 2199,
    rating: 4.7,
    reviewCount: 278,
    image: 'https://images.unsplash.com/photo-1605001011246-6ba4fdaa8e5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    isNew: true,
    isFavorite: false,
    category: 'Tableware',
    description: 'Set of 2 eco-friendly terracotta coffee mugs',
    colors: ['#8B4513', '#A0522D', '#CD853F']
  }
];


const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Jaipur, Rajasthan',
    content: 'The terracotta water matka I bought keeps water naturally cool in our hot summers. It\'s beautiful and functional - a perfect addition to our home!',
    avatar: 'PS',
  },
  {
    name: 'Rahul Mehta',
    location: 'Kolkata, West Bengal',
    content: 'The hand-painted terracotta diyas we ordered for Diwali were a huge hit! The intricate designs and natural finish made our celebrations extra special.',
    avatar: 'RM',
  },
  {
    name: 'Ayesha Khan',
    location: 'Hyderabad, Telangana',
    content: 'The terracotta planters are perfect for my herb garden. They provide excellent aeration to the roots and look absolutely stunning on my balcony.',
    avatar: 'AK',
  },
  {
    name: 'Vikram Patel',
    location: 'Ahmedabad, Gujarat',
    content: 'The terracotta cookware has transformed our cooking! The food tastes so much better, and it\'s amazing how evenly it cooks everything.',
    avatar: 'VP',
  },
  {
    name: 'Meenakshi Iyer',
    location: 'Chennai, Tamil Nadu',
    content: 'The terracotta water filter was exactly what we needed. The water tastes pure and fresh, just like my grandmother used to make it!',
    avatar: 'MI',
  },
  {
    name: 'Arjun Kapoor',
    location: 'Mumbai, Maharashtra',
    content: 'The terracotta dinner set is a showstopper! Every meal feels special with these beautiful, handcrafted plates and bowls.',
    avatar: 'AK',
  },
  {
    name: 'Neha Gupta',
    location: 'Delhi',
    content: 'I bought the terracotta wall hangings for my living room, and they add such a warm, earthy vibe to the space. Everyone asks where I got them!',
    avatar: 'NG',
  },
  {
    name: 'Rajesh Nair',
    location: 'Kochi, Kerala',
    content: 'The terracotta tea set is my morning companion. The tea stays warm longer and tastes better in these cups. Highly recommended!',
    avatar: 'RN',
  },
  {
    name: 'Sunita Reddy',
    location: 'Bangalore, Karnataka',
    content: 'The terracotta garden pots are not just beautiful but also eco-friendly. My plants have never been happier!',
    avatar: 'SR',
  },
  {
    name: 'Amit Joshi',
    location: 'Pune, Maharashtra',
    content: 'The terracotta serving bowls are perfect for parties. They keep food at the right temperature and look stunning on the table.',
    avatar: 'AJ',
  },
];

function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };
  
  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

const HomePage = () => {
  // Get auth state - single source of truth
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State for popups
  const [guestPopupData, setGuestPopupData] = useState(null);
  const [userPopupData, setUserPopupData] = useState(null);
  const [popupLoading, setPopupLoading] = useState(true);
  const [showGuestAnnouncement, setShowGuestAnnouncement] = useState(false);
  const [showUserAnnouncement, setShowUserAnnouncement] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // Track if popup was dismissed in this page load
  const [isPopupDismissed, setIsPopupDismissed] = useState(false);
  
  // Track if this is the first render after page load
  const isInitialMount = useRef(true);

  // Debug state changes - only in developmentloca
  const prevState = useRef({
    showGuestAnnouncement,
    showUserAnnouncement,
    guestPopupData: !!guestPopupData,
    userPopupData: !!userPopupData,
    popupLoading,
    currentUser: !!currentUser,
    isAuthInitialized,
    authLoading
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      const currentState = {
        showGuestAnnouncement,
        showUserAnnouncement,
        guestPopupData: !!guestPopupData,
        userPopupData: !!userPopupData,
        popupLoading,
        currentUser: !!currentUser,
        isAuthInitialized,
        authLoading
      };

      if (JSON.stringify(prevState.current) !== JSON.stringify(currentState)) {
        // console.log('Popup state changed:', currentState);
        prevState.current = currentState;
      }
    }
  }, [showGuestAnnouncement, showUserAnnouncement, guestPopupData, userPopupData, popupLoading, currentUser, isAuthInitialized, authLoading]);

  // Show popup on initial page load/refresh only
  useEffect(() => {
    if (authLoading || !currentUser) return;

    // Only run on the very first render after page load
    if (isInitialMount.current && window.location.pathname === '/') {
      // Check if popup is active before showing
      if (userPopupData?.isActive === true) {
        console.log('Initial homepage load/refresh, showing popup');
        setShowUserAnnouncement(true);
        setIsPopupDismissed(false);
      } else {
        console.log('User popup is not active, not showing');
        setShowUserAnnouncement(false);
      }
      isInitialMount.current = false;
    }
  }, [currentUser, authLoading, userPopupData]);

  // Reset isInitialMount when user logs out
  useEffect(() => {
    if (!currentUser) {
      isInitialMount.current = true;
    }
  }, [currentUser]);

  // Set auth initialized state after initial load
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth initialized, current user:', currentUser?.uid || 'none');
      setIsAuthInitialized(true);
    }
  }, [authLoading, currentUser]);

  // State for Handcrafted section
  const [sectionData, setSectionData] = useState({
    title: 'Handcrafted with Love',
    description: 'Discover our unique collection of handcrafted pottery, each piece telling its own story through traditional craftsmanship.'
  });
  const [sectionLoading, setSectionLoading] = useState(true);
  
  // State for Recently Viewed products
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Track if popup has been shown in this session
  const popupShownRef = useRef(false);
  
  // Load recently viewed products on component mount and when the component becomes visible again
  useEffect(() => {
    const loadRecentlyViewed = () => {
      const viewedProducts = getRecentlyViewed();
      setRecentlyViewed(viewedProducts);
    };
    
    // Load immediately
    loadRecentlyViewed();
    
    // Also load when the page becomes visible again (when user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadRecentlyViewed();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check if popup should be shown (for non-logged-in users)
  const shouldShowPopup = useCallback(() => {
    // Don't show if still loading
    if (popupLoading) return false;
    
    // For logged-in users, we handle popups differently
    if (currentUser) return false;
    
    // Check if guest popup is active
    if (guestPopupData?.isActive !== true) {
      console.log('Guest popup is inactive or undefined, not showing');
      return false;
    }

    // Check if popup was explicitly dismissed
    const dismissed = localStorage.getItem('popupDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // If less than 24 hours have passed since dismissal, don't show
      if (now - dismissedTime < oneDay) {
        console.log('Popup was dismissed recently, not showing again yet');
        return false;
      } else {
        // More than 24 hours have passed, clear the dismissed flag
        localStorage.removeItem('popupDismissed');
      }
    }

    return true; // Show popup if not dismissed and active
  }, [popupLoading, currentUser, guestPopupData]);

  // Subscribe to guest popup data updates
  useEffect(() => {
    let unsubscribeGuest;

    const setupGuestPopupListener = async () => {
      try {
        const docRef = doc(db, 'popups', 'guestAnnouncement');

        // Initial fetch
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGuestPopupData(data);

          // Only show guest popup if user is not logged in and popup is active
          if (!currentUser && data.isActive && shouldShowPopup()) {
            console.log('Showing guest popup for non-logged in user');
            setShowGuestAnnouncement(true);
            localStorage.setItem('announcementLastShown', Date.now().toString());
          }
        } else {
          console.log('No guest popup data found in Firestore');
        }

        // Set up real-time listener for updates
        unsubscribeGuest = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setGuestPopupData(data);

            // Only show guest popup if user is not logged in and popup is active
            if (!currentUser && data.isActive && !showGuestAnnouncement && shouldShowPopup()) {
              console.log('Showing guest popup from real-time update');
              setShowGuestAnnouncement(true);
              localStorage.setItem('announcementLastShown', Date.now().toString());
            }
          }
        });
      } catch (error) {
        console.error('Error setting up guest popup listener:', error);
      } finally {
        setPopupLoading(false);
      }
    };

    // Add a small delay to ensure the page loads before showing the popup
    const timer = setTimeout(() => {
      setupGuestPopupListener();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (unsubscribeGuest) {
        unsubscribeGuest();
      }
    };
  }, [shouldShowPopup, currentUser]);

  // Default user popup data
  // const defaultUserPopup = {
  //   title: 'Welcome Back!',
  //   message: 'Thank you for being a valued customer!',
  //   description: 'Check out our latest offers and collections.',
  //   buttonText: 'Shop Now',
  //   buttonLink: '/shop',
  //   secondaryButtonText: 'Dismiss',
  //   buttonLink2: '',
  //   badge: 'Exclusive',
  //   isActive: true,
  //   imageUrl: ''
  // };

  // Subscribe to user popup data updates
  useEffect(() => {
    console.log('User state changed:', {
      user: currentUser ? 'Logged in' : 'Not logged in',
      showUserAnnouncement,
      userPopupData: {
        ...userPopupData,
        isActive: userPopupData?.isActive
      }
    });

    let unsubscribeUser;

    const setupUserPopupListener = async () => {
      try {
        const docRef = doc(db, 'popups', 'userAnnouncement');

        // Initial fetch
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('User popup data from Firestore:', data);
          setUserPopupData(data);

          // Check if we should show the popup
          const shouldShow = currentUser && data.isActive && shouldShowPopup();
          console.log('Should show user popup?', {
            user: !!currentUser,
            isActive: data.isActive,
            shouldShowPopup: shouldShowPopup(),
            result: shouldShow
          });

          if (shouldShow) {
            console.log('Showing user popup from Firestore data');
            setShowUserAnnouncement(true);
            localStorage.setItem('userAnnouncementLastShown', Date.now().toString());
          }
        } else {
          // If no document exists, use default data
          console.log('No user popup data in Firestore, using default');

          // Use default values without writing to Firestore
          setUserPopupData(defaultUserPopup);

          // Always show popup for logged-in users with default data (respecting cooldown)
          if (currentUser && defaultUserPopup.isActive && shouldShowPopup()) {
            console.log('Showing default user popup for user:', currentUser.uid);
            setShowUserAnnouncement(true);
            localStorage.setItem('userAnnouncementLastShown', Date.now().toString());
          }
        }

        // Set up real-time listener for updates
        unsubscribeUser = onSnapshot(docRef, (doc) => {
          console.log('User popup snapshot received:', { exists: doc.exists(), data: doc.data() });
          if (doc.exists()) {
            const data = doc.data();
            console.log('Setting user popup data:', data);
            setUserPopupData(data);

            // Only show user popup if user is logged in and popup is active
            if (currentUser && data.isActive && !showUserAnnouncement && shouldShowPopup()) {
              console.log('Showing user popup for user:', currentUser.uid);
              setShowUserAnnouncement(true);
              localStorage.setItem('userAnnouncementLastShown', Date.now().toString());
            }
          }
        });

      } catch (error) {
        console.error('Error setting up user popup listener:', error);
      } finally {
        setPopupLoading(false);
      }
    };

    // Only set up user popup listener if user is logged in
    if (currentUser) {
      const timer = setTimeout(() => {
        setupUserPopupListener();
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (unsubscribeUser) {
          unsubscribeUser();
        }
      };
    }

    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, [shouldShowPopup, currentUser]);

  // Subscribe to Handcrafted section data updates
  useEffect(() => {
    let unsubscribe;

    const fetchSectionData = async () => {
      try {
        const docRef = doc(db, 'homepageSections', 'handcraftedSection');

        // Initial fetch
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSectionData(docSnap.data());
        }

        // Set up real-time listener
        const q = query(docRef);
        const unsub = onSnapshot(q, (doc) => {
          if (doc.exists()) {
            setSectionData(doc.data());
          }
        });

        // Store the unsubscribe function
        unsubscribe = unsub;
      } catch (error) {
        console.error('Error setting up section data listener:', error);
      } finally {
        setSectionLoading(false);
      }
    };

    fetchSectionData();

    // Cleanup function to unsubscribe from the listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState(sampleProducts);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Helper function to get images from product
  const getProductImages = (product) => {
    // Function to extract URL from image object or return as is if it's a string
    const getImageUrl = (image) => {
      if (!image) return null;

      // If it's a string, return it directly
      if (typeof image === 'string') return image;

      // If it's an object, try to get URL from common properties
      if (typeof image === 'object') {
        return image.url || image.src || image.path || image.link || null;
      }

      return null;
    };

    const result = {
      primary: null,
      secondary: null
    };

    // Check for images array first
    if (product.images && Array.isArray(product.images)) {
      if (product.images.length > 0) {
        result.primary = getImageUrl(product.images[0]);
      }
      if (product.images.length > 1) {
        result.secondary = getImageUrl(product.images[1]);
      }
      return result;
    }

    // Check for common image field names
    const possibleImageFields = ['image', 'imageUrl', 'img', 'photo', 'picture', 'mainImage'];
    for (const field of possibleImageFields) {
      if (product[field]) {
        const imageValue = product[field];
        // If it's an array, get the first item
        if (Array.isArray(imageValue)) {
          if (imageValue.length > 0) result.primary = getImageUrl(imageValue[0]);
          if (imageValue.length > 1) result.secondary = getImageUrl(imageValue[1]);
        } else {
          result.primary = getImageUrl(imageValue);
        }
        break;
      }
    }

    return result;
  };

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch featured products
    const fetchFeaturedProducts = async () => {
      try {
        const q = query(collection(db, 'products'), where('featured', '==', true));
        const querySnapshot = await getDocs(q);
        const featured = [];

        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const productData = {
            id: doc.id,
            ...data
          };

          // Get the image URLs
          const { primary: primaryImage, secondary: secondaryImage } = getProductImages(data);

          // Add the product to the featured list
          featured.push({
            ...productData,
            primaryImage,
            secondaryImage
          });
        }

        console.log('All featured products:', featured);
        setFeaturedProducts(featured);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchProducts();
    fetchFeaturedProducts();
  }, []); // Added missing dependency array
  // Testimonials state
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3); // Number of testimonials to show at once
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState(0);

  // Track if auth state is ready
  const [authInitialized, setAuthInitialized] = useState(false);

  // Set auth initialized state after initial load
  useEffect(() => {
    if (!authLoading) {
      console.log('Auth initialized, current user:', currentUser?.uid || 'none');
      setAuthInitialized(true);
    }
  }, [authLoading, currentUser]);

  // Debug log user state
  useEffect(() => {
    console.log('Current user in HomePage:', currentUser ? 'User logged in' : 'No user');
  }, [currentUser]);

  // Debug popup visibility
  useEffect(() => {
    // console.log('Popup visibility state:', {
    //   showUserAnnouncement,
    //   hasUserPopupData: !!userPopupData,
    //   hasUser: !!currentUser,
    //   userPopupDataExists: userPopupData && Object.keys(userPopupData).length > 0,
    //   shouldShowPopup: shouldShowPopup(),
    //   currentTime: new Date().toISOString(),
    //   lastShown: localStorage.getItem('userAnnouncementLastShown')
    // });

    // Ensure popup shows for logged-in users with valid data
    const shouldShow = currentUser && userPopupData?.isActive && shouldShowPopup() && !showUserAnnouncement;
    // console.log('Should show user popup?', {
    //   currentUser: !!currentUser,
    //   hasUserPopupData: !!userPopupData,
    //   isActive: userPopupData?.isActive,
    //   shouldShowBasedOnTime: shouldShowPopup(),
    //   notAlreadyShowing: !showUserAnnouncement,
    //   finalDecision: shouldShow
    // });

    if (shouldShow) {
      // console.log('Forcing user popup to show for user:', currentUser.uid);
      setShowUserAnnouncement(true);
      localStorage.setItem('userAnnouncementLastShown', Date.now().toString());
    }
  }, [showUserAnnouncement, userPopupData, currentUser, shouldShowPopup]);

  // Handle touch events for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      setActiveTestimonial(prev =>
        prev === Math.ceil(testimonials.length / visibleCount) - 1 ? 0 : prev + 1
      );
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      setActiveTestimonial(prev =>
        prev === 0 ? Math.ceil(testimonials.length / visibleCount) - 1 : prev - 1
      );
    }
  };

  // Adjust visible count based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setVisibleCount(1);
      } else if (window.innerWidth < 960) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-advance testimonials
  useEffect(() => {
    let timer;
    const startTimer = () => {
      timer = setInterval(() => {
        setActiveTestimonial(prev => (prev + 1) % Math.ceil(testimonials.length / visibleCount));
      }, 4000);
    };

    startTimer();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testimonials.length, visibleCount]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();

    // Check if user is logged in
    if (!currentUser) {
      setAuthDialogTab(0); // Show login tab first
      setShowAuthDialog(true);
      return;
    }

    // Add to cart logic here
    console.log('Add to cart:', product);
  };

  // Show announcement popup on initial load or when user logs in
  useEffect(() => {
    const checkAnnouncement = async () => {
      try {
        const popupRef = doc(db, 'homepageSections', 'announcementPopup');
        const popupSnap = await getDoc(popupRef);

        if (popupSnap.exists() && popupSnap.data().isActive) {
          // Check if user has seen the popup recently (in the last 24 hours)
          const lastSeen = localStorage.getItem('announcementLastSeen');
          const oneDayInMs = 24 * 60 * 60 * 1000;

          if (!lastSeen || (Date.now() - parseInt(lastSeen, 10)) > oneDayInMs) {
            // Small delay for better UX
            const timer = setTimeout(() => {
              if (currentUser) {
                setShowUserAnnouncement(true);
              } else {
                setShowGuestAnnouncement(true);
              }
              // Update last seen time
              localStorage.setItem('announcementLastSeen', Date.now().toString());
            }, 2000);

            return () => clearTimeout(timer);
          }
        }
      } catch (error) {
        console.error('Error checking announcement:', error);
      }
    };

    // Check for announcement on initial load
    checkAnnouncement();

    // Also check when the page becomes visible again (if user switches tabs and comes back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAnnouncement();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]); // Re-run when user logs in/out

  // Handle popup close
  return (
    <Box>
      {/* Main Slider */}
      <Box sx={{ width: '100%', position: 'relative' }}>
        <MainSlider />
      </Box>

      {/* Featured Products Section */}
      <Container
        component="section"
        maxWidth="xl"
        sx={{
          py: { xs: 6, md: 8 },
          position: 'relative',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Box sx={{ 
          textAlign: 'center', 
          mb: { xs: 4, md: 6 },
          maxWidth: 800,
          mx: 'auto',
          px: { xs: 2, sm: 0 }
        }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              mb: 2,
              lineHeight: 1.2,
              color: 'text.primary',
              position: 'relative',
              display: 'inline-block',
              '&:after': {
                content: '""',
                position: 'absolute',
                width: '80px',
                height: '4px',
                background: 'linear-gradient(90deg, #8B4513, #A0522D)',
                bottom: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '4px'
              }
            }}
          >
            Featured Products
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              lineHeight: 1.6,
              maxWidth: '700px',
              mx: 'auto',
              color: 'text.secondary',
              mt: 2
            }}
          >
            Discover our handpicked collection of premium pottery pieces, each crafted with traditional techniques and modern aesthetics
          </Typography>
        </Box>

        <Grid 
          container 
          spacing={{ xs: 2, sm: 3, lg: 4 }}
          sx={{
            justifyContent: { xs: 'center', lg: 'flex-start' },
            mt: 2,
            mx: { lg: '-8px' },
            '& .MuiGrid-item': {
              display: 'flex',
              justifyContent: 'center',
              '& > *': {
                width: '100%',
                maxWidth: { xs: 320, lg: 'none' },
              }
            }
          }}>
          {featuredLoading ? (
            // Show loading skeletons while fetching featured products
            Array.from(new Array(4)).map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={`skeleton-${index}`}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                  },
                  '@media (min-width: 1024px)': {
                    maxWidth: 'calc(100% - 16px)',
                    margin: '0 8px'
                  }
                }}>
                  <Skeleton variant="rectangular" height={240} animation="wave" />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Skeleton width="60%" height={24} style={{ marginBottom: 10 }} />
                    <Skeleton width="40%" height={20} style={{ marginBottom: 10 }} />
                    <Skeleton width="30%" height={20} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  onMouseEnter={() => {
                    // Set a timer to show quick view after 2 seconds
                    const timer = setTimeout(() => {
                      setQuickViewProduct(product);
                    }, 2000);

                    // Store the timer ID in a data attribute to clear it if needed
                    const card = document.getElementById(`product-card-${product.id}`);
                    if (card) {
                      card.dataset.hoverTimer = timer;
                    }
                  }}
                  onMouseLeave={() => {
                    // Clear the hover timer if mouse leaves before 2 seconds
                    const card = document.getElementById(`product-card-${product.id}`);
                    if (card && card.dataset.hoverTimer) {
                      clearTimeout(parseInt(card.dataset.hoverTimer));
                    }
                  }}
                  id={`product-card-${product.id}`}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                      cursor: 'pointer',
                    },
                  }}
                >
                  <Box
                    className="quick-view-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickViewProduct(product);
                    }}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, 20px)',
                      opacity: 0,
                      transition: 'all 0.3s ease',
                      zIndex: 2,
                      '&:hover': {
                        transform: 'translate(-50%, 15px)',
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        borderRadius: 20,
                        px: 3,
                        py: 1,
                        boxShadow: 3,
                        '&:hover': {
                          boxShadow: 6,
                        },
                      }}
                    >
                      Quick View
                    </Button>
                  </Box>
                  <Box
                    component="div"
                    sx={{
                      position: 'relative',
                      pt: '100%',
                      bgcolor: 'grey.100',
                      overflow: 'hidden',
                      '&:hover .product-image-primary': {
                        transform: 'scale(1.05) translateY(-5px)',
                        opacity: 0,
                      },
                      '&:hover .product-image-secondary': {
                        opacity: 1,
                        transform: 'scale(1.05) translateY(-5px)',
                      },
                      '&:hover .product-actions': {
                        transform: 'translateY(0)',
                        opacity: 1,
                      }
                    }}>
                    {(() => {
                      try {
                        const { primaryImage, secondaryImage } = product;
                        const hasSecondaryImage = !!secondaryImage;

                        if (!primaryImage) {
                          console.log('No primary image found for product:', product.id, 'Product data:', product);
                          return (
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'grey.100',
                              color: 'grey.500',
                              fontSize: '0.875rem',
                              textAlign: 'center',
                              p: 2
                            }}>
                              No image available
                            </Box>
                          );
                        }

                        // Format the image URL
                        const formatImageUrl = (url) => {
                          if (!url) return '';
                          let safeUrl = String(url);
                          if (typeof url === 'object') {
                            safeUrl = url.url || url.src || url.path || '';
                          }
                          return safeUrl.startsWith('http') ? safeUrl :
                            `http://localhost:3000/${safeUrl.replace(/^\/+/, '')}`;
                        };

                        const primaryUrl = formatImageUrl(primaryImage);
                        const secondaryUrl = formatImageUrl(secondaryImage);

                        return (
                          <>
                            {/* Product Image */}
                            <Box
                              className="product-image-primary"
                              component="img"
                              src={primaryUrl}
                              alt={product.name || 'Product image'}
                              onError={(e) => {
                                console.error('Error loading primary image for product:', product.id, 'URL:', primaryUrl);
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log('Primary image loaded for product:', product.id, 'URL:', primaryUrl)}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                backgroundColor: 'grey.100',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                willChange: 'transform, opacity',
                                backfaceVisibility: 'hidden',
                              }}
                            />

                            {/* Secondary Image (shown on hover) */}
                            {hasSecondaryImage && (
                              <Box
                                className="product-image-secondary"
                                component="img"
                                src={secondaryUrl}
                                alt={`${product.name || 'Product'} - Alternate view`}
                                onError={(e) => {
                                  console.error('Error loading secondary image for product:', product.id, 'URL:', secondaryUrl);
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                }}
                                onLoad={() => console.log('Secondary image loaded for product:', product.id, 'URL:', secondaryUrl)}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  backgroundColor: 'grey.100',
                                  opacity: 0,
                                  transform: 'scale(1)',
                                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                  willChange: 'transform, opacity',
                                  backfaceVisibility: 'hidden',
                                }}
                              />
                            )}
                          </>
                        );
                      } catch (error) {
                        console.error('Error rendering product image:', error);
                        return (
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            p: 2
                          }}>
                            Error loading image
                          </Box>
                        );
                      }
                    })()}
                    {product.isNew && (
                      <Chip
                        label="New"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)', px: 1, py: 0.5, borderRadius: 1 }}>
                        <Typography variant="body2" color="success.dark" sx={{ fontWeight: 600, mr: 0.5 }}>
                          {product.rating ? Number(product.rating).toFixed(1) : '0.0'}
                        </Typography>
                        <StarIcon sx={{ color: 'warning.main', fontSize: '1rem' }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        • {product.reviewCount ? `${product.reviewCount.toLocaleString()} ${product.reviewCount === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}
                      </Typography>
                    </Box>
                    {product.stock < 10 && product.stock > 0 && (
                      <Box sx={{
                        display: 'inline-block',
                        bgcolor: 'warning.light',
                        color: 'warning.contrastText',
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        mb: 1,
                        width: 'fit-content'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          Only {product.stock} left in stock!
                        </Typography>
                      </Box>
                    )}
                    {product.stock === 0 && (
                      <Box sx={{
                        display: 'inline-block',
                        bgcolor: 'error.light',
                        color: 'error.contrastText',
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        mb: 1,
                        width: 'fit-content'
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          Out of Stock
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 'auto',
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '2.8em',
                        lineHeight: 1.4
                      }}
                    >
                      {product.description}
                    </Typography>
                    <Box sx={{
                      mt: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      {product.discount > 0 ? (
                        <>
                          <Typography
                            variant="h5"
                            color="primary"
                            sx={{
                              fontWeight: 800,
                              fontSize: '1.5rem',
                              lineHeight: 1.2,
                              mr: 1
                            }}
                          >
                            {formatPrice(product.price * (1 - (product.discount / 100)))}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              textDecoration: 'line-through',
                              opacity: 0.8,
                              mr: 1
                            }}
                          >
                            {formatPrice(product.price)}
                          </Typography>
                          <Chip
                            label={`${product.discount}% OFF`}
                            size="small"
                            color="error"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 'bold'
                            }}
                          />
                        </>
                      ) : (
                        <Typography
                          variant="h6"
                          color="primary"
                          sx={{
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            lineHeight: 1.2
                          }}
                        >
                          {formatPrice(product.price)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary">
                  No featured products available. Please check back later.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
              borderRadius: '50px',
              textTransform: 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
              transition: 'all 0.3s ease',
            }}
            component={RouterLink}
            to="/products"
          >
            View All Products
          </Button>
        </Box>
      </Container>

      

      {/* Categories Section */}
      <WorkshopSection />

      {/* Recently Viewed Section */}
      <RecentlyViewedSection onQuickView={setQuickViewProduct} />
      {/* Handcrafted Section */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 3,
                  '& img': {
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'transform 0.5s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  },
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80"
                  alt="Handcrafted Pottery"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
                Handcrafted with Love
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3, color: 'text.secondary' }}>
                Each piece in our collection is meticulously handcrafted by skilled artisans who have perfected their craft over generations.
                We take pride in creating unique, high-quality pottery that brings beauty and functionality to your everyday life.
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4, color: 'text.secondary' }}>
                Our commitment to sustainability means we use eco-friendly materials and processes, ensuring that our pottery is not only
                beautiful but also kind to the planet.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                component={RouterLink}
                to="/about"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: '50px',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                  transition: 'all 0.3s ease',
                  mt: 2
                }}
              >
                Learn More About Us
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Newsletter Section */}
      <Box sx={{
        py: 8,
        background: 'linear-gradient(135deg, #f5f5dc 0%, #f0e6d2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(#d2b48c33 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.3,
        }
      }}>
        <Container maxWidth="md">
          <Box sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: '700px',
            mx: 'auto',
            p: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)'
          }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(90deg, #8B5A2B 0%, #D2B48C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              Subscribe to Our Newsletter
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'text.secondary',
                mb: 4,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Stay updated with our latest products, exclusive offers, and artisanal stories. Join our community of pottery lovers today!
            </Typography>

            <Box
              component="form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = form.email.value.trim();
                const submitButton = form.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;

                try {
                  // Disable button and show loading state
                  submitButton.disabled = true;
                  submitButton.textContent = 'Subscribing...';

                  const result = await subscribeToNewsletter(email);

                  // Show success message
                  alert(result.message || 'Thank you for subscribing!');
                  form.reset();
                } catch (error) {
                  // Show error message
                  alert(error.message || 'Failed to subscribe. Please try again.');
                  console.error('Subscription error:', error);
                } finally {
                  // Re-enable button
                  if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                  }
                }
              }}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                maxWidth: '600px',
                mx: 'auto',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#d2b48c',
                  },
                  '&:hover fieldset': {
                    borderColor: '#8B5A2B',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8B5A2B',
                  },
                },
              }}
              noValidate
              autoComplete="off"
            >
              <InputBase
                name="email"
                type="email"
                required
                placeholder="Enter your email address"
                sx={{
                  flex: 1,
                  bgcolor: 'background.paper',
                  px: 3,
                  py: 1.5,
                  borderRadius: '50px',
                  border: '1px solid #d2b48c',
                  '&:focus': {
                    borderColor: '#8B5A2B',
                    outline: 'none',
                  },
                  '&::placeholder': {
                    color: '#999',
                    opacity: 1,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(90deg, #8B5A2B 0%, #D2B48C 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #6D3C1D 0%, #B3896B 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(139, 90, 43, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                Subscribe Now
              </Button>
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 2,
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}
            >
              We respect your privacy. Unsubscribe at any time.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Scroll to Top Button */}
      <ScrollTop>
        <Fab color="primary" size="medium" aria-label="scroll back to top" sx={{ bgcolor: '#8B5A2B', '&:hover': { bgcolor: '#6D3C1D' } }}>
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>

      {/* Guest Announcement Popup - shown to non-logged-in users */}
      <AnnouncementPopup
        open={showGuestAnnouncement}
        onClose={() => setShowGuestAnnouncement(false)}
        popupData={guestPopupData}
      />

      {/* User Announcement Popup - shown only on initial page load/refresh */}
      <UserAnnouncementPopup
        open={showUserAnnouncement && !isPopupDismissed}
        onClose={() => {
          // Close the popup and prevent it from showing again
          setShowUserAnnouncement(false);
          setIsPopupDismissed(true);
        }}
        popupData={userPopupData}
      />

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        initialTab={authDialogTab}
      />

      {/* Quick View Dialog */}
      <QuickView
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        product={quickViewProduct}
      />
    </Box>
  );
};

export default HomePage;
