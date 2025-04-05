
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { prepareUpdatedEntity } from '@/utils/auditUtils';
import { TournamentContextType } from './types';
import { Tournament, Team, Match, TournamentFormat, TournamentStage, MatchStatus, Division, CourtStatus } from "@/types/tournament";
import { getCategoryDemoData } from "@/utils/tournamentSampleData";
import { SchedulingOptions, SchedulingResult } from "@/services/tournament/SchedulingService";
import { generateId } from "@/utils/tournamentUtils";
import { schedulingService } from "@/services/tournament/SchedulingService";

// Export the context so it can be imported elsewhere
export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

// Export the hook as a named export
export function useTournament(): TournamentContextType {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}

const getInitialTournaments = () => {
  try {
    const storedTournaments = localStorage.getItem('tournaments');
    return storedTournaments ? JSON.parse(storedTournaments) : [];
  } catch (error) {
    console.error('Failed to load tournaments from local storage:', error);
    return [];
  }
};

// Mock function implementations needed by the context
const createNewTournament = (tournamentData: any, tournaments: any[]) => {
  const tournament = {
    id: `tournament-${Date.now()}`,
    ...tournamentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return { tournament, tournaments: [...tournaments, tournament] };
};

const importTeamsToTournament = (teams: any[], tournament: any) => {
  return {
    ...tournament,
    teams: [...tournament.teams, ...teams],
    updatedAt: new Date().toISOString()
  };
};

const scheduleMatchInTournament = (
  team1Id: string, 
  team2Id: string, 
  scheduledTime: Date, 
  tournament: any,
  courtId?: string,
  categoryId?: string
) => {
  const team1 = tournament.teams.find((t: any) => t.id === team1Id);
  const team2 = tournament.teams.find((t: any) => t.id === team2Id);
  const match = {
    id: `match-${Date.now()}`,
    tournamentId: tournament.id,
    team1,
    team2,
    scores: [],
    scheduledTime,
    status: 'SCHEDULED',
    courtId,
    categoryId
  };
  return {
    ...tournament,
    matches: [...tournament.matches, match],
    updatedAt: new Date().toISOString()
  };
};

const updateMatchScoreInTournament = (
  matchId: string, 
  setIndex: number, 
  team1Score: number, 
  team2Score: number, 
  tournament: any, 
  scorerName?: string
) => {
  const updatedMatches = tournament.matches.map((match: any) => {
    if (match.id === matchId) {
      const scores = [...(match.scores || [])];
      scores[setIndex] = { team1Score, team2Score, scoredBy: scorerName, timestamp: new Date().toISOString() };
      
      return {
        ...match,
        scores,
        updatedAt: new Date().toISOString()
      };
    }
    return match;
  });
  
  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date().toISOString()
  };
};

const updateMatchStatusInTournament = (
  matchId: string,
  status: string,
  tournament: any
) => {
  const updatedMatches = tournament.matches.map((match: any) => {
    if (match.id === matchId) {
      return {
        ...match,
        status,
        updatedAt: new Date().toISOString()
      };
    }
    return match;
  });
  
  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date().toISOString()
  };
};

const completeMatchInTournament = (
  matchId: string,
  tournament: any,
  scorerName?: string
) => {
  const updatedMatches = tournament.matches.map((match: any) => {
    if (match.id === matchId) {
      return {
        ...match,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        completedBy: scorerName,
        updatedAt: new Date().toISOString()
      };
    }
    return match;
  });
  
  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date().toISOString()
  };
};

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState(getInitialTournaments());
  const [currentTournament, setCurrentTournament] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);

  // Save tournaments to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  // Add a new tournament - renamed to createTournament to match interface
  const createTournament = (tournamentData: any) => {
    const { tournament, tournaments: updatedTournaments } = createNewTournament(tournamentData, tournaments);
    setTournaments(updatedTournaments);
    setCurrentTournament(tournament);
    return tournament;
  };

  // Update an existing tournament
  const updateTournament = async (tournament: any) => {
    const updatedTournament = prepareUpdatedEntity(tournament);
    setTournaments(tournaments.map((t: any) => t.id === tournament.id ? updatedTournament : t));
    setCurrentTournament(updatedTournament);
    return updatedTournament;
  };

  // Function to delete a tournament
  const deleteTournament = async (tournamentId: string) => {
    const updatedTournaments = tournaments.filter((t: any) => t.id !== tournamentId);
    setTournaments(updatedTournaments);
    
    // If the current tournament is being deleted, set it to null
    if (currentTournament && currentTournament.id === tournamentId) {
      setCurrentTournament(null);
    }
  };

  // Import teams to the current tournament
  const importTeams = async (teams: any[]) => {
    if (!currentTournament) return;
    const updatedTournament = importTeamsToTournament(teams, currentTournament);
    setTournaments(tournaments.map((t: any) => t.id === updatedTournament.id ? updatedTournament : t));
    setCurrentTournament(updatedTournament);
    return updatedTournament;
  };

  // Schedule a match
  const scheduleMatch = useCallback(async (team1Id: string, team2Id: string, scheduledTime: Date, courtId: string, categoryId: string) => {
    if (!currentTournament) return;
    setIsPending(true);
    try {
      const updatedTournament = scheduleMatchInTournament(team1Id, team2Id, scheduledTime, currentTournament, courtId, categoryId);
      setTournaments(tournaments.map((t: any) => t.id === updatedTournament.id ? updatedTournament : t));
      setCurrentTournament(updatedTournament);
      return updatedTournament;
    } catch (error) {
      console.error('Error scheduling match:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [currentTournament, tournaments]);

  // Update match score
  const updateMatchScore = useCallback(async (matchId: string, setIndex: number, team1Score: number, team2Score: number, scorerName?: string) => {
    if (!currentTournament) return;
    setIsPending(true);
    try {
      const updatedTournament = updateMatchScoreInTournament(matchId, setIndex, team1Score, team2Score, currentTournament, scorerName);
      setCurrentTournament(updatedTournament);
      if (!tournaments.some((t: any) => t.id === updatedTournament.id)) {
        setTournaments([...tournaments, updatedTournament]);
      } else {
        setTournaments(tournaments.map((t: any) => t.id === updatedTournament.id ? updatedTournament : t));
      }
      return updatedTournament;
    } catch (error) {
      console.error('Error updating match score:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [currentTournament, tournaments]);

  // Update match status
  const updateMatchStatus = useCallback(async (matchId: string, status: string) => {
    if (!currentTournament) return;
    setIsPending(true);
    try {
      const updatedTournament = updateMatchStatusInTournament(matchId, status, currentTournament);
      setTournaments(tournaments.map((t: any) => t.id === updatedTournament.id ? updatedTournament : t));
      setCurrentTournament(updatedTournament);
      return updatedTournament;
    } catch (error) {
      console.error('Error updating match status:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [currentTournament, tournaments]);

  // Complete a match
  const completeMatch = useCallback(async (matchId: string, scorerName?: string) => {
    if (!currentTournament) return;
    setIsPending(true);
    try {
      const updatedTournament = completeMatchInTournament(matchId, currentTournament, scorerName);
      setCurrentTournament(updatedTournament);
      setTournaments(tournaments.map((t: any) => t.id === updatedTournament.id ? updatedTournament : t));
      return updatedTournament;
    } catch (error) {
      console.error('Error completing match:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [currentTournament, tournaments]);

  // Assign a court to a match
  const assignCourt = useCallback(async (matchId: string, courtId: string) => {
    if (!currentTournament) return;
    // Find the match and court
    const match = currentTournament.matches.find((m: any) => m.id === matchId);
    const court = currentTournament.courts.find((c: any) => c.id === courtId);
    if (!match || !court) {
      console.error('Match or court not found');
      return;
    }
    
    // Update the match with the court number
    const updatedMatch = {
      ...match,
      courtNumber: court.number
    };
    
    // Update the court with the current match
    const updatedCourt = {
      ...court,
      currentMatch: updatedMatch
    };
    
    // Update the tournament with the updated match and court
    const updatedTournaments = {
      ...currentTournament,
      matches: currentTournament.matches.map((m: any) => m.id === matchId ? updatedMatch : m),
      courts: currentTournament.courts.map((c: any) => c.id === courtId ? updatedCourt : c)
    };
    
    setTournaments(tournaments.map((t: any) => t.id === updatedTournaments.id ? updatedTournaments : t));
    setCurrentTournament(updatedTournaments);
    return updatedTournaments;
  }, [currentTournament, tournaments]);

  // Auto-assign available courts to scheduled matches
  const autoAssignCourts = useCallback(async () => {
    if (!currentTournament) return 0;
    let updatedTournament = { ...currentTournament };
    
    // Get available courts
    const availableCourts = updatedTournament.courts.filter((court: any) => court.status === 'AVAILABLE');
    
    // Get scheduled matches without a court assigned
    const scheduledMatches = updatedTournament.matches.filter((match: any) => match.status === 'SCHEDULED' && !match.courtNumber);
    
    // Assign courts to matches
    for (let i = 0; i < Math.min(availableCourts.length, scheduledMatches.length); i++) {
      const court = availableCourts[i];
      const match = scheduledMatches[i];
      
      // Update the match with the court number
      const updatedMatch = {
        ...match,
        courtNumber: court.number
      };
      
      // Update the court with the current match
      const updatedCourt = {
        ...court,
        currentMatch: updatedMatch
      };
      
      // Update the tournament with the updated match and court
      updatedTournament = {
        ...updatedTournament,
        matches: updatedTournament.matches.map((m: any) => m.id === match.id ? updatedMatch : m),
        courts: updatedTournament.courts.map((c: any) => c.id === court.id ? updatedCourt : c)
      };
    }
    
    setTournaments(tournaments.map((t: any) => t.id === updatedTournament.id ? updatedTournament : t));
    setCurrentTournament(updatedTournament);
    return scheduledMatches.length;
  }, [tournaments, currentTournament]);

  // Add the missing implementations
  // Update match
  const updateMatch = async (match: any) => {
    if (!currentTournament) return;
    try {
      const updatedMatches = currentTournament.matches.map((m: any) => m.id === match.id ? match : m);
      const updatedTournament = {
        ...currentTournament,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      return await updateTournament(updatedTournament);
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  };

  // Add a team to the current tournament
  const addTeam = async (team: any) => {
    if (!currentTournament) return;
    try {
      const updatedTournament = {
        ...currentTournament,
        teams: [...currentTournament.teams, team],
        updatedAt: new Date()
      };
      return await updateTournament(updatedTournament);
    } catch (error) {
      console.error('Error adding team:', error);
      throw error;
    }
  };

  // Schedule matches with court assignments
  const scheduleMatches = async (teamPairs: { team1: Team; team2: Team }[], options: SchedulingOptions): Promise<SchedulingResult> => {
    if (!currentTournament) {
      throw new Error('No current tournament selected');
    }

    try {
      console.log('Scheduling matches:', teamPairs.length, 'pairs');
      console.log('Scheduling options:', options);
      
      // Use the schedulingService to handle the scheduling
      const result = schedulingService.scheduleMatches(currentTournament, teamPairs, options);
      
      // Update the tournament with the result
      await updateTournament(result.tournament);
      
      return result;
    } catch (error) {
      console.error("Error scheduling matches:", error);
      throw error;
    }
  };

  // Load category demo data
  const loadCategoryDemoData = async (tournamentId: string, categoryId: string, format: TournamentFormat) => {
    if (!currentTournament) {
      console.error('No current tournament selected');
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
      
      // Get demo data for this category and format
      const { teams, matches } = getCategoryDemoData(format, category);
      
      // Add the teams and matches to the current tournament
      const updatedTournament = {
        ...currentTournament,
        teams: [...(currentTournament.teams || []), ...teams],
        matches: [...(currentTournament.matches || []), ...matches],
        updatedAt: new Date()
      };
      
      // Update the tournament
      await updateTournament(updatedTournament);
      
      console.log(`Demo data loaded for category ${category.name}: ${teams.length} teams, ${matches.length} matches`);
    } catch (error) {
      console.error(`Error loading demo data for category ID ${categoryId}:`, error);
      throw error;
    }
  };

  // Load sample data - fixed to return void
  const loadSampleData = async (format?: string) => {
    try {
      console.log('[DEBUG] Loading sample tournament data for format:', format || 'MULTI_STAGE');
      
      // Create a sample tournament
      const sampleTournament = {
        id: `sample-${Date.now()}`,
        name: 'Sample Tournament',
        description: 'A sample tournament with demo data',
        format: format || 'MULTI_STAGE',
        status: 'DRAFT',
        currentStage: 'INITIAL_ROUND',
        teams: [],
        matches: [],
        courts: [
          { id: 'court-1', name: 'Court 1', number: 1, status: 'AVAILABLE' },
          { id: 'court-2', name: 'Court 2', number: 2, status: 'AVAILABLE' }
        ],
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [
          { id: 'category-1', name: 'Men\'s Singles', type: 'MENS_SINGLES' },
          { id: 'category-2', name: 'Women\'s Singles', type: 'WOMENS_SINGLES' },
          { id: 'category-3', name: 'Mixed Doubles', type: 'MIXED_DOUBLES' }
        ]
      };
      
      // Update state and localStorage
      setTournaments([...tournaments, sampleTournament]);
      setCurrentTournament(sampleTournament);
      // Not returning the value as the interface expects void
    } catch (error) {
      console.error('Error loading sample data:', error);
      throw error;
    }
  };

  // Generate multi-stage tournament brackets
  const generateMultiStageTournament = async () => {
    if (!currentTournament) {
      console.error('No current tournament selected');
      return;
    }

    try {
      console.log('Generating multi-stage tournament brackets');
      
      // Group teams by category
      const teamsByCategory = new Map<string, Team[]>();
      currentTournament.teams.forEach(team => {
        if (team.category?.id) {
          const teams = teamsByCategory.get(team.category.id) || [];
          teams.push(team);
          teamsByCategory.set(team.category.id, teams);
        }
      });

      const newMatches: Match[] = [];

      // Generate matches for each category
      for (const category of currentTournament.categories) {
        const teams = teamsByCategory.get(category.id) || [];
        if (teams.length < 2) {
          console.warn(`Not enough teams in category ${category.name} to generate matches`);
          continue;
        }

        // Initial qualification matches
        const qualificationMatches = teams.reduce<Match[]>((matches, team, index, array) => {
          if (index % 2 === 0 && index + 1 < array.length) {
            matches.push({
              id: generateId(),
              tournamentId: currentTournament.id,
              team1: team,
              team2: array[index + 1],
              scores: [],
              division: "INITIAL" as Division,
              stage: "INITIAL_ROUND" as TournamentStage,
              status: "SCHEDULED" as MatchStatus,
              scheduledTime: new Date(Date.now() + 3600000 * (index / 2)),
              category: category,
              groupName: "Qualification Round"
            });
          }
          return matches;
        }, []);

        // Division placement matches (will be filled after qualification)
        const divisionPlacementMatches = Array(Math.floor(teams.length / 4)).fill(null).map((_, index) => ({
          id: generateId(),
          tournamentId: currentTournament.id,
          team1: null, // Will be filled after qualification
          team2: null, // Will be filled after qualification
          scores: [],
          division: (index === 0 ? "DIVISION_1" : "DIVISION_2") as Division,
          stage: "DIVISION_PLACEMENT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 86400000), // Next day
          category: category,
          groupName: `Division ${index + 1} Placement`
        }));

        // Playoff matches (will be filled after division placement)
        const playoffMatches = Array(Math.floor(teams.length / 8)).fill(null).map((_, index) => ({
          id: generateId(),
          tournamentId: currentTournament.id,
          team1: null, // Will be filled after division placement
          team2: null, // Will be filled after division placement
          scores: [],
          division: "DIVISION_1" as Division,
          stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + 172800000), // Two days later
          category: category,
          groupName: "Playoffs"
        }));

        newMatches.push(...qualificationMatches, ...divisionPlacementMatches, ...playoffMatches);
      }

      // Update tournament with new matches
      const updatedTournament = {
        ...currentTournament,
        matches: [...currentTournament.matches, ...newMatches],
        currentStage: "INITIAL_ROUND" as TournamentStage,
        updatedAt: new Date()
      };

      await updateTournament(updatedTournament);
      
      console.log(`Generated ${newMatches.length} matches across all categories`);
      return updatedTournament;
    } catch (error) {
      console.error('Error generating multi-stage tournament:', error);
      throw error;
    }
  };

  // Stub implementations for required methods
  const stubImplementations = {
    generateBracket: async () => Promise.resolve(),
    advanceToNextStage: async () => Promise.resolve(),
    updateCourt: async () => Promise.resolve(),
    assignSeeding: async () => Promise.resolve(),
    moveTeamToDivision: async () => Promise.resolve(),
    addCategory: async () => Promise.resolve(),
    removeCategory: async () => Promise.resolve(),
    updateCategory: async () => Promise.resolve(),
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
        createTournament,
        updateTournament,
        deleteTournament,
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
        generateMultiStageTournament,
        ...stubImplementations,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}
