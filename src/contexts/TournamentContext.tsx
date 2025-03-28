import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Tournament, Match, Court, Team, MatchStatus, Division, TournamentFormat, TournamentStatus, CourtStatus, TournamentStage, Group } from "@/types/tournament";

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
  updateMatchScore: (matchId: string, team1Score: number, team2Score: number) => void;
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

// Sample data generation helper
const createSampleData = (): Tournament => {
  // Sample teams - 38 teams for the specific tournament format
  const teams: Team[] = Array.from({ length: 38 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    initialRanking: i + 1
  }));

  // Sample courts - 5 courts as specified
  const courts: Court[] = Array.from({ length: 5 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Sample matches for initial round
  const matches: Match[] = [];

  // Create sample tournament
  return {
    id: "sampleTournament",
    name: "38-Team Multi-Stage Tournament",
    description: "Multi-stage tournament with 38 teams progressing through divisions",
    format: "MULTI_STAGE" as TournamentFormat,
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "INITIAL_ROUND" as TournamentStage,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    divisionProgression: true,
    autoAssignCourts: true
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
      division: "INITIAL" as Division,
      stage: currentTournament.currentStage,
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

  // Complete a match and auto-assign court to next match
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
    const loser = team1Sets > team2Sets ? match.team2 : match.team1;
    
    const updatedMatch = {
      ...match,
      status: "COMPLETED" as MatchStatus,
      winner,
      loser
    };
    
    // Free up the court
    const updatedCourts = [...currentTournament.courts];
    let freedCourtId = null;
    
    if (match.courtNumber) {
      const courtIndex = updatedCourts.findIndex(c => c.number === match.courtNumber);
      if (courtIndex >= 0) {
        freedCourtId = updatedCourts[courtIndex].id;
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
    
    // Progress winner to next match in bracket if applicable
    if (match.nextMatchId) {
      const nextMatchIndex = updatedMatches.findIndex(m => m.id === match.nextMatchId);
      if (nextMatchIndex >= 0) {
        const nextMatch = updatedMatches[nextMatchIndex];
        const isFirstTeam = match.bracketPosition && match.bracketPosition % 2 !== 0;
        
        updatedMatches[nextMatchIndex] = {
          ...nextMatch,
          team1: isFirstTeam ? winner : nextMatch.team1,
          team2: !isFirstTeam ? winner : nextMatch.team2
        };
      }
    }
    
    const updatedTournament = {
      ...currentTournament,
      matches: updatedMatches,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
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

  // Generate the 38-team multi-stage tournament
  const generateMultiStageTournament = () => {
    if (!currentTournament) return;
    
    // Need 38 teams
    if (currentTournament.teams.length !== 38) {
      console.warn("This tournament format requires exactly 38 teams");
      return;
    }
    
    // Generate matches for the initial round
    const teams = [...currentTournament.teams];
    const matches: Match[] = [];
    
    // Initial Round: 38 teams -> 19 matches
    for (let i = 0; i < 19; i++) {
      const team1 = teams[i * 2];
      const team2 = teams[i * 2 + 1];
      
      matches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1,
        team2,
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "INITIAL" as Division,
        stage: "INITIAL_ROUND" as TournamentStage,
        status: "SCHEDULED" as MatchStatus
      });
    }
    
    const updatedTournament = {
      ...currentTournament,
      matches,
      currentStage: "INITIAL_ROUND" as TournamentStage,
      status: "IN_PROGRESS" as TournamentStatus,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
    autoAssignCourts();
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
    
    // Get winners and losers from initial round
    const winners: Team[] = [];
    const losers: Team[] = [];
    
    initialMatches.forEach(match => {
      if (match.winner) winners.push(match.winner);
      if (match.loser) losers.push(match.loser);
    });
    
    // Rank winners and losers based on original rankings
    winners.sort((a, b) => (a.initialRanking || 999) - (b.initialRanking || 999));
    losers.sort((a, b) => (a.initialRanking || 999) - (b.initialRanking || 999));
    
    const newMatches: Match[] = [];
    
    // Division 1 Qualifiers: #14-#19 (3 matches)
    for (let i = 0; i < 3; i++) {
      newMatches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: winners[13 + i * 2], // 14, 16, 18
        team2: winners[14 + i * 2], // 15, 17, 19
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "QUALIFIER_DIV1" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus
      });
    }
    
    // Division 2 Qualifiers: #20-#29 (5 matches)
    for (let i = 0; i < 5; i++) {
      newMatches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: losers[i * 2], // 0, 2, 4, 6, 8
        team2: losers[i * 2 + 1], // 1, 3, 5, 7, 9
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "QUALIFIER_DIV2" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus
      });
    }
    
    // Division 3 Group Stage: #30-#38 (3 groups of 3 teams)
    // Set up the groups
    const groups: Group[] = [
      { id: generateId(), name: "Group A", teamIds: [losers[10].id, losers[11].id, losers[12].id] },
      { id: generateId(), name: "Group B", teamIds: [losers[13].id, losers[14].id, losers[15].id] },
      { id: generateId(), name: "Group C", teamIds: [losers[16].id, losers[17].id, losers[18].id] }
    ];
    
    // Create group matches
    groups.forEach(group => {
      // Each group has 3 matches: team1 vs team2, team1 vs team3, team2 vs team3
      const groupTeams = group.teamIds.map(id => 
        losers.find(team => team.id === id)!
      );
      
      // Match 1: Team 1 vs Team 2
      newMatches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: groupTeams[0],
        team2: groupTeams[1],
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "GROUP_DIV3" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        groupName: group.name
      });
      
      // Match 2: Team 1 vs Team 3
      newMatches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: groupTeams[0],
        team2: groupTeams[2],
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "GROUP_DIV3" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        groupName: group.name
      });
      
      // Match 3: Team 2 vs Team 3
      newMatches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: groupTeams[1],
        team2: groupTeams[2],
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "GROUP_DIV3" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        groupName: group.name
      });
    });
    
    const updatedTournament = {
      ...currentTournament,
      matches: [...currentTournament.matches, ...newMatches],
      currentStage: "DIVISION_PLACEMENT" as TournamentStage,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
    autoAssignCourts();
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
    
    // Get winners and losers from division qualifiers
    const div1QualifierMatches = currentTournament.matches.filter(
      m => m.division === "QUALIFIER_DIV1" && m.stage === "DIVISION_PLACEMENT"
    );
    
    const div2QualifierMatches = currentTournament.matches.filter(
      m => m.division === "QUALIFIER_DIV2" && m.stage === "DIVISION_PLACEMENT"
    );
    
    const div3GroupMatches = currentTournament.matches.filter(
      m => m.division === "GROUP_DIV3" && m.stage === "DIVISION_PLACEMENT"
    );
    
    // Collect teams for each division
    const div1Teams: Team[] = [];
    const div2Teams: Team[] = [];
    const div3Teams: Team[] = [];
    
    // First 13 winners from initial round go to Division 1
    const initialMatches = currentTournament.matches.filter(
      m => m.stage === "INITIAL_ROUND"
    );
    
    const initialWinners = initialMatches
      .map(m => m.winner)
      .filter((w): w is Team => !!w)
      .sort((a, b) => (a.initialRanking || 999) - (b.initialRanking || 999));
    
    // Add top 13 winners to Division 1
    for (let i = 0; i < 13; i++) {
      div1Teams.push(initialWinners[i]);
    }
    
    // Add winners from Division 1 qualifiers to Division 1
    div1QualifierMatches.forEach(match => {
      if (match.winner) div1Teams.push(match.winner);
    });
    
    // Add losers from Division 1 qualifiers to Division 2
    div1QualifierMatches.forEach(match => {
      if (match.loser) div2Teams.push(match.loser);
    });
    
    // Add winners from Division 2 qualifiers to Division 2
    div2QualifierMatches.forEach(match => {
      if (match.winner) div2Teams.push(match.winner);
    });
    
    // Add losers from Division 2 qualifiers to Division 3
    div2QualifierMatches.forEach(match => {
      if (match.loser) div3Teams.push(match.loser);
    });
    
    // Calculate winners of each Division 3 group (most wins)
    const groupResults = new Map<string, Map<string, number>>(); // Group -> Team -> Wins
    
    div3GroupMatches.forEach(match => {
      if (!match.groupName || !match.winner) return;
      
      if (!groupResults.has(match.groupName)) {
        groupResults.set(match.groupName, new Map<string, number>());
      }
      
      const teamWins = groupResults.get(match.groupName)!;
      const currentWins = teamWins.get(match.winner.id) || 0;
      teamWins.set(match.winner.id, currentWins + 1);
    });
    
    // Get group winners
    groupResults.forEach((teamWins, groupName) => {
      let maxWins = 0;
      let groupWinner: string | null = null;
      
      teamWins.forEach((wins, teamId) => {
        if (wins > maxWins) {
          maxWins = wins;
          groupWinner = teamId;
        }
      });
      
      if (groupWinner) {
        const winner = currentTournament.teams.find(t => t.id === groupWinner);
        if (winner) div3Teams.push(winner);
      }
    });
    
    // Create the knockout brackets
    const newMatches: Match[] = [];
    
    // Division 1: 16-team knockout (Round of 16)
    for (let i = 0; i < 8; i++) {
      newMatches.push({
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: div1Teams[i],
        team2: div1Teams[15 - i],
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "DIVISION_1" as Division,
        stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
        bracketRound: 1,
        bracketPosition: i + 1,
        status: "SCHEDULED" as MatchStatus
      });
    }
    
    // Division 2: 16-team knockout (Round of 16)
    for (let i = 0; i < 8; i++) {
      const match: Match = {
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: div2Teams[i],
        team2: div2Teams[15 - i],
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "DIVISION_2" as Division,
        stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
        bracketRound: 1,
        bracketPosition: i + 1,
        status: "SCHEDULED" as MatchStatus
      };
      
      newMatches.push(match);
    }
    
    // Division 3: 8-team knockout (Quarterfinals)
    for (let i = 0; i < 4; i++) {
      const match: Match = {
        id: generateId(),
        tournamentId: currentTournament.id,
        team1: div3Teams[i],
        team2: div3Teams[7 - i],
        scores: [{ team1Score: 0, team2Score: 0 }],
        division: "DIVISION_3" as Division,
        stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
        bracketRound: 1,
        bracketPosition: i + 1,
        status: "SCHEDULED" as MatchStatus
      };
      
      newMatches.push(match);
    }
    
    const updatedTournament = {
      ...currentTournament,
      matches: [...currentTournament.matches, ...newMatches],
      currentStage: "PLAYOFF_KNOCKOUT" as TournamentStage,
      updatedAt: new Date()
    };
    
    updateTournament(updatedTournament);
    autoAssignCourts();
  };

  // Auto-assign available courts to scheduled matches
  const autoAssignCourts = () => {
    if (!currentTournament) return 0;
    
    const availableCourts = currentTournament.courts.filter(c => c.status === "AVAILABLE");
    const scheduledMatches = currentTournament.matches.filter(
      m => m.status === "SCHEDULED" && !m.courtNumber
    );
    
    // Sort matches by scheduled time
    scheduledMatches.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });
    
    // Assign courts to as many matches as possible
    const updatedCourts = [...currentTournament.courts];
    const updatedMatches = [...currentTournament.matches];
    
    let assignedCount = 0;
    
    for (let i = 0; i < Math.min(availableCourts.length, scheduledMatches.length); i++) {
      const court = availableCourts[i];
      const match = scheduledMatches[i];
      
      // Update the match
      const matchIndex = updatedMatches.findIndex(m => m.id === match.id);
      if (matchIndex >= 0) {
        updatedMatches[matchIndex] = {
          ...match,
          courtNumber: court.number
        };
      }
      
      // Update the court
      const courtIndex = updatedCourts.findIndex(c => c.id === court.id);
      if (courtIndex >= 0) {
        updatedCourts[courtIndex] = {
          ...court,
          status: "IN_USE" as CourtStatus,
          currentMatch: {
            ...match,
            courtNumber: court.number
          }
        };
      }
      
      assignedCount++;
    }
    
    if (assignedCount > 0) {
      const updatedTournament = {
        ...currentTournament,
        courts: updatedCourts,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      
      updateTournament(updatedTournament);
    }
    
    return assignedCount;
  };

  // Load
