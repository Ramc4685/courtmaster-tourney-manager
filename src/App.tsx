
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/home';
import { TournamentProvider } from './contexts/tournament/TournamentContext';
import { AuthProvider } from './contexts/auth/AuthContext';
import Layout from './components/layout/Layout';
import TournamentCreationForm from './components/admin/tournament/TournamentCreationForm';
import { TournamentList } from './components/tournament/TournamentList';
import TournamentView from './components/tournament/TournamentView';
import ScoringView from './components/scoring/ScoringView';
import PublicView from './components/public/PublicView';
import Profile from './components/profile/Profile';
import Settings from './components/settings/Settings';
import AdminDashboard from './components/admin/AdminDashboard';
import Login from './components/auth/Login';
import { getDefaultScoringSettings } from './utils/matchUtils';

function App() {
  // Add debugging
  useEffect(() => {
    console.log('App component mounted');
    return () => {
      console.log('App component unmounted');
    };
  }, []);

  console.log('App component rendering');

  return (
    <Router>
      <AuthProvider>
        <TournamentProvider>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/tournaments" element={<Layout><TournamentList /></Layout>} />
            <Route path="/tournament/create" element={<Layout><TournamentCreationForm /></Layout>} />
            <Route path="/tournament/:id" element={<Layout><TournamentView /></Layout>} />
            <Route 
              path="/scoring/:id" 
              element={
                <Layout>
                  <ScoringView 
                    match={{
                      id: 'placeholder',
                      tournamentId: 'placeholder',
                      status: 'SCHEDULED' as MatchStatus,
                      scores: []
                    }}
                    scoringSettings={getDefaultScoringSettings()}
                    onMatchComplete={(matchId, winnerId) => {
                      console.log(`Match ${matchId} completed, winner: ${winnerId}`);
                    }}
                  />
                </Layout>
              } 
            />
            <Route 
              path="/scoring/standalone" 
              element={
                <Layout>
                  <ScoringView 
                    match={{
                      id: 'placeholder',
                      tournamentId: 'placeholder',
                      status: 'SCHEDULED' as MatchStatus,
                      scores: []
                    }}
                    scoringSettings={getDefaultScoringSettings()}
                    onMatchComplete={(matchId, winnerId) => {
                      console.log(`Match ${matchId} completed, winner: ${winnerId}`);
                    }}
                  />
                </Layout>
              } 
            />
            <Route path="/public/:id" element={<Layout><PublicView /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
          </Routes>
        </TournamentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
