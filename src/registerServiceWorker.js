/**
 * Service Worker Registration
 * 
 * This file handles the registration and updates of the service worker.
 * It's separated from the main bundle to ensure it runs early in the page load.
 */

// Configuration
const SW_PATH = '/sw.js';
const SW_SCOPE = '/';
const DEBUG = import.meta.env.DEV;

/**
 * Register the service worker
 */
function registerServiceWorker() {
  // Skip if not in a browser environment or if service workers aren't supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    if (DEBUG) {
      console.log('[Service Worker] Service workers are not supported in this browser');
    }
    return Promise.reject(new Error('Service workers not supported'));
  }

  // Skip if we're not in production and service worker is disabled in dev
  if (DEBUG && !import.meta.env.VITE_ENABLE_SW_IN_DEV) {
    if (DEBUG) {
      console.log('[Service Worker] Service worker is disabled in development mode');
    }
    return Promise.reject(new Error('Service worker disabled in development'));
  }

  return new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: SW_SCOPE,
        });

        if (DEBUG) {
          console.log('[Service Worker] Registration successful, scope is:', registration.scope);
        }

        // Check for updates immediately
        registration.update().catch(err => {
          if (DEBUG) {
            console.error('[Service Worker] Update check failed:', err);
          }
        });

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          if (DEBUG) {
            console.log('[Service Worker] New service worker found');
          }

          newWorker.addEventListener('statechange', () => {
            switch (newWorker.state) {
              case 'installed':
                if (navigator.serviceWorker.controller) {
                  // New update available
                  if (DEBUG) {
                    console.log('[Service Worker] New content is available; please refresh.');
                  }
                  // Notify the user or auto-update
                  notifyUpdateAvailable(registration);
                } else {
                  // First install
                  if (DEBUG) {
                    console.log('[Service Worker] Content is cached for offline use.');
                  }
                }
                break;
              case 'activated':
                if (DEBUG) {
                  console.log('[Service Worker] Service worker is activated');
                }
                break;
              case 'redundant':
                if (DEBUG) {
                  console.log('[Service Worker] Service worker is redundant');
                }
                break;
            }
          });
        });

        // Listen for controller change (page refresh after update)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (DEBUG) {
            console.log('[Service Worker] Controller changed');
          }
          window.location.reload();
        });

        resolve(registration);
      } catch (error) {
        console.error('[Service Worker] Registration failed:', error);
        reject(error);
      }
    });
  });
}

/**
 * Notify the user that an update is available
 * @param {ServiceWorkerRegistration} registration - The service worker registration
 */
function notifyUpdateAvailable(registration) {
  // You can replace this with a more sophisticated UI notification
  const shouldReload = window.confirm(
    'A new version of this app is available. Reload to update?'
  );
  
  if (shouldReload) {
    // Tell the service worker to skip waiting and activate the new worker
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Unregister the service worker
 */
function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister().then((success) => {
        if (success) {
          if (DEBUG) {
            console.log('[Service Worker] Unregistration successful');
          }
        }
      });
    });
  }
}

// Export the registration function
export { registerServiceWorker, unregisterServiceWorker };

// Auto-register in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerServiceWorker().catch(error => {
    console.error('Error during service worker registration:', error);
  });
}

// This allows the service worker to be registered from index.js if needed
export default registerServiceWorker;
