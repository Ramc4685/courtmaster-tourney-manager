
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import TournamentCreate from "./pages/tournament/TournamentCreate";
import TournamentView from "./pages/tournament/TournamentView";
import { MatchStatus } from "./types/tournament-enums";
import Home from "./pages/home"; // Changed to match actual file name casing

const App: React.FC = () => {
  const sampleMatches = [
    {
      id: "match1",
      tournamentId: "tournament1",
      status: MatchStatus.SCHEDULED,
      // ... other match properties
    },
    {
      id: "match2",
      tournamentId: "tournament2",
      status: MatchStatus.SCHEDULED,
      // ... other match properties
    },
  ];

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournament/create" element={<TournamentCreate onTournamentCreated={() => {}} />} />
          <Route path="/tournament/:id" element={<TournamentView />} />
          {/* ... keep existing routes */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
