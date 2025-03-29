
import { Tournament, Match, Court, CourtStatus } from "@/types/tournament";
import { findCourtById, findMatchById, updateCourtInTournament, updateMatchInTournament } from "./tournamentUtils";

// Assign court to match
export const assignCourtToMatch = (tournament: Tournament, matchId: string, courtId: string): Tournament | null => {
  const match = findMatchById(tournament, matchId);
  if (!match) return null;
  
  // Special case: removing court assignment
  if (courtId === "no-court") {
    return removeCourt(tournament, match);
  }
  
  const court = findCourtById(tournament, courtId);
  if (!court) return null;
  
  // If match already has a court assigned, free that court first
  if (match.courtNumber) {
    tournament = freeCourt(tournament, match.courtNumber);
  }
  
  // Update the match with court number
  const updatedMatch = {
    ...match,
    courtNumber: court.number
  };
  
  // Update the court status and current match
  const updatedCourt = {
    ...court,
    status: "IN_USE" as CourtStatus,
    currentMatch: updatedMatch
  };
  
  // Update both in the tournament
  let updatedTournament = updateMatchInTournament(tournament, updatedMatch);
  updatedTournament = updateCourtInTournament(updatedTournament, updatedCourt);
  
  return updatedTournament;
};

// Remove court assignment from a match
export const removeCourt = (tournament: Tournament, match: Match): Tournament => {
  // If match has a court assigned, free it
  if (match.courtNumber) {
    tournament = freeCourt(tournament, match.courtNumber);
  }
  
  // Update the match to remove court assignment
  const updatedMatch = {
    ...match,
    courtNumber: undefined
  };
  
  // Update the match in the tournament
  return updateMatchInTournament(tournament, updatedMatch);
};

// Free up a court
export const freeCourt = (tournament: Tournament, courtNumber: number): Tournament => {
  const courtIndex = tournament.courts.findIndex(c => c.number === courtNumber);
  
  if (courtIndex < 0) return tournament;
  
  const updatedCourts = [...tournament.courts];
  updatedCourts[courtIndex] = {
    ...updatedCourts[courtIndex],
    status: "AVAILABLE" as CourtStatus,
    currentMatch: undefined
  };
  
  return {
    ...tournament,
    courts: updatedCourts,
    updatedAt: new Date()
  };
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
