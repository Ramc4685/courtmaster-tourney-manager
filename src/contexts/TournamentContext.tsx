
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Tournament, Match, Team, Court, MatchStatus, Division, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { createNewTournament, deleteTournament, importTeamsToTournament, scheduleMatchInTournament } from "./tournament/tournamentOperations";
import { updateMatchScoreInTournament, completeMatchInTournament, updateMatchStatusInTournament } from "./tournament/matchOperations";
import { prepareUpdatedEntity } from "@/utils/auditUtils";
import { SchedulingOptions, SchedulingResult } from "@/services/tournament/SchedulingService";

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => Promise<void>;
  addTournament: (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => void;
  updateTournament: (tournament: Tournament) => Promise<void>;
  removeTournament: (tournamentId: string) => Promise<void>;
  importTeams: (teams: Team[]) => Promise<void>;
  scheduleMatch: (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => Promise<void>;
  updateMatchScore: (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<void>;
  completeMatch: (matchId: string, scorerName?: string) => Promise<void>;
  assignCourt: (matchId: string, courtId: string) => Promise<void>;
  autoAssignCourts: () => Promise<void>;
  isPending: boolean;
  // Add the missing methods that components require
  updateMatch: (match: Match) => Promise<void>;
  addTeam: (team: Team) => Promise<void>;
  scheduleMatches: (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions) => Promise<SchedulingResult>;
  loadCategoryDemoData: (tournamentId: string, categoryId: string, format: TournamentFormat) => Promise<void>;
  loadSampleData: (format?: TournamentFormat) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

const getInitialTournaments = (): Tournament[] => {
  try {
    const storedTournaments = localStorage.getItem("tournaments");
    return storedTournaments ? JSON.parse(storedTournaments) : [];
  } catch (error) {
    console.error("Failed to load tournaments from local storage:", error);
    return [];
  }
};

export const TournamentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(getInitialTournaments());
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Save tournaments to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("tournaments", JSON.stringify(tournaments));
  }, [tournaments]);

  // Add a new tournament
  const addTournament = (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "matches" | "currentStage">) => {
    const { tournament, tournaments: updatedTournaments } = createNewTournament(tournamentData, tournaments);
    setTournaments(updatedTournaments);
    setCurrentTournament(tournament);
  };

  // Update an existing tournament
  const updateTournament = async (tournament: Tournament) => {
    const updatedTournament = prepareUpdatedEntity(tournament);
    setTournaments(
      tournaments.map((t) => (t.id === tournament.id ? updatedTournament : t))
    );
    setCurrentTournament(updatedTournament);
  };

  // Remove a tournament
  const removeTournament = async (tournamentId: string) => {
    const { tournaments: updatedTournaments, currentTournament: updatedCurrentTournament } = deleteTournament(
      tournamentId,
      tournaments,
      currentTournament
    );
    setTournaments(updatedTournaments);
    setCurrentTournament(updatedCurrentTournament);
  };

  // Import teams to the current tournament
  const importTeams = async (teams: Team[]) => {
    if (!currentTournament) return;

    const updatedTournament = importTeamsToTournament(teams, currentTournament);
    setTournaments(
      tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
    );
    setCurrentTournament(updatedTournament);
  };

  // Schedule a match
  const scheduleMatch = useCallback(
    async (team1Id: string, team2Id: string, scheduledTime: Date, courtId?: string, categoryId?: string) => {
      if (!currentTournament) return;

      setIsPending(true);
      try {
        const updatedTournament = scheduleMatchInTournament(
          team1Id,
          team2Id,
          scheduledTime,
          currentTournament,
          courtId,
          categoryId
        );
        setTournaments(
          tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
        );
        setCurrentTournament(updatedTournament);
      } catch (error) {
        console.error("Error scheduling match:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Update match score
  const updateMatchScore = useCallback(
    async (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => {
      if (!currentTournament) return;
      
      setIsPending(true);
      try {
        const updatedTournament = updateMatchScoreInTournament(
          matchId, 
          setIndex, 
          team1Score, 
          team2Score, 
          currentTournament,
          scorerName
        );
        setCurrentTournament(updatedTournament);
        if (!tournaments.some(t => t.id === updatedTournament.id)) {
          setTournaments([...tournaments, updatedTournament]);
        } else {
          setTournaments(
            tournaments.map(t => (t.id === updatedTournament.id ? updatedTournament : t))
          );
        }
      } catch (error) {
        console.error("Error updating match score:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Update match status
  const updateMatchStatus = useCallback(
    async (matchId: string, status: string) => {
      if (!currentTournament) return;

      setIsPending(true);
      try {
        const updatedTournament = updateMatchStatusInTournament(matchId, status as any, currentTournament);
        setTournaments(
          tournaments.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
        );
        setCurrentTournament(updatedTournament);
      } catch (error) {
        console.error("Error updating match status:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Complete a match
  const completeMatch = useCallback(
    async (matchId: string, scorerName?: string) => {
      if (!currentTournament) return;
      
      setIsPending(true);
      try {
        const updatedTournament = completeMatchInTournament(
          matchId, 
          currentTournament,
          scorerName
        );
        setCurrentTournament(updatedTournament);
        setTournaments(
          tournaments.map(t => (t.id === updatedTournament.id ? updatedTournament : t))
        );
      } catch (error) {
        console.error("Error completing match:", error);
      } finally {
        setIsPending(false);
      }
    },
    [currentTournament, tournaments]
  );

  // Assign a court to a match
  const assignCourt = useCallback(
    async (matchId: string, courtId: string) => {
      if (!currentTournament) return;

      // Find the match and court
      const match = currentTournament.matches.find((m) => m.id === matchId);
      const court = currentTournament.courts.find((c) => c.id === courtId);

      if (!match || !court) {
        console.error("Match or court not found");
        return;
      }

      // Update the match with the court number
      const updatedMatch = { ...match, courtNumber: court.number };

      // Update the court with the current match
      const updatedCourt = { ...court, currentMatch: updatedMatch };

      // Update the tournament with the updated match and court
      const updatedTournaments = {
        ...currentTournament,
        matches: currentTournament.matches.map((m) =>
          m.id === matchId ? updatedMatch : m
        ),
        courts: currentTournament.courts.map((c) =>
          c.id === courtId ? updatedCourt : c
        ),
      };

      setTournaments(
        tournaments.map((t) =>
          t.id === updatedTournaments.id ? updatedTournaments : t
        )
      );
      setCurrentTournament(updatedTournaments);
    },
    [currentTournament, tournaments]
  );

  // Auto-assign available courts to scheduled matches
  const autoAssignCourts = useCallback(async () => {
    if (!currentTournament) return;

    let updatedTournament: Tournament = { ...currentTournament };

    // Get available courts
    const availableCourts = updatedTournament.courts.filter(
      (court) => court.status === "AVAILABLE"
    );

    // Get scheduled matches without a court assigned
    const scheduledMatches = updatedTournament.matches.filter(
      (match) => match.status === "SCHEDULED" && !match.courtNumber
    );

    // Assign courts to matches
    for (let i = 0; i < Math.min(availableCourts.length, scheduledMatches.length); i++) {
      const court = availableCourts[i];
      const match = scheduledMatches[i];

      // Update the match with the court number
      const updatedMatch = { ...match, courtNumber: court.number };

      // Update the court with the current match
      const updatedCourt = { ...court, currentMatch: updatedMatch };

      // Update the tournament with the updated match and court
      updatedTournament = {
        ...updatedTournament,
        matches: updatedTournament.matches.map((m) =>
          m.id === match.id ? updatedMatch : m
        ),
        courts: updatedTournament.courts.map((c) =>
          c.id === court.id ? updatedCourt : c
        ),
      };
    }

    setTournaments(
      tournaments.map((t) =>
        t.id === updatedTournament.id ? updatedTournament : t
      )
    );
    setCurrentTournament(updatedTournament);
    return Promise.resolve(scheduledMatches.length);
  }, [tournaments, currentTournament]);

  // Add the missing implementations

  // Update match
  const updateMatch = async (match: Match) => {
    if (!currentTournament) return;
    
    try {
      const updatedMatches = currentTournament.matches.map(m => m.id === match.id ? match : m);
      const updatedTournament = {
        ...currentTournament,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  // Add a team to the current tournament
  const addTeam = async (team: Team) => {
    if (!currentTournament) return;
    
    try {
      const updatedTournament = {
        ...currentTournament,
        teams: [...currentTournament.teams, team],
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
    } catch (error) {
      console.error("Error adding team:", error);
    }
  };

  // Schedule multiple matches
  const scheduleMatches = async (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions): Promise<SchedulingResult> => {
    if (!currentTournament) {
      throw new Error("No active tournament");
    }
    
    try {
      // Mock implementation for now - in real app would use schedulingService
      const now = new Date();
      const scheduledMatches = teamPairs.map((pair, index) => {
        const scheduledTime = new Date(now.getTime() + index * options.matchDuration * 60000);
        return {
          id: `match-${Date.now()}-${index}`,
          tournamentId: currentTournament.id,
          team1: pair.team1,
          team2: pair.team2,
          scores: [],
          division: options.division,
          stage: currentTournament.currentStage,
          scheduledTime,
          status: "SCHEDULED" as MatchStatus,
          category: currentTournament.categories[0] // Default to first category
        };
      });
      
      const updatedTournament = {
        ...currentTournament,
        matches: [...currentTournament.matches, ...scheduledMatches],
        updatedAt: new Date()
      };
      
      await updateTournament(updatedTournament);
      
      return {
        scheduledMatches: scheduledMatches.length,
        assignedCourts: 0,
        startedMatches: 0,
        tournament: updatedTournament
      };
    } catch (error) {
      console.error("Error scheduling matches:", error);
      throw error;
    }
  };

  // Load category demo data
  const loadCategoryDemoData = async (tournamentId: string, categoryId: string, format: TournamentFormat) => {
    if (!currentTournament) {
      console.error("No current tournament selected");
      return;
    }
    
    try {
      console.log(`Loading demo data for category ID ${categoryId} with format ${format}`);
      
      // Find the category
      const category = currentTournament.categories.find(c => c.id === categoryId);
      if (!category) {
        console.error(`Category with ID ${categoryId} not found`);
        return;
      }
      
      // Mock implementation - create some teams and matches for this category
      const teams: Team[] = Array(8).fill(null).map((_, i) => ({
        id: `demo-team-${categoryId}-${i}`,
        name: `Demo Team ${i+1}`,
        players: [{ id: `player-${i*2}`, name: `Player ${i*2+1}` }, { id: `player-${i*2+1}`, name: `Player ${i*2+2}` }],
        category
      }));
      
      // Create some matches between these teams
      const matches: Match[] = [];
      for (let i = 0; i < teams.length; i += 2) {
        matches.push({
          id: `demo-match-${categoryId}-${i/2}`,
          tournamentId: currentTournament.id,
          team1: teams[i],
          team2: teams[i+1],
          scores: [],
          division: "INITIAL",
          stage: currentTournament.currentStage,
          scheduledTime: new Date(Date.now() + i * 30 * 60000), // Schedule 30 min apart
          status: "SCHEDULED",
          category
        });
      }
      
      // Add the teams and matches to the current tournament
      const updatedTournament = {
        ...currentTournament,
        teams: [...currentTournament.teams, ...teams],
        matches: [...currentTournament.matches, ...matches],
        updatedAt: new Date()
      };
      
      // Update the tournament
      await updateTournament(updatedTournament);
      console.log(`Demo data loaded for category ${category.name}: ${teams.length} teams, ${matches.length} matches`);
    } catch (error) {
      console.error(`Error loading demo data for category ID ${categoryId}:`, error);
    }
  };

  // Load sample data
  const loadSampleData = async (format?: TournamentFormat) => {
    try {
      console.log('[DEBUG] Loading sample tournament data for format:', format || 'MULTI_STAGE');
      
      // Create a sample tournament
      const sampleTournament: Tournament = {
        id: `sample-${Date.now()}`,
        name: "Sample Tournament",
        description: "A sample tournament with demo data",
        format: format || "MULTI_STAGE",
        status: "DRAFT",
        currentStage: "INITIAL_ROUND",
        teams: [],
        matches: [],
        courts: [
          { id: "court-1", name: "Court 1", number: 1, status: "AVAILABLE" },
          { id: "court-2", name: "Court 2", number: 2, status: "AVAILABLE" }
        ],
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [
          { id: "category-1", name: "Men's Singles", type: "MENS_SINGLES" },
          { id: "category-2", name: "Women's Singles", type: "WOMENS_SINGLES" },
          { id: "category-3", name: "Mixed Doubles", type: "MIXED_DOUBLES" }
        ]
      };
      
      // Update state and localStorage
      setTournaments([...tournaments, sampleTournament]);
      setCurrentTournament(sampleTournament);
    } catch (error) {
      console.error("Error loading sample data:", error);
    }
  };

  // Delete tournament (renamed from removeTournament to match interface)
  const deleteTournament = async (tournamentId: string) => {
    await removeTournament(tournamentId);
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        isPending,
        setCurrentTournament: async (tournament) => {
          setCurrentTournament(tournament);
          return Promise.resolve();
        },
        addTournament,
        updateTournament,
        removeTournament,
        importTeams,
        scheduleMatch,
        updateMatchScore,
        updateMatchStatus,
        completeMatch,
        assignCourt,
        autoAssignCourts,
        updateMatch,
        addTeam,
        scheduleMatches,
        loadCategoryDemoData,
        loadSampleData,
        deleteTournament,
        // Stub implementations for any required methods not yet fully implemented
        generateBracket: async () => Promise.resolve(),
        generateMultiStageTournament: async () => Promise.resolve(),
        advanceToNextStage: async () => Promise.resolve(),
        updateCourt: async () => Promise.resolve(),
        assignSeeding: async () => Promise.resolve(),
        moveTeamToDivision: async () => Promise.resolve(),
        addCategory: async () => Promise.resolve(),
        removeCategory: async () => Promise.resolve(),
        updateCategory: async () => Promise.resolve()
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournamentContext must be used within a TournamentProvider");
  }
  return context;
};
