
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Try to import the component tagger in a way that won't break builds
let componentTagger;
try {
  // Using a static import pattern that Vite can handle
  componentTagger = require("lovable-tagger")?.componentTagger;
} catch (e) {
  // If the import fails, set to undefined
  componentTagger = undefined;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only use component tagger in development mode
    mode === 'development' && componentTagger && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build configuration optimizations for deployment
  build: {
    // Improve chunk size for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@/components/ui'],
        }
      }
    },
    // Generate source maps for production build
    sourcemap: true,
  }
}));
