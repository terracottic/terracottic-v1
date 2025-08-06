import { useEffect, useRef } from 'react';
import performanceConfig from '../config/performance';

/**
 * Hook to preload resources and routes for better performance
 * @param {Array} additionalRoutes - Additional routes to preload
 * @param {Array} additionalResources - Additional resources to preload
 */
function usePreloadResources(additionalRoutes = [], additionalResources = []) {
  const preloadedRef = useRef(new Set());
  
  useEffect(() => {
    // Skip if preloading is disabled
    if (!performanceConfig.features.PRELOAD_CRITICAL_ASSETS) {
      return;
    }

    // Function to preload a resource
    const preloadResource = (href, as = '', type = '') => {
      // Skip if already preloaded
      const resourceKey = `${href}-${as}-${type}`;
      if (preloadedRef.current.has(resourceKey)) {
        return;
      }
      
      preloadedRef.current.add(resourceKey);
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      
      if (as) {
        link.as = as;
      }
      
      if (type) {
        link.type = type;
      }
      
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };
    
    // Function to preconnect to a domain
    const preconnect = (url, options = {}) => {
      const { crossOrigin = true } = options;
      const key = `preconnect-${url}`;
      
      if (preloadedRef.current.has(key)) {
        return;
      }
      
      preloadedRef.current.add(key);
      
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      
      if (crossOrigin) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    };
    
    // Function to prefetch a route
    const prefetchRoute = (route) => {
      // Skip if route-based splitting is disabled
      if (!performanceConfig.features.ROUTE_BASED_SPLITTING) {
        return;
      }
      
      // Skip if already preloaded
      const routeKey = `route-${route}`;
      if (preloadedRef.current.has(routeKey)) {
        return;
      }
      
      preloadedRef.current.add(routeKey);
      
      // Use the webpackPrefetch magic comment if using webpack
      // This will be handled by the bundler
      if (import.meta.env.PROD) {
        // In production, we can use the prefetch API
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      }
    };
    
    // Preconnect to external domains
    performanceConfig.externalResources.forEach(resource => {
      if (resource.rel === 'preconnect' || resource.rel === 'dns-prefetch') {
        preconnect(resource.href, { crossOrigin: resource.crossOrigin === 'anonymous' });
      }
    });
    
    // Preload critical CSS
    performanceConfig.criticalCSS.forEach(href => {
      preloadResource(href, 'style', 'text/css');
    });
    
    // Preload critical JS
    performanceConfig.criticalJS.forEach(src => {
      preloadResource(src, 'script', 'application/javascript');
    });
    
    // Preload additional resources
    additionalResources.forEach(resource => {
      if (typeof resource === 'string') {
        preloadResource(resource);
      } else {
        preloadResource(resource.href, resource.as, resource.type);
      }
    });
    
    // Preload routes
    const routesToPreload = [
      ...performanceConfig.preloadRoutes,
      ...additionalRoutes,
    ];
    
    routesToPreload.forEach(route => {
      prefetchRoute(route);
    });
    
    // Set up intersection observer for lazy loading
    if (performanceConfig.features.PREFETCH_VISIBLE_LINKS) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target;
            const href = link.getAttribute('href');
            
            if (href && href.startsWith('/')) {
              prefetchRoute(href);
            }
            
            // Unobserve after prefetching
            observer.unobserve(link);
          }
        });
      }, {
        rootMargin: '200px', // Start prefetching when link is 200px from viewport
        threshold: 0.01
      });
      
      // Observe all links
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach(link => {
        observer.observe(link);
      });
      
      // Cleanup
      return () => {
        links.forEach(link => {
          observer.unobserve(link);
        });
        observer.disconnect();
      };
    }
  }, [additionalRoutes, additionalResources]);
}

export default usePreloadResources;
