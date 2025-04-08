
import React from "react";
import { Match, Team, Tournament, Division, DivisionType } from "@/types/tournament";
import { cn } from "@/lib/utils";
import { DivisionEnum } from "@/types/tournament-enums";

interface TournamentBracketProps {
  tournament: Tournament;
  division?: string;
  onMatchClick?: (match: Match) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  division = "DIVISION_1",
  onMatchClick,
}) => {
  // Filter matches for the selected division and playoff stage
  const divisionMatches = tournament.matches.filter(
    (match) => String(match.division) === division && match.stage === "PLAYOFF_KNOCKOUT"
  );

  const maxRound = Math.max(...divisionMatches.map((m) => m.bracketRound || 0));

  // Generate rounds for the selected division
  const generateRounds = () => {
    if (!tournament || !divisionMatches.length) return [];

    const rounds = [];
    const roundCount = maxRound;

    for (let r = 0; r < roundCount; r++) {
      const matchesInRound = divisionMatches.filter(
        (match) => match.bracketRound === r + 1
      );

      const expectedMatchesInRound = Math.pow(2, Math.ceil(Math.log2(divisionMatches.length)) - r - 1);

      rounds.push({
        name: getRoundName(r, roundCount, division),
        matches: matchesInRound.length ? matchesInRound : Array(expectedMatchesInRound).fill(null),
      });
    }

    return rounds;
  };

  const getRoundName = (roundIndex: number, totalRounds: number, div: string) => {
    if (div === "DIVISION_1" || div === "DIVISION_2") {
      if (roundIndex === 0) return "Round of 16";
      if (roundIndex === 1) return "Quarterfinals";
      if (roundIndex === 2) return "Semifinals";
      if (roundIndex === 3) return "Final";
    } else if (div === "DIVISION_3") {
      if (roundIndex === 0) return "Quarterfinals";
      if (roundIndex === 1) return "Semifinals";
      if (roundIndex === 2) return "Final";
    }
    return `Round ${roundIndex + 1}`;
  };

  const getDivisionColor = (div: string) => {
    switch (div) {
      case "DIVISION_1":
        return "bg-purple-500 text-white";
      case "DIVISION_2":
        return "bg-blue-500 text-white";
      case "DIVISION_3":
        return "bg-teal-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const rounds = generateRounds();

  // If no rounds exist yet, show placeholder
  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bracket available</h3>
        <p className="text-gray-500 mb-4">
          The tournament bracket will be generated after the division placement stage is completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`py-2 px-4 text-center font-semibold rounded-md ${getDivisionColor(division)}`}>
        {typeof division === 'string' ? division.replace("_", " ") : "Division"}
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-8 min-w-max p-4">
          {rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="flex flex-col space-y-4">
              <div className="text-center font-medium text-sm mb-2">
                {round.name}
              </div>
              <div
                className="flex flex-col justify-around"
                style={{
                  height:
                    round.matches.length > 0
                      ? `${round.matches.length * 80}px`
                      : "auto",
                }}
              >
                {round.matches.map((match, matchIndex) => (
                  <div
                    key={`${roundIndex}-${matchIndex}`}
                    className={cn(
                      "w-48 border rounded-md overflow-hidden shadow-sm",
                      match ? "cursor-pointer hover:border-blue-500" : "border-dashed border-gray-300 bg-gray-50"
                    )}
                    onClick={() => match && onMatchClick && onMatchClick(match)}
                  >
                    {match ? (
                      <>
                        <div className="flex justify-between items-center p-2 border-b bg-gray-50">
                          <div className="font-medium text-xs">Match {match.bracketPosition}</div>
                          <div className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            match.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                            match.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {match.status === "SCHEDULED" ? "Not Started" : match.status}
                          </div>
                        </div>
                        <div className="p-2">
                          <TeamSlot
                            team={match.team1}
                            isWinner={match.status === "COMPLETED" && match.winner?.id === match.team1?.id}
                            score={match.scores?.length > 0 ? match.scores[match.scores.length - 1].team1Score : undefined}
                          />
                          <div className="my-1 border-t border-gray-100"></div>
                          <TeamSlot
                            team={match.team2}
                            isWinner={match.status === "COMPLETED" && match.winner?.id === match.team2?.id}
                            score={match.scores?.length > 0 ? match.scores[match.scores.length - 1].team2Score : undefined}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-xs">
                        TBD
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper component for team display
const TeamSlot: React.FC<{
  team?: Team;
  isWinner?: boolean;
  score?: number;
}> = ({ team, isWinner, score }) => {
  return (
    <div
      className={cn(
        "flex justify-between items-center",
        isWinner ? "font-medium" : ""
      )}
    >
      <div className="truncate text-sm" title={team?.name || "TBD"}>
        {team?.name || "TBD"}
      </div>
      {score !== undefined && (
        <div
          className={cn(
            "text-sm px-1.5 rounded",
            isWinner ? "bg-court-green/20 text-court-green" : ""
          )}
        >
          {score}
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
