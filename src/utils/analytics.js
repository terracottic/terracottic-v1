/**
 * Analytics and Performance Monitoring Utility
 * 
 * This utility provides a centralized way to track various metrics and events
 * throughout the application, with support for multiple analytics providers.
 */

import performanceConfig from '../config/performance';

// Analytics providers
const PROVIDERS = {
  GOOGLE_ANALYTICS: 'google-analytics',
  GOOGLE_TAG_MANAGER: 'google-tag-manager',
  SEGMENT: 'segment',
  CUSTOM: 'custom',
};

// Default configuration
const defaultConfig = {
  enabled: import.meta.env.PROD,
  providers: [PROVIDERS.GOOGLE_ANALYTICS],
  trackPageViews: true,
  trackClicks: true,
  trackErrors: true,
  trackPerformance: true,
  sampleRate: 1.0, // 100% of sessions
  debug: import.meta.env.DEV,
};

class Analytics {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initialized = false;
    this.providers = new Map();
    
    // Initialize with configured providers
    this.initialize();
  }
  
  /**
   * Initialize analytics providers
   */
  initialize() {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }
    
    this.config.providers.forEach(provider => {
      switch (provider) {
        case PROVIDERS.GOOGLE_ANALYTICS:
          this.initializeGoogleAnalytics();
          break;
        case PROVIDERS.GOOGLE_TAG_MANAGER:
          this.initializeGoogleTagManager();
          break;
        case PROVIDERS.SEGMENT:
          this.initializeSegment();
          break;
        case PROVIDERS.CUSTOM:
          // Custom provider initialization
          break;
        default:
          console.warn(`Unknown analytics provider: ${provider}`);
      }
    });
    
    this.initialized = true;
    this.log('Analytics initialized');
    
    // Set up automatic tracking if enabled
    this.setupAutomaticTracking();
  }
  
  /**
   * Initialize Google Analytics
   */
  initializeGoogleAnalytics() {
    if (typeof window === 'undefined' || !window.gtag) {
      console.warn('Google Analytics (gtag.js) not found');
      return;
    }
    
    // Initialize Google Analytics
    window.dataLayer = window.dataLayer || [];
    window.gtag('js', new Date());
    
    const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
    if (!trackingId) {
      console.warn('Google Analytics tracking ID not found');
      return;
    }
    
    window.gtag('config', trackingId, {
      send_page_view: this.config.trackPageViews,
      transport_url: 'https://www.google-analytics.com',
      first_party_collection: true,
      anonymize_ip: true,
      sample_rate: this.config.sampleRate * 100,
    });
    
    this.providers.set(PROVIDERS.GOOGLE_ANALYTICS, {
      trackEvent: (event) => {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          non_interaction: event.nonInteraction,
        });
      },
      trackPageView: (page) => {
        window.gtag('event', 'page_view', {
          page_path: page,
          send_to: trackingId,
        });
      },
      identify: (userId, traits) => {
        window.gtag('set', 'user_properties', traits);
        if (userId) {
          window.gtag('set', { user_id: userId });
        }
      },
    });
    
    this.log('Google Analytics initialized');
  }
  
  /**
   * Initialize Google Tag Manager
   */
  initializeGoogleTagManager() {
    if (typeof window === 'undefined' || !window.dataLayer) {
      console.warn('Google Tag Manager not found');
      return;
    }
    
    const gtmId = import.meta.env.VITE_GTM_ID;
    if (!gtmId) {
      console.warn('Google Tag Manager ID not found');
      return;
    }
    
    // GTM script is typically loaded in the HTML
    this.providers.set(PROVIDERS.GOOGLE_TAG_MANAGER, {
      trackEvent: (event) => {
        window.dataLayer.push({
          event: 'custom_event',
          event_category: event.category,
          event_action: event.action,
          event_label: event.label,
          event_value: event.value,
        });
      },
      trackPageView: (page) => {
        window.dataLayer.push({
          event: 'page_view',
          page_path: page,
        });
      },
      identify: (userId, traits) => {
        window.dataLayer.push({
          user_id: userId,
          ...traits,
        });
      },
    });
    
    this.log('Google Tag Manager initialized');
  }
  
  /**
   * Initialize Segment
   */
  initializeSegment() {
    if (typeof window === 'undefined' || !window.analytics) {
      console.warn('Segment not found');
      return;
    }
    
    const writeKey = import.meta.env.VITE_SEGMENT_WRITE_KEY;
    if (!writeKey) {
      console.warn('Segment write key not found');
      return;
    }
    
    // Segment is typically loaded via their snippet
    this.providers.set(PROVIDERS.SEGMENT, {
      trackEvent: (event) => {
        window.analytics.track(event.action, {
          category: event.category,
          label: event.label,
          value: event.value,
        });
      },
      trackPageView: (page) => {
        window.analytics.page(page);
      },
      identify: (userId, traits) => {
        window.analytics.identify(userId, traits);
      },
    });
    
    this.log('Segment initialized');
  }
  
  /**
   * Set up automatic event tracking
   */
  setupAutomaticTracking() {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Track page views
    if (this.config.trackPageViews) {
      this.trackPageView(window.location.pathname);
      
      // Listen for route changes (for SPAs)
      const originalPushState = window.history.pushState;
      window.history.pushState = (...args) => {
        originalPushState.apply(window.history, args);
        this.trackPageView(window.location.pathname);
      };
      
      window.addEventListener('popstate', () => {
        this.trackPageView(window.location.pathname);
      });
    }
    
    // Track clicks on interactive elements
    if (this.config.trackClicks) {
      document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-track], [data-analytics]');
        if (!target) return;
        
        const trackData = target.dataset.track || target.dataset.analytics;
        if (!trackData) return;
        
        try {
          const { action, category, label, value } = JSON.parse(trackData);
          this.trackEvent({
            category: category || 'UI Interaction',
            action: action || 'click',
            label: label || target.textContent.trim().substring(0, 100),
            value: value ? parseInt(value, 10) : undefined,
          });
        } catch (error) {
          console.error('Error parsing track data:', error);
        }
      }, true);
    }
    
    // Track JavaScript errors
    if (this.config.trackErrors) {
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        });
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: 'Unhandled Promise Rejection',
          reason: event.reason,
        });
      });
    }
    
    // Track performance metrics
    if (this.config.trackPerformance && 'performance' in window) {
      this.trackPerformance();
    }
  }
  
  /**
   * Track a custom event
   * @param {Object} event - The event to track
   * @param {string} event.category - The event category
   * @param {string} event.action - The event action
   * @param {string} [event.label] - The event label
   * @param {number} [event.value] - The event value
   * @param {boolean} [event.nonInteraction=false] - Whether the event is non-interactive
   */
  trackEvent(event) {
    if (!this.shouldTrack()) return;
    
    const eventData = {
      category: event.category || 'General',
      action: event.action || 'Unknown Action',
      label: event.label,
      value: event.value,
      nonInteraction: event.nonInteraction || false,
    };
    
    this.providers.forEach(provider => {
      if (provider.trackEvent) {
        try {
          provider.trackEvent(eventData);
        } catch (error) {
          console.error('Error tracking event:', error);
        }
      }
    });
    
    this.log('Event tracked:', eventData);
  }
  
  /**
   * Track a page view
   * @param {string} [page] - The page path to track
   */
  trackPageView(page = window.location.pathname) {
    if (!this.shouldTrack()) return;
    
    this.providers.forEach(provider => {
      if (provider.trackPageView) {
        try {
          provider.trackPageView(page);
        } catch (error) {
          console.error('Error tracking page view:', error);
        }
      }
    });
    
    this.log('Page view tracked:', page);
  }
  
  /**
   * Identify a user
   * @param {string} userId - The user ID
   * @param {Object} [traits] - User traits
   */
  identify(userId, traits = {}) {
    if (!this.shouldTrack()) return;
    
    this.providers.forEach(provider => {
      if (provider.identify) {
        try {
          provider.identify(userId, traits);
        } catch (error) {
          console.error('Error identifying user:', error);
        }
      }
    });
    
    this.log('User identified:', { userId, traits });
  }
  
  /**
   * Track an error
   * @param {Object} error - The error to track
   */
  trackError(error) {
    if (!this.shouldTrack()) return;
    
    const errorData = {
      category: 'Error',
      action: error.message || 'Unknown Error',
      label: error.source || 'JavaScript',
      value: 1,
      nonInteraction: true,
      ...error,
    };
    
    this.trackEvent(errorData);
    this.log('Error tracked:', error);
  }
  
  /**
   * Track performance metrics
   */
  trackPerformance() {
    if (typeof window === 'undefined' || !window.performance) return;
    
    // Measure page load time
    const navigationTiming = performance.getEntriesByType('navigation')[0];
    if (navigationTiming) {
      this.trackEvent({
        category: 'Performance',
        action: 'Page Load',
        value: navigationTiming.loadEventEnd - navigationTiming.startTime,
        nonInteraction: true,
      });
    }
    
    // Measure resource timing
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      this.trackEvent({
        category: 'Performance',
        action: 'Resource Load',
        label: resource.name,
        value: resource.duration,
        nonInteraction: true,
      });
    });
  }
  
  /**
   * Check if tracking should occur based on sample rate
   * @private
   */
  shouldTrack() {
    if (!this.config.enabled) return false;
    return Math.random() <= this.config.sampleRate;
  }
  
  /**
   * Log debug information
   * @private
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}

// Create a singleton instance
const analytics = new Analytics({
  enabled: performanceConfig.features.SEND_ANALYTICS,
  debug: import.meta.env.DEV,
  providers: [
    import.meta.env.VITE_GA_TRACKING_ID && PROVIDERS.GOOGLE_ANALYTICS,
    import.meta.env.VITE_GTM_ID && PROVIDERS.GOOGLE_TAG_MANAGER,
    import.meta.env.VITE_SEGMENT_WRITE_KEY && PROVIDERS.SEGMENT,
  ].filter(Boolean),
});

export { PROVIDERS };
export default analytics;
