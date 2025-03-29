import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Tournaments from './pages/Tournaments';
import TournamentCreate from './pages/TournamentCreate';
import TournamentEdit from './pages/TournamentEdit';
import PublicView from './pages/PublicView';
import PublicViewRealtime from './pages/PublicViewRealtime';
import Scoring from './pages/Scoring';
import { AuthProvider } from './contexts/auth/AuthContext';
import { TournamentProvider } from './contexts/tournament/TournamentContext';
import { SupabaseProvider } from './contexts/supabase/SupabaseContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Account from './pages/Account';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
    <SupabaseProvider>
      <AuthProvider>
        <TournamentProvider>
          <Router>
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
              <Route path="/tournaments/create" element={<ProtectedRoute><TournamentCreate /></ProtectedRoute>} />
              <Route path="/tournaments/:tournamentId/edit" element={<ProtectedRoute><TournamentEdit /></ProtectedRoute>} />
              <Route path="/tournaments/:tournamentId/scoring" element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
              <Route path="/public/:tournamentId" element={<PublicView />} />
              <Route path="/public/realtime/:tournamentId" element={<PublicViewRealtime />} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            </Routes>
          </Router>
        </TournamentProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
}

export default App;
