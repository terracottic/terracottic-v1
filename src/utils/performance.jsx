import { useEffect, useRef } from 'react';

/**
 * Hook to measure and log component render performance
 * @param {string} componentName - Name of the component being measured
 * @param {boolean} [enabled=true] - Whether performance measurement is enabled
 */
export function useRenderMetrics(componentName, enabled = true) {
  const renderCount = useRef(0);
  const startTime = useRef(0);
  
  if (!enabled) return;
  
  // Log initial render
  if (renderCount.current === 0) {
    console.log(`[Render] ${componentName}: Initial render`);
  }
  
  // Measure render time
  useEffect(() => {
    if (!enabled) return;
    
    const now = performance.now();
    const renderTime = now - startTime.current;
    
    if (renderCount.current > 0) {
      console.log(`[Render] ${componentName}: Re-render #${renderCount.current} (${renderTime.toFixed(2)}ms)`);
    }
    
    renderCount.current++;
    
    return () => {
      startTime.current = performance.now();
    };
  });
}

/**
 * Function to measure function execution time
 * @param {Function} fn - Function to measure
 * @param {string} [name='Function'] - Name for the measurement
 * @returns {*} - The result of the function
 */
export function measureExecution(fn, name = 'Function') {
  return function(...args) {
    if (import.meta.env.DEV) {
      console.time(`⏱️ ${name} execution time`);
      const result = fn.apply(this, args);
      console.timeEnd(`⏱️ ${name} execution time`);
      return result;
    }
    return fn.apply(this, args);
  };
}

/**
 * Creates a performance marker for measuring code sections
 * @param {string} name - Name of the marker
 * @returns {Object} - Object with end() method to end the measurement
 */
export function createPerfMarker(name) {
  if (import.meta.env.DEV) {
    const start = performance.now();
    console.log(`🚀 [Perf] ${name} - started`);
    
    return {
      end: () => {
        const end = performance.now();
        console.log(`✅ [Perf] ${name} - ${(end - start).toFixed(2)}ms`);
      }
    };
  }
  
  // No-op in production
  return { end: () => {} };
}

/**
 * Wraps a component with performance measurements
 * @param {React.ComponentType} Component - Component to wrap
 * @param {string} [componentName=Component.displayName] - Name for the component
 * @returns {React.ComponentType} - Wrapped component with performance measurements
 */
export function withPerformance(Component, componentName = Component.displayName || Component.name) {
  if (import.meta.env.DEV) {
    return function WithPerformance(props) {
      useRenderMetrics(componentName);
      return <Component {...props} />;
    };
  }
  return Component;
}

/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Throttle function to limit the rate at which a function can fire
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Performance observer for long tasks
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) { // Log tasks longer than 50ms
        console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
      }
    }
  });
  
  observer.observe({ entryTypes: ['longtask'] });
}
