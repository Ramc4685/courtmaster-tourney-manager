import { Toaster } from 'sonner';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppRouter } from './router';
import { AppErrorBoundary } from '@/components/common/ErrorBoundary';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { MobileNavigationProvider } from '@/components/mobile/MobileNavigationProvider';
import { ContextualHelpProvider, HelpButton } from '@/components/help/ContextualHelpSystem';
import { TouchOptimizedStyles } from '@/components/mobile/TouchOptimizedComponents';
import { useEffect } from 'react';
import { pwaManager } from '@/lib/pwa/PWAManager';

// Initialize PWA Manager and monitoring
const initializeApp = async () => {
  try {
    // Initialize PWA features
    await pwaManager.checkForUpdates();
    
    // Initialize performance monitoring in production (when available)
    if (import.meta.env.PROD) {
      try {
        // Dynamic import will be available when PerformanceMonitor is implemented
        const performanceModule = await import('@/lib/monitoring/PerformanceMonitor').catch(() => null);
        if (performanceModule?.PerformanceMonitor) {
          const performanceMonitor = new performanceModule.PerformanceMonitor();
          performanceMonitor.start?.();
        }
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }
  } catch (error) {
    console.error('App initialization failed:', error);
  }
};

function AppContent() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <AccessibilityProvider>
      <MobileNavigationProvider>
        <ContextualHelpProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AppRouter />
            <Toaster />
            <HelpButton />
            <TouchOptimizedStyles />
          </LocalizationProvider>
        </ContextualHelpProvider>
      </MobileNavigationProvider>
    </AccessibilityProvider>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}
