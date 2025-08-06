import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, Close as CloseIcon, Info as InfoIcon } from '@mui/icons-material';
import { createPerfMarker, measureExecution } from '../utils/performance.jsx';

/**
 * Performance Monitor Component
 * 
 * This component provides a floating panel that displays various performance metrics
 * and allows for performance measurements in development and production.
 */
const PerformanceMonitor = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [metrics, setMetrics] = useState({
    fcp: null,       // First Contentful Paint
    lcp: null,       // Largest Contentful Paint
    fid: null,       // First Input Delay
    cls: null,       // Cumulative Layout Shift
    tbt: null,       // Total Blocking Time
    tti: null,       // Time to Interactive
    memory: null,    // Memory usage
    navigation: null // Navigation timing
  });
  
  const observerRef = useRef(null);
  const measurementsRef = useRef([]);
  const [measurements, setMeasurements] = useState([]);

  // Initialize Performance Observer for Core Web Vitals
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        observerRef.current = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          for (const entry of entries) {
            if (entry.entryType === 'largest-contentful-paint') {
              setMetrics(prev => ({
                ...prev,
                lcp: entry.startTime.toFixed(2) + 'ms'
              }));
            }
            
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              setMetrics(prev => ({
                ...prev,
                cls: (prev.cls ? parseFloat(prev.cls) + entry.value : entry.value).toFixed(4)
              }));
            }
          }
        });

        observerRef.current.observe({ type: 'largest-contentful-paint', buffered: true });
        observerRef.current.observe({ type: 'layout-shift', buffered: true });
      }

      // Get navigation timing
      const measureNavigationTiming = () => {
        if ('performance' in window) {
          const [timing] = performance.getEntriesByType('navigation');
          if (timing) {
            setMetrics(prev => ({
              ...prev,
              fcp: timing.domContentLoadedEventEnd.toFixed(2) + 'ms',
              tti: (timing.domInteractive - timing.startTime).toFixed(2) + 'ms',
              navigation: {
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                tcp: timing.connectEnd - timing.connectStart,
                request: timing.responseStart - timing.requestStart,
                response: timing.responseEnd - timing.responseStart,
                domLoading: timing.domComplete - timing.domLoading,
                domInteractive: timing.domInteractive - timing.navigationStart,
                domComplete: timing.domComplete - timing.navigationStart,
                loadEvent: timing.loadEventEnd - timing.loadEventStart,
                total: timing.loadEventEnd - timing.startTime
              }
            }));
          }
        }
      };

      // Get memory usage if available
      const measureMemory = () => {
        if ('memory' in performance) {
          setMetrics(prev => ({
            ...prev,
            memory: {
              usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
              totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
              jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            }
          }));
        }
      };

      // Measure FID (First Input Delay)
      const measureFID = () => {
        const firstInputEntry = performance.getEntriesByType('first-input')[0];
        if (firstInputEntry) {
          setMetrics(prev => ({
            ...prev,
            fid: firstInputEntry.processingStart - firstInputEntry.startTime + 'ms'
          }));
        }
      };

      // Measure TBT (Total Blocking Time)
      const measureTBT = () => {
        // This is a simplified approximation
        // In a real app, you'd use the web-vitals library for more accurate measurement
        const longTasks = performance.getEntriesByType('longtask') || [];
        const tbt = longTasks.reduce((total, task) => {
          return total + (task.duration - 50); // Only count time over 50ms
        }, 0);
        
        setMetrics(prev => ({
          ...prev,
          tbt: tbt > 0 ? tbt.toFixed(2) + 'ms' : '0ms'
        }));
      };

      // Set up event listeners
      window.addEventListener('load', () => {
        measureNavigationTiming();
        measureMemory();
        measureFID();
        measureTBT();
      });

      // Clean up
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        window.removeEventListener('load', measureNavigationTiming);
      };
    }
  }, []);

  // Add a new measurement
  const addMeasurement = (name, duration) => {
    const newMeasurement = {
      id: Date.now(),
      name,
      duration: duration.toFixed(2) + 'ms',
      timestamp: new Date().toISOString()
    };
    
    measurementsRef.current = [newMeasurement, ...measurementsRef.current].slice(0, 20);
    setMeasurements(measurementsRef.current);
  };

  // Measure a function's execution time
  const measure = (fn, name) => {
    return measureExecution(fn, name);
  };

  // Create a performance marker
  const createMarker = (name) => {
    return createPerfMarker(name);
  };

  // Refresh all metrics
  const refreshMetrics = () => {
    // Reset metrics
    setMetrics({
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      tbt: null,
      tti: null,
      memory: null,
      navigation: null
    });
    
    // Re-measure
    if (typeof window !== 'undefined' && 'performance' in window) {
      const timing = performance.timing || {};
      const navigation = performance.getEntriesByType('navigation')[0] || {};
      
      setMetrics(prev => ({
        ...prev,
        fcp: (navigation.domContentLoadedEventEnd || 0).toFixed(2) + 'ms',
        tti: ((navigation.domInteractive || 0) - (navigation.startTime || 0)).toFixed(2) + 'ms',
        navigation: {
          dns: (navigation.domainLookupEnd - navigation.domainLookupStart) || 0,
          tcp: (navigation.connectEnd - navigation.connectStart) || 0,
          request: (navigation.responseStart - navigation.requestStart) || 0,
          response: (navigation.responseEnd - navigation.responseStart) || 0,
          domLoading: (navigation.domComplete - navigation.domLoading) || 0,
          domInteractive: (navigation.domInteractive - navigation.startTime) || 0,
          domComplete: (navigation.domComplete - navigation.startTime) || 0,
          loadEvent: (navigation.loadEventEnd - navigation.loadEventStart) || 0,
          total: (navigation.loadEventEnd - navigation.startTime) || 0
        }
      }));
    }
  };

  if (!isOpen) {
    return (
      <Box
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          bgcolor: 'primary.main',
          color: 'white',
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 3,
          zIndex: 9999,
          '&:hover': {
            bgcolor: 'primary.dark'
          }
        }}
      >
        <InfoIcon />
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 500,
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 9999,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">Performance Monitor</Typography>
        <Box>
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={refreshMetrics} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={() => setIsOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>Core Web Vitals</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>First Contentful Paint (FCP)</TableCell>
                <TableCell>{metrics.fcp || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Largest Contentful Paint (LCP)</TableCell>
                <TableCell>{metrics.lcp || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>First Input Delay (FID)</TableCell>
                <TableCell>{metrics.fid || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cumulative Layout Shift (CLS)</TableCell>
                <TableCell>{metrics.cls || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Blocking Time (TBT)</TableCell>
                <TableCell>{metrics.tbt || 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Time to Interactive (TTI)</TableCell>
                <TableCell>{metrics.tti || 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {metrics.memory && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>Memory Usage</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Used JS Heap Size</TableCell>
                  <TableCell>{metrics.memory.usedJSHeapSize}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total JS Heap Size</TableCell>
                  <TableCell>{metrics.memory.totalJSHeapSize}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>JS Heap Size Limit</TableCell>
                  <TableCell>{metrics.memory.jsHeapSizeLimit}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {measurements.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Custom Measurements</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurements.map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell>{measurement.name}</TableCell>
                    <TableCell>{measurement.duration}</TableCell>
                    <TableCell>{new Date(measurement.timestamp).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
};

PerformanceMonitor.propTypes = {
  defaultOpen: PropTypes.bool
};

export { measureExecution as measure };
export { createPerfMarker as createMarker };
export default PerformanceMonitor;
