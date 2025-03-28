
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TournamentProvider } from "@/contexts/TournamentContext";
import Index from "./pages/Index";
import Tournaments from "./pages/Tournaments";
import TournamentCreate from "./pages/TournamentCreate";
import Scoring from "./pages/Scoring";
import PublicView from "./pages/PublicView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TournamentProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/create" element={<TournamentCreate />} />
            <Route path="/tournaments/:tournamentId" element={<Tournaments />} />
            <Route path="/scoring" element={<Scoring />} />
            <Route path="/scoring/:tournamentId" element={<Scoring />} />
            <Route path="/public" element={<PublicView />} />
            <Route path="/public/:tournamentId" element={<PublicView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TournamentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
