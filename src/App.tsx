import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from "@/components/shared/Layout"
import Tournaments from "@/pages/Tournaments";
import TournamentCreate from "@/pages/TournamentCreate";
import TournamentDetail from "@/pages/TournamentDetail";
import Scoring from "@/pages/Scoring";
import Index from "@/pages/Index";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import PublicView from "@/pages/PublicView";
import PublicViewRealtime from "@/pages/PublicViewRealtime";
import QuickMatchPage from "@/pages/QuickMatch";

// Import necessary providers
import { ToastProvider } from "@/hooks/use-toast"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { StandaloneMatchProvider } from "@/contexts/StandaloneMatchContext";

function App() {
  // Create a client
  const [queryClient] = React.useState(() => new QueryClient());

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournament/create" element={<TournamentCreate />} />
          <Route path="tournament/:tournamentId" element={<TournamentDetail />} />
          <Route path="scoring" element={<Scoring />} />
          <Route path="quick-match" element={<QuickMatchPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/share/:shareCode" element={<PublicView />} />
        <Route path="/share/rt/:shareCode" element={<PublicViewRealtime />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
