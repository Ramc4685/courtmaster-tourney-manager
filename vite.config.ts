
import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Enable component tagger in development mode
    mode === 'development' && componentTagger(),
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    // Generate bundle visualizer in analyze mode
    mode === 'analyze' && visualizer({
      open: true,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
    // Enable Brotli & Gzip compression for production builds
    mode === 'production' && compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|webp)$/i],
    }),
    mode === 'production' && compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpe?g|gif|webp)$/i],
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Explicitly tell Vite how to handle directories vs files
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  // Optimization configuration
  build: {
    // Improve chunk size for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Core framework and large dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components
          ui: ['@/components/ui/button', '@/components/ui/card', '@/components/ui/select'],
          // Supabase and auth
          auth: ['@supabase/supabase-js'],
          // Data visualization
          charts: ['recharts'],
          // Date handling
          dates: ['date-fns'],
          // Form handling
          forms: ['react-hook-form', 'zod']
        }
      }
    },
    // Enable source maps for production build for better error tracking
    sourcemap: true,
    // Target modern browsers for smaller bundle size
    target: 'es2020',
    // Optimize CSS
    cssCodeSplit: true,
    // Adjust chunk size warning
    chunkSizeWarningLimit: 600,
    // Minification options
    minify: 'esbuild',
    assetsInlineLimit: 4096, // 4kb
  },
  // Disable the native module imports that are causing issues on Vercel
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Enable tree shaking to eliminate dead code
  esbuild: {
    treeShaking: true,
  }
}));
