// Import web-vitals with a simple approach
const webVitals = await import('web-vitals');

// Use the v3+ API if available, otherwise fall back to v2 API
const getCLS = webVitals.onCLS || webVitals.getCLS || (() => {});
const getFID = webVitals.onFID || webVitals.getFID || (() => {});
const getLCP = webVitals.onLCP || webVitals.getLCP || (() => {});
const getFCP = webVitals.onFCP || webVitals.getFCP || (() => {});
const getTTFB = webVitals.onTTFB || webVitals.getTTFB || (() => {});
import performanceConfig from '../config/performance';

/**
 * Sends metrics to an analytics endpoint
 * @param {Object} metric - The metric to report
 */
const sendToAnalytics = (metric) => {
  // In development, just log to console
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
    return;
  }

  // In production, send to your analytics service
  const body = JSON.stringify({
    dsn: import.meta.env.VITE_ANALYTICS_ID, // Analytics ID from environment variables
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event: metric.name,
    value: metric.value.toString(),
    speed: 
      'connection' in navigator && 
      navigator.connection &&
      'effectiveType' in navigator.connection 
        ? navigator.connection.effectiveType 
        : '',
  });

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  const url = 'https://example-analytics.com/collect';
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
};

/**
 * Reports Web Vitals metrics
 * @param {Function} [onPerfEntry] - Optional callback function
 */
export const reportWebVitals = (onPerfEntry) => {
  // Skip if performance monitoring is disabled
  if (!performanceConfig.features.ENABLE_WEB_VITALS) {
    return;
  }

  // If onPerfEntry is a function, call it with each metric
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getLCP(onPerfEntry);
    getFCP(onPerfEntry);
    getTTFB(onPerfEntry);
    return;
  }

  // Otherwise, use our analytics function
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
  getFCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};

/**
 * Logs performance metrics to the console
 * @param {Object} metric - The metric to log
 */
const logMetrics = (metric) => {
  const { name, value } = metric;
  const threshold = performanceConfig.getBudget(name);
  const exceedsBudget = threshold && value > threshold;
  
  const style = `
    color: ${exceedsBudget ? '#ff4d4f' : '#52c41a'};
    font-weight: bold;
    font-size: 12px;
  `;
  
  const message = `%c[Web Vitals] ${name}: ${Math.round(value * 100) / 100}${metric.unit || ''}${exceedsBudget ? ` (exceeds budget of ${threshold}${metric.unit || ''})` : ''}`;
  
  if (exceedsBudget) {
    console.warn(message, style);
  } else if (performanceConfig.features.LOG_PERFORMANCE_METRICS) {
    console.log(message, style);
  }
};

// Export the report function and individual metric getters
export {
  reportWebVitals as default,
  getCLS,
  getFID,
  getLCP,
  getFCP,
  getTTFB,
  logMetrics,
};
