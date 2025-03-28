import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import TournamentDetail from './pages/TournamentDetail';
import Scoring from './pages/Scoring';
import PublicView from './pages/PublicView';
import PublicViewRealtime from './pages/PublicViewRealtime';
import { TournamentProvider } from './contexts/TournamentContext';

function App() {
  return (
    <TournamentProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournament/:tournamentId" element={<TournamentDetail />} />
          <Route path="/scoring/:tournamentId" element={<Scoring />} />
          <Route path="/public/:tournamentId?" element={<PublicView />} />
          <Route path="/public-live/:tournamentId?" element={<PublicViewRealtime />} />
        </Routes>
      </Router>
    </TournamentProvider>
  );
}

export default App;
