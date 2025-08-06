/**
 * Service Worker Configuration
 * 
 * This file contains configuration options for the service worker,
 * including cache names, strategies, and precache settings.
 */

// Cache version - update this to force cache invalidation
const CACHE_VERSION = 'v1.0.0';

// Cache names
const CACHE_NAMES = {
  // Core application shell - includes HTML, CSS, JS, and other critical assets
  APP_SHELL: `app-shell-${CACHE_VERSION}`,
  
  // Static assets like images, fonts, etc.
  ASSETS: `assets-${CACHE_VERSION}`,
  
  // API responses that don't change often
  API: `api-cache-${CACHE_VERSION}`,
  
  // Images and media files
  IMAGES: `images-${CACHE_VERSION}`,
  
  // Fonts
  FONTS: `fonts-${CACHE_VERSION}`,
};

// Files to cache on install (app shell)
const PRECACHE_ASSETS = [
  // HTML
  '/',
  '/index.html',
  '/offline.html',
  
  // Manifest and icons
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  
  // Core CSS and JS
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/static/css/main.chunk.css',
  
  // Fonts
  '/static/media/*.woff2',
  '/static/media/*.woff',
  '/static/media/*.ttf',
];

// File extensions to cache
const CACHEABLE_EXTENSIONS = [
  'html', 'css', 'js', 'json', 'xml',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif',
  'woff', 'woff2', 'ttf', 'eot',
  'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac',
  'wasm', 'pdf', 'txt', 'ico', 'webmanifest'
];

// API endpoints to cache
const CACHEABLE_API_ENDPOINTS = [
  '/api/products',
  '/api/categories',
  '/api/config',
];

// Cache strategies
const STRATEGIES = {
  // Cache First - for versioned files and assets that rarely change
  CACHE_FIRST: 'CACHE_FIRST',
  
  // Network First - for API calls where fresh data is important
  NETWORK_FIRST: 'NETWORK_FIRST',
  
  // Stale While Revalidate - for assets that can be slightly stale
  STALE_WHILE_REVALIDATE: 'STALE_WHILE_REVALIDATE',
  
  // Cache Only - for assets that never change
  CACHE_ONLY: 'CACHE_ONLY',
  
  // Network Only - for requests that should never be cached
  NETWORK_ONLY: 'NETWORK_ONLY',
};

// Route patterns and their caching strategies
const ROUTE_STRATEGIES = [
  // App shell - cache first
  {
    pattern: /\/(|index\.html)?$/,
    strategy: STRATEGIES.NETWORK_FIRST,
    cacheName: CACHE_NAMES.APP_SHELL,
  },
  
  // Static assets - cache first
  {
    pattern: /\.(?:js|css|json|xml|wasm|webmanifest)$/,
    strategy: STRATEGIES.CACHE_FIRST,
    cacheName: CACHE_NAMES.ASSETS,
  },
  
  // Images - stale while revalidate
  {
    pattern: /\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)$/,
    strategy: STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: CACHE_NAMES.IMAGES,
  },
  
  // Fonts - cache first with long expiration
  {
    pattern: /\.(?:woff|woff2|ttf|eot)$/,
    strategy: STRATEGIES.CACHE_FIRST,
    cacheName: CACHE_NAMES.FONTS,
  },
  
  // API endpoints - network first
  {
    pattern: new RegExp(`^(${CACHEABLE_API_ENDPOINTS.join('|')})`),
    strategy: STRATEGIES.NETWORK_FIRST,
    cacheName: CACHE_NAMES.API,
  },
];

// Offline fallback page
const OFFLINE_FALLBACK = '/offline.html';

// Background sync configuration
const BACKGROUND_SYNC = {
  enabled: true,
  queueName: 'bg-sync-queue',
  maxRetentionTime: 24 * 60, // 24 hours in minutes
};

// Cache expiration settings
const CACHE_EXPIRATION = {
  // Default cache expiration (in seconds)
  DEFAULT: 60 * 60 * 24 * 7, // 1 week
  
  // API cache expiration (in seconds)
  API: 60 * 5, // 5 minutes
  
  // Image cache expiration (in seconds)
  IMAGES: 60 * 60 * 24 * 30, // 30 days
  
  // Font cache expiration (in seconds)
  FONTS: 60 * 60 * 24 * 365, // 1 year
};

// Debug mode
const DEBUG = import.meta.env.DEV;

// Export configuration
export {
  CACHE_VERSION,
  CACHE_NAMES,
  PRECACHE_ASSETS,
  CACHEABLE_EXTENSIONS,
  CACHEABLE_API_ENDPOINTS,
  STRATEGIES,
  ROUTE_STRATEGIES,
  OFFLINE_FALLBACK,
  BACKGROUND_SYNC,
  CACHE_EXPIRATION,
  DEBUG,
};

export default {
  CACHE_VERSION,
  CACHE_NAMES,
  PRECACHE_ASSETS,
  CACHEABLE_EXTENSIONS,
  CACHEABLE_API_ENDPOINTS,
  STRATEGIES,
  ROUTE_STRATEGIES,
  OFFLINE_FALLBACK,
  BACKGROUND_SYNC,
  CACHE_EXPIRATION,
  DEBUG,
};
