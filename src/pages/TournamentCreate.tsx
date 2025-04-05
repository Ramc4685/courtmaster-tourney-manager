
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TournamentCreateComponent from './tournament/TournamentCreate';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tournament } from '@/types/tournament';
import { toast } from '@/components/ui/use-toast';

// This is a wrapper component that redirects properly after tournament creation
const TournamentCreatePage = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournament();

  const handleTournamentCreated = (tournament: Tournament) => {
    console.log("Tournament created successfully:", tournament);
    
    toast({
      title: "Tournament Created",
      description: `${tournament.name} has been created successfully.`,
    });
    
    navigate(`/tournament/${tournament.id}`);
  };

  return <TournamentCreateComponent onTournamentCreated={handleTournamentCreated} />;
};

export default TournamentCreatePage;
