
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tournament, TournamentFormat } from "@/types/tournament";
import { Grid2X2, Grid3X3, ListOrdered, Users } from "lucide-react";

interface TournamentFormatExplanationProps {
  tournament: Tournament;
}

const TournamentFormatExplanation: React.FC<TournamentFormatExplanationProps> = ({ tournament }) => {
  const getFormatIcon = (format: TournamentFormat) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
      case "DOUBLE_ELIMINATION":
        return <Grid2X2 className="h-6 w-6" />;
      case "ROUND_ROBIN":
        return <Grid3X3 className="h-6 w-6" />;
      case "SWISS":
        return <ListOrdered className="h-6 w-6" />;
      case "GROUP_KNOCKOUT":
        return <Users className="h-6 w-6" />;
      case "MULTI_STAGE":
      default:
        return <Grid3X3 className="h-6 w-6" />;
    }
  };

  const getFormatExplanation = (format: TournamentFormat) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
        return "Teams are eliminated after one loss, with winners advancing until a champion is declared.";
      case "DOUBLE_ELIMINATION":
        return "Teams get a second chance in a losers bracket and are eliminated after two losses.";
      case "ROUND_ROBIN":
        return "Every team plays against every other team; standings are based on total wins and losses.";
      case "SWISS":
        return "Teams play a fixed number of rounds against opponents with similar records; no immediate elimination.";
      case "GROUP_KNOCKOUT":
        return "Teams are divided into groups for round-robin play, then top teams advance to elimination rounds.";
      case "MULTI_STAGE":
        return "38-team tournament with initial rounds, division placement, and playoff knockout stages.";
      default:
        return "Custom tournament format.";
    }
  };

  const getFormatDetails = (tournament: Tournament) => {
    switch (tournament.format) {
      case "SINGLE_ELIMINATION":
        return (
          <div className="mt-2">
            <p>• Teams: {tournament.teams.length}</p>
            <p>• Consolation Rounds: {tournament.formatConfig?.consolationRounds ? "Yes" : "No"}</p>
          </div>
        );
      case "DOUBLE_ELIMINATION":
        return (
          <div className="mt-2">
            <p>• Teams: {tournament.teams.length}</p>
            <p>• Includes Winners and Losers Brackets</p>
          </div>
        );
      case "ROUND_ROBIN":
        const totalMatches = (tournament.teams.length * (tournament.teams.length - 1)) / 2;
        return (
          <div className="mt-2">
            <p>• Teams: {tournament.teams.length}</p>
            <p>• Total Matches: {totalMatches}</p>
            <p>• Each team plays {tournament.teams.length - 1} matches</p>
          </div>
        );
      case "SWISS":
        return (
          <div className="mt-2">
            <p>• Teams: {tournament.teams.length}</p>
            <p>• Swiss Rounds: {tournament.formatConfig?.swissRounds || 3}</p>
          </div>
        );
      case "GROUP_KNOCKOUT":
        return (
          <div className="mt-2">
            <p>• Teams: {tournament.teams.length}</p>
            <p>• Groups: {tournament.formatConfig?.groupCount || 'Unknown'}</p>
            <p>• Teams per Group: {tournament.formatConfig?.teamsPerGroup || 'Variable'}</p>
            <p>• Teams Advancing per Group: {tournament.formatConfig?.advancingTeamsPerGroup || 2}</p>
          </div>
        );
      case "MULTI_STAGE":
        return (
          <div className="mt-2">
            <p>• Teams: {tournament.teams.length}</p>
            <p>• Division Progression: {tournament.divisionProgression ? "Enabled" : "Disabled"}</p>
            <p>• Stages: Initial Round → Division Placement → Playoff Knockout</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 gap-2">
        {getFormatIcon(tournament.format)}
        <div>
          <CardTitle>Tournament Format</CardTitle>
          <CardDescription>{tournament.format.replace("_", " ")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p>{getFormatExplanation(tournament.format)}</p>
        {getFormatDetails(tournament)}
      </CardContent>
    </Card>
  );
};

export default TournamentFormatExplanation;
