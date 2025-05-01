import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, List, ListItem, ListItemText, Divider } from '@mui/material'; // Using MUI components
import { useAuth } from '@/contexts/auth/AuthContext';
import { tournamentService } from '@/services/tournament/TournamentService';
import { registrationService, UserRegistration } from '@/services/registrationService';
import { matchService, UpcomingMatchInfo } from '@/services/matchService';
import { Tournament } from '@/types/tournament';
import { Link } from 'react-router-dom';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary'; // Import DashboardSummary

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]); // Store all tournaments for summary
  const [organizedTournaments, setOrganizedTournaments] = useState<Tournament[]>([]);
  const [registeredTournaments, setRegisteredTournaments] = useState<UserRegistration[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);
      try {
        // Fetch all tournaments first (needed for summary and organized list)
        const fetchedAllTournaments = await tournamentService.getTournaments();
        setAllTournaments(fetchedAllTournaments);

        // Filter for organized tournaments
        const userOrganized = fetchedAllTournaments.filter(t => t.organizerId === user.id);
        setOrganizedTournaments(userOrganized);

        // Fetch user's registrations (player and team)
        const userRegistrations = await registrationService.getUserRegistrations(user.id);
        setRegisteredTournaments(userRegistrations);

        // Fetch user's upcoming matches
        const userUpcomingMatches = await matchService.getUpcomingMatchesForUser(user.id);
        setUpcomingMatches(userUpcomingMatches);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate counts for DashboardSummary
  // Note: registeredPlayers count might need refinement based on exact definition (players vs entries)
  const upcomingMatchesCount = upcomingMatches.length;
  const registeredEntriesCount = registeredTournaments.length; // Using registration count for now

  return (
    <Box sx={{ p: 3 }}>
      {/* Use Box instead of Typography for main title to match DashboardSummary style */}
      {/* <Typography variant="h4" gutterBottom> Dashboard </Typography> */}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {!isLoading && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Integrate DashboardSummary at the top */}
          <DashboardSummary 
            tournaments={allTournaments} // Pass all tournaments for summary stats/list
            upcomingMatches={upcomingMatchesCount}
            registeredPlayers={registeredEntriesCount} // Pass calculated count
          />

          {/* Keep detailed lists below */}
          <Grid container spacing={3}>
            {/* Tournaments You Organize */}
            <Grid item xs={12} md={6}>
              {/* Using Paper for consistency with previous implementation, but could use Card */}
              <Paper sx={{ p: 2, height: '100%' }}> 
                <Typography variant="h6" gutterBottom>
                  Tournaments You Organize
                </Typography>
                {organizedTournaments.length > 0 ? (
                  <List dense>
                    {organizedTournaments.map((tournament, index) => (
                      <React.Fragment key={tournament.id}>
                        <ListItem button component={Link} to={`/tournaments/${tournament.id}`}>
                          <ListItemText 
                            primary={tournament.name}
                            secondary={`Status: ${tournament.status} | Dates: ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}`}
                          />
                        </ListItem>
                        {index < organizedTournaments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    You haven't organized any tournaments yet.
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Tournaments You're Registered In */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Tournaments You're Registered In
                </Typography>
                {registeredTournaments.length > 0 ? (
                  <List dense>
                    {registeredTournaments.map((reg, index) => (
                      <React.Fragment key={reg.id}>
                        <ListItem button component={Link} to={`/tournaments/${reg.tournamentId}`}>
                          <ListItemText 
                            primary={reg.tournamentName}
                            secondary={`Status: ${reg.status} ${reg.isTeamRegistration ? `(Team: ${reg.teamName})` : ''} | Dates: ${new Date(reg.tournamentStartDate).toLocaleDateString()} - ${new Date(reg.tournamentEndDate).toLocaleDateString()}`}
                          />
                        </ListItem>
                        {index < registeredTournaments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    You are not registered for any upcoming tournaments.
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Upcoming Matches */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Your Upcoming Matches
                </Typography>
                {upcomingMatches.length > 0 ? (
                  <List dense>
                    {upcomingMatches.map((match, index) => (
                      <React.Fragment key={match.id}>
                        {/* Assuming a route like /tournaments/:tId/matches/:mId exists */}
                        <ListItem button component={Link} to={`/tournaments/${match.tournamentId}/matches/${match.id}`}> 
                          <ListItemText 
                            primary={`${match.tournamentName} - Round ${match.roundNumber} vs ${match.opponentName || 'TBD'}`}
                            secondary={`Time: ${match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Not scheduled'} | Court: ${match.courtName || 'TBD'}`}
                          />
                        </ListItem>
                        {index < upcomingMatches.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    You have no upcoming scheduled matches.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;

