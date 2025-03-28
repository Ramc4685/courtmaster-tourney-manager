
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division } from "@/types/tournament";

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament) => void;
  createTournament: (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches">) => void;
  updateTournament: (tournament: Tournament) => void;
  addTeam: (team: Team) => void;
  updateMatch: (match: Match) => void;
  updateCourt: (court: Court) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  updateMatchScore: (matchId: string, team1Score: number, team2Score: number) => void;
  completeMatch: (matchId: string) => void;
  moveTeamToDivision: (teamId: string, fromDivision: Division, toDivision: Division) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);

  // Generate unique ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Create a new tournament
  const createTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches">) => {
    const newTournament: Tournament = {
      ...tournamentData,
      id: generateId(),
      matches: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setTournaments([...tournaments, newTournament]);
    setCurrentTournament(newTournament);
  };

  // Update tournament
  const updateTournament = (tournament: Tournament) => {
    const updatedTournament = { 
      ...tournament, 
      updatedAt: new Date() 
    };
    
    setTournaments(
      tournaments.map(t => t.id === tournament.id ? updatedTournament : t)
    );
    
    if (currentTournament?.id === tournament.id) {
      setCurrentTournament(updatedTournament);
    }
  };

  // Add team to current tournament
  const addTeam = (team: Team) => {
    if (!currentTournament) return;
    
    const updatedTournament = {
      ...currentTournament,
      teams: [...currentTournament.teams, team],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Update match
  const updateMatch = (match: Match) => {
    if (!currentTournament) return;
    
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === match.id ? match : m
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Update court
  const updateCourt = (court: Court) => {
    if (!currentTournament) return;
    
    const updatedCourts = currentTournament.courts.map(c => 
      c.id === court.id ? court : c
    );
    
    const updatedTournament = {
      ...currentTournament,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Assign court to match
  const assignCourt = (matchId: string, courtId: string) => {
    if (!currentTournament) return;
    
    const match = currentTournament.matches.find(m => m.id === matchId);
    const court = currentTournament.courts.find(c => c.id === courtId);
    
    if (!match || !court) return;
    
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
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedCourts = currentTournament.courts.map(c => 
      c.id === courtId ? updatedCourt : c
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Update match status
  const updateMatchStatus = (matchId: string, status: MatchStatus) => {
    if (!currentTournament) return;
    
    const match = currentTournament.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const updatedMatch = {
      ...match,
      status
    };
    
    // If the match is completed or cancelled, free up the court
    if (status === "COMPLETED" || status === "CANCELLED") {
      if (match.courtNumber) {
        const court = currentTournament.courts.find(c => c.number === match.courtNumber);
        if (court) {
          const updatedCourt = {
            ...court,
            status: "AVAILABLE" as const,
            currentMatch: undefined
          };
          
          const updatedCourts = currentTournament.courts.map(c => 
            c.id === court.id ? updatedCourt : c
          );
          
          const updatedMatches = currentTournament.matches.map(m => 
            m.id === matchId ? updatedMatch : m
          );
          
          const updatedTournament = {
            ...currentTournament,
            matches: updatedMatches,
            courts: updatedCourts,
            updatedAt: new Date()
          };
          
          updateTournament(updatedTournament);
          return;
        }
      }
    }
    
    // If no court update needed, just update the match
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Update match score
  const updateMatchScore = (matchId: string, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;
    
    const match = currentTournament.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const updatedScores = [...match.scores];
    const currentSetIndex = updatedScores.length - 1;
    
    if (currentSetIndex < 0 || updatedScores[currentSetIndex].team1Score >= 21 || updatedScores[currentSetIndex].team2Score >= 21) {
      // Start a new set if needed
      updatedScores.push({ team1Score, team2Score });
    } else {
      // Update current set
      updatedScores[currentSetIndex] = { team1Score, team2Score };
    }
    
    const updatedMatch = {
      ...match,
      scores: updatedScores
    };
    
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Complete a match
  const completeMatch = (matchId: string) => {
    if (!currentTournament) return;
    
    const match = currentTournament.matches.find(m => m.id === matchId);
    if (!match) return;
    
    // Determine winner based on scores
    let team1Sets = 0;
    let team2Sets = 0;
    
    match.scores.forEach(score => {
      if (score.team1Score > score.team2Score) {
        team1Sets++;
      } else if (score.team2Score > score.team1Score) {
        team2Sets++;
      }
    });
    
    const winner = team1Sets > team2Sets ? match.team1 : match.team2;
    
    const updatedMatch = {
      ...match,
      status: "COMPLETED" as MatchStatus,
      winner
    };
    
    // Free up the court
    const updatedCourts = [...currentTournament.courts];
    if (match.courtNumber) {
      const courtIndex = updatedCourts.findIndex(c => c.number === match.courtNumber);
      if (courtIndex >= 0) {
        updatedCourts[courtIndex] = {
          ...updatedCourts[courtIndex],
          status: "AVAILABLE" as const,
          currentMatch: undefined
        };
      }
    }
    
    const updatedMatches = currentTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Move team to a different division based on results
  const moveTeamToDivision = (teamId: string, fromDivision: Division, toDivision: Division) => {
    if (!currentTournament) return;
    
    // Logic to move teams between divisions based on match results
    // This would involve creating new matches in the target division
    
    // For simplicity, we're just updating existing matches' division
    const updatedMatches = currentTournament.matches.map(match => {
      if ((match.team1.id === teamId || match.team2.id === teamId) && match.division === fromDivision && match.status !== "COMPLETED") {
        return { ...match, division: toDivision };
      }
      return match;
    });
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  const value = {
    tournaments,
    currentTournament,
    setCurrentTournament,
    createTournament,
    updateTournament,
    addTeam,
    updateMatch,
    updateCourt,
    assignCourt,
    updateMatchStatus,
    updateMatchScore,
    completeMatch,
    moveTeamToDivision
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
