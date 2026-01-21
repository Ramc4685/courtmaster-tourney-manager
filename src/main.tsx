import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize error tracking and monitoring (side-effect imports)
// import '@/lib/monitoring/sentry' // Disabled for development
import '@/lib/monitoring/ErrorTracker'
import '@/lib/monitoring/PerformanceMonitorClean'
import '@/lib/network/fetchWrapper'

// Import and expose EnhancedOfflineManager for testing
import { enhancedOfflineManager } from '@/lib/offline/EnhancedOfflineManager'

// Expose for testing/debugging in development
if (import.meta.env.DEV || import.meta.env.NODE_ENV === 'test') {
  (window as any).enhancedOfflineManager = enhancedOfflineManager;
  console.log('🔧 EnhancedOfflineManager exposed globally for testing');
}

// Add more detailed debugging
console.log('Application starting...');

// Add console log to debug rendering
console.log('Initializing app render');

// Make sure we're finding the root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found! Check if the HTML file has a div with id='root'");
} else {
  console.log('Root element found, rendering app');
  try {
    const root = createRoot(rootElement);
    console.log('Root created successfully');
    root.render(
      <App />
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
  }
}
