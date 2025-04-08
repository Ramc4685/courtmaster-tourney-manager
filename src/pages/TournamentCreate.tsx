
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '@/contexts/tournament/useTournament';
import { Tournament } from '@/types/tournament';
import { toast } from '@/components/ui/use-toast';
import CreateTournamentForm from '@/components/admin/TournamentCreationForm';
import { TournamentFormValues } from '@/components/admin/tournament/types';

// This is a wrapper component that redirects properly after tournament creation
const TournamentCreatePage = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournament();

  const handleTournamentSubmit = async (data: TournamentFormValues) => {
    try {
      const result = await createTournament(data);
      console.log("Tournament created successfully:", result);
      
      toast({
        title: "Tournament Created",
        description: `${data.name} has been created successfully.`,
      });
      
      // Now that we have a tournament id, navigate to the detail page
      if (result && result.id) {
        navigate(`/tournament/${result.id}`);
      }
    } catch (error) {
      console.error("Failed to create tournament:", error);
      toast({
        title: "Error Creating Tournament",
        description: "There was a problem creating your tournament. Please try again.",
        variant: "destructive",
      });
    }
  };

  return <CreateTournamentForm onSubmit={handleTournamentSubmit} />;
};

export default TournamentCreatePage;
