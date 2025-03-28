
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import TournamentDetail from './pages/TournamentDetail';
import Scoring from './pages/Scoring';
import PublicView from './pages/PublicView';
import PublicViewRealtime from './pages/PublicViewRealtime';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { TournamentProvider } from './contexts/TournamentContext';
import { AuthProvider } from './contexts/auth/AuthContext';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tournament/:tournamentId" element={<TournamentDetail />} />
            <Route path="/scoring/:tournamentId" element={<Scoring />} />
            <Route path="/public/:tournamentId?" element={<PublicView />} />
            <Route path="/public-live/:tournamentId?" element={<PublicViewRealtime />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Router>
        <Toaster />
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
