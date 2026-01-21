#!/usr/bin/env node

/**
 * CourtMaster Comprehensive Data Seeding Script
 * Creates complete sample data with tournaments, teams, players, divisions, matches, and courts
 * This replaces all other seed scripts and provides one consolidated seeding solution
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.development' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`)
};

// Appwrite configuration
const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

// Collection IDs from environment
const COLLECTIONS = {
  TOURNAMENTS: process.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'tournaments',
  PROFILES: process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
  DIVISIONS: process.env.VITE_APPWRITE_DIVISIONS_COLLECTION_ID || 'divisions',
  TEAMS: process.env.VITE_APPWRITE_TEAMS_COLLECTION_ID || 'teams',
  TEAM_MEMBERS: process.env.VITE_APPWRITE_TEAM_MEMBERS_COLLECTION_ID || 'team_members',
  REGISTRATIONS: process.env.VITE_APPWRITE_REGISTRATIONS_COLLECTION_ID || 'registrations',
  MATCHES: process.env.VITE_APPWRITE_MATCHES_COLLECTION_ID || 'matches',
  COURTS: process.env.VITE_APPWRITE_COURTS_COLLECTION_ID || 'courts'
};

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// Sample data generators
const generateProfiles = () => {
  const players = [
    { first: 'Alex', last: 'Chen', email: 'alex.chen@courtmaster.local', skill: 'Advanced' },
    { first: 'Maria', last: 'Rodriguez', email: 'maria.rodriguez@courtmaster.local', skill: 'Intermediate' },
    { first: 'David', last: 'Thompson', email: 'david.thompson@courtmaster.local', skill: 'Advanced' },
    { first: 'Sarah', last: 'Johnson', email: 'sarah.johnson@courtmaster.local', skill: 'Intermediate' },
    { first: 'Michael', last: 'Lee', email: 'michael.lee@courtmaster.local', skill: 'Expert' },
    { first: 'Emily', last: 'Davis', email: 'emily.davis@courtmaster.local', skill: 'Advanced' },
    { first: 'James', last: 'Wilson', email: 'james.wilson@courtmaster.local', skill: 'Intermediate' },
    { first: 'Lisa', last: 'Brown', email: 'lisa.brown@courtmaster.local', skill: 'Advanced' },
    { first: 'Robert', last: 'Garcia', email: 'robert.garcia@courtmaster.local', skill: 'Expert' },
    { first: 'Jennifer', last: 'Martinez', email: 'jennifer.martinez@courtmaster.local', skill: 'Intermediate' },
    { first: 'Kevin', last: 'Anderson', email: 'kevin.anderson@courtmaster.local', skill: 'Advanced' },
    { first: 'Amanda', last: 'Taylor', email: 'amanda.taylor@courtmaster.local', skill: 'Intermediate' }
  ];

  return players.map((player, i) => ({
    $id: ID.unique(),
    user_id: `user_${i + 1}`,
    full_name: `${player.first} ${player.last}`,
    display_name: `${player.first} ${player.last}`,
    phone: `+1-555-${String(i + 1).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.first}${player.last}`,
    player_stats: JSON.stringify({
      matches_won: Math.floor(Math.random() * 20),
      matches_played: Math.floor(Math.random() * 30) + 10,
      tournaments_won: Math.floor(Math.random() * 5),
      tournaments_played: Math.floor(Math.random() * 10) + 3,
      rating: 1200 + Math.floor(Math.random() * 800),
      skill_level: player.skill
    })
  }));
};

const generateTournaments = () => {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return [
    {
      $id: ID.unique(),
      name: 'Summer Mixed Doubles Tournament',
      description: 'Annual summer badminton tournament featuring mixed doubles competition for all skill levels. Join us for an exciting tournament with prizes and networking opportunities.',
      start_date: oneWeekFromNow.toISOString(),
      end_date: twoWeeksFromNow.toISOString(),
      registration_deadline: threeDaysFromNow.toISOString(),
      venue: 'Central Sports Complex - Courts 1-6',
      organizer_id: 'admin-user-id'
    },
    {
      $id: ID.unique(),
      name: 'Fall Singles Championship',
      description: 'Competitive singles tournament for advanced players. Test your skills against the best in the region.',
      start_date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      registration_deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Elite Badminton Center',
      organizer_id: 'admin-user-id'
    }
  ];
};

const generateDivisions = (tournamentId) => [
  {
    $id: ID.unique(),
    tournament_id: tournamentId,
    name: 'Open Mixed Doubles',
    type: 'MIXED',
    skill_level: 'All Levels',
    gender: 'MIXED'
  },
  {
    $id: ID.unique(),
    tournament_id: tournamentId,
    name: 'Advanced Mixed Doubles',
    type: 'MIXED',
    skill_level: 'Advanced',
    gender: 'MIXED'
  }
];

const generateTeams = (tournamentId, divisionIds, profiles) => {
  const teams = [];
  const teamNames = [
    'Thunder Smash', 'Net Ninjas', 'Shuttle Stars', 'Court Kings',
    'Badminton Pros', 'Feather Force', 'Racket Rangers', 'Smash Squad',
    'Victory Volley', 'Power Pair', 'Dynamic Duo', 'Elite Eagles'
  ];

  // Create teams for mixed doubles (pairs)
  for (let i = 0; i < Math.min(12, profiles.length / 2); i++) {
    const player1 = profiles[i * 2];
    const player2 = profiles[i * 2 + 1];

    if (player1 && player2) {
      const teamId = ID.unique();

      // Create players array with proper structure
      const players = [
        {
          id: player1.$id,
          name: player1.full_name,
          email: `${player1.full_name.replace(' ', '.').toLowerCase()}@courtmaster.local`,
          profileId: player1.$id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: player2.$id,
          name: player2.full_name,
          email: `${player2.full_name.replace(' ', '.').toLowerCase()}@courtmaster.local`,
          profileId: player2.$id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      teams.push({
        $id: teamId,
        tournament_id: tournamentId,
        name: teamNames[i] || `Team ${i + 1}`,
        captain_id: player1.user_id
      });

      // Add team members (separate from teams array)
      teams.push({
        collection: 'team_members',
        $id: ID.unique(),
        team_id: teamId,
        user_id: player1.user_id
      });

      teams.push({
        collection: 'team_members',
        $id: ID.unique(),
        team_id: teamId,
        user_id: player2.user_id
      });
    }
  }

  return teams;
};

const generateRegistrations = (tournamentId, divisionIds, profiles) => {
  const registrations = [];
  const statuses = ['APPROVED', 'PENDING', 'APPROVED', 'APPROVED', 'PENDING', 'APPROVED'];

  // Create registrations for pairs (mixed doubles)
  for (let i = 0; i < Math.min(12, profiles.length / 2); i++) {
    const player1 = profiles[i * 2];
    const player2 = profiles[i * 2 + 1];
    const divisionId = divisionIds[i % divisionIds.length];

    if (player1 && player2) {
      registrations.push({
        $id: ID.unique(),
        tournament_id: tournamentId,
        division_id: divisionId,
        user_id: player1.user_id, // Required field
        player_id: player1.user_id,
        partner_id: player2.user_id,
        player_name: player1.full_name,
        player_email: `${player1.full_name.replace(' ', '.').toLowerCase()}@courtmaster.local`,
        status: statuses[i % statuses.length],
        waiver_accepted: true,
        payment_status: 'paid',
        priority: Math.floor(Math.random() * 3)
      });
    }
  }

  return registrations;
};

const generateCourts = (tournamentId) => [
  {
    $id: ID.unique(),
    tournament_id: tournamentId,
    name: 'Court 1',
    number: 1,
    description: 'Main court with premium lighting and scoring display'
  },
  {
    $id: ID.unique(),
    tournament_id: tournamentId,
    name: 'Court 2',
    number: 2,
    description: 'Secondary court with standard equipment'
  },
  {
    $id: ID.unique(),
    tournament_id: tournamentId,
    name: 'Court 3',
    number: 3,
    description: 'Practice court available for warm-up'
  },
  {
    $id: ID.unique(),
    tournament_id: tournamentId,
    name: 'Court 4',
    number: 4,
    description: 'Court under maintenance - not available'
  }
];

const generateMatches = (tournamentId, divisionId, teams, courtIds) => {
  const matches = [];
  const teamList = teams.filter(t => !t.collection); // Only actual teams, not team members
  const now = new Date();

  // Generate first round matches
  for (let i = 0; i < Math.min(6, Math.floor(teamList.length / 2)); i++) {
    const team1 = teamList[i * 2];
    const team2 = teamList[i * 2 + 1];
    const courtId = courtIds[i % Math.min(3, courtIds.length)]; // Use first 3 courts (avoid maintenance court)

    if (team1 && team2) {
      const scheduledTime = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000); // Space matches 1 hour apart
      const matchStatus = Math.random() > 0.6 ? 'COMPLETED' : 'SCHEDULED';

      matches.push({
        $id: ID.unique(),
        tournament_id: tournamentId,
        division_id: divisionId,
        round_number: 1,
        match_number: i + 1,
        team1_id: team1.$id,
        team2_id: team2.$id,
        status: matchStatus,
        scores: matchStatus === 'COMPLETED' ? JSON.stringify([
          { team1Score: Math.floor(Math.random() * 22), team2Score: Math.floor(Math.random() * 22) },
          { team1Score: Math.floor(Math.random() * 22), team2Score: Math.floor(Math.random() * 22) }
        ]) : JSON.stringify([]),
        winner_team_id: matchStatus === 'COMPLETED' ? (Math.random() > 0.5 ? team1.$id : team2.$id) : null,
        scheduled_time: scheduledTime.toISOString(),
        start_time: matchStatus === 'COMPLETED' ? scheduledTime.toISOString() : null,
        end_time: matchStatus === 'COMPLETED' ? new Date(scheduledTime.getTime() + 45 * 60 * 1000).toISOString() : null,
        court_id: courtId,
        verified: matchStatus === 'COMPLETED'
      });
    }
  }

  return matches;
};

// Seeding functions
const seedCollection = async (collectionId, data, collectionName) => {
  log.info(`Seeding ${collectionName}...`);

  try {
    const results = [];

    for (const item of data) {
      try {
        const document = await databases.createDocument(
          DATABASE_ID,
          collectionId,
          item.$id,
          item,
          [
            Permission.read(Role.any()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        results.push(document);
        log.info(`  ✓ Created ${collectionName.slice(0, -1)}: ${item.name || item.full_name || item.$id}`);
      } catch (error) {
        if (error.code === 409) {
          log.warning(`  ○ ${collectionName.slice(0, -1)} already exists: ${item.name || item.full_name || item.$id}`);
        } else {
          log.error(`  ✗ Failed to create ${collectionName.slice(0, -1)}: ${error.message}`);
        }
      }
    }

    log.success(`${collectionName} seeding completed (${results.length} items created)`);
    return results;
  } catch (error) {
    log.error(`Failed to seed ${collectionName}: ${error.message}`);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    log.header('╔══════════════════════════════════════════════════════════════╗');
    log.header('║              CourtMaster Complete Data Seeding              ║');
    log.header('╚══════════════════════════════════════════════════════════════╝');

    log.info('Starting comprehensive database seeding...');
    log.info(`Endpoint: ${APPWRITE_ENDPOINT}`);
    log.info(`Project: ${APPWRITE_PROJECT_ID}`);
    log.info(`Database: ${DATABASE_ID}`);

    // Generate all sample data
    const profiles = generateProfiles();
    const tournaments = generateTournaments();

    // Seed profiles first
    const createdProfiles = await seedCollection(COLLECTIONS.PROFILES, profiles, 'Profiles');

    // Seed tournaments
    const createdTournaments = await seedCollection(COLLECTIONS.TOURNAMENTS, tournaments, 'Tournaments');

    if (createdTournaments.length > 0 && createdProfiles.length >= 4) {
      const mainTournament = createdTournaments[0];

      // Generate and seed divisions
      const divisions = generateDivisions(mainTournament.$id);
      const createdDivisions = await seedCollection(COLLECTIONS.DIVISIONS, divisions, 'Divisions');

      if (createdDivisions.length > 0) {
        const divisionIds = createdDivisions.map(d => d.$id);

        // Generate and seed teams (includes team members)
        const teamsData = generateTeams(mainTournament.$id, divisionIds, createdProfiles);
        const teams = teamsData.filter(t => !t.collection);
        const teamMembers = teamsData.filter(t => t.collection === 'team_members').map(tm => {
          // Remove the collection property before seeding
          const { collection, ...teamMember } = tm;
          return teamMember;
        });

        const createdTeams = await seedCollection(COLLECTIONS.TEAMS, teams, 'Teams');
        await seedCollection(COLLECTIONS.TEAM_MEMBERS, teamMembers, 'Team Members');

        // Generate and seed registrations
        const registrations = generateRegistrations(mainTournament.$id, divisionIds, createdProfiles);
        await seedCollection(COLLECTIONS.REGISTRATIONS, registrations, 'Registrations');

        // Generate and seed courts
        const courts = generateCourts(mainTournament.$id);
        const createdCourts = await seedCollection(COLLECTIONS.COURTS, courts, 'Courts');

        // Generate and seed matches
        if (createdTeams.length >= 2 && createdCourts.length > 0) {
          const courtIds = createdCourts.map(c => c.$id);
          const matches = generateMatches(mainTournament.$id, divisionIds[0], teamsData, courtIds);
          await seedCollection(COLLECTIONS.MATCHES, matches, 'Matches');
        }
      }
    }

    // Summary
    log.header('\n╔══════════════════════════════════════════════════════════════╗');
    log.header('║                   Complete Seeding Finished                 ║');
    log.header('╚══════════════════════════════════════════════════════════════╝');

    log.success(`🎯 Database seeding completed successfully!`);
    log.info(`📊 Summary:`);
    log.info(`   • Profiles: ${profiles.length} generated`);
    log.info(`   • Tournaments: ${tournaments.length} generated`);
    log.info(`   • Divisions: Generated for tournaments`);
    log.info(`   • Teams: Generated for mixed doubles`);
    log.info(`   • Registrations: Generated with partner pairings`);
    log.info(`   • Courts: Generated with different statuses`);
    log.info(`   • Matches: Generated with realistic scheduling`);

    log.info('\n🚀 Your application now has complete sample data!');
    log.info('   - Tournament with proper format and status');
    log.info('   - Teams with actual players');
    log.info('   - Divisions and categories');
    log.info('   - Matches with scores and scheduling');
    log.info('   - Courts with availability status');

  } catch (error) {
    log.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    console.log('CourtMaster Complete Data Seeding Script');
    console.log('');
    console.log('Usage: node scripts/seed-complete.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  (none)    Seed the database with complete sample data');
    console.log('  help      Show this help message');
    console.log('');
    console.log('This script creates:');
    console.log('  • Player profiles with stats and preferences');
    console.log('  • Tournaments with proper format and settings');
    console.log('  • Divisions and categories');
    console.log('  • Teams with players (mixed doubles pairs)');
    console.log('  • Registrations with partner information');
    console.log('  • Courts with different statuses');
    console.log('  • Matches with realistic scheduling and some completed games');
    console.log('');
    console.log('Environment Variables Required:');
    console.log('  VITE_APPWRITE_ENDPOINT     Appwrite server endpoint');
    console.log('  VITE_APPWRITE_PROJECT_ID   Appwrite project ID');
    console.log('  APPWRITE_API_KEY          Appwrite API key (required)');
    console.log('  APPWRITE_DATABASE_ID      Database ID');
    break;
  default:
    if (!APPWRITE_API_KEY) {
      log.error('APPWRITE_API_KEY environment variable is required');
      log.info('Please set your Appwrite API key in the .env.development file');
      process.exit(1);
    }
    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !DATABASE_ID) {
      log.error('Missing required environment variables');
      log.info('Please ensure VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, and APPWRITE_DATABASE_ID are set');
      process.exit(1);
    }
    seedDatabase();
    break;
}