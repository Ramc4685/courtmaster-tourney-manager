
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import TournamentCreate from "./pages/tournament/TournamentCreate";
import { MatchStatus } from "./types/tournament-enums";
import Home from "./pages/home"; // Fixed casing issue

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
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournament/create" element={<TournamentCreate onTournamentCreated={() => {}} />} />
          {/* ... keep existing routes */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
