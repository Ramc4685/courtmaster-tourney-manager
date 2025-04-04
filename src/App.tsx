import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import Scoring from './pages/Scoring';
import PublicView from './pages/PublicView';
import StandaloneScoring from './pages/StandaloneScoring';
import Pricing from './pages/Pricing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournament/:tournamentId" element={<TournamentDetails />} />
        <Route path="/scoring/:tournamentId" element={<Scoring />} />
        <Route path="/public/:tournamentId" element={<PublicView />} />
        <Route path="/scoring/standalone" element={<StandaloneScoring />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </Router>
  );
}

export default App;
