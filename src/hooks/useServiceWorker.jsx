import { useState, useEffect } from 'react';

/**
 * Custom hook to handle service worker registration and updates
 * @returns {Object} - Service worker registration state and methods
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      return;
    }

    let registrationInstance = null;
    let updateFound = false;

    async function register() {
      try {
        registrationInstance = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          type: 'module',
        });

        setRegistration(registrationInstance);

        // Check for updates immediately
        if (registrationInstance.waiting) {
          setUpdateAvailable(true);
          return;
        }

        // Listen for the controlling service worker changing
        registrationInstance.addEventListener('updatefound', () => {
          const newWorker = registrationInstance.installing;
          
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            // When the new service worker is installed
            if (newWorker.state === 'installed') {
              // If there's a controller, then there's an update available
              if (navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              } else {
                console.log('Service Worker installed for the first time');
                setOfflineReady(true);
              }
            }
            
            // When the new service worker is activated
            if (newWorker.state === 'activated') {
              console.log('Service Worker activated');
              setOfflineReady(true);
              setUpdateAvailable(false);
            }
          });
        });

        // Ensure refresh is only called once
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            window.location.reload();
            refreshing = true;
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Register service worker
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      register();
    } else {
      window.addEventListener('load', register);
    }

    // Listen for messages from the service worker
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        setNeedRefresh(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      if (registrationInstance) {
        registrationInstance.removeEventListener('updatefound', () => {});
      }
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Skip waiting and update the service worker
   */
  const updateServiceWorker = () => {
    if (!registration || !registration.waiting) return;
    
    // Send a message to the service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Force the page to refresh after the new service worker takes control
    const refresh = () => window.location.reload();
    
    // Check if the new service worker is activated
    const checkForActivation = setInterval(() => {
      if (!registration.active) return;
      clearInterval(checkForActivation);
      refresh();
    }, 1000);
    
    // Fallback in case the above doesn't work
    setTimeout(refresh, 1000);
  };

  return {
    registration,
    updateAvailable,
    offlineReady,
    needRefresh,
    updateServiceWorker,
  };
}

/**
 * Component to handle service worker updates and offline status
 */
export function ServiceWorkerUpdater() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '320px',
    }}>
      <div style={{ fontWeight: 'bold' }}>Update Available</div>
      <div>A new version of the app is available. Would you like to update now?</div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={updateServiceWorker}
          style={{
            padding: '8px 16px',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Update Now
        </button>
      </div>
    </div>
  );
}

/**
 * Component to show offline status
 */
export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#f56565',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span>You are currently offline</span>
    </div>
  );
}
