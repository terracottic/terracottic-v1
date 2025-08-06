import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const [isLoading, setIsLoading] = useState(true);
  const loaderRef = useRef(null);
  const location = useLocation();
  const isMounted = useRef(true);

  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Safe style update helper
  const safeUpdateStyles = (element, styles) => {
    if (!element || !isMounted.current) return false;
    try {
      Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
      });
      return true;
    } catch (error) {
      console.error('Error updating styles:', error);
      return false;
    }
  };

  // Handle initial page load
  useEffect(() => {
    let timeoutId;
    let cleanupTimeoutId;

    const handleLoad = () => {
      if (!loaderRef.current) return;
      
      timeoutId = setTimeout(() => {
        if (safeUpdateStyles(loaderRef.current, {
          transition: 'opacity 0.4s ease',
          opacity: '0'
        })) {
          cleanupTimeoutId = setTimeout(() => {
            if (isMounted.current) {
              setIsLoading(false);
            }
          }, 400);
        }
      }, 300);
    };

    // If page is already loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(timeoutId);
      clearTimeout(cleanupTimeoutId);
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    if (!loaderRef.current) return;
    
    let timeoutId;
    let cleanupTimeoutId;
    
    const showLoader = () => {
      if (!loaderRef.current) return false;
      
      return safeUpdateStyles(loaderRef.current, {
        opacity: '1',
        display: 'flex',
        transition: 'none'
      });
    };
    
    const hideLoader = () => {
      if (!loaderRef.current) return;
      
      safeUpdateStyles(loaderRef.current, {
        transition: 'opacity 0.4s ease',
        opacity: '0'
      });
      
      cleanupTimeoutId = setTimeout(() => {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }, 400);
    };
    
    if (isMounted.current) {
      setIsLoading(true);
      
      if (showLoader()) {
        timeoutId = setTimeout(hideLoader, 100);
      }
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(cleanupTimeoutId);
    };
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div 
      id="loader" 
      ref={loaderRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fdf0da',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: 1,
        transition: 'opacity 0.4s ease'
      }}
    >
      <div className="loader-letters">
        <span>T</span>
        <span>e</span>
        <span>r</span>
        <span>r</span>
        <span>a</span>
        <span>c</span>
        <span>o</span>
        <span>t</span>
        <span>t</span>
        <span>i</span>
        <span>c</span>
      </div>
    </div>
  );
};

export default LoadingAnimation;
