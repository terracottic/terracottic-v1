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
    include: ['@emotion/react', '@emotion/styled', '@mui/material', '@mui/icons-material', 'axios',
      '@stripe/stripe-js',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      '@emailjs/browser',],
    esbuildOptions: {
      // Enable esbuild's tree shaking
      treeShaking: true,
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
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', '*.{png,svg}'],
      manifest: {
        name: 'Terracottic',
        short_name: 'Terracottic',
        description: 'Your Terracotta Products Store',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'android-chrome-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'android-chrome-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/(assets|images)\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
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
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
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
