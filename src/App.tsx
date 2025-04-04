
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/home';
import Tournaments from '@/pages/Tournaments';
import TournamentCreate from '@/pages/tournament/TournamentCreate';
import TournamentDetail from '@/pages/TournamentDetail';
import Scoring from '@/pages/Scoring';
import StandaloneScoring from '@/pages/StandaloneScoring';
import Settings from '@/pages/Settings';
import { TournamentProvider } from '@/contexts/tournament/TournamentContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TournamentProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournament/create" element={<TournamentCreate />} />
                <Route path="/tournament/:tournamentId" element={<TournamentDetail />} />
                <Route path="/scoring" element={<Scoring />} />
                <Route path="/scoring/:tournamentId" element={<Scoring />} />
                <Route path="/scoring/standalone" element={<StandaloneScoring />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
            <Toaster />
          </Router>
        </TournamentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
