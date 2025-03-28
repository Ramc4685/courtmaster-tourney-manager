
import { Tournament } from "@/types/tournament";
import { createDivisionPlacementMatches, createPlayoffKnockoutMatches } from "@/utils/tournamentProgressionUtils";

// Helper function to advance from Initial Round to Division Placement
export const advanceToDivisionPlacement = (currentTournament: Tournament): Tournament => {
  // Check if all matches in initial round are completed
  const initialMatches = currentTournament.matches.filter(
    m => m.stage === "INITIAL_ROUND"
  );
  
  if (initialMatches.some(m => m.status !== "COMPLETED")) {
    console.warn("Cannot advance until all initial round matches are completed");
    return currentTournament;
  }
  
  const newMatches = createDivisionPlacementMatches(currentTournament);
  
  return {
    ...currentTournament,
    matches: [...currentTournament.matches, ...newMatches],
    currentStage: "DIVISION_PLACEMENT",
    updatedAt: new Date()
  };
};

// Helper function to advance from Division Placement to Playoff Knockout
export const advanceToPlayoffKnockout = (currentTournament: Tournament): Tournament => {
  // Check if all matches in division placement are completed
  const divisionPlacementMatches = currentTournament.matches.filter(
    m => m.stage === "DIVISION_PLACEMENT"
  );
  
  if (divisionPlacementMatches.some(m => m.status !== "COMPLETED")) {
    console.warn("Cannot advance until all division placement matches are completed");
    return currentTournament;
  }
  
  const newMatches = createPlayoffKnockoutMatches(currentTournament);
  
  return {
    ...currentTournament,
    matches: [...currentTournament.matches, ...newMatches],
    currentStage: "PLAYOFF_KNOCKOUT",
    updatedAt: new Date()
  };
};
