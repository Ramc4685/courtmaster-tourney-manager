
import {
  TournamentFormat,
  TournamentStatus,
  MatchStatus,
  CourtStatus,
  DivisionType,
  StageType,
  ScorerType,
  CategoryType,
  TournamentStage,
  Division
} from './tournament-enums';

// Core entity interfaces
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  division?: DivisionType;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TournamentCategory {
  id: string;
  name: string;
  type: CategoryType;
  division: string;
}

export interface Court {
  id: string;
  name: string;
  number?: number;
  status: CourtStatus;
  currentMatchId?: string;
  currentMatch?: Match;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  userName?: string;
  details: Record<string, any>;
  type?: string;
  metadata?: Record<string, any>;
}

export interface StandaloneAuditLog {
  timestamp: Date;
  action: string;
  details: string | Record<string, any>;
  user_id?: string;
  userName?: string;
}

export interface ScoreAuditLog {
  timestamp: Date;
  action: string;
  details: {
    score: string;
    scorer: string;
    setComplete: boolean;
    previousScore?: string;
    reason?: string;
  };
  user_id: string;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  isComplete?: boolean;
  winner?: 'team1' | 'team2' | null;
  duration?: number;
  auditLogs?: ScoreAuditLog[];
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber?: string;
  team1?: Team;
  team2?: Team;
  team1Id?: string;
  team2Id?: string;
  winner?: Team | "team1" | "team2";
  loser?: Team | "team1" | "team2";
  scores: MatchScore[];
  status: MatchStatus;
  courtNumber?: number;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  division?: Division;
  stage?: TournamentStage | StageType;
  round?: number;
  bracketRound?: number;
  bracketPosition?: number;
  nextMatchId?: string;
  nextMatchPosition?: "team1" | "team2";
  previousMatchIds?: string[];
  updatedAt?: Date;
  createdAt?: Date;
  updated_by?: string;
  category?: TournamentCategory;
  scorerName?: string;
  auditLogs?: AuditLog[];
}

export interface StandaloneMatch {
  id: string;
  matchNumber?: string;
  team1: Team;
  team2: Team;
  scheduledTime?: Date;
  completedTime?: Date;
  courtNumber?: number;
  courtName?: string;
  status: MatchStatus;
  scores: MatchScore[];
  winner?: Team;
  loser?: Team;
  categoryName?: string;
  tournamentName?: string;
  category?: TournamentCategory;
  auditLogs?: StandaloneAuditLog[];
  createdAt?: Date;
  updatedAt?: Date;
  created_by?: string;
  updated_by?: string;
  isPublic?: boolean;
  shareCode?: string;
  scorerName?: string;
  endTime?: Date;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  location?: string;
  registrationEnabled: boolean;
  registrationDeadline?: Date;
  maxTeams?: number;
  scoringRules?: string;
  scoringSettings?: ScoringSettings;
  categories: TournamentCategory[];
  teams: Team[];
  matches: Match[];
  courts: Court[];
  createdAt: Date;
  updatedAt: Date;
  currentStage?: TournamentStage;
  updated_by?: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  sport: string;
  maxPoints: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  maxSets: number;
  setsToWin: number;
  tiebreakRules?: {
    pointsToWin: number;
    requireTwoPointLead: boolean;
    maxPoints: number;
  };
  customRules?: Record<string, any>;
}

export interface ScoringSettings {
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  setsToWin?: number;
  tiebreakRules?: {
    pointsToWin: number;
    requireTwoPointLead: boolean;
    maxPoints: number;
  };
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Now fix the App.tsx issue with match scores
<lov-write file_path="src/App.tsx">
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
                      status: 'SCHEDULED',
                      scores: [] // Fix the missing scores property
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
                      status: 'SCHEDULED',
                      scores: [] // Fix the missing scores property
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
