
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useMatchFormLogic } from "./form/useMatchFormLogic";
import TeamFormSection from "./form/TeamFormSection";
import MatchDetailsSection from "./form/MatchDetailsSection";

// Schema definition for form values
export type FormValues = z.infer<typeof z.object({
  team1Name: z.string().min(1),
  team1Players: z.array(z.string()),
  team2Name: z.string().min(1),
  team2Players: z.array(z.string()),
  scheduledDate: z.date().optional(),
  courtName: z.string().optional(),
  tournamentName: z.string().optional(),
  categoryName: z.string().optional(),
  isPublic: z.boolean().default(false)
})>;

const StandaloneMatchForm: React.FC = () => {
  const {
    form,
    team1Players,
    team2Players,
    showTeam1Alert,
    showTeam2Alert,
    handleAddPlayer,
    handleRemovePlayer,
    handlePlayerChange,
    handleTeamNameChange,
    onSubmit
  } = useMatchFormLogic();

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create Quick Match</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Section */}
            <TeamFormSection 
              teamNumber="team1"
              teamName={form.watch('team1Name')}
              players={team1Players}
              onTeamNameChange={handleTeamNameChange}
              onPlayerChange={handlePlayerChange}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              showAlert={showTeam1Alert}
            />
            
            {/* Team 2 Section */}
            <TeamFormSection 
              teamNumber="team2"
              teamName={form.watch('team2Name')}
              players={team2Players}
              onTeamNameChange={handleTeamNameChange}
              onPlayerChange={handlePlayerChange}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              showAlert={showTeam2Alert}
            />
          </div>
          
          {/* Optional Fields */}
          <MatchDetailsSection form={form} />
          
          <div className="flex justify-end">
            <Button type="submit" className="bg-court-green hover:bg-court-green/90">
              Create Match
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StandaloneMatchForm;
