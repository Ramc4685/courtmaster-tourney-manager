export const tournamentBasePath = '/tournament';

const withTournamentPath = (tournamentId: string, ...segments: string[]): string => {
  const sanitizedId = tournamentId.trim();
  const suffix = segments.filter(Boolean).join('/');
  return suffix ? `${tournamentBasePath}/${sanitizedId}/${suffix}` : `${tournamentBasePath}/${sanitizedId}`;
};

export const tournamentRoutes = {
  base: (tournamentId: string) => withTournamentPath(tournamentId),
  dashboard: (tournamentId: string) => withTournamentPath(tournamentId, 'dashboard'),
  scoreboard: (tournamentId: string) => withTournamentPath(tournamentId, 'scoreboard'),
  participants: (tournamentId: string) => withTournamentPath(tournamentId, 'participants'),
  matches: (tournamentId: string) => withTournamentPath(tournamentId, 'matches'),
  match: (tournamentId: string, matchId: string) => withTournamentPath(tournamentId, 'matches', matchId),
  schedule: (tournamentId: string) => withTournamentPath(tournamentId, 'schedule'),
  courts: (tournamentId: string) => withTournamentPath(tournamentId, 'courts'),
  announcements: (tournamentId: string) => withTournamentPath(tournamentId, 'announcements'),
  settings: (tournamentId: string) => withTournamentPath(tournamentId, 'settings'),
};

export const buildTournamentRoute = withTournamentPath;
