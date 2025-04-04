
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/home'; // lowercase 'h' instead of uppercase 'H'
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail'; // Updated to correct path
import TournamentCreate from './pages/TournamentCreate';
import Scoring from './pages/Scoring';
import PublicView from './pages/PublicView';
import StandaloneScoring from './pages/StandaloneScoring';
import StandaloneMatchScoring from './pages/StandaloneMatchScoring';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Share from './pages/Share';
import { TournamentProvider } from './contexts/tournament/TournamentContext';
import { AuthProvider } from './contexts/auth/AuthContext';
import Layout from './components/layout/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TournamentProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournament/create" element={<TournamentCreate />} />
              <Route path="/tournament/:tournamentId" element={<TournamentDetail />} />
              <Route path="/scoring/:tournamentId" element={<Scoring />} />
              <Route path="/public/:tournamentId" element={<PublicView />} />
              <Route path="/scoring/standalone" element={<StandaloneScoring />} />
              <Route path="/scoring/standalone/:matchId" element={<StandaloneMatchScoring />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/share/tournament-:tournamentId" element={<Share />} />
            </Routes>
          </Layout>
        </TournamentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
