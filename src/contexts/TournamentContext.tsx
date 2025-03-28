import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division, TournamentFormat, TournamentStatus, CourtStatus } from "@/types/tournament";

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament) => void;
  createTournament: (tournament: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches">) => void;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (tournamentId: string) => void;
  addTeam: (team: Team) => void;
  updateMatch: (match: Match) => void;
  updateCourt: (court: Court) => void;
  assignCourt: (matchId: string, courtId: string) => void;
  updateMatchStatus: (matchId: string, status: MatchStatus) => void;
  updateMatchScore: (matchId: string, team1Score: number, team2Score: number) => void;
  completeMatch: (matchId: string) => void;
  moveTeamToDivision: (teamId: string, fromDivision: Division, toDivision: Division) => void;
  loadSampleData: () => void;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};

// Sample data generation helper
const createSampleData = (): Tournament => {
  // Sample teams
  const teams = [
    {
      id: "team1",
      name: "Eagle Smashers",
      players: [
        { id: "p1", name: "John Smith", email: "john@example.com" },
        { id: "p2", name: "Lisa Wong", email: "lisa@example.com" }
      ]
    },
    {
      id: "team2",
      name: "Phoenix Risers",
      players: [
        { id: "p3", name: "Mike Johnson", email: "mike@example.com" },
        { id: "p4", name: "Sarah Chen", email: "sarah@example.com" }
      ]
    },
    {
      id: "team3",
      name: "Falcon Duo",
      players: [
        { id: "p5", name: "David Park", email: "david@example.com" },
        { id: "p6", name: "Emma Garcia", email: "emma@example.com" }
      ]
    },
    {
      id: "team4",
      name: "Thunder Strikers",
      players: [
        { id: "p7", name: "James Lee", email: "james@example.com" },
        { id: "p8", name: "Olivia Martinez", email: "olivia@example.com" }
      ]
    }
  ];

  // Sample courts
  const courts: Court[] = [
    {
      id: "court1",
      name: "Court A",
      number: 1,
      status: "AVAILABLE" as CourtStatus
    },
    {
      id: "court2",
      name: "Court B",
      number: 2,
      status: "AVAILABLE" as CourtStatus
    }
  ];

  // Sample matches with scores
  const matches = [
    {
      id: "match1",
      tournamentId: "sampleTournament",
      team1: teams[0],
      team2: teams[1],
      scores: [{ team1Score: 21, team2Score: 18 }],
      division: "GROUP" as Division,
      courtNumber: 1,
      scheduledTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour from now
      status: "SCHEDULED" as MatchStatus
    },
    {
      id: "match2",
      tournamentId: "sampleTournament",
      team1: teams[2],
      team2: teams[3],
      scores: [{ team1Score: 19, team2Score: 21 }, { team1Score: 21, team2Score: 15 }],
      division: "GROUP" as Division,
      courtNumber: 2,
      scheduledTime: new Date(new Date().getTime() + 120 * 60 * 1000), // 2 hours from now
      status: "IN_PROGRESS" as MatchStatus
    },
    {
      id: "match3",
      tournamentId: "sampleTournament",
      team1: teams[0],
      team2: teams[2],
      scores: [{ team1Score: 21, team2Score: 18 }, { team1Score: 21, team2Score: 23 }, { team1Score: 21, team2Score: 19 }],
      division: "GROUP" as Division,
      scheduledTime: new Date(new Date().getTime() + 180 * 60 * 1000), // 3 hours from now
      status: "SCHEDULED" as MatchStatus
    }
  ];

  // Update court status and current match for in-progress match
  // Properly type the court and set its properties
  courts[1] = {
    ...courts[1],
    status: "IN_USE" as CourtStatus,
    currentMatch: matches[1]
  };

  // Create sample tournament
  return {
    id: "sampleTournament",
    name: "Summer Badminton Championship",
    description: "Annual summer tournament featuring the region's best badminton talent",
    format: "SINGLE_ELIMINATION" as TournamentFormat,
    status: "IN_PROGRESS" as TournamentStatus,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    divisionProgression: true
  };
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

  // Schedule a new match
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
      }
    }
    
    const newMatch: Match = {
      id: generateId(),
      tournamentId: currentTournament.id,
      team1,
      team2,
      scores: [{ team1Score: 0, team2Score: 0 }],
      division: "GROUP" as Division,
      courtNumber,
      scheduledTime,
      status: "SCHEDULED" as MatchStatus
    };
    
    const updatedTournament = {
      ...currentTournament,
      matches: [...currentTournament.matches, newMatch],
      courts: updatedCourts,
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

  // Load sample data function
  const loadSampleData = () => {
    const sampleTournament = createSampleData();
    
    // Check if sample tournament already exists
    const existingIndex = tournaments.findIndex(t => t.id === sampleTournament.id);
    
    if (existingIndex >= 0) {
      // Update existing sample tournament
      const updatedTournaments = [...tournaments];
      updatedTournaments[existingIndex] = sampleTournament;
      setTournaments(updatedTournaments);
    } else {
      // Add new sample tournament
      setTournaments([...tournaments, sampleTournament]);
    }
    
    setCurrentTournament(sampleTournament);
  };

  const value = {
    tournaments,
    currentTournament,
    setCurrentTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    addTeam,
    updateMatch,
    updateCourt,
    assignCourt,
    updateMatchStatus,
    updateMatchScore,
    completeMatch,
    moveTeamToDivision,
    loadSampleData,
    scheduleMatch
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};
