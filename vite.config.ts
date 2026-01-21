import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "0.0.0.0",
    port: 3000, // Align with docker-compose port mapping
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true
    },
    allowedHosts: [
      // Allow localhost and all manus subdomains
      "localhost",
      "127.0.0.1",
      "*.manus.computer",
    ],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Include all essential files for offline functionality
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        // Enhanced runtime caching for offline-first experience
        runtimeCaching: [
          {
            // API calls - Network first with offline fallback
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Appwrite API calls
            urlPattern: /^https?:\/\/.*\/v1\/.*/i,
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'appwrite-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tournament data - Cache first for performance
            urlPattern: /^https?:\/\/.*\/(tournaments|teams|matches|registrations).*/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'tournament-data',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Static assets - Cache first
            urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
            },
          },
          {
            // Google Fonts - Cache first
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
            },
          },
        ],
        // Background sync for offline operations
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Add custom service worker for enhanced offline functionality
        importScripts: ['/sw.js'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'CourtMaster Tournament Manager',
        short_name: 'CourtMaster',
        description: 'Offline-first tournament management for sports venues',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['sports', 'productivity', 'business'],
        lang: 'en',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        // Enhanced PWA features
        shortcuts: [
          {
            name: 'Create Tournament',
            short_name: 'New Tournament',
            description: 'Create a new tournament',
            url: '/tournaments/create',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Live Scoring',
            short_name: 'Live Score',
            description: 'Access live scoring interface',
            url: '/scoring',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Team Registration',
            short_name: 'Register',
            description: 'Register teams for tournaments',
            url: '/registration',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      }
    }),
    // Enable component tagger in development mode
    mode === "development" && componentTagger(),
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    // Generate bundle visualizer in analyze mode
    mode === "analyze" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
    // Enable Brotli & Gzip compression for production builds
    mode === "production" &&
      compression({
        algorithm: "brotliCompress",
        exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|webp)$/i],
      }),
    mode === "production" &&
      compression({
        algorithm: "gzip",
        exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|webp)$/i],
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Explicitly tell Vite how to handle directories vs files
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
      ],
    },
  },
  // Override rollup options to fix Vercel Node.js 22 build issues
  build: {
    // Use esbuild for all minification to avoid Rollup platform-specific dependencies
    minify: "esbuild",
    rollupOptions: {
      // Force the use of the JavaScript implementation of Rollup
      context: "globalThis",
      // Disable all native addons to prevent platform-specific dependencies
      external: [
        /@rollup\/rollup-linux-.*/,
        /@rollup\/rollup-darwin-.*/,
        /@rollup\/rollup-win32-.*/,
      ],
      // Force Rollup to skip node-gyp bindings to avoid platform-specific issues
      shimMissingExports: true,
      output: {
        manualChunks: (id) => {
          // Performance budget per chunk: ~200kb (stricter for better caching)

          // Core React framework - most stable, cached longest
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-core';
          }

          // UI Libraries - More granular chunking for better caching
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-dropdown-menu') || 
              id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-popover')) {
            return 'radix-interactive';
          }
          if (id.includes('@radix-ui/react-avatar') || id.includes('@radix-ui/react-label') || 
              id.includes('@radix-ui/react-separator') || id.includes('@radix-ui/react-slot')) {
            return 'radix-display';
          }
          if (id.includes('@radix-ui/')) {
            return 'radix-misc';
          }
          if (id.includes('@mui/material')) {
            return 'mui-core';
          }
          if (id.includes('@mui/x-date-pickers')) {
            return 'mui-pickers';
          }
          if (id.includes('@mui/')) {
            return 'mui-misc';
          }
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }

          // Heavy dependencies - isolate for optional loading
          if (id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('exceljs')) {
            return 'excel-export';
          }
          if (id.includes('jspdf')) {
            return 'pdf-export';
          }
          if (id.includes('@dnd-kit/') || id.includes('@hello-pangea/dnd')) {
            return 'drag-drop';
          }

          // Authentication and real-time
          if (id.includes('appwrite') || id.includes('node-appwrite')) {
            return 'appwrite';
          }

          // Sport-specific logic (tournament management)
          if (id.includes('/scoring/') || id.includes('/rules/') || id.includes('/sport/') || 
              id.includes('/tournament/') || id.includes('/match/')) {
            return 'sport-logic';
          }

          // Data handling and utilities - split by usage pattern
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          if (id.includes('lodash') || id.includes('uuid') || id.includes('nanoid')) {
            return 'data-utils';
          }

          // Form handling
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms';
          }

          // Offline and state management - split by functionality
          if (id.includes('idb')) {
            return 'offline-storage';
          }
          if (id.includes('zustand')) {
            return 'state-management';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'data-fetching';
          }
          if (id.includes('@tanstack/react-table') || id.includes('@tanstack/react-virtual')) {
            return 'data-display';
          }

          // PWA and service worker
          if (id.includes('workbox') || id.includes('vite-plugin-pwa')) {
            return 'pwa';
          }

          // Testing libraries (should be excluded in production)
          if (id.includes('@testing-library/') || id.includes('vitest') || id.includes('@playwright/')) {
            return 'testing';
          }

          // Specialized UI components
          if (id.includes('react-window') || id.includes('react-signature-canvas') || 
              id.includes('qrcode.react') || id.includes('react-qr-code')) {
            return 'specialized-ui';
          }

          // Icons and styling
          if (id.includes('lucide-react') || id.includes('react-icons')) {
            return 'icons';
          }
          if (id.includes('tailwind') || id.includes('class-variance-authority') || 
              id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'styling';
          }

          // Analytics and monitoring
          if (id.includes('@vercel/analytics') || id.includes('mitt')) {
            return 'analytics';
          }

          // Vendor node_modules (catch-all for remaining large deps)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Enhance asset handling
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          // Organize assets by type for better caching
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `styles/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },
        // Enhanced chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, "")
            : "chunk";
          return `chunks/[name]-[hash].js`;
        },
        entryFileNames: `entry/[name]-[hash].js`,
      },
    },
    // Enable source maps for production build for better error tracking
    sourcemap: true,
    // Target modern browsers for smaller bundle size
    target: "es2020",
    // Optimize CSS
    cssCodeSplit: true,
    // Performance budget configuration
    chunkSizeWarningLimit: 200, // Stricter budget for better performance
    // Minification options with size optimization
    assetsInlineLimit: 2048, // 2kb - smaller inline limit for better caching

    // Enhanced asset optimization
    assetsDir: 'assets',
    outDir: 'dist',
    emptyOutDir: true,

    // Performance optimizations
    reportCompressedSize: true,
    modulePreload: {
      polyfill: true,
      resolveDependencies: (url, deps) => {
        // Simplified preloading strategy - only preload essential chunks
        // Limit to 2 dependencies to avoid bandwidth waste
        return deps.slice(0, 2);
      }
    }
  },
  // Enhanced dependency optimization
  optimizeDeps: {
    // Pre-bundle heavy dependencies for faster dev startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@tanstack/react-query',
    ],
    // Exclude from pre-bundling to avoid issues
    exclude: [
      // These cause platform-specific issues
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-darwin-x64',
      '@rollup/rollup-win32-x64-msvc',
      // These should be loaded dynamically
      'exceljs',
      'jspdf',
      'recharts'
    ],
    esbuildOptions: {
      target: "es2020",
      // Enhanced tree-shaking
      treeShaking: true,
      // Bundle format optimization
      format: 'esm',
      // Force esbuild to ignore native Node.js modules
      define: {
        "process.env.ROLLUP_SKIP_NODEJS_NATIVE_ADDONS": JSON.stringify("true"),
        "process.env.ROLLUP_NATIVE_BINDINGS": JSON.stringify("false"),
        "process.env.ROLLUP_FORCE_JAVASCRIPT": JSON.stringify("true"),
        // Performance monitoring flags
        "process.env.VITE_PERFORMANCE_MONITORING": JSON.stringify(mode === "production" ? "true" : "false"),
      },
      // Drop console in production for smaller bundles
      drop: mode === "production" ? ['console', 'debugger'] : [],
    },
  },
  // Enable tree shaking to eliminate dead code
  esbuild: {
    treeShaking: true,
  },
}));

