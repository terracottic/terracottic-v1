// Service Worker for Terracottic - Advanced Caching and Offline Support

// Import configuration
importScripts('/config/service-worker-config.js');

// Use the config from the imported file
const {
  CACHE_NAMES,
  PRECACHE_ASSETS,
  STRATEGIES,
  ROUTE_STRATEGIES,
  OFFLINE_FALLBACK,
  BACKGROUND_SYNC,
  CACHE_EXPIRATION,
  DEBUG
} = self.__WB_MANIFEST || {};

// Enable debug logging
const log = (...args) => {
  if (DEBUG) {
    console.log('[Service Worker]', ...args);
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  log('Installing service worker');
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  // Pre-cache critical assets
  event.waitUntil(
    caches.open(CACHE_NAMES.APP_SHELL)
      .then(cache => {
        log('Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        log('App shell cached');
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  log('Activating service worker');
  
  // Claim control of all clients immediately
  event.waitUntil(
    clients.claim().then(() => {
      log('Service Worker activated and controlling all clients');
    })
  );
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that aren't in our current CACHE_NAMES
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean)
      );
    })
  );
});

// Helper function to get the caching strategy for a request
function getStrategyForRequest(request) {
  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate';
  const isApiRequest = url.pathname.startsWith('/api/');
  
  // Find the first matching route strategy
  const routeStrategy = ROUTE_STRATEGIES.find(({ pattern }) => {
    return pattern.test(url.pathname);
  });
  
  // Default strategy
  const defaultStrategy = isApiRequest ? STRATEGIES.NETWORK_FIRST : STRATEGIES.STALE_WHILE_REVALIDATE;
  
  return {
    strategy: routeStrategy?.strategy || defaultStrategy,
    cacheName: routeStrategy?.cacheName || CACHE_NAMES.ASSETS,
  };
}

// Helper function for cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    log('Serving from cache:', request.url);
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache the response
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    log('Caching new resource:', request.url);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Helper function for network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache the successful response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try to serve from cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      log('Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    
    // If nothing in cache, return the error
    throw error;
  }
}

// Helper function for stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    // Cache the successful response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Try to serve from cache immediately
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Return cached response if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension URLs
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const { strategy, cacheName } = getStrategyForRequest(event.request);
  const url = new URL(event.request.url);
  
  // Handle navigation requests with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirst(event.request, cacheName)
        .catch(() => caches.match(OFFLINE_FALLBACK))
    );
    return;
  }
  
  // Handle different caching strategies
  switch (strategy) {
    case STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(event.request, cacheName));
      break;
      
    case STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(event.request, cacheName));
      break;
      
    case STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event.request, cacheName));
      break;
      
    case STRATEGIES.CACHE_ONLY:
      event.respondWith(caches.match(event.request));
      break;
      
    case STRATEGIES.NETWORK_ONLY:
    default:
      event.respondWith(fetch(event.request));
  }
});

// Background sync for failed requests
if (BACKGROUND_SYNC.enabled && 'sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === BACKGROUND_SYNC.queueName) {
      log('Background sync triggered');
      // Handle background sync
    }
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || 'New notification';
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Handle the notification click
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Otherwise, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
    );
});
