
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tournament, TournamentFormat, TournamentCategory } from "@/types/tournament";
import FormatVisualization from "./FormatVisualizations";

interface EnhancedTournamentFormatExplanationProps {
  tournament: Tournament;
  category?: TournamentCategory;
}

const EnhancedTournamentFormatExplanation: React.FC<EnhancedTournamentFormatExplanationProps> = ({
  tournament,
  category
}) => {
  // Use category format if provided, otherwise fallback to tournament format
  const format = category?.format || tournament.format;
  
  // Get format name for display
  const getFormatName = (format: TournamentFormat) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
        return "Single Elimination";
      case "DOUBLE_ELIMINATION":
        return "Double Elimination";
      case "ROUND_ROBIN":
        return "Round Robin";
      case "SWISS":
        return "Swiss System";
      case "GROUP_KNOCKOUT":
        return "Group Knockout";
      case "MULTI_STAGE":
        return "Multi-Stage Tournament";
      default:
        return "Unknown Format";
    }
  };
  
  // Get format description
  const getFormatDescription = (format: TournamentFormat) => {
    switch (format) {
      case "SINGLE_ELIMINATION":
        return "A knockout tournament where participants are eliminated after a single loss, until only one champion remains.";
      case "DOUBLE_ELIMINATION":
        return "Teams must lose twice to be eliminated. Losers move to a lower bracket for a second chance.";
      case "ROUND_ROBIN":
        return "Each participant plays against all other participants, and the winner is determined based on accumulated points.";
      case "SWISS":
        return "Teams with similar records are paired in each round, avoiding rematches, until a winner is determined based on record.";
      case "GROUP_KNOCKOUT":
        return "Teams are divided into groups for a round-robin phase, followed by knockout matches between top finishers.";
      case "MULTI_STAGE":
        return "A progressive tournament with multiple stages, including qualification, division placement, and playoffs.";
      default:
        return "Tournament format details are not available.";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Format: {getFormatName(format)}</CardTitle>
        <CardDescription>
          {category ? `Format for ${category.name}` : 'Overall tournament format'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{getFormatDescription(format)}</p>
        
        {/* Visual Representation */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Format Structure</h4>
          <FormatVisualization format={format} />
        </div>
        
        {/* Format-specific details */}
        {format === "MULTI_STAGE" && tournament.formatConfig && (
          <div className="mt-4 bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Multi-Stage Configuration</h4>
            <ul className="text-sm space-y-1">
              {tournament.formatConfig.groupCount && (
                <li>Group Count: {tournament.formatConfig.groupCount}</li>
              )}
              {tournament.formatConfig.teamsPerGroup && (
                <li>Teams Per Group: {tournament.formatConfig.teamsPerGroup}</li>
              )}
              {tournament.formatConfig.advancingTeamsPerGroup && (
                <li>Advancing Teams: {tournament.formatConfig.advancingTeamsPerGroup} per group</li>
              )}
            </ul>
          </div>
        )}
        
        {format === "SWISS" && tournament.formatConfig && (
          <div className="mt-4 bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium mb-2">Swiss Configuration</h4>
            <ul className="text-sm space-y-1">
              {tournament.formatConfig.swissRounds && (
                <li>Number of Rounds: {tournament.formatConfig.swissRounds}</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTournamentFormatExplanation;
