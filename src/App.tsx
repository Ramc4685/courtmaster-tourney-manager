
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from "@/components/layout/Layout";
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { StandaloneMatchProvider } from "@/contexts/StandaloneMatchContext";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth/AuthContext";

function App() {
  // Create a client
  const queryClient = new QueryClient();

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TournamentProvider>
          <StandaloneMatchProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="tournaments" element={<Tournaments />} />
                  <Route path="tournament/create" element={<TournamentCreate />} />
                  <Route path="tournament/:tournamentId" element={<TournamentDetail />} />
                  <Route path="scoring/:tournamentId" element={<Scoring />} />
                  <Route path="quick-match" element={<QuickMatchPage />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
                <Route path="/share/:tournamentId" element={<PublicView />} />
                <Route path="/share/rt/:tournamentId" element={<PublicViewRealtime />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
          </StandaloneMatchProvider>
        </TournamentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
