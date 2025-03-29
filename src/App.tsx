
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { TournamentProvider } from './contexts/tournament/TournamentContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { lazyWithRetry } from './utils/lazyImports';

// Lazy-loaded components for better performance
const Tournaments = lazyWithRetry(() => import('./pages/Tournaments'));
const TournamentCreate = lazyWithRetry(() => import('./pages/tournament/TournamentCreate'));
const TournamentDetail = lazyWithRetry(() => import('./pages/TournamentDetail'));
const PublicView = lazyWithRetry(() => import('./pages/PublicView'));
const PublicViewRealtime = lazyWithRetry(() => import('./pages/PublicViewRealtime'));
const Scoring = lazyWithRetry(() => import('./pages/Scoring'));

/**
 * Root App component with optimized route loading and performance monitoring
 */
function App() {
  // Add performance monitoring
  useEffect(() => {
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
              <Route path="/" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/tournaments/create" element={<ProtectedRoute><TournamentCreate /></ProtectedRoute>} />
              <Route path="/tournaments/:tournamentId" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
              <Route path="/tournaments/:tournamentId/scoring" element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
              <Route path="/public/:tournamentId" element={<PublicView />} />
              <Route path="/public/realtime/:tournamentId" element={<PublicViewRealtime />} />
            </Routes>
          </Suspense>
        </Router>
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
