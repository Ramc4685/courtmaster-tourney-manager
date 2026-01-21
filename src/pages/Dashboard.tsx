import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { useAuth } from '@/contexts/auth/AuthContext';
import { UpcomingMatchInfo, matchService } from '@/services';
import { registrationService, UserRegistration } from '@/services/registrationService';
import { tournamentService } from '@/services';
import { Tournament } from '@/types/tournament';
import {
  ServiceResponseState,
  createServiceResponseState,
} from '@/utils/serviceHelpers';

const defaultErrorMessage = 'Something went wrong. Please try again later.';

const formatError = (fallback: string, rawError: unknown) => {
  if (rawError instanceof Error && rawError.message) {
    return `${fallback} (${rawError.message})`;
  }
  return fallback || defaultErrorMessage;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tournamentsState, setTournamentsState] = useState<ServiceResponseState<Tournament[]>>(
    createServiceResponseState<Tournament[]>([])
  );
  const [registrationsState, setRegistrationsState] = useState<ServiceResponseState<UserRegistration[]>>(
    createServiceResponseState<UserRegistration[]>([])
  );
  const [matchesState, setMatchesState] = useState<ServiceResponseState<UpcomingMatchInfo[]>>(
    createServiceResponseState<UpcomingMatchInfo[]>([])
  );

  const fetchAllData = async (userId: string) => {
    setTournamentsState(prev => ({ ...prev, loading: true, error: null }));
    setRegistrationsState(prev => ({ ...prev, loading: true, error: null }));
    setMatchesState(prev => ({ ...prev, loading: true, error: null }));

    const [tournamentResult, registrationResult, matchResult] = await Promise.allSettled([
      tournamentService.getTournaments(),
      registrationService.getUserRegistrations(userId),
      matchService.getUpcomingMatchesForUser(userId),
    ]);

    if (tournamentResult.status === 'fulfilled') {
      setTournamentsState({ data: tournamentResult.value, loading: false, error: null });
    } else {
      setTournamentsState(prev => ({
        ...prev,
        loading: false,
        error: formatError('Unable to load tournaments right now.', tournamentResult.reason),
      }));
    }

    if (registrationResult.status === 'fulfilled') {
      setRegistrationsState({ data: registrationResult.value, loading: false, error: null });
    } else {
      setRegistrationsState(prev => ({
        ...prev,
        loading: false,
        error: formatError('Unable to load registrations right now.', registrationResult.reason),
      }));
    }

    if (matchResult.status === 'fulfilled') {
      setMatchesState({ data: matchResult.value, loading: false, error: null });
    } else {
      setMatchesState(prev => ({
        ...prev,
        loading: false,
        error: formatError('Unable to load upcoming matches right now.', matchResult.reason),
      }));
    }
  };

  const retrySection = async (section: 'tournaments' | 'registrations' | 'matches') => {
    if (!user) return;

    if (section === 'tournaments') {
      setTournamentsState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const tournaments = await tournamentService.getTournaments();
        setTournamentsState({ data: tournaments, loading: false, error: null });
      } catch (err) {
        setTournamentsState(prev => ({
          ...prev,
          loading: false,
          error: formatError('Unable to load tournaments right now.', err),
        }));
      }
    }

    if (section === 'registrations') {
      setRegistrationsState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const registrations = await registrationService.getUserRegistrations(user.id);
        setRegistrationsState({ data: registrations, loading: false, error: null });
      } catch (err) {
        setRegistrationsState(prev => ({
          ...prev,
          loading: false,
          error: formatError('Unable to load registrations right now.', err),
        }));
      }
    }

    if (section === 'matches') {
      setMatchesState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const matches = await matchService.getUpcomingMatchesForUser(user.id);
        setMatchesState({ data: matches, loading: false, error: null });
      } catch (err) {
        setMatchesState(prev => ({
          ...prev,
          loading: false,
          error: formatError('Unable to load upcoming matches right now.', err),
        }));
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setTournamentsState(createServiceResponseState<Tournament[]>([]));
      setRegistrationsState(createServiceResponseState<UserRegistration[]>([]));
      setMatchesState(createServiceResponseState<UpcomingMatchInfo[]>([]));
      return;
    }

    fetchAllData(user.id);
  }, [user]);

  const tournaments = tournamentsState.data ?? [];
  const organizedTournaments = useMemo(() => {
    if (!user) {
      return [] as Tournament[];
    }
    return tournaments.filter(tournament =>
      tournament.organizerId === user.id || tournament.organizer_id === user.id
    );
  }, [tournaments, user]);

  const registeredTournaments = registrationsState.data ?? [];
  const upcomingMatches = matchesState.data ?? [];

  const renderSectionError = (message: string, onRetry: () => void) => (
    <Alert>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );

  const renderSectionLoading = (label: string) => (
    <div className="flex items-center py-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="ml-2">Loading {label}...</span>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        <DashboardSummary
          tournaments={organizedTournaments}
          tournamentsLoading={tournamentsState.loading}
          tournamentsError={tournamentsState.error}
          onRetryTournaments={() => retrySection('tournaments')}
          upcomingMatches={upcomingMatches.length}
          upcomingMatchesLoading={matchesState.loading}
          upcomingMatchesError={matchesState.error}
          onRetryUpcomingMatches={() => retrySection('matches')}
          registeredPlayers={registeredTournaments.length}
          registeredPlayersLoading={registrationsState.loading}
          registeredPlayersError={registrationsState.error}
          onRetryRegisteredPlayers={() => retrySection('registrations')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Tournaments You Organize</CardTitle>
            </CardHeader>
            <CardContent>
              {tournamentsState.loading ? (
                renderSectionLoading('tournaments')
              ) : tournamentsState.error ? (
                renderSectionError(tournamentsState.error, () => retrySection('tournaments'))
              ) : organizedTournaments.length > 0 ? (
                <div className="space-y-4">
                  {organizedTournaments.map((tournament) => (
                    <Link
                      key={tournament.id}
                      to={`/tournaments/${tournament.id}`}
                      className="block p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                    >
                      <h4 className="font-medium">{tournament.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: {tournament.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You haven't organized any tournaments yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Tournaments You're Registered In</CardTitle>
            </CardHeader>
            <CardContent>
              {registrationsState.loading ? (
                renderSectionLoading('registrations')
              ) : registrationsState.error ? (
                renderSectionError(registrationsState.error, () => retrySection('registrations'))
              ) : registeredTournaments.length > 0 ? (
                <div className="space-y-4">
                  {registeredTournaments.map((registration) => (
                    <Link
                      key={registration.id}
                      to={`/tournaments/${registration.tournamentId}`}
                      className="block p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                    >
                      <h4 className="font-medium">{registration.tournamentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: {registration.status}
                        {registration.isTeamRegistration ? ` (Team: ${registration.teamName})` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(registration.tournamentStartDate).toLocaleDateString()} - {new Date(registration.tournamentEndDate).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You are not registered for any upcoming tournaments.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 xl:col-span-1">
            <CardHeader>
              <CardTitle>Your Upcoming Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {matchesState.loading ? (
                renderSectionLoading('upcoming matches')
              ) : matchesState.error ? (
                renderSectionError(matchesState.error, () => retrySection('matches'))
              ) : upcomingMatches.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <Link
                      key={match.id}
                      to={`/tournaments/${match.tournamentId}/matches/${match.id}`}
                      className="block p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
                    >
                      <h4 className="font-medium">
                        {match.tournamentName} - Round {match.roundNumber}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        vs {match.opponentName || 'TBD'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'Not scheduled'} |
                        Court: {match.courtName || 'TBD'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You have no upcoming scheduled matches.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
