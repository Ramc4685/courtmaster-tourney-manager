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
import TournamentManagement from "@/components/admin/TournamentManagement";
import TournamentCreationForm from "@/components/admin/TournamentCreationForm";

function App() {
  return (
    <Router>
      <AuthProvider>
        <TournamentProvider>
          <Routes>
            <Route path="/" element={
              <Layout>
                <Home />
              </Layout>
            } />
            <Route path="/login" element={
              <Layout>
                <Login />
              </Layout>
            } />
            <Route path="/tournaments" element={
              <Layout>
                <Tournaments />
              </Layout>
            } />
            <Route path="/tournaments/new" element={
              <Layout>
                <TournamentCreate />
              </Layout>
            } />
            <Route path="/tournament/create" element={
              <Layout>
                <TournamentCreate />
              </Layout>
            } />
            <Route path="/tournament/:tournamentId" element={
              <Layout>
                <TournamentDetail />
              </Layout>
            } />
            <Route path="/scoring/:tournamentId" element={
              <Layout>
                <Scoring />
              </Layout>
            } />
            <Route path="/scoring/:tournamentId/:matchId" element={
              <Layout>
                <Scoring />
              </Layout>
            } />
            <Route path="/public/:tournamentId" element={
              <Layout>
                <PublicView />
              </Layout>
            } />
            <Route path="/scoring/standalone" element={
              <Layout>
                <StandaloneScoring />
              </Layout>
            } />
            <Route path="/scoring/standalone/:matchId" element={
              <Layout>
                <StandaloneMatchScoring />
              </Layout>
            } />
            <Route path="/pricing" element={
              <Layout>
                <Pricing />
              </Layout>
            } />
            <Route path="/share/:tournamentId" element={
              <Layout>
                <Share />
              </Layout>
            } />
            <Route path="/tournaments" element={<TournamentManagement />} />
            <Route path="/tournaments/create" element={<TournamentCreationForm />} />
          </Routes>
        </TournamentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
