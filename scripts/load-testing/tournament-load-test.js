/**
 * Comprehensive Load Testing for Tournament Operations
 *
 * Tests various tournament scenarios with realistic load patterns
 * including team registration, match scoring, and bracket generation.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const tournamentCreationRate = new Rate('tournament_creation_success');
const teamRegistrationRate = new Rate('team_registration_success');
const matchScoringRate = new Rate('match_scoring_success');
const bracketGenerationTime = new Trend('bracket_generation_duration');
const realTimeUpdateRate = new Rate('realtime_updates_success');

// Load test data
const tournaments = new SharedArray('tournaments', function () {
  return JSON.parse(open('./test-data/tournaments.json'));
});

const teams = new SharedArray('teams', function () {
  return JSON.parse(open('./test-data/teams.json'));
});

const matches = new SharedArray('matches', function () {
  return JSON.parse(open('./test-data/matches.json'));
});

// Test configuration
export const options = {
  stages: [
    // Warm-up phase
    { duration: '2m', target: 10 },

    // Normal load phase
    { duration: '5m', target: 50 },

    // Peak load phase (tournament day)
    { duration: '10m', target: 100 },

    // Stress test phase
    { duration: '5m', target: 200 },

    // Spike test
    { duration: '2m', target: 300 },

    // Cool down
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    // Response time thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_duration{name:tournament_creation}': ['p(95)<3000'],
    'http_req_duration{name:team_registration}': ['p(95)<1000'],
    'http_req_duration{name:match_scoring}': ['p(95)<500'],
    'http_req_duration{name:bracket_generation}': ['p(95)<10000'],

    // Success rate thresholds
    'tournament_creation_success': ['rate>0.95'],
    'team_registration_success': ['rate>0.98'],
    'match_scoring_success': ['rate>0.99'],
    'realtime_updates_success': ['rate>0.95'],

    // Error rate thresholds
    'http_req_failed': ['rate<0.05'],

    // Custom metric thresholds
    'bracket_generation_duration': ['p(95)<15000'],
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:3001';

// Authentication setup
let authToken = '';

export function setup() {
  // Authenticate and get token
  const loginResponse = http.post(`${API_URL}/auth/login`, {
    email: __ENV.TEST_EMAIL || 'test@courtmaster.com',
    password: __ENV.TEST_PASSWORD || 'testpass123'
  });

  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    authToken = body.token;
    console.log('Authentication successful');
  } else {
    console.error('Authentication failed:', loginResponse.status);
  }

  return { authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  // Simulate different user behaviors based on virtual user ID
  const userType = getUserType(__VU);

  switch (userType) {
    case 'organizer':
      organizerWorkflow(headers);
      break;
    case 'player':
      playerWorkflow(headers);
      break;
    case 'scorer':
      scorerWorkflow(headers);
      break;
    case 'spectator':
      spectatorWorkflow(headers);
      break;
    default:
      mixedWorkflow(headers);
  }

  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
}

/**
 * Tournament organizer workflow
 */
function organizerWorkflow(headers) {
  group('Organizer Workflow', function () {
    // Create tournament
    group('Tournament Creation', function () {
      const tournament = getRandomTournament();
      const response = http.post(
        `${API_URL}/tournaments`,
        JSON.stringify(tournament),
        { headers, tags: { name: 'tournament_creation' } }
      );

      const success = check(response, {
        'tournament created': (r) => r.status === 201,
        'response time < 3s': (r) => r.timings.duration < 3000,
      });

      tournamentCreationRate.add(success);

      if (success) {
        const tournamentData = JSON.parse(response.body);
        const tournamentId = tournamentData.id;

        // Set up tournament details
        setupTournamentDetails(tournamentId, headers);

        // Generate brackets (high load operation)
        generateBrackets(tournamentId, headers);
      }
    });

    sleep(2);
  });
}

/**
 * Player workflow
 */
function playerWorkflow(headers) {
  group('Player Workflow', function () {
    // Browse tournaments
    browseTournaments(headers);

    // Register for tournament
    group('Team Registration', function () {
      const tournamentId = getRandomTournamentId();
      const team = getRandomTeam();

      const response = http.post(
        `${API_URL}/tournaments/${tournamentId}/register`,
        JSON.stringify(team),
        { headers, tags: { name: 'team_registration' } }
      );

      const success = check(response, {
        'team registered': (r) => r.status === 201,
        'response time < 1s': (r) => r.timings.duration < 1000,
      });

      teamRegistrationRate.add(success);
    });

    // Check tournament status
    checkTournamentStatus(headers);

    sleep(1);
  });
}

/**
 * Scorer workflow
 */
function scorerWorkflow(headers) {
  group('Scorer Workflow', function () {
    // Get assigned matches
    getAssignedMatches(headers);

    // Score matches (critical operation)
    group('Match Scoring', function () {
      const matchId = getRandomMatchId();
      const score = getRandomScore();

      const response = http.put(
        `${API_URL}/matches/${matchId}/score`,
        JSON.stringify(score),
        { headers, tags: { name: 'match_scoring' } }
      );

      const success = check(response, {
        'match scored': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });

      matchScoringRate.add(success);

      // Test real-time updates
      if (success) {
        testRealTimeUpdates(matchId, headers);
      }
    });

    sleep(0.5);
  });
}

/**
 * Spectator workflow
 */
function spectatorWorkflow(headers) {
  group('Spectator Workflow', function () {
    // View public tournament page
    viewPublicTournament(headers);

    // Check live scores
    checkLiveScores(headers);

    // View brackets
    viewBrackets(headers);

    sleep(2);
  });
}

/**
 * Mixed workflow for general users
 */
function mixedWorkflow(headers) {
  const workflows = [organizerWorkflow, playerWorkflow, scorerWorkflow, spectatorWorkflow];
  const randomWorkflow = workflows[Math.floor(Math.random() * workflows.length)];
  randomWorkflow(headers);
}

/**
 * Helper functions
 */

function getUserType(vuId) {
  if (vuId % 10 === 0) return 'organizer'; // 10% organizers
  if (vuId % 5 === 0) return 'scorer'; // 10% scorers (excluding organizers)
  if (vuId % 3 === 0) return 'spectator'; // ~27% spectators
  return 'player'; // ~53% players
}

function getRandomTournament() {
  const tournament = tournaments[Math.floor(Math.random() * tournaments.length)];
  return {
    ...tournament,
    name: `${tournament.name} ${Date.now()}`, // Make unique
    startDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function getRandomTeam() {
  return teams[Math.floor(Math.random() * teams.length)];
}

function getRandomMatch() {
  return matches[Math.floor(Math.random() * matches.length)];
}

function getRandomTournamentId() {
  return `tournament_${Math.floor(Math.random() * 100) + 1}`;
}

function getRandomMatchId() {
  return `match_${Math.floor(Math.random() * 1000) + 1}`;
}

function getRandomScore() {
  return {
    team1Score: Math.floor(Math.random() * 30),
    team2Score: Math.floor(Math.random() * 30),
    sets: [
      { team1: Math.floor(Math.random() * 25) + 1, team2: Math.floor(Math.random() * 25) + 1 },
      { team1: Math.floor(Math.random() * 25) + 1, team2: Math.floor(Math.random() * 25) + 1 },
    ],
    status: 'completed',
    timestamp: new Date().toISOString(),
  };
}

function browseTournaments(headers) {
  group('Browse Tournaments', function () {
    const response = http.get(`${API_URL}/tournaments`, { headers });

    check(response, {
      'tournaments loaded': (r) => r.status === 200,
      'response contains tournaments': (r) => JSON.parse(r.body).length > 0,
    });
  });
}

function setupTournamentDetails(tournamentId, headers) {
  group('Setup Tournament Details', function () {
    // Add categories
    const categories = {
      categories: [
        { name: 'Men\'s Singles', maxTeams: 32 },
        { name: 'Women\'s Singles', maxTeams: 32 },
        { name: 'Mixed Doubles', maxTeams: 16 },
      ]
    };

    const response = http.put(
      `${API_URL}/tournaments/${tournamentId}/categories`,
      JSON.stringify(categories),
      { headers }
    );

    check(response, {
      'categories added': (r) => r.status === 200,
    });
  });
}

function generateBrackets(tournamentId, headers) {
  group('Bracket Generation', function () {
    const startTime = Date.now();

    const response = http.post(
      `${API_URL}/tournaments/${tournamentId}/generate-brackets`,
      JSON.stringify({ algorithm: 'single_elimination' }),
      { headers, tags: { name: 'bracket_generation' } }
    );

    const duration = Date.now() - startTime;
    bracketGenerationTime.add(duration);

    check(response, {
      'brackets generated': (r) => r.status === 200,
      'generation time < 15s': (r) => r.timings.duration < 15000,
    });
  });
}

function getAssignedMatches(headers) {
  group('Get Assigned Matches', function () {
    const response = http.get(`${API_URL}/matches/assigned`, { headers });

    check(response, {
      'matches retrieved': (r) => r.status === 200,
    });
  });
}

function testRealTimeUpdates(matchId, headers) {
  group('Real-time Updates', function () {
    // Simulate WebSocket connection check
    const response = http.get(`${API_URL}/matches/${matchId}/live`, { headers });

    const success = check(response, {
      'real-time data available': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });

    realTimeUpdateRate.add(success);
  });
}

function checkTournamentStatus(headers) {
  group('Check Tournament Status', function () {
    const tournamentId = getRandomTournamentId();
    const response = http.get(`${API_URL}/tournaments/${tournamentId}/status`, { headers });

    check(response, {
      'status retrieved': (r) => r.status === 200,
    });
  });
}

function viewPublicTournament(headers) {
  group('View Public Tournament', function () {
    const tournamentId = getRandomTournamentId();
    const response = http.get(`${BASE_URL}/tournaments/${tournamentId}/public`, { headers });

    check(response, {
      'public page loaded': (r) => r.status === 200,
      'page contains tournament data': (r) => r.body.includes('tournament'),
    });
  });
}

function checkLiveScores(headers) {
  group('Check Live Scores', function () {
    const response = http.get(`${API_URL}/scores/live`, { headers });

    check(response, {
      'live scores retrieved': (r) => r.status === 200,
    });
  });
}

function viewBrackets(headers) {
  group('View Brackets', function () {
    const tournamentId = getRandomTournamentId();
    const response = http.get(`${API_URL}/tournaments/${tournamentId}/brackets`, { headers });

    check(response, {
      'brackets loaded': (r) => r.status === 200,
    });
  });
}

/**
 * Stress test specific scenarios
 */
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': generateHTMLReport(data),
  };
}

function generateHTMLReport(data) {
  const metrics = data.metrics;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>CourtMaster Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        .metric { margin: 1rem 0; padding: 1rem; border-left: 4px solid #007acc; background: #f5f5f5; }
        .success { border-color: #28a745; }
        .warning { border-color: #ffc107; }
        .error { border-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <h1>CourtMaster Load Test Results</h1>
    <p><strong>Test Duration:</strong> ${data.state.testRunDuration || 'N/A'}</p>
    <p><strong>Virtual Users:</strong> ${data.state.isRunning ? 'Test in progress' : 'Test completed'}</p>

    <h2>Key Metrics</h2>
    ${generateMetricHTML('Response Time (95th percentile)', metrics.http_req_duration?.values?.['p(95)'], 'ms', 2000)}
    ${generateMetricHTML('Success Rate', (1 - (metrics.http_req_failed?.values?.rate || 0)) * 100, '%', 95)}
    ${generateMetricHTML('Tournament Creation Success', (metrics.tournament_creation_success?.values?.rate || 0) * 100, '%', 95)}
    ${generateMetricHTML('Match Scoring Success', (metrics.match_scoring_success?.values?.rate || 0) * 100, '%', 99)}

    <h2>Detailed Metrics</h2>
    <table>
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Trend</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(metrics).map(([name, metric]) => `
                <tr>
                    <td>${name}</td>
                    <td>${formatMetricValue(metric)}</td>
                    <td>${metric.type}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Test Scenarios</h2>
    <ul>
        <li><strong>Organizer Workflow:</strong> Tournament creation, setup, and bracket generation</li>
        <li><strong>Player Workflow:</strong> Tournament browsing and team registration</li>
        <li><strong>Scorer Workflow:</strong> Match scoring and real-time updates</li>
        <li><strong>Spectator Workflow:</strong> Public tournament viewing and live scores</li>
    </ul>

    <h2>Performance Thresholds</h2>
    <ul>
        <li>Response time 95th percentile: < 2 seconds</li>
        <li>Match scoring response time: < 500ms</li>
        <li>Bracket generation: < 15 seconds</li>
        <li>Overall success rate: > 95%</li>
        <li>Match scoring success rate: > 99%</li>
    </ul>
</body>
</html>`;
}

function generateMetricHTML(name, value, unit, threshold) {
  const status = value < threshold ? 'success' : value < threshold * 1.2 ? 'warning' : 'error';
  return `<div class="metric ${status}"><strong>${name}:</strong> ${value?.toFixed(2) || 'N/A'} ${unit}</div>`;
}

function formatMetricValue(metric) {
  if (metric.values) {
    if (metric.values.rate !== undefined) {
      return `${(metric.values.rate * 100).toFixed(2)}%`;
    }
    if (metric.values.avg !== undefined) {
      return `${metric.values.avg.toFixed(2)}ms`;
    }
    if (metric.values['p(95)'] !== undefined) {
      return `${metric.values['p(95)'].toFixed(2)}ms (p95)`;
    }
  }
  return 'N/A';
}

export { tournamentCreationRate, teamRegistrationRate, matchScoringRate, bracketGenerationTime, realTimeUpdateRate };