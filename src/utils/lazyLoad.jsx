import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import performanceConfig from '../config/performance';

// Default loading component
const DefaultLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    width: '100%'
  }}>
    <div className="spinner">Loading...</div>
  </div>
);

/**
 * Creates a lazy-loaded component with a loading fallback
 * @param {Function} importFunc - Dynamic import function for the component
 * @param {Object} [options] - Options for the lazy loading
 * @param {React.ComponentType} [options.fallback] - Custom fallback component
 * @param {number} [options.delay=200] - Minimum delay before showing the fallback (in ms)
 * @returns {React.ComponentType} - Lazy-loaded component with Suspense
 */
function lazyLoad(importFunc, { fallback: Fallback = DefaultLoading, delay = 200 } = {}) {
  // Skip lazy loading in test environment
  if (import.meta.env.MODE === 'test') {
    return importFunc().then(module => module.default);
  }

  // Create a lazy-loaded component
  const LazyComponent = lazy(() => {
    // Add a small delay to prevent flickering for fast loads
    return Promise.all([
      importFunc(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]).then(([module]) => module);
  });

  // Return a component with Suspense
  const LazyWithSuspense = (props) => (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Set display name for better debugging
  LazyWithSuspense.displayName = `LazyLoad(${getDisplayName(importFunc)})`;
  
  return LazyWithSuspense;
}

/**
 * Creates a named lazy-loaded component with automatic chunk naming
 * @param {string} componentName - Name of the component (used for webpack chunk name)
 * @param {Function} importFunc - Dynamic import function for the component
 * @param {Object} [options] - Options for the lazy loading
 * @returns {React.ComponentType} - Lazy-loaded component with Suspense
 */
function namedLazy(componentName, importFunc, options = {}) {
  // Add webpackChunkName comment for better chunk naming
  const namedImportFunc = () => 
    importFunc(/* webpackChunkName: "[request]" */ `../components/${componentName}`);
  
  return lazyLoad(namedImportFunc, options);
}

/**
 * Creates a route-based lazy-loaded component
 * @param {Function} importFunc - Dynamic import function for the route component
 * @param {Object} [options] - Options for the lazy loading
 * @returns {React.ComponentType} - Lazy-loaded route component with Suspense
 */
function lazyRoute(importFunc, options = {}) {
  // Skip lazy loading in test environment
  if (import.meta.env.MODE === 'test') {
    return importFunc().then(module => module.default);
  }

  // Create a lazy-loaded component with a route-specific loading state
  const RouteLoading = options.fallback || (() => (
    <div className="route-loading">
      <div className="spinner">Loading route...</div>
    </div>
  ));

  return lazyLoad(importFunc, { ...options, fallback: RouteLoading });
}

/**
 * Higher-order component that adds Suspense with a fallback
 * @param {React.ComponentType} Component - Component to wrap with Suspense
 * @param {Object} [options] - Options for the Suspense wrapper
 * @param {React.ComponentType} [options.fallback] - Custom fallback component
 * @returns {React.ComponentType} - Wrapped component with Suspense
 */
function withSuspense(Component, { fallback: Fallback = DefaultLoading } = {}) {
  const WithSuspense = (props) => (
    <Suspense fallback={<Fallback />}>
      <Component {...props} />
    </Suspense>
  );

  // Set display name for better debugging
  WithSuspense.displayName = `WithSuspense(${getDisplayName(Component)})`;
  
  return WithSuspense;
}

/**
 * Preloads a component that was loaded with React.lazy
 * @param {React.LazyExoticComponent} lazyComponent - The lazy-loaded component
 * @returns {Promise} - A promise that resolves when the component is loaded
 */
function preloadLazyComponent(lazyComponent) {
  return lazyComponent._payload._result.then(component => component.default || component);
}

/**
 * Preloads a route component before navigation
 * @param {Function} importFunc - The dynamic import function for the route
 * @returns {Function} - A function to trigger the preload
 */
function preloadRoute(importFunc) {
  return () => {
    // Skip if preloading is disabled
    if (!performanceConfig.features.ROUTE_BASED_SPLITTING) {
      return;
    }
    
    // Start preloading the component
    importFunc().catch(error => {
      console.error('Failed to preload route:', error);
    });
  };
}

/**
 * Helper function to get the display name of a component
 * @private
 */
function getDisplayName(component) {
  return component.displayName || component.name || 'Component';
}

export {
  lazyLoad,
  namedLazy,
  lazyRoute,
  withSuspense,
  preloadLazyComponent,
  preloadRoute,
  DefaultLoading,
};

export default lazyLoad;
