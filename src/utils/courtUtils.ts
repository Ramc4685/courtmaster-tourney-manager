
import { Tournament, Match, Court } from "@/types/tournament";
import { findCourtById, findMatchById, updateCourtInTournament, updateMatchInTournament } from "./tournamentUtils";

// Assign court to match
export const assignCourtToMatch = (tournament: Tournament, matchId: string, courtId: string): Tournament | null => {
  const match = findMatchById(tournament, matchId);
  const court = findCourtById(tournament, courtId);
  
  if (!match || !court) return null;
  
  // Update the match with court number
  const updatedMatch = {
    ...match,
    courtNumber: court.number
  };
  
  // Update the court status and current match
  const updatedCourt = {
    ...court,
    status: "IN_USE" as const,
    currentMatch: updatedMatch
  };
  
  // Update both in the tournament
  let updatedTournament = updateMatchInTournament(tournament, updatedMatch);
  updatedTournament = updateCourtInTournament(updatedTournament, updatedCourt);
  
  return updatedTournament;
};

// Auto-assign courts to scheduled matches
export const autoAssignCourts = (tournament: Tournament): { tournament: Tournament, assignedCount: number } => {
  const availableCourts = tournament.courts.filter(c => c.status === "AVAILABLE");
  const scheduledMatches = tournament.matches.filter(
    m => m.status === "SCHEDULED" && !m.courtNumber
  );
  
  // Sort matches by scheduled time
  scheduledMatches.sort((a, b) => {
    if (!a.scheduledTime) return 1;
    if (!b.scheduledTime) return -1;
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
  });
  
  // Get a copy of the tournament to work with
  let updatedTournament = { ...tournament };
  let assignedCount = 0;
  
  // Process each match that needs a court
  for (let i = 0; i < scheduledMatches.length; i++) {
    const match = scheduledMatches[i];
    
    // See if there's an available court
    const availableCourtIndex = updatedTournament.courts.findIndex(c => c.status === "AVAILABLE");
    
    if (availableCourtIndex >= 0) {
      // We found an available court
      const court = updatedTournament.courts[availableCourtIndex];
      
      // Assign the court to the match
      const result = assignCourtToMatch(updatedTournament, match.id, court.id);
      
      if (result) {
        updatedTournament = result;
        assignedCount++;
      }
    } else {
      // No more courts available, we're done
      break;
    }
  }
  
  return { tournament: updatedTournament, assignedCount };
};
