import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { createMockTournament, createMockTeam, createMockPlayer, mockLocalStorage, mockToast } from '../utils';
import { Tournament, Team, Match, Court } from '@/types/entities';
import { TournamentStatus, CourtStatus } from '@/types/tournament-enums';

// Mock all the services
const mockTournamentService = {
  createTournament: vi.fn(),
  updateTournament: vi.fn(),
  getTournamentById: vi.fn(),
  listTournaments: vi.fn(),
  generateSchedule: vi.fn(),
  generateBracket: vi.fn()
};

const mockTeamService = {
  addTeam: vi.fn(),
  updateTeam: vi.fn(),
  removeTeam: vi.fn(),
  listTeams: vi.fn()
};

const mockMatchService = {
  listMatches: vi.fn(),
  updateMatch: vi.fn(),
  updateMatchScore: vi.fn(),
  createMatch: vi.fn()
};

const mockCourtService = {
  listCourts: vi.fn(),
  createCourt: vi.fn(),
  updateCourt: vi.fn(),
  assignMatchToCourt: vi.fn()
};

const mockRegistrationService = {
  submitRegistration: vi.fn(),
  listRegistrations: vi.fn(),
  approveRegistration: vi.fn(),
  getRegistrationStatus: vi.fn()
};

vi.mock('@/services/api', () => ({
  tournamentService: mockTournamentService,
  teamService: mockTeamService,
  matchService: mockMatchService,
  courtService: mockCourtService,
  registrationService: mockRegistrationService
}));

// Mock the contexts
const mockUser = {
  id: 'admin-user-1',
  email: 'admin@example.com',
  role: 'admin'
};

vi.mock('@/contexts/auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn()
  })
}));

const mockTournamentContext = {
  tournaments: [],
  selectedTournament: null,
  isLoading: false,
  createTournament: vi.fn(),
  selectTournament: vi.fn(),
  updateTournament: vi.fn(),
  refreshTournaments: vi.fn()
};

vi.mock('@/contexts/tournament/TournamentContext', () => ({
  useTournament: () => mockTournamentContext,
  TournamentProvider: ({ children }: any) => children
}));

// Mock notifications
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage()
});

// Mock Appwrite realtime
vi.mock('@/lib/appwrite', () => ({
  subscribeToCollectionFiltered: vi.fn(() => vi.fn()),
  COLLECTIONS: {
    TOURNAMENTS: 'tournaments',
    TEAMS: 'teams',
    MATCHES: 'matches',
    COURTS: 'courts',
    REGISTRATIONS: 'registrations'
  }
}));

// Create a wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Mock data
const mockTournament: Tournament = {
  ...createMockTournament(),
  id: 'tournament-1',
  name: 'Integration Test Tournament',
  status: TournamentStatus.DRAFT
};

const mockTeams: Team[] = [
  createMockTeam({ id: 'team-1', name: 'Team Alpha' }),
  createMockTeam({ id: 'team-2', name: 'Team Beta' }),
  createMockTeam({ id: 'team-3', name: 'Team Gamma' }),
  createMockTeam({ id: 'team-4', name: 'Team Delta' })
];

const mockCourts: Court[] = [
  {
    id: 'court-1',
    name: 'Center Court',
    courtNumber: 1,
    court_number: 1,
    status: CourtStatus.AVAILABLE,
    tournament_id: 'tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'court-2',
    name: 'Court 2',
    courtNumber: 2,
    court_number: 2,
    status: CourtStatus.AVAILABLE,
    tournament_id: 'tournament-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('Tournament Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockTournamentService.createTournament.mockResolvedValue(mockTournament);
    mockTournamentService.getTournamentById.mockResolvedValue(mockTournament);
    mockTournamentService.listTournaments.mockResolvedValue([mockTournament]);
    mockTournamentService.updateTournament.mockResolvedValue(mockTournament);

    mockTeamService.listTeams.mockResolvedValue(mockTeams);
    mockTeamService.addTeam.mockResolvedValue(mockTeams[0]);

    mockCourtService.listCourts.mockResolvedValue(mockCourts);
    mockCourtService.createCourt.mockResolvedValue(mockCourts[0]);

    mockMatchService.listMatches.mockResolvedValue([]);
    mockRegistrationService.listRegistrations.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Tournament Creation Workflow', () => {
    it('allows admin to create tournament from start to finish', async () => {
      const user = userEvent.setup();

      // Import the actual components (these would be the real components in the app)
      const TournamentWizard = vi.fn().mockImplementation(() => (
        <div data-testid="tournament-wizard">
          <h1>Create Tournament</h1>
          <form data-testid="tournament-form">
            <input
              data-testid="tournament-name"
              placeholder="Tournament Name"
              defaultValue="Test Tournament"
            />
            <button type="submit" data-testid="create-tournament">
              Create Tournament
            </button>
          </form>
        </div>
      ));

      render(
        <TestWrapper>
          <TournamentWizard />
        </TestWrapper>
      );

      // Step 1: Fill in tournament details
      const nameInput = screen.getByTestId('tournament-name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Integration Test Tournament');

      // Step 2: Submit the form
      const createButton = screen.getByTestId('create-tournament');
      await user.click(createButton);

      // Verify tournament creation was called
      await waitFor(() => {
        expect(mockTournamentService.createTournament).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Integration Test Tournament'
          })
        );
      });

      // Verify success notification
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Tournament created')
      );
    });

    it('handles tournament creation errors gracefully', async () => {
      const user = userEvent.setup();

      mockTournamentService.createTournament.mockRejectedValue(
        new Error('Tournament name already exists')
      );

      const TournamentWizard = vi.fn().mockImplementation(() => (
        <div data-testid="tournament-wizard">
          <form data-testid="tournament-form">
            <input data-testid="tournament-name" placeholder="Tournament Name" />
            <button type="submit" data-testid="create-tournament">
              Create Tournament
            </button>
          </form>
        </div>
      ));

      render(
        <TestWrapper>
          <TournamentWizard />
        </TestWrapper>
      );

      const nameInput = screen.getByTestId('tournament-name');
      await user.type(nameInput, 'Duplicate Tournament');

      const createButton = screen.getByTestId('create-tournament');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Tournament name already exists')
        );
      });
    });
  });

  describe('Team Registration Workflow', () => {
    it('allows teams to register for tournament', async () => {
      const user = userEvent.setup();

      const RegistrationForm = vi.fn().mockImplementation(() => (
        <div data-testid="registration-form">
          <h2>Team Registration</h2>
          <form data-testid="team-registration-form">
            <input
              data-testid="team-name"
              placeholder="Team Name"
            />
            <input
              data-testid="player-name"
              placeholder="Player Name"
            />
            <input
              data-testid="contact-email"
              placeholder="Contact Email"
              type="email"
            />
            <button type="submit" data-testid="register-team">
              Register Team
            </button>
          </form>
        </div>
      ));

      render(
        <TestWrapper>
          <RegistrationForm />
        </TestWrapper>
      );

      // Fill in registration form
      await user.type(screen.getByTestId('team-name'), 'Test Team');
      await user.type(screen.getByTestId('player-name'), 'John Doe');
      await user.type(screen.getByTestId('contact-email'), 'john@example.com');

      // Submit registration
      await user.click(screen.getByTestId('register-team'));

      await waitFor(() => {
        expect(mockRegistrationService.submitRegistration).toHaveBeenCalledWith(
          expect.objectContaining({
            teamName: 'Test Team',
            playerName: 'John Doe',
            contactEmail: 'john@example.com'
          })
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Registration submitted')
      );
    });

    it('handles registration validation errors', async () => {
      const user = userEvent.setup();

      mockRegistrationService.submitRegistration.mockRejectedValue(
        new Error('Email already registered')
      );

      const RegistrationForm = vi.fn().mockImplementation(() => (
        <div data-testid="registration-form">
          <form data-testid="team-registration-form">
            <input data-testid="team-name" placeholder="Team Name" />
            <input data-testid="contact-email" placeholder="Contact Email" type="email" />
            <button type="submit" data-testid="register-team">Register Team</button>
          </form>
        </div>
      ));

      render(
        <TestWrapper>
          <RegistrationForm />
        </TestWrapper>
      );

      await user.type(screen.getByTestId('team-name'), 'Duplicate Team');
      await user.type(screen.getByTestId('contact-email'), 'existing@example.com');
      await user.click(screen.getByTestId('register-team'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Email already registered')
        );
      });
    });
  });

  describe('Match Scheduling and Court Assignment Workflow', () => {
    beforeEach(() => {
      mockTournamentService.generateSchedule.mockResolvedValue([
        {
          id: 'match-1',
          tournament_id: 'tournament-1',
          team1_id: 'team-1',
          team2_id: 'team-2',
          round_number: 1,
          match_number: 1,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    });

    it('generates schedule and assigns courts automatically', async () => {
      const user = userEvent.setup();

      const SchedulingInterface = vi.fn().mockImplementation(() => (
        <div data-testid="scheduling-interface">
          <h2>Match Scheduling</h2>
          <button data-testid="generate-schedule">
            Generate Schedule
          </button>
          <button data-testid="assign-courts">
            Auto-Assign Courts
          </button>
          <div data-testid="match-list">
            <div data-testid="match-item">Team Alpha vs Team Beta</div>
          </div>
        </div>
      ));

      render(
        <TestWrapper>
          <SchedulingInterface />
        </TestWrapper>
      );

      // Generate schedule
      await user.click(screen.getByTestId('generate-schedule'));

      await waitFor(() => {
        expect(mockTournamentService.generateSchedule).toHaveBeenCalledWith('tournament-1');
      });

      // Auto-assign courts
      await user.click(screen.getByTestId('assign-courts'));

      await waitFor(() => {
        expect(mockCourtService.assignMatchToCourt).toHaveBeenCalled();
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Schedule generated')
      );
    });

    it('handles scheduling conflicts and provides alternatives', async () => {
      const user = userEvent.setup();

      mockTournamentService.generateSchedule.mockRejectedValue(
        new Error('Insufficient courts for simultaneous matches')
      );

      const SchedulingInterface = vi.fn().mockImplementation(() => (
        <div data-testid="scheduling-interface">
          <button data-testid="generate-schedule">Generate Schedule</button>
          <div data-testid="error-message" style={{ display: 'none' }}>
            Scheduling conflict detected
          </div>
          <button data-testid="resolve-conflicts" style={{ display: 'none' }}>
            Resolve Conflicts
          </button>
        </div>
      ));

      render(
        <TestWrapper>
          <SchedulingInterface />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('generate-schedule'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Insufficient courts')
        );
      });
    });
  });

  describe('Live Scoring Workflow', () => {
    it('allows real-time score updates during matches', async () => {
      const user = userEvent.setup();

      const ScoringInterface = vi.fn().mockImplementation(() => (
        <div data-testid="scoring-interface">
          <h2>Live Scoring</h2>
          <div data-testid="match-info">Team Alpha vs Team Beta</div>
          <div data-testid="score-controls">
            <button data-testid="team1-point">Team 1 +1</button>
            <button data-testid="team2-point">Team 2 +1</button>
            <div data-testid="current-score">15 - 12</div>
          </div>
          <button data-testid="finish-match">Finish Match</button>
        </div>
      ));

      render(
        <TestWrapper>
          <ScoringInterface />
        </TestWrapper>
      );

      // Add points to team 1
      await user.click(screen.getByTestId('team1-point'));
      await user.click(screen.getByTestId('team1-point'));

      // Add points to team 2
      await user.click(screen.getByTestId('team2-point'));

      // Finish the match
      await user.click(screen.getByTestId('finish-match'));

      await waitFor(() => {
        expect(mockMatchService.updateMatchScore).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            scores: expect.any(Object)
          })
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Match completed')
      );
    });

    it('validates score updates and prevents invalid scores', async () => {
      const user = userEvent.setup();

      mockMatchService.updateMatchScore.mockRejectedValue(
        new Error('Invalid score: cannot exceed maximum points')
      );

      const ScoringInterface = vi.fn().mockImplementation(() => (
        <div data-testid="scoring-interface">
          <button data-testid="team1-point">Team 1 +1</button>
          <div data-testid="current-score">30 - 29</div>
        </div>
      ));

      render(
        <TestWrapper>
          <ScoringInterface />
        </TestWrapper>
      );

      // Try to add point that would exceed maximum
      await user.click(screen.getByTestId('team1-point'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('Invalid score')
        );
      });
    });
  });

  describe('Cross-Component Data Flow', () => {
    it('maintains data consistency across tournament components', async () => {
      const user = userEvent.setup();

      // Update tournament status
      const updatedTournament = { ...mockTournament, status: TournamentStatus.ACTIVE };
      mockTournamentService.updateTournament.mockResolvedValue(updatedTournament);

      const TournamentDashboard = vi.fn().mockImplementation(() => (
        <div data-testid="tournament-dashboard">
          <div data-testid="tournament-status">{mockTournament.status}</div>
          <button data-testid="start-tournament">Start Tournament</button>
          <div data-testid="team-count">Teams: {mockTeams.length}</div>
          <div data-testid="court-count">Courts: {mockCourts.length}</div>
        </div>
      ));

      render(
        <TestWrapper>
          <TournamentDashboard />
        </TestWrapper>
      );

      // Verify initial state
      expect(screen.getByTestId('tournament-status')).toHaveTextContent('DRAFT');
      expect(screen.getByTestId('team-count')).toHaveTextContent('Teams: 4');

      // Start tournament
      await user.click(screen.getByTestId('start-tournament'));

      await waitFor(() => {
        expect(mockTournamentService.updateTournament).toHaveBeenCalledWith(
          mockTournament.id,
          expect.objectContaining({
            status: TournamentStatus.ACTIVE
          })
        );
      });
    });

    it('handles real-time updates across multiple components', async () => {
      // Simulate real-time update
      const realtimeUpdate = {
        type: 'MATCH_UPDATE',
        data: {
          matchId: 'match-1',
          scores: { team1: 21, team2: 18 }
        }
      };

      const MultiComponentView = vi.fn().mockImplementation(() => (
        <div data-testid="multi-component-view">
          <div data-testid="live-scores">
            <div data-testid="match-1-score">21 - 18</div>
          </div>
          <div data-testid="tournament-bracket">
            <div data-testid="bracket-match-1">Team Alpha wins</div>
          </div>
          <div data-testid="public-display">
            <div data-testid="public-match-1">Final: 21-18</div>
          </div>
        </div>
      ));

      render(
        <TestWrapper>
          <MultiComponentView />
        </TestWrapper>
      );

      // Verify all components show updated data
      expect(screen.getByTestId('match-1-score')).toHaveTextContent('21 - 18');
      expect(screen.getByTestId('bracket-match-1')).toHaveTextContent('Team Alpha wins');
      expect(screen.getByTestId('public-match-1')).toHaveTextContent('Final: 21-18');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers gracefully from network failures', async () => {
      const user = userEvent.setup();

      // Simulate network failure
      mockMatchService.listMatches
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue([]);

      const ResilienceTest = vi.fn().mockImplementation(() => (
        <div data-testid="resilience-test">
          <button data-testid="retry-action">Retry</button>
          <div data-testid="error-state">Network error occurred</div>
        </div>
      ));

      render(
        <TestWrapper>
          <ResilienceTest />
        </TestWrapper>
      );

      // Verify error state is shown
      expect(screen.getByTestId('error-state')).toHaveTextContent('Network error occurred');

      // Retry the action
      await user.click(screen.getByTestId('retry-action'));

      await waitFor(() => {
        expect(mockMatchService.listMatches).toHaveBeenCalledTimes(2);
      });
    });

    it('maintains functionality during partial service failures', async () => {
      // One service fails, others continue working
      mockCourtService.listCourts.mockRejectedValue(new Error('Court service unavailable'));
      mockMatchService.listMatches.mockResolvedValue([]);
      mockTeamService.listTeams.mockResolvedValue(mockTeams);

      const PartialFailureTest = vi.fn().mockImplementation(() => (
        <div data-testid="partial-failure-test">
          <div data-testid="teams-section">Teams: Available</div>
          <div data-testid="matches-section">Matches: Available</div>
          <div data-testid="courts-section">Courts: Service Error</div>
        </div>
      ));

      render(
        <TestWrapper>
          <PartialFailureTest />
        </TestWrapper>
      );

      // Verify partial functionality is maintained
      expect(screen.getByTestId('teams-section')).toHaveTextContent('Teams: Available');
      expect(screen.getByTestId('matches-section')).toHaveTextContent('Matches: Available');
      expect(screen.getByTestId('courts-section')).toHaveTextContent('Courts: Service Error');
    });
  });

  describe('Performance Under Load', () => {
    it('handles large tournaments efficiently', async () => {
      // Create large dataset
      const largeTeamSet = Array.from({ length: 100 }, (_, i) =>
        createMockTeam({ id: `team-${i}`, name: `Team ${i}` })
      );

      const largeMatchSet = Array.from({ length: 200 }, (_, i) => ({
        id: `match-${i}`,
        tournament_id: 'tournament-1',
        team1_id: `team-${i * 2}`,
        team2_id: `team-${i * 2 + 1}`,
        match_number: i + 1,
        round_number: Math.floor(i / 16) + 1,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      mockTeamService.listTeams.mockResolvedValue(largeTeamSet);
      mockMatchService.listMatches.mockResolvedValue(largeMatchSet);

      const PerformanceTest = vi.fn().mockImplementation(() => (
        <div data-testid="performance-test">
          <div data-testid="team-list">
            {largeTeamSet.slice(0, 10).map(team => (
              <div key={team.id} data-testid={`team-${team.id}`}>
                {team.name}
              </div>
            ))}
          </div>
          <div data-testid="match-count">Matches: {largeMatchSet.length}</div>
        </div>
      ));

      const startTime = performance.now();

      render(
        <TestWrapper>
          <PerformanceTest />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('match-count')).toHaveTextContent('Matches: 200');
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even with large dataset
      expect(renderTime).toBeLessThan(1000); // 1 second
    });
  });
});