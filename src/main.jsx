import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';

// Ensure we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Safe access to window object
const safeWindow = isBrowser ? window : {};

// Fix for useLayoutEffect SSR warning
if (!isBrowser) {
  React.useLayoutEffect = React.useEffect;
}
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import theme from './theme';
import App from './App';
import './index.css';

// Performance Monitoring
import reportWebVitals from './utils/reportWebVitals';
import { registerServiceWorker } from './registerServiceWorker';
import { Workbox } from 'workbox-window';

// Register service worker in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Register the service worker
  registerServiceWorker().catch(error => {
    console.error('Error during service worker registration:', error);
  });
  
  // Initialize Workbox for advanced service worker features
  if ('serviceWorker' in navigator && window.workbox !== undefined) {
    const wb = new Workbox('/sw.js');
    
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('App updated. Reloading...');
        window.location.reload();
      } else {
        console.log('App is ready for offline use.');
      }
    });
    
    wb.register().catch(error => {
      console.error('Workbox registration failed:', error);
    });
  }
}

const container = document.getElementById('root');
const root = createRoot(container);

// Function to render the app
function render(Component) {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <HelmetProvider>
            <AuthProvider>
              <CurrencyProvider>
                <NotificationProvider>
                  <Component />
                </NotificationProvider>
              </CurrencyProvider>
            </AuthProvider>
          </HelmetProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

// Initial render
render(App);

// If you want to measure performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
if (import.meta.env.PROD) {
  reportWebVitals(metric => {
    // Send metrics to your analytics service
    console.log(metric);
    
    // Example: Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
  });
}

// Handle service worker updates
if ('serviceWorker' in navigator && window.workbox !== undefined) {
  const wb = new Workbox('/sw.js');
  
  wb.addEventListener('waiting', (event) => {
    // A new service worker has installed, but it can't activate until all tabs are closed
    if (window.confirm('A new version is available! Reload to update?')) {
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });
      
      // Send a message to the waiting service worker to activate
      if (event.sw) {
        event.sw.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  });
  
  wb.register().then(registration => {
    console.log('Service Worker registration completed');
  }).catch(error => {
    console.error('Service Worker registration failed:', error);
  });
}

