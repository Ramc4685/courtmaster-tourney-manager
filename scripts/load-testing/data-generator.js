/**
 * Realistic Test Data Generator for Load Testing
 *
 * Generates comprehensive test data for tournaments, teams, players, and matches
 * with realistic patterns and scaling options for different tournament sizes.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for data generation
const CONFIG = {
  tournaments: {
    count: 50,
    sizes: [8, 16, 32, 64, 128, 256], // Number of teams
    formats: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
    sports: ['badminton', 'tennis', 'squash', 'table_tennis', 'pickleball'],
  },
  teams: {
    count: 1000,
    playersPerTeam: { min: 1, max: 4 },
  },
  players: {
    count: 2500,
    skillLevels: ['beginner', 'intermediate', 'advanced', 'expert', 'professional'],
  },
  matches: {
    count: 5000,
    scoringPatterns: {
      badminton: { maxPoints: 21, sets: 3 },
      tennis: { maxPoints: 6, sets: 3, tiebreak: 7 },
      squash: { maxPoints: 11, sets: 5 },
      table_tennis: { maxPoints: 11, sets: 7 },
      pickleball: { maxPoints: 11, sets: 3 },
    },
  },
};

// Sample data pools
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
  'Cameron', 'Blake', 'Sage', 'River', 'Phoenix', 'Rowan', 'Skylar', 'Drew',
  'Emery', 'Finley', 'Hayden', 'Kendall', 'Logan', 'Parker', 'Peyton', 'Reese',
  'Sam', 'Jamie', 'Jesse', 'Kai', 'Lane', 'Max', 'Nico', 'Ash', 'Bay', 'Blue',
  'Charlie', 'Dakota', 'Eden', 'Gray', 'Harper', 'Indigo', 'Jade', 'Kit',
  'Lee', 'Marley', 'Nova', 'Ocean', 'Piper', 'Rain', 'Scout', 'Tate'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz'
];

const TEAM_ADJECTIVES = [
  'Lightning', 'Thunder', 'Storm', 'Blazing', 'Swift', 'Mighty', 'Golden',
  'Silver', 'Diamond', 'Elite', 'Prime', 'Ultimate', 'Supreme', 'Royal',
  'Noble', 'Fierce', 'Bold', 'Brave', 'Rapid', 'Dynamic', 'Stellar',
  'Cosmic', 'Phoenix', 'Dragon', 'Eagle', 'Falcon', 'Wolf', 'Lion',
  'Tiger', 'Panther', 'Viper', 'Shark', 'Hawk', 'Raven', 'Spartan',
  'Titan', 'Warrior', 'Champion', 'Victory', 'Triumph', 'Glory', 'Honor'
];

const TEAM_NOUNS = [
  'Aces', 'Arrows', 'Blades', 'Bolts', 'Bullets', 'Comets', 'Crushers',
  'Destroyers', 'Dynamos', 'Flames', 'Force', 'Fury', 'Guardians', 'Heroes',
  'Hunters', 'Knights', 'Legends', 'Masters', 'Phantoms', 'Pirates',
  'Rangers', 'Rebels', 'Rockets', 'Shadows', 'Spartans', 'Spirits',
  'Stars', 'Strikers', 'Titans', 'Thunders', 'Vikings', 'Warriors',
  'Wizards', 'Wolves', 'Wonders', 'Zones', 'Blazers', 'Chargers',
  'Defenders', 'Gladiators', 'Scorpions', 'Vipers', 'Cyclones', 'Meteors'
];

const TOURNAMENT_ADJECTIVES = [
  'Spring', 'Summer', 'Autumn', 'Winter', 'Annual', 'Monthly', 'Weekly',
  'Regional', 'National', 'International', 'Open', 'Championship', 'Classic',
  'Premier', 'Grand', 'Elite', 'Professional', 'Amateur', 'Youth', 'Senior',
  'Masters', 'Invitational', 'Memorial', 'Charity', 'Corporate', 'University'
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'Boston',
  'Nashville', 'Portland', 'Las Vegas', 'Detroit', 'Memphis', 'Louisville',
  'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
  'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh',
  'Miami', 'Cleveland', 'Tulsa', 'Oakland', 'Minneapolis', 'Wichita'
];

class DataGenerator {
  constructor() {
    this.players = [];
    this.teams = [];
    this.tournaments = [];
    this.matches = [];
    this.registrations = [];
  }

  /**
   * Generate all test data
   */
  generateAll() {
    console.log('🎯 Generating test data for load testing...');

    this.generatePlayers();
    this.generateTeams();
    this.generateTournaments();
    this.generateMatches();
    this.generateRegistrations();
    this.generateConflictScenarios();

    this.saveAllData();
    this.generateSummaryReport();

    console.log('✅ Test data generation completed!');
  }

  /**
   * Generate realistic players
   */
  generatePlayers() {
    console.log('👥 Generating players...');

    for (let i = 0; i < CONFIG.players.count; i++) {
      const player = {
        id: `player_${i + 1}`,
        firstName: this.randomChoice(FIRST_NAMES),
        lastName: this.randomChoice(LAST_NAMES),
        email: this.generateEmail(),
        skillLevel: this.randomChoice(CONFIG.players.skillLevels),
        rating: this.generateRating(),
        registrationDate: this.randomPastDate(365),
        preferences: this.generatePlayerPreferences(),
        stats: this.generatePlayerStats(),
        contactInfo: this.generateContactInfo(),
        emergencyContact: this.generateEmergencyContact(),
      };

      this.players.push(player);
    }

    console.log(`   Generated ${this.players.length} players`);
  }

  /**
   * Generate realistic teams
   */
  generateTeams() {
    console.log('👥 Generating teams...');

    for (let i = 0; i < CONFIG.teams.count; i++) {
      const teamSize = this.randomInt(
        CONFIG.teams.playersPerTeam.min,
        CONFIG.teams.playersPerTeam.max
      );

      const team = {
        id: `team_${i + 1}`,
        name: this.generateTeamName(),
        sport: this.randomChoice(CONFIG.tournaments.sports),
        players: this.selectRandomPlayers(teamSize),
        captain: null, // Will be set to first player
        skillLevel: null, // Will be calculated from players
        registrationDate: this.randomPastDate(180),
        preferences: this.generateTeamPreferences(),
        stats: this.generateTeamStats(),
        achievements: this.generateAchievements(),
      };

      // Set captain and calculate skill level
      if (team.players.length > 0) {
        team.captain = team.players[0].id;
        team.skillLevel = this.calculateTeamSkillLevel(team.players);
      }

      this.teams.push(team);
    }

    console.log(`   Generated ${this.teams.length} teams`);
  }

  /**
   * Generate realistic tournaments
   */
  generateTournaments() {
    console.log('🏆 Generating tournaments...');

    for (let i = 0; i < CONFIG.tournaments.count; i++) {
      const sport = this.randomChoice(CONFIG.tournaments.sports);
      const format = this.randomChoice(CONFIG.tournaments.formats);
      const maxTeams = this.randomChoice(CONFIG.tournaments.sizes);

      const tournament = {
        id: `tournament_${i + 1}`,
        name: this.generateTournamentName(sport),
        sport,
        format,
        maxTeams,
        status: this.randomChoice(['upcoming', 'registration_open', 'in_progress', 'completed']),
        startDate: this.randomFutureDate(90),
        endDate: null, // Will be calculated
        registrationDeadline: null, // Will be calculated
        location: this.generateLocation(),
        organizer: this.generateOrganizer(),
        description: this.generateTournamentDescription(sport, format),
        rules: this.generateTournamentRules(sport),
        prizes: this.generatePrizes(),
        categories: this.generateCategories(sport),
        schedule: this.generateSchedule(),
        settings: this.generateTournamentSettings(format),
        fees: this.generateFees(),
        requirements: this.generateRequirements(),
      };

      // Calculate derived dates
      tournament.endDate = this.addDays(tournament.startDate, this.getTournamentDuration(maxTeams, format));
      tournament.registrationDeadline = this.addDays(tournament.startDate, -7);

      this.tournaments.push(tournament);
    }

    console.log(`   Generated ${this.tournaments.length} tournaments`);
  }

  /**
   * Generate realistic matches
   */
  generateMatches() {
    console.log('🏓 Generating matches...');

    let matchCount = 0;

    // Generate matches for each tournament
    for (const tournament of this.tournaments) {
      if (tournament.status === 'completed' || tournament.status === 'in_progress') {
        const matches = this.generateTournamentMatches(tournament);
        this.matches.push(...matches);
        matchCount += matches.length;
      }
    }

    // Generate additional standalone matches for variety
    for (let i = matchCount; i < CONFIG.matches.count; i++) {
      const match = this.generateStandaloneMatch(i + 1);
      this.matches.push(match);
    }

    console.log(`   Generated ${this.matches.length} matches`);
  }

  /**
   * Generate team registrations
   */
  generateRegistrations() {
    console.log('📝 Generating registrations...');

    for (const tournament of this.tournaments) {
      if (tournament.status !== 'upcoming') {
        const registrationCount = this.randomInt(
          Math.floor(tournament.maxTeams * 0.5),
          tournament.maxTeams
        );

        for (let i = 0; i < registrationCount; i++) {
          const team = this.randomChoice(this.teams.filter(t => t.sport === tournament.sport));

          const registration = {
            id: `reg_${tournament.id}_${team.id}`,
            tournamentId: tournament.id,
            teamId: team.id,
            registrationDate: this.randomDateBetween(
              this.addDays(tournament.startDate, -30),
              tournament.registrationDeadline
            ),
            status: this.randomChoice(['pending', 'confirmed', 'waitlist', 'cancelled']),
            paymentStatus: this.randomChoice(['pending', 'paid', 'refunded']),
            category: this.randomChoice(tournament.categories).name,
            notes: this.generateRegistrationNotes(),
            waiver: {
              signed: this.randomBoolean(0.9),
              signedDate: this.randomPastDate(30),
              signedBy: team.captain,
            },
          };

          this.registrations.push(registration);
        }
      }
    }

    console.log(`   Generated ${this.registrations.length} registrations`);
  }

  /**
   * Generate conflict scenarios for testing
   */
  generateConflictScenarios() {
    console.log('⚡ Generating conflict scenarios...');

    // Create some overlapping registrations
    for (let i = 0; i < 20; i++) {
      const tournament = this.randomChoice(this.tournaments);
      const team = this.randomChoice(this.teams);

      const conflictRegistration = {
        id: `conflict_reg_${i + 1}`,
        tournamentId: tournament.id,
        teamId: team.id,
        registrationDate: new Date().toISOString(),
        status: 'pending',
        paymentStatus: 'pending',
        category: this.randomChoice(tournament.categories).name,
        notes: 'Potential conflict scenario for testing',
        waiver: { signed: false },
      };

      this.registrations.push(conflictRegistration);
    }

    // Create some matches with scoring conflicts
    for (let i = 0; i < 10; i++) {
      const match = this.randomChoice(this.matches.filter(m => m.status === 'completed'));
      if (match) {
        // Create a conflicting score update
        const conflictMatch = {
          ...match,
          id: `conflict_match_${i + 1}`,
          scores: this.generateConflictingScore(match.scores),
          updatedAt: new Date().toISOString(),
          updatedBy: 'conflict_generator',
        };

        this.matches.push(conflictMatch);
      }
    }

    console.log('   Generated conflict scenarios');
  }

  /**
   * Save all generated data to files
   */
  saveAllData() {
    console.log('💾 Saving data files...');

    const outputDir = join(__dirname, 'test-data');
    mkdirSync(outputDir, { recursive: true });

    // Save individual data files
    this.saveDataFile(outputDir, 'players.json', this.players);
    this.saveDataFile(outputDir, 'teams.json', this.teams);
    this.saveDataFile(outputDir, 'tournaments.json', this.tournaments);
    this.saveDataFile(outputDir, 'matches.json', this.matches);
    this.saveDataFile(outputDir, 'registrations.json', this.registrations);

    // Save combined data for easy import
    this.saveDataFile(outputDir, 'all-data.json', {
      players: this.players,
      teams: this.teams,
      tournaments: this.tournaments,
      matches: this.matches,
      registrations: this.registrations,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        totalRecords: this.players.length + this.teams.length + this.tournaments.length + this.matches.length + this.registrations.length,
      },
    });

    // Generate data for different load test scenarios
    this.generateScenarioData(outputDir);

    console.log(`   Saved data to ${outputDir}`);
  }

  /**
   * Generate scenario-specific data
   */
  generateScenarioData(outputDir) {
    // Small tournament scenario (8-16 teams)
    const smallTournaments = this.tournaments.filter(t => t.maxTeams <= 16);
    this.saveDataFile(outputDir, 'small-tournaments.json', smallTournaments);

    // Large tournament scenario (64+ teams)
    const largeTournaments = this.tournaments.filter(t => t.maxTeams >= 64);
    this.saveDataFile(outputDir, 'large-tournaments.json', largeTournaments);

    // Active matches for scoring scenarios
    const activeMatches = this.matches.filter(m => m.status === 'in_progress');
    this.saveDataFile(outputDir, 'active-matches.json', activeMatches);

    // High-skill teams for competitive scenarios
    const skillfulTeams = this.teams.filter(t => t.skillLevel === 'expert' || t.skillLevel === 'professional');
    this.saveDataFile(outputDir, 'skilled-teams.json', skillfulTeams);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    console.log('📊 Generating summary report...');

    const report = {
      summary: {
        totalPlayers: this.players.length,
        totalTeams: this.teams.length,
        totalTournaments: this.tournaments.length,
        totalMatches: this.matches.length,
        totalRegistrations: this.registrations.length,
      },
      distribution: {
        sports: this.getDistribution(this.tournaments, 'sport'),
        tournamentFormats: this.getDistribution(this.tournaments, 'format'),
        tournamentSizes: this.getDistribution(this.tournaments, 'maxTeams'),
        playerSkillLevels: this.getDistribution(this.players, 'skillLevel'),
        teamSkillLevels: this.getDistribution(this.teams, 'skillLevel'),
        matchStatuses: this.getDistribution(this.matches, 'status'),
        tournamentStatuses: this.getDistribution(this.tournaments, 'status'),
      },
      scenarios: {
        smallTournaments: this.tournaments.filter(t => t.maxTeams <= 16).length,
        largeTournaments: this.tournaments.filter(t => t.maxTeams >= 64).length,
        activeMatches: this.matches.filter(m => m.status === 'in_progress').length,
        completedMatches: this.matches.filter(m => m.status === 'completed').length,
        openRegistrations: this.tournaments.filter(t => t.status === 'registration_open').length,
      },
      loadTestData: {
        organizers: 5, // 10% of 50 tournaments
        players: Math.floor(this.players.length * 0.53), // 53% players
        scorers: Math.floor(this.players.length * 0.1), // 10% scorers
        spectators: Math.floor(this.players.length * 0.27), // 27% spectators
      },
    };

    const outputDir = join(__dirname, 'test-data');
    this.saveDataFile(outputDir, 'summary-report.json', report);

    // Generate human-readable report
    const readableReport = this.generateReadableReport(report);
    writeFileSync(join(outputDir, 'summary-report.md'), readableReport);

    console.log('   Generated summary report');
  }

  // Helper methods for data generation

  generateEmail() {
    const firstName = this.randomChoice(FIRST_NAMES).toLowerCase();
    const lastName = this.randomChoice(LAST_NAMES).toLowerCase();
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'email.com'];
    return `${firstName}.${lastName}@${this.randomChoice(domains)}`;
  }

  generateRating() {
    return Math.floor(Math.random() * 2000) + 500; // Rating between 500-2500
  }

  generatePlayerPreferences() {
    return {
      preferredTimes: this.randomChoice(['morning', 'afternoon', 'evening', 'any']),
      maxTravelDistance: this.randomInt(5, 100),
      skillLevelPreference: this.randomChoice(['similar', 'higher', 'any']),
      notifications: {
        email: this.randomBoolean(0.8),
        sms: this.randomBoolean(0.6),
        push: this.randomBoolean(0.9),
      },
    };
  }

  generatePlayerStats() {
    return {
      tournamentsPlayed: this.randomInt(0, 50),
      tournamentsWon: this.randomInt(0, 15),
      matchesPlayed: this.randomInt(0, 200),
      matchesWon: this.randomInt(0, 150),
      winRate: Math.random(),
      currentStreak: this.randomInt(-5, 10),
    };
  }

  generateContactInfo() {
    return {
      phone: this.generatePhoneNumber(),
      address: {
        street: `${this.randomInt(100, 9999)} ${this.randomChoice(['Main', 'Oak', 'Pine', 'Elm', 'Maple'])} St`,
        city: this.randomChoice(CITIES),
        state: this.randomChoice(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']),
        zipCode: this.randomInt(10000, 99999).toString(),
      },
    };
  }

  generateEmergencyContact() {
    return {
      name: `${this.randomChoice(FIRST_NAMES)} ${this.randomChoice(LAST_NAMES)}`,
      phone: this.generatePhoneNumber(),
      relationship: this.randomChoice(['spouse', 'parent', 'sibling', 'friend', 'other']),
    };
  }

  generateTeamName() {
    return `${this.randomChoice(TEAM_ADJECTIVES)} ${this.randomChoice(TEAM_NOUNS)}`;
  }

  generateTeamPreferences() {
    return {
      preferredTournamentTypes: this.randomSubset(CONFIG.tournaments.formats, 1, 3),
      maxTravelDistance: this.randomInt(10, 200),
      budgetRange: {
        min: this.randomInt(50, 200),
        max: this.randomInt(300, 1000),
      },
    };
  }

  generateTeamStats() {
    return {
      tournamentsEntered: this.randomInt(0, 30),
      tournamentsWon: this.randomInt(0, 10),
      finalReached: this.randomInt(0, 15),
      overallWinRate: Math.random(),
      bestRanking: this.randomInt(1, 100),
    };
  }

  generateAchievements() {
    const achievements = [];
    const possibleAchievements = [
      'Tournament Champion',
      'Runner-up',
      'Best New Team',
      'Most Improved',
      'Sportsmanship Award',
      'Consistent Performer',
      'Giant Killer',
    ];

    const count = this.randomInt(0, 3);
    for (let i = 0; i < count; i++) {
      achievements.push({
        title: this.randomChoice(possibleAchievements),
        year: new Date().getFullYear() - this.randomInt(0, 5),
        tournament: this.generateTournamentName('badminton'),
      });
    }

    return achievements;
  }

  generateTournamentName(sport) {
    const adjective = this.randomChoice(TOURNAMENT_ADJECTIVES);
    const city = this.randomChoice(CITIES);
    const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);
    return `${adjective} ${city} ${sportName} Tournament`;
  }

  generateLocation() {
    return {
      name: `${this.randomChoice(CITIES)} Sports Center`,
      address: {
        street: `${this.randomInt(100, 9999)} ${this.randomChoice(['Sports', 'Athletic', 'Recreation', 'Fitness'])} Blvd`,
        city: this.randomChoice(CITIES),
        state: this.randomChoice(['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']),
        zipCode: this.randomInt(10000, 99999).toString(),
      },
      courts: this.randomInt(4, 16),
      parking: this.randomBoolean(0.9),
      accessibility: this.randomBoolean(0.8),
      amenities: this.randomSubset(['food', 'drinks', 'pro_shop', 'locker_rooms', 'wifi'], 2, 5),
    };
  }

  generateOrganizer() {
    return {
      name: `${this.randomChoice(FIRST_NAMES)} ${this.randomChoice(LAST_NAMES)}`,
      email: this.generateEmail(),
      phone: this.generatePhoneNumber(),
      organization: this.randomChoice([
        'City Recreation Department',
        'Sports Club',
        'Community Center',
        'Athletic Association',
        'Private Organizer',
      ]),
      experience: this.randomInt(1, 15),
    };
  }

  generateTournamentDescription(sport, format) {
    const descriptions = {
      single_elimination: 'Fast-paced tournament with single elimination format. One loss and you\'re out!',
      double_elimination: 'Competitive format giving teams a second chance through the losers bracket.',
      round_robin: 'Everyone plays everyone in a comprehensive round-robin format.',
      swiss: 'Swiss system pairing ensuring players face opponents of similar skill levels.',
    };

    return `Join us for an exciting ${sport} tournament featuring ${descriptions[format]} Perfect for players of all skill levels looking for competitive play and great sportsmanship.`;
  }

  generateTournamentRules(sport) {
    const commonRules = [
      'All participants must sign a waiver before competing',
      'Matches must start within 10 minutes of scheduled time',
      'Players are responsible for providing their own equipment',
      'Unsportsmanlike conduct will result in disqualification',
      'Tournament director decisions are final',
    ];

    const sportRules = {
      badminton: [
        'Matches are best of 3 games to 21 points',
        'Rally point scoring system',
        'Service must be underhand and below waist level',
      ],
      tennis: [
        'Matches are best of 3 sets',
        'Standard ATP/WTA rules apply',
        'Tiebreak at 6-6 in each set',
      ],
      squash: [
        'Matches are best of 5 games to 11 points',
        'Must win by 2 points',
        'Let calls will be reviewed by referee',
      ],
    };

    return [...commonRules, ...(sportRules[sport] || [])];
  }

  generatePrizes() {
    return {
      first: { cash: this.randomInt(500, 2000), trophy: true, title: 'Champion' },
      second: { cash: this.randomInt(250, 1000), trophy: true, title: 'Runner-up' },
      third: { cash: this.randomInt(100, 500), trophy: false, title: 'Third Place' },
      participation: { item: 'Tournament T-shirt', allParticipants: true },
    };
  }

  generateCategories(sport) {
    const baseCategories = [
      { name: 'Open', description: 'All skill levels welcome', maxTeams: 32 },
      { name: 'Intermediate', description: 'For intermediate players', maxTeams: 24 },
      { name: 'Advanced', description: 'For advanced players only', maxTeams: 16 },
    ];

    if (sport === 'badminton' || sport === 'tennis') {
      return [
        ...baseCategories,
        { name: 'Mixed Doubles', description: 'Mixed gender doubles', maxTeams: 16 },
        { name: 'Men\'s Singles', description: 'Male singles only', maxTeams: 32 },
        { name: 'Women\'s Singles', description: 'Female singles only', maxTeams: 32 },
      ];
    }

    return baseCategories;
  }

  generateSchedule() {
    return {
      checkInTime: '08:00',
      firstMatchTime: '09:00',
      lunchBreak: { start: '12:00', end: '13:00' },
      expectedFinishTime: '18:00',
      awards: '18:30',
    };
  }

  generateTournamentSettings(format) {
    return {
      format,
      seeding: this.randomChoice(['random', 'skill_based', 'registration_order']),
      tiebreaker: this.randomChoice(['head_to_head', 'point_differential', 'points_scored']),
      overtime: this.randomBoolean(0.7),
      courtRotation: this.randomBoolean(0.8),
      warmupTime: this.randomInt(5, 15),
    };
  }

  generateFees() {
    return {
      registration: this.randomInt(25, 100),
      late: this.randomInt(10, 25),
      refundPolicy: this.randomChoice(['full_7_days', 'partial_3_days', 'no_refund']),
      acceptedPayments: ['cash', 'card', 'venmo', 'paypal'],
    };
  }

  generateRequirements() {
    return {
      minimumAge: this.randomInt(16, 21),
      skillLevel: this.randomChoice(['any', 'intermediate', 'advanced']),
      equipment: this.randomChoice(['provided', 'own_required', 'rental_available']),
      insurance: this.randomBoolean(0.3),
      membership: this.randomBoolean(0.2),
    };
  }

  selectRandomPlayers(count) {
    const shuffled = [...this.players].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  calculateTeamSkillLevel(players) {
    const skillMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, professional: 5 };
    const reverseSkillMap = { 1: 'beginner', 2: 'intermediate', 3: 'advanced', 4: 'expert', 5: 'professional' };

    const avgSkill = players.reduce((sum, player) => sum + skillMap[player.skillLevel], 0) / players.length;
    return reverseSkillMap[Math.round(avgSkill)];
  }

  generateTournamentMatches(tournament) {
    const matches = [];
    const registeredTeams = this.registrations
      .filter(reg => reg.tournamentId === tournament.id && reg.status === 'confirmed')
      .map(reg => this.teams.find(team => team.id === reg.teamId))
      .filter(Boolean);

    if (registeredTeams.length < 2) return matches;

    const matchCount = this.calculateMatchCount(registeredTeams.length, tournament.format);

    for (let i = 0; i < matchCount; i++) {
      const [team1, team2] = this.selectMatchTeams(registeredTeams);
      const match = {
        id: `${tournament.id}_match_${i + 1}`,
        tournamentId: tournament.id,
        round: this.calculateRound(i, tournament.format),
        team1: team1.id,
        team2: team2.id,
        scheduledTime: this.generateMatchTime(tournament.startDate, i),
        court: this.randomInt(1, tournament.location.courts),
        status: this.generateMatchStatus(),
        scores: null,
        winner: null,
        referee: this.generateReferee(),
        duration: null,
        notes: '',
      };

      if (match.status === 'completed') {
        match.scores = this.generateMatchScores(tournament.sport);
        match.winner = this.determineWinner(match.scores);
        match.duration = this.randomInt(30, 120); // minutes
      }

      matches.push(match);
    }

    return matches;
  }

  generateStandaloneMatch(index) {
    const sport = this.randomChoice(CONFIG.tournaments.sports);
    const teams = this.teams.filter(team => team.sport === sport);

    if (teams.length < 2) {
      // Create basic match if no teams available
      return {
        id: `standalone_match_${index}`,
        tournamentId: null,
        round: 1,
        team1: 'team_1',
        team2: 'team_2',
        scheduledTime: this.randomPastDate(30),
        court: 1,
        status: 'completed',
        scores: this.generateMatchScores(sport),
        winner: Math.random() > 0.5 ? 'team_1' : 'team_2',
        referee: this.generateReferee(),
        duration: this.randomInt(30, 120),
        notes: 'Standalone practice match',
      };
    }

    const [team1, team2] = this.selectMatchTeams(teams);

    return {
      id: `standalone_match_${index}`,
      tournamentId: null,
      round: 1,
      team1: team1.id,
      team2: team2.id,
      scheduledTime: this.randomPastDate(30),
      court: this.randomInt(1, 8),
      status: this.generateMatchStatus(),
      scores: this.generateMatchScores(sport),
      winner: this.determineWinner(this.generateMatchScores(sport)),
      referee: this.generateReferee(),
      duration: this.randomInt(30, 120),
      notes: 'Standalone practice match',
    };
  }

  generateMatchScores(sport) {
    const patterns = CONFIG.matches.scoringPatterns[sport] || CONFIG.matches.scoringPatterns.badminton;
    const scores = [];

    for (let set = 0; set < patterns.sets && scores.length < 3; set++) {
      const team1Score = this.randomInt(0, patterns.maxPoints + 5);
      const team2Score = this.randomInt(0, patterns.maxPoints + 5);

      scores.push({ team1: team1Score, team2: team2Score });

      // Stop if one team has won majority of sets
      const team1Wins = scores.filter(s => s.team1 > s.team2).length;
      const team2Wins = scores.filter(s => s.team2 > s.team1).length;

      if (team1Wins > patterns.sets / 2 || team2Wins > patterns.sets / 2) {
        break;
      }
    }

    return scores;
  }

  generateConflictingScore(originalScores) {
    // Create a slight variation of the original score for conflict testing
    return originalScores.map(score => ({
      team1: score.team1 + this.randomInt(-2, 2),
      team2: score.team2 + this.randomInt(-2, 2),
    }));
  }

  generateRegistrationNotes() {
    const notes = [
      'First time playing in tournament',
      'Returning player from last year',
      'Part of local club team',
      'Individual registration',
      'Special dietary requirements',
      'Needs equipment rental',
      'Carpooling available',
      'Local player',
    ];

    return this.randomBoolean(0.3) ? this.randomChoice(notes) : '';
  }

  generateReferee() {
    return {
      id: `ref_${this.randomInt(1, 20)}`,
      name: `${this.randomChoice(FIRST_NAMES)} ${this.randomChoice(LAST_NAMES)}`,
      certification: this.randomChoice(['level_1', 'level_2', 'level_3', 'international']),
      experience: this.randomInt(1, 20),
    };
  }

  // Utility methods

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomSubset(array, min, max) {
    const count = this.randomInt(min, max);
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomBoolean(probability = 0.5) {
    return Math.random() < probability;
  }

  randomPastDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - this.randomInt(0, daysAgo));
    return date.toISOString();
  }

  randomFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + this.randomInt(1, daysFromNow));
    return date.toISOString();
  }

  randomDateBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString();
  }

  addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  generatePhoneNumber() {
    return `${this.randomInt(200, 999)}-${this.randomInt(100, 999)}-${this.randomInt(1000, 9999)}`;
  }

  getTournamentDuration(teams, format) {
    if (format === 'round_robin') return Math.ceil(teams * 0.3);
    if (format === 'swiss') return Math.ceil(Math.log2(teams));
    return Math.ceil(Math.log2(teams)) + 1; // Elimination formats
  }

  calculateMatchCount(teams, format) {
    if (format === 'single_elimination') return teams - 1;
    if (format === 'double_elimination') return (teams - 1) * 2;
    if (format === 'round_robin') return (teams * (teams - 1)) / 2;
    return teams * Math.ceil(Math.log2(teams)); // Swiss
  }

  selectMatchTeams(teams) {
    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1]];
  }

  calculateRound(matchIndex, format) {
    // Simplified round calculation
    return Math.ceil((matchIndex + 1) / 4);
  }

  generateMatchTime(tournamentStart, matchIndex) {
    const startDate = new Date(tournamentStart);
    const dayOffset = Math.floor(matchIndex / 20); // ~20 matches per day
    const hourOffset = (matchIndex % 20) * 0.75; // 45 minutes per match

    startDate.setDate(startDate.getDate() + dayOffset);
    startDate.setHours(9 + hourOffset);

    return startDate.toISOString();
  }

  generateMatchStatus() {
    return this.randomChoice(['scheduled', 'in_progress', 'completed', 'cancelled']);
  }

  determineWinner(scores) {
    let team1Wins = 0;
    let team2Wins = 0;

    scores.forEach(score => {
      if (score.team1 > score.team2) team1Wins++;
      else if (score.team2 > score.team1) team2Wins++;
    });

    if (team1Wins > team2Wins) return 'team1';
    if (team2Wins > team1Wins) return 'team2';
    return null; // Tie
  }

  getDistribution(array, field) {
    const distribution = {};
    array.forEach(item => {
      const value = item[field];
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  saveDataFile(dir, filename, data) {
    const filepath = join(dir, filename);
    writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  generateReadableReport(report) {
    return `# Load Test Data Generation Report

Generated on: ${new Date().toISOString()}

## Summary
- **Total Players**: ${report.summary.totalPlayers}
- **Total Teams**: ${report.summary.totalTeams}
- **Total Tournaments**: ${report.summary.totalTournaments}
- **Total Matches**: ${report.summary.totalMatches}
- **Total Registrations**: ${report.summary.totalRegistrations}

## Load Test Scenarios
- **Small Tournaments** (8-16 teams): ${report.scenarios.smallTournaments}
- **Large Tournaments** (64+ teams): ${report.scenarios.largeTournaments}
- **Active Matches** (for scoring tests): ${report.scenarios.activeMatches}
- **Completed Matches** (for history tests): ${report.scenarios.completedMatches}
- **Open Registrations** (for registration tests): ${report.scenarios.openRegistrations}

## User Distribution for Load Testing
- **Organizers**: ${report.loadTestData.organizers} (10%)
- **Players**: ${report.loadTestData.players} (53%)
- **Scorers**: ${report.loadTestData.scorers} (10%)
- **Spectators**: ${report.loadTestData.spectators} (27%)

## Sport Distribution
${Object.entries(report.distribution.sports).map(([sport, count]) => `- **${sport}**: ${count}`).join('\n')}

## Tournament Formats
${Object.entries(report.distribution.tournamentFormats).map(([format, count]) => `- **${format}**: ${count}`).join('\n')}

## Data Files Generated
- \`players.json\` - Individual player profiles
- \`teams.json\` - Team rosters and information
- \`tournaments.json\` - Tournament configurations
- \`matches.json\` - Match data and scores
- \`registrations.json\` - Tournament registrations
- \`all-data.json\` - Combined dataset
- Scenario-specific files for targeted testing

This data is designed to simulate realistic tournament management scenarios with appropriate load patterns and edge cases for comprehensive testing.
`;
  }
}

// Generate data if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new DataGenerator();
  generator.generateAll();
}

export { DataGenerator };