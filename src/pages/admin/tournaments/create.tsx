import React from "react";
import { useNavigate } from "react-router-dom";
import { useTournament } from "@/contexts/tournament/useTournament";
import CreateTournamentForm from "@/components/admin/tournament/CreateTournamentForm";
import { TournamentFormValues } from "@/components/admin/tournament/types";

const CreateTournamentPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTournament } = useTournament();

  const handleSubmit = async (data: TournamentFormValues) => {
    try {
      await createTournament(data);
      navigate("/admin/tournaments");
    } catch (error) {
      console.error("Failed to create tournament:", error);
      // TODO: Show error notification
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Tournament</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new tournament
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <CreateTournamentForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default CreateTournamentPage; 