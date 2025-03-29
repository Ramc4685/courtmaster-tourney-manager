
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import TournamentDetail from './pages/TournamentDetail';
import Scoring from './pages/Scoring';
import PublicView from './pages/PublicView';
import PublicViewRealtime from './pages/PublicViewRealtime';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import TournamentCreate from './pages/TournamentCreate';
import Tournaments from './pages/Tournaments';
import { TournamentProvider } from './contexts/TournamentContext';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/create" element={<TournamentCreate />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetail />} />
            <Route path="/scoring/:tournamentId" element={<Scoring />} />
            <Route path="/public/:tournamentId?" element={<PublicView />} />
            <Route path="/public-live/:tournamentId?" element={<PublicViewRealtime />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
        <Toaster />
        <Analytics />
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
