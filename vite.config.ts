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
    port: 8080, // Keep original port, Vite will find the next available one if needed
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'CourtMaster Tournament Manager',
        short_name: 'CourtMaster',
        description: 'Manage Tennis Tournaments Efficiently',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
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
        manualChunks: {
          // Core framework and large dependencies
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI components
          ui: [
            "@/components/ui/button",
            "@/components/ui/card",
            "@/components/ui/select",
          ],
          // Authentication
          auth: ["appwrite"],
          // Data visualization
          charts: ["recharts"],
          // Date handling
          dates: ["date-fns"],
          // Form handling
          forms: ["react-hook-form", "zod"],
        },
      },
    },
    // Enable source maps for production build for better error tracking
    sourcemap: true,
    // Target modern browsers for smaller bundle size
    target: "es2020",
    // Optimize CSS
    cssCodeSplit: true,
    // Adjust chunk size warning
    chunkSizeWarningLimit: 600,
    // Minification options
    assetsInlineLimit: 4096, // 4kb
  },
  // Disable the native module imports that are causing issues on Vercel
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
      // Force esbuild to ignore native Node.js modules
      define: {
        "process.env.ROLLUP_SKIP_NODEJS_NATIVE_ADDONS": JSON.stringify("true"),
        "process.env.ROLLUP_NATIVE_BINDINGS": JSON.stringify("false"),
        "process.env.ROLLUP_FORCE_JAVASCRIPT": JSON.stringify("true"),
      },
    },
  },
  // Enable tree shaking to eliminate dead code
  esbuild: {
    treeShaking: true,
  },
}));

