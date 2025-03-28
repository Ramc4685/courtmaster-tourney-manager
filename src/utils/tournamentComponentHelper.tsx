
import React from "react";
import EnhancedMatchesTab from "@/components/tournament/tabs/EnhancedMatchesTab";
import MatchesTab from "@/components/tournament/tabs/MatchesTab";
import { Match, Team, Court } from "@/types/tournament";

/**
 * Helper for getting the appropriate MatchesTab component
 * Allows us to use our enhanced version without modifying the original component
 */
export const getMatchesTabComponent = () => {
  // We'll always return the enhanced version
  return EnhancedMatchesTab;
};

/**
 * Helper function to render the MatchesTab with the enhanced version if available
 */
export const renderMatchesTab = (
  matches: Match[],
  teams: Team[],
  courts: Court[],
  onMatchUpdate: (match: Match) => void,
  onCourtAssign: (matchId: string, courtId: string) => void,
  onAddMatchClick: () => void,
  onAutoScheduleClick: () => void
) => {
  const TabComponent = getMatchesTabComponent();
  
  return (
    <TabComponent
      matches={matches}
      teams={teams}
      courts={courts}
      onMatchUpdate={onMatchUpdate}
      onCourtAssign={onCourtAssign}
      onAddMatchClick={onAddMatchClick}
      onAutoScheduleClick={onAutoScheduleClick}
    />
  );
};
