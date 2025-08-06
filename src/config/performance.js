/**
 * Performance Configuration
 * 
 * This file contains performance-related configuration options and feature flags
 * that can be toggled to enable/disable various performance optimizations.
 */

// Enable/disable development-only performance monitoring
const ENABLE_DEV_MONITOR = import.meta.env.DEV;

// Enable/disable production performance monitoring (e.g., for collecting metrics)
const ENABLE_PROD_MONITOR = import.meta.env.PROD;

// Enable/disable service worker in development
const ENABLE_SW_IN_DEV = false;

// Performance budgets (in milliseconds or KB)
const BUDGETS = {
  // Core Web Vitals thresholds
  LCP: 2500,      // Largest Contentful Paint (ms)
  FID: 100,       // First Input Delay (ms)
  CLS: 0.1,       // Cumulative Layout Shift (score)
  TBT: 300,       // Total Blocking Time (ms)
  TTI: 3800,      // Time to Interactive (ms)
  
  // Bundle size budgets (KB)
  JS_BUDGET: 200, // Max recommended JS bundle size
  CSS_BUDGET: 50, // Max recommended CSS bundle size
  IMG_BUDGET: 500 // Max recommended image size (KB)
};

// Feature flags for performance optimizations
const FEATURES = {
  // Image optimizations
  IMAGE_OPTIMIZATION: true,
  LAZY_LOAD_IMAGES: true,
  USE_WEBP: true,
  USE_AVIF: true,
  
  // Code splitting
  DYNAMIC_IMPORTS: true,
  ROUTE_BASED_SPLITTING: true,
  
  // Caching
  CACHE_ASSETS: true,
  CACHE_API_RESPONSES: true,
  
  // Prefetching
  PREFETCH_VISIBLE_LINKS: true,
  PRELOAD_CRITICAL_ASSETS: true,
  
  // Service Worker
  ENABLE_SERVICE_WORKER: import.meta.env.PROD || ENABLE_SW_IN_DEV,
  ENABLE_OFFLINE_SUPPORT: true,
  ENABLE_BACKGROUND_SYNC: true,
  
  // Performance monitoring
  ENABLE_PERFORMANCE_METRICS: ENABLE_DEV_MONITOR || ENABLE_PROD_MONITOR,
  LOG_PERFORMANCE_METRICS: ENABLE_DEV_MONITOR,
  SEND_ANALYTICS: ENABLE_PROD_MONITOR,
  
  // Development tools
  ENABLE_PERFORMANCE_MONITOR: ENABLE_DEV_MONITOR,
  ENABLE_WEB_VITALS: true,
  ENABLE_REACT_STRICT_MODE: true
};

// List of routes to preload (for route-based code splitting)
const PRELOAD_ROUTES = [
  '/dashboard',
  '/products',
  '/profile',
  // Add other important routes here
];

// List of API endpoints to cache
const CACHED_ENDPOINTS = [
  '/api/products',
  '/api/categories',
  // Add other API endpoints to cache
];

// List of external scripts to preconnect/preload
const EXTERNAL_RESOURCES = [
  // Google Fonts
  { href: 'https://fonts.googleapis.com', rel: 'preconnect', crossOrigin: 'anonymous' },
  { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossOrigin: 'anonymous' },
  
  // Analytics (example)
  // { href: 'https://www.google-analytics.com', rel: 'preconnect', crossOrigin: 'anonymous' },
];

// Critical CSS files to preload
const CRITICAL_CSS = [
  // Add paths to critical CSS files
];

// Critical JS files to preload
const CRITICAL_JS = [
  // Add paths to critical JS files
];

// Performance monitoring configuration
const MONITORING = {
  // Web Vitals reporting
  webVitals: {
    enabled: FEATURES.ENABLE_WEB_VITALS,
    sampleRate: 1.0, // Percentage of sessions to track (0.0 - 1.0)
    debug: ENABLE_DEV_MONITOR,
  },
  
  // Custom metrics
  metrics: {
    enabled: FEATURES.ENABLE_PERFORMANCE_METRICS,
    logMetrics: FEATURES.LOG_PERFORMANCE_METRICS,
    sendToAnalytics: FEATURES.SEND_ANALYTICS,
    // Add custom metric configurations here
  },
  
  // Error tracking
  errorTracking: {
    enabled: true,
    sampleRate: 1.0, // Percentage of errors to track (0.0 - 1.0)
    ignoreErrors: [
      // Add error messages to ignore
    ],
  },
};

// Export the configuration
const config = {
  budgets: BUDGETS,
  features: FEATURES,
  preloadRoutes: PRELOAD_ROUTES,
  cachedEndpoints: CACHED_ENDPOINTS,
  externalResources: EXTERNAL_RESOURCES,
  criticalCSS: CRITICAL_CSS,
  criticalJS: CRITICAL_JS,
  monitoring: MONITORING,
  
  // Helper methods
  isFeatureEnabled: (feature) => {
    return FEATURES[feature] === true;
  },
  
  // Get budget thresholds
  getBudget: (metric) => {
    return BUDGETS[metric];
  },
  
  // Check if a value exceeds the budget
  exceedsBudget: (metric, value) => {
    const budget = BUDGETS[metric];
    return budget && value > budget;
  },
};

export default config;
