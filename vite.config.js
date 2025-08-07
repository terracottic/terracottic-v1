import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      '@mui/material/styles',
      'axios',
      '@stripe/stripe-js',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@emailjs/browser'
    ],
    esbuildOptions: {
      // Enable esbuild's tree shaking
      treeShaking: true,
      // Ensure MUI components are properly bundled
      define: {
        global: 'globalThis',
      },
    },
  },
  plugins: [
    react({
      fastRefresh: true,
      tsDecorators: true,
      devTarget: 'es2020',
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    VitePWA({
      // Use minimal configuration since we have our own manifest
      strategies: 'injectManifest',
      // Point to our existing manifest file
      manifest: false, // We'll use the one in public/
      // Disable all automatic asset handling
      includeAssets: false,
      includeManifestIcons: false,
      injectRegister: false,
      // Basic service worker configuration
      workbox: {
        // Only cache essential files
        globPatterns: ['**/*.{js,css,html}'],
        // Skip all generation
        skipWaiting: false,
        clientsClaim: false,
        cleanupOutdatedCaches: false,
        sourcemap: false,
        // Don't precache any assets
        globIgnores: ['**/*'],
      },
    }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    visualizer({
      template: 'treemap',
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'bundle-analysis.html',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    sourcemap: false,
    cssCodeSplit: true,
    // Ensure consistent module resolution
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      // Ensure proper resolution of MUI modules
      requireReturnsDefault: 'auto',
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
      mangle: {
        safari10: true,
      },
    },
    brotliSize: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group React and React DOM together to ensure single instance
            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor_react';
            }
            if (id.includes('exceljs')) return 'vendor_exceljs';
            if (id.includes('date-fns') || id.includes('@mui/x-date-pickers')) return 'vendor_dates';
            if (id.includes('@mui/material') || id.includes('@emotion')) return 'vendor_mui';
            if (id.includes('chart.js') || id.includes('react-chartjs')) return 'vendor_charts';
            if (id.includes('firebase')) return 'vendor_firebase';
            if (id.includes('react-router-dom')) return 'vendor_router';
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) return 'vendor_redux';
            return 'vendor';
          }
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name.includes('node_modules')) {
            const moduleName = chunkInfo.name.split('node_modules/').pop().split('/')[0];
            return `assets/vendor.${moduleName}.[hash].js`;
          }
          return 'assets/[name].[hash].js';
        },
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
