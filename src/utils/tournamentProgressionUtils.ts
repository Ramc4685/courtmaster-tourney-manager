
import { Tournament, Match, Team, Division, TournamentStage, Group } from "@/types/tournament";
import { generateId, sortTeamsByRanking } from "./tournamentUtils";
import { createMatch } from "./matchUtils";

// Create initial round matches
export const createInitialRoundMatches = (tournament: Tournament): Match[] => {
  const teams = sortTeamsByRanking(tournament.teams);
  const matches: Match[] = [];
  
  // Create a start time - default to tournament start date, or now if not set
  const startTime = tournament.startDate || new Date();
  let currentMatchTime = new Date(startTime);
  
  // Initial Round: 38 teams -> 19 matches
  for (let i = 0; i < 19; i++) {
    // Seed the teams: 1 vs 38, 2 vs 37, etc.
    const team1 = teams[i];
    const team2 = teams[teams.length - 1 - i];
    
    // Set match time and increment for next match (30 min per match)
    const scheduledTime = new Date(currentMatchTime);
    currentMatchTime.setMinutes(currentMatchTime.getMinutes() + 30);
    
    matches.push(createMatch(
      tournament.id,
      team1,
      team2,
      "INITIAL" as Division,
      "INITIAL_ROUND" as TournamentStage,
      scheduledTime
    ));
  }
  
  return matches;
};

// Get winners and losers from completed matches
export const getMatchWinnersAndLosers = (matches: Match[]): { winners: Team[], losers: Team[] } => {
  const winners: Team[] = [];
  const losers: Team[] = [];
  
  matches.forEach(match => {
    if (match.winner) winners.push(match.winner);
    if (match.loser) losers.push(match.loser);
  });
  
  return { winners, losers };
};

// Create division placement matches
export const createDivisionPlacementMatches = (tournament: Tournament): Match[] => {
  const initialMatches = tournament.matches.filter(
    m => m.stage === "INITIAL_ROUND"
  );
  
  // Get winners and losers from initial round
  const { winners, losers } = getMatchWinnersAndLosers(initialMatches);
  
  // Rank winners and losers based on original rankings
  const rankedWinners = sortTeamsByRanking(winners);
  const rankedLosers = sortTeamsByRanking(losers);
  
  const newMatches: Match[] = [];
  
  // Division 1 Qualifiers: #14-#19 (3 matches)
  for (let i = 0; i < 3; i++) {
    newMatches.push(createMatch(
      tournament.id,
      rankedWinners[13 + i * 2], // 14, 16, 18
      rankedWinners[14 + i * 2], // 15, 17, 19
      "QUALIFIER_DIV1" as Division,
      "DIVISION_PLACEMENT" as TournamentStage
    ));
  }
  
  // Division 2 Qualifiers: #20-#29 (5 matches)
  for (let i = 0; i < 5; i++) {
    newMatches.push(createMatch(
      tournament.id,
      rankedLosers[i * 2], // 0, 2, 4, 6, 8
      rankedLosers[i * 2 + 1], // 1, 3, 5, 7, 9
      "QUALIFIER_DIV2" as Division,
      "DIVISION_PLACEMENT" as TournamentStage
    ));
  }
  
  // Division 3 Group Stage: #30-#38 (3 groups of 3 teams)
  // Set up the groups
  const groups: Group[] = [
    { id: generateId(), name: "Group A", teamIds: [rankedLosers[10].id, rankedLosers[11].id, rankedLosers[12].id] },
    { id: generateId(), name: "Group B", teamIds: [rankedLosers[13].id, rankedLosers[14].id, rankedLosers[15].id] },
    { id: generateId(), name: "Group C", teamIds: [rankedLosers[16].id, rankedLosers[17].id, rankedLosers[18].id] }
  ];
  
  // Create group matches
  groups.forEach(group => {
    // Each group has 3 matches: team1 vs team2, team1 vs team3, team2 vs team3
    const groupTeams = group.teamIds.map(id => 
      rankedLosers.find(team => team.id === id)!
    );
    
    // Match 1: Team 1 vs Team 2
    const match1 = createMatch(
      tournament.id,
      groupTeams[0],
      groupTeams[1],
      "GROUP_DIV3" as Division,
      "DIVISION_PLACEMENT" as TournamentStage
    );
    match1.groupName = group.name;
    newMatches.push(match1);
    
    // Match 2: Team 1 vs Team 3
    const match2 = createMatch(
      tournament.id,
      groupTeams[0],
      groupTeams[2],
      "GROUP_DIV3" as Division,
      "DIVISION_PLACEMENT" as TournamentStage
    );
    match2.groupName = group.name;
    newMatches.push(match2);
    
    // Match 3: Team 2 vs Team 3
    const match3 = createMatch(
      tournament.id,
      groupTeams[1],
      groupTeams[2],
      "GROUP_DIV3" as Division,
      "DIVISION_PLACEMENT" as TournamentStage
    );
    match3.groupName = group.name;
    newMatches.push(match3);
  });
  
  return newMatches;
};

// Calculate group stage results
export const calculateGroupResults = (
  groupMatches: Match[]
): Map<string, Map<string, number>> => {
  const groupResults = new Map<string, Map<string, number>>(); // Group -> Team -> Wins
  
  groupMatches.forEach(match => {
    if (!match.groupName || !match.winner) return;
    
    if (!groupResults.has(match.groupName)) {
      groupResults.set(match.groupName, new Map<string, number>());
    }
    
    const teamWins = groupResults.get(match.groupName)!;
    const currentWins = teamWins.get(match.winner.id) || 0;
    teamWins.set(match.winner.id, currentWins + 1);
  });
  
  return groupResults;
};

// Create playoff knockout matches
export const createPlayoffKnockoutMatches = (tournament: Tournament): Match[] => {
  const divisionPlacementMatches = tournament.matches.filter(
    m => m.stage === "DIVISION_PLACEMENT"
  );
  
  const div1QualifierMatches = tournament.matches.filter(
    m => m.division === "QUALIFIER_DIV1" && m.stage === "DIVISION_PLACEMENT"
  );
  
  const div2QualifierMatches = tournament.matches.filter(
    m => m.division === "QUALIFIER_DIV2" && m.stage === "DIVISION_PLACEMENT"
  );
  
  const div3GroupMatches = tournament.matches.filter(
    m => m.division === "GROUP_DIV3" && m.stage === "DIVISION_PLACEMENT"
  );
  
  // Collect teams for each division
  const div1Teams: Team[] = [];
  const div2Teams: Team[] = [];
  const div3Teams: Team[] = [];
  
  // First 13 winners from initial round go to Division 1
  const initialMatches = tournament.matches.filter(
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
  const groupResults = calculateGroupResults(div3GroupMatches);
  
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
      const winner = tournament.teams.find(t => t.id === groupWinner);
      if (winner) div3Teams.push(winner);
    }
  });
  
  // Create the knockout brackets
  const newMatches: Match[] = [];
  
  // Division 1: 16-team knockout (Round of 16)
  for (let i = 0; i < 8; i++) {
    const match = createMatch(
      tournament.id,
      div1Teams[i],
      div1Teams[15 - i],
      "DIVISION_1" as Division,
      "PLAYOFF_KNOCKOUT" as TournamentStage
    );
    match.bracketRound = 1;
    match.bracketPosition = i + 1;
    newMatches.push(match);
  }
  
  // Division 2: 16-team knockout (Round of 16)
  for (let i = 0; i < 8; i++) {
    const match = createMatch(
      tournament.id,
      div2Teams[i],
      div2Teams[15 - i],
      "DIVISION_2" as Division,
      "PLAYOFF_KNOCKOUT" as TournamentStage
    );
    match.bracketRound = 1;
    match.bracketPosition = i + 1;
    newMatches.push(match);
  }
  
  // Division 3: 8-team knockout (Quarter Finals)
  for (let i = 0; i < 4; i++) {
    const match = createMatch(
      tournament.id,
      div3Teams[i],
      div3Teams[7 - i],
      "DIVISION_3" as Division,
      "PLAYOFF_KNOCKOUT" as TournamentStage
    );
    match.bracketRound = 1;
    match.bracketPosition = i + 1;
    newMatches.push(match);
  }
  
  return newMatches;
};
