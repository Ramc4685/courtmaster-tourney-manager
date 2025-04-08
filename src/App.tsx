import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@/pages/home';
import { TournamentProvider } from '@/contexts/tournament/TournamentContext';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import Layout from '@/components/layout/Layout';
import TournamentCreationForm from '@/components/admin/tournament/TournamentCreationForm';
import { TournamentList } from '@/components/tournament/TournamentList';
import TournamentDetails from '@/pages/tournament/TournamentDetails';
import { ScoringView } from '@/components/match/ScoringView';
import PublicView from '@/components/public/PublicView';
import Profile from '@/components/profile/Profile';
import Settings from '@/components/settings/Settings';
import AdminDashboard from '@/components/admin/AdminDashboard';
import Login from '@/components/auth/Login';
import { getDefaultScoringSettings } from '@/utils/matchUtils';
import { MatchStatus, TournamentStage, Division } from '@/types/tournament-enums';

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
            <Route path="/tournament/:id" element={<Layout><TournamentDetails /></Layout>} />
            <Route 
              path="/scoring/:id" 
              element={
                <Layout>
                  <ScoringView 
                    match={{
                      id: 'placeholder',
                      tournamentId: 'placeholder',
                      team1Id: 'placeholder',
                      team2Id: 'placeholder',
                      status: MatchStatus.SCHEDULED,
                      division: Division.MENS,
                      stage: TournamentStage.GROUP_STAGE,
                      round: 1,
                      scores: {
                        team1: [],
                        team2: []
                      },
                      auditLogs: [],
                      createdAt: new Date(),
                      updatedAt: new Date()
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
                      team1Id: 'placeholder',
                      team2Id: 'placeholder',
                      status: MatchStatus.SCHEDULED,
                      division: Division.MENS,
                      stage: TournamentStage.GROUP_STAGE,
                      round: 1,
                      scores: {
                        team1: [],
                        team2: []
                      },
                      auditLogs: [],
                      createdAt: new Date(),
                      updatedAt: new Date()
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
