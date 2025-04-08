import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@/pages/home';
import { TournamentProvider } from '@/contexts/tournament/TournamentContext';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout'; // Updated import
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
          <RoleBasedLayout> {/* Updated Layout wrapper */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tournaments" element={<TournamentList />} />
              <Route path="/tournament/create" element={<TournamentCreationForm />} />
              <Route path="/tournament/:id" element={<TournamentDetails />} />
              <Route 
                path="/scoring/:id" 
                element={
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
                } 
              />
              <Route 
                path="/scoring/standalone" 
                element={
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
                } 
              />
              <Route path="/public/:id" element={<PublicView />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </RoleBasedLayout> {/* Updated Layout closing tag */}
        </TournamentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;