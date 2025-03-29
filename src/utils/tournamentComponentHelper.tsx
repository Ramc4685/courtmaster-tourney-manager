
import React from "react";
import { Court, Match, Team } from "@/types/tournament";
import MatchesTab from "@/components/tournament/tabs/MatchesTab";

/**
 * Renders the Matches Tab with the necessary props
 * @param matches Array of matches
 * @param teams Array of teams
 * @param courts Array of courts
 * @param onMatchUpdate Function to update a match
 * @param onCourtAssign Function to assign a court to a match
 * @param onStartMatch Function to start a match
 * @param onAddMatchClick Function to handle adding a match
 * @param onAutoScheduleClick Function to handle auto scheduling
 * @returns MatchesTab component
 */
export const renderMatchesTab = (
  matches: Match[],
  teams: Team[],
  courts: Court[],
  onMatchUpdate: (match: Match) => void,
  onCourtAssign: (matchId: string, courtId: string) => void,
  onStartMatch?: (matchId: string, force?: boolean) => void,
  onAddMatchClick?: () => void,
  onAutoScheduleClick?: () => void
) => (
  <MatchesTab
    matches={matches}
    teams={teams}
    courts={courts}
    onMatchUpdate={onMatchUpdate}
    onCourtAssign={onCourtAssign}
    onStartMatch={onStartMatch}
    onAddMatchClick={onAddMatchClick || (() => {})}
    onAutoScheduleClick={onAutoScheduleClick || (() => {})}
  />
);

export default {
  renderMatchesTab
};
