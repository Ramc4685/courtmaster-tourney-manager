
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division, TournamentStage, ScoringSettings } from "@/types/tournament";
import { createSampleData } from "@/utils/tournamentSampleData";
import { generateId, findMatchById, findCourtByNumber, updateMatchInTournament } from "@/utils/tournamentUtils";
import { determineMatchWinnerAndLoser, updateBracketProgression, getDefaultScoringSettings } from "@/utils/matchUtils";
import { createInitialRoundMatches, createDivisionPlacementMatches, createPlayoffKnockoutMatches } from "@/utils/tournamentProgressionUtils";
import { assignCourtToMatch, autoAssignCourts } from "@/utils/courtUtils";
import { createMatch } from "@/utils/matchUtils";

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament) => void;
  createTournament: (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => void;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (tournamentId: string) => void;
  addTeam: (team: Team) => void;
  importTeams: (teams: Team[]) => void;
  updateMatch: (match: Match) => void;
  updateCourt: (court: Court) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number) => void;
  completeMatch: (matchId: string) => void;
  moveTeamToDivision: (teamId: string, fromDivision: Division, toDivision: Division) => void;
  loadSampleData: () => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => void;
  generateBracket: () => void;
  autoAssignCourts: () => number;
  generateMultiStageTournament: () => void;
  advanceToNextStage: () => void;
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
  // Initialize state from localStorage if available, otherwise use empty arrays/null
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const storedTournaments = localStorage.getItem('tournaments');
    return storedTournaments ? JSON.parse(storedTournaments) : [];
  });
  
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(() => {
    const storedCurrentTournament = localStorage.getItem('currentTournament');
    return storedCurrentTournament ? JSON.parse(storedCurrentTournament) : null;
  });

  // Save to localStorage whenever tournaments or currentTournament change
  useEffect(() => {
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    if (currentTournament) {
      localStorage.setItem('currentTournament', JSON.stringify(currentTournament));
    }
  }, [currentTournament]);

  // Create a new tournament
  const createTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => {
    const newTournament: Tournament = {
      ...tournamentData,
      id: generateId(),
      matches: [],
      currentStage: "INITIAL_ROUND", // Default stage
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedTournaments = [...tournaments, newTournament];
    setTournaments(updatedTournaments);
    setCurrentTournament(newTournament);
  };

  // Delete tournament
  const deleteTournament = (tournamentId: string) => {
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    setTournaments(updatedTournaments);
    
    if (currentTournament?.id === tournamentId) {
      setCurrentTournament(null);
    }
  };

  // Update tournament
  const updateTournament = (tournament: Tournament) => {
    const updatedTournament = { 
      ...tournament, 
      updatedAt: new Date() 
    };
    
    const updatedTournaments = tournaments.map(t => 
      t.id === tournament.id ? updatedTournament : t
    );
    
    setTournaments(updatedTournaments);
    
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

  // Import multiple teams at once
  const importTeams = (teams: Team[]) => {
    if (!currentTournament) return;
    
    const updatedTournament = {
      ...currentTournament,
      teams: [...currentTournament.teams, ...teams],
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Update match
  const updateMatch = (match: Match) => {
    if (!currentTournament) return;
    
    const updatedTournament = updateMatchInTournament(currentTournament, match);
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
    
    const result = assignCourtToMatch(currentTournament, matchId, courtId);
    if (result) {
      updateTournament(result);
    }
  };

  // Auto-assign available courts to scheduled matches
  const autoAssignCourtsHandler = () => {
    if (!currentTournament) return 0;
    
    const { tournament: updatedTournament, assignedCount } = autoAssignCourts(currentTournament);
    
    if (assignedCount > 0) {
      updateTournament(updatedTournament);
    }
    
    return assignedCount;
  };

  // Update match status
  const updateMatchStatus = (matchId: string, status: MatchStatus) => {
    if (!currentTournament) return;
    
    const match = findMatchById(currentTournament, matchId);
    if (!match) return;
    
    const updatedMatch = {
      ...match,
      status
    };
    
    // If the match is completed or cancelled, free up the court
    if ((status === "COMPLETED" || status === "CANCELLED") && match.courtNumber) {
      const courtToUpdate = findCourtByNumber(currentTournament, match.courtNumber);
      
      if (courtToUpdate) {
        const updatedCourt = {
          ...courtToUpdate,
          status: "AVAILABLE" as const,
          currentMatch: undefined
        };
        
        const updatedCourts = currentTournament.courts.map(c => 
          c.id === courtToUpdate.id ? updatedCourt : c
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

  // Update match score - modified to accept setIndex parameter
  const updateMatchScore = (matchId: string, setIndex: number, team1Score: number, team2Score: number) => {
    if (!currentTournament) return;
    
    console.log(`Updating match ${matchId} score at set ${setIndex}: ${team1Score}-${team2Score}`);
    
    const match = findMatchById(currentTournament, matchId);
    if (!match) {
      console.error("Match not found:", matchId);
      return;
    }
    
    const updatedScores = [...match.scores];
    
    // Ensure we have enough sets
    while (updatedScores.length <= setIndex) {
      updatedScores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Update the score at the specified index
    updatedScores[setIndex] = { team1Score, team2Score };
    
    const updatedMatch = {
      ...match,
      scores: updatedScores
    };
    
    console.log("Updated match scores:", updatedScores);
    
    updateMatch(updatedMatch);
  };

  // Complete a match and auto-assign court to next match
  const completeMatch = (matchId: string) => {
    if (!currentTournament) return;
    
    const match = findMatchById(currentTournament, matchId);
    if (!match) return;
    
    // Get scoring settings from tournament or use defaults
    const scoringSettings = currentTournament.scoringSettings || getDefaultScoringSettings();
    
    // Determine winner based on scores
    const result = determineMatchWinnerAndLoser(match, scoringSettings);
    if (!result) {
      console.error("Unable to determine winner and loser for match:", matchId);
      return;
    }
    
    const { winner, loser } = result;
    
    console.log(`Match ${matchId} completed. Winner: ${winner.name}, Loser: ${loser.name}`);
    
    const updatedMatch = {
      ...match,
      status: "COMPLETED" as MatchStatus,
      winner,
      loser
    };
    
    // Free up the court
    let updatedTournament = { ...currentTournament };
    let freedCourtId = null;
    
    if (match.courtNumber) {
      const courtIndex = updatedTournament.courts.findIndex(c => c.number === match.courtNumber);
      if (courtIndex >= 0) {
        freedCourtId = updatedTournament.courts[courtIndex].id;
        updatedTournament.courts[courtIndex] = {
          ...updatedTournament.courts[courtIndex],
          status: "AVAILABLE" as const,
          currentMatch: undefined
        };
      }
    }
    
    const updatedMatches = updatedTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    // Update the tournament with the completed match first
    updatedTournament = {
      ...updatedTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    // Now update bracket progression with the winner
    updatedTournament = updateBracketProgression(updatedTournament, updatedMatch, winner);
    
    console.log("Tournament updated with match completion and bracket progression");
    
    updateTournament(updatedTournament);
    
    // Auto-assign freed court to next scheduled match if enabled
    if (currentTournament.autoAssignCourts && freedCourtId) {
      const nextScheduledMatch = currentTournament.matches.find(
        m => m.status === "SCHEDULED" && !m.courtNumber
      );
      
      if (nextScheduledMatch) {
        assignCourt(nextScheduledMatch.id, freedCourtId);
      }
    }
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

  // Schedule a new match with date and time
  const scheduleMatch = (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => {
    if (!currentTournament) return;
    
    const team1 = currentTournament.teams.find(t => t.id === team1Id);
    const team2 = currentTournament.teams.find(t => t.id === team2Id);
    
    if (!team1 || !team2) return;
    
    let courtNumber;
    let updatedCourts = [...currentTournament.courts];
    
    if (courtId) {
      const court = currentTournament.courts.find(c => c.id === courtId);
      if (court) {
        courtNumber = court.number;
        // Update court status if a court is assigned
        const courtIndex = updatedCourts.findIndex(c => c.id === courtId);
        if (courtIndex >= 0) {
          updatedCourts[courtIndex] = {
            ...updatedCourts[courtIndex],
            status: "IN_USE" as const
          };
        }
      }
    }
    
    const newMatch = createMatch(
      currentTournament.id,
      team1,
      team2,
      "INITIAL" as Division,
      currentTournament.currentStage,
      scheduledTime,
      courtNumber
    );
    
    const updatedTournament = {
      ...currentTournament,
      matches: [...currentTournament.matches, newMatch],
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
  };

  // Generate the 38-team multi-stage tournament with scheduled times
  const generateMultiStageTournament = () => {
    if (!currentTournament) return;
    
    // Need 38 teams
    if (currentTournament.teams.length !== 38) {
      console.warn("This tournament format requires exactly 38 teams");
      return;
    }
    
    const matches = createInitialRoundMatches(currentTournament);
    
    const updatedTournament = {
      ...currentTournament,
      matches,
      currentStage: "INITIAL_ROUND" as TournamentStage,
      status: "IN_PROGRESS" as const,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
    // Auto-assign courts after creating matches
    setTimeout(() => autoAssignCourtsHandler(), 100);
  };
  
  // Advance to the next stage based on current results
  const advanceToNextStage = () => {
    if (!currentTournament) return;
    
    switch (currentTournament.currentStage) {
      case "INITIAL_ROUND":
        advanceToDivisionPlacement();
        break;
      case "DIVISION_PLACEMENT":
        advanceToPlayoffKnockout();
        break;
      default:
        break;
    }
  };
  
  // Helper function to advance from Initial Round to Division Placement
  const advanceToDivisionPlacement = () => {
    if (!currentTournament) return;
    
    // Check if all matches in initial round are completed
    const initialMatches = currentTournament.matches.filter(
      m => m.stage === "INITIAL_ROUND"
    );
    
    if (initialMatches.some(m => m.status !== "COMPLETED")) {
      console.warn("Cannot advance until all initial round matches are completed");
      return;
    }
    
    const newMatches = createDivisionPlacementMatches(currentTournament);
    
    const updatedTournament = {
      ...currentTournament,
      matches: [...currentTournament.matches, ...newMatches],
      currentStage: "DIVISION_PLACEMENT" as TournamentStage,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
    autoAssignCourtsHandler();
  };
  
  // Helper function to advance from Division Placement to Playoff Knockout
  const advanceToPlayoffKnockout = () => {
    if (!currentTournament) return;
    
    // Check if all matches in division placement are completed
    const divisionPlacementMatches = currentTournament.matches.filter(
      m => m.stage === "DIVISION_PLACEMENT"
    );
    
    if (divisionPlacementMatches.some(m => m.status !== "COMPLETED")) {
      console.warn("Cannot advance until all division placement matches are completed");
      return;
    }
    
    const newMatches = createPlayoffKnockoutMatches(currentTournament);
    
    const updatedTournament = {
      ...currentTournament,
      matches: [...currentTournament.matches, ...newMatches],
      currentStage: "PLAYOFF_KNOCKOUT" as TournamentStage,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
    autoAssignCourtsHandler();
  };
  
  // Generate bracket based on match results
  const generateBracket = () => {
    if (!currentTournament) return;
    
    // Placeholder for real bracket generation logic
    console.log("Generating bracket...");
    // This would typically create a tournament bracket based on seeding
    // and add it to the matches array
  };
  
  // Load sample data
  const loadSampleData = () => {
    const sampleData = createSampleData();
    setCurrentTournament(sampleData);
    setTournaments(prev => [...prev, sampleData]);
  };
  
  // Return the context provider with all methods and state
  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        setCurrentTournament,
        createTournament,
        updateTournament,
        deleteTournament,
        addTeam,
        importTeams,
        updateMatch,
        updateCourt,
        assignCourt,
        updateMatchStatus,
        updateMatchScore,
        completeMatch,
        moveTeamToDivision,
        loadSampleData,
        scheduleMatch,
        generateBracket,
        autoAssignCourts: autoAssignCourtsHandler,
        generateMultiStageTournament,
        advanceToNextStage
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};
