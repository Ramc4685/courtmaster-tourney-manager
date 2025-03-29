
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { TournamentProvider } from './contexts/tournament/TournamentContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { lazyWithRetry } from './utils/lazyImports';
import { Toaster } from 'sonner';
import Index from './pages/Index'; // Import Index directly to prevent issues with lazy loading

// Lazy-loaded components for better performance
const Tournaments = lazyWithRetry(() => import('./pages/Tournaments'));
const TournamentCreate = lazyWithRetry(() => import('./pages/TournamentCreate')); // Ensure this points to the correct file
const TournamentDetail = lazyWithRetry(() => import('./pages/TournamentDetail'));
const PublicView = lazyWithRetry(() => import('./pages/PublicView'));
const Public = lazyWithRetry(() => import('./pages/Public'));
const PublicViewRealtime = lazyWithRetry(() => import('./pages/PublicViewRealtime'));
const Scoring = lazyWithRetry(() => import('./pages/Scoring'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));

/**
 * Root App component with optimized route loading and performance monitoring
 */
function App() {
  // Add performance monitoring
  useEffect(() => {
    console.log('App component mounted');
    // Track page load performance
    if (typeof window !== 'undefined' && 'performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfEntries = performance.getEntriesByType('navigation');
          if (perfEntries.length > 0) {
            const metrics = perfEntries[0] as PerformanceNavigationTiming;
            console.info('Performance metrics:', {
              dnsLookup: metrics.domainLookupEnd - metrics.domainLookupStart,
              tcpConnection: metrics.connectEnd - metrics.connectStart,
              serverResponse: metrics.responseEnd - metrics.requestStart,
              domParsing: metrics.domInteractive - metrics.responseEnd,
              resourceLoading: metrics.loadEventStart - metrics.domContentLoadedEventEnd,
              totalPageLoad: metrics.loadEventEnd - metrics.startTime,
            });
          }
        }, 0);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <TournamentProvider>
        <Router>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/tournaments/create" element={<ProtectedRoute><TournamentCreate /></ProtectedRoute>} />
              <Route path="/tournaments/:tournamentId" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
              <Route path="/tournaments/:tournamentId/scoring" element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
              <Route path="/scoring/:tournamentId" element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
              <Route path="/public" element={<Public />} />
              <Route path="/public/:tournamentId" element={<PublicView />} />
              <Route path="/public/realtime/:tournamentId" element={<PublicViewRealtime />} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </Router>
        <Toaster position="top-right" />
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
