
// Re-export all services
import { RegistrationService } from './registrationService';
import { ProfileService } from './profileService';
import { courtService } from './courtService';
import { matchService } from './matchService';
import { NotificationService } from './notificationService';
import { EmailService, emailService } from './emailService';
import { TournamentService } from './tournament/TournamentService';
import { APIService } from './APIService'; // Import the APIService

// Registration Service
export const registrationService = new RegistrationService();

// Profile Service
export const profileService = new ProfileService();

// Court Service
export { courtService };

// Match Service
export { matchService };

// Tournament Service
export const tournamentService = new TournamentService();

// Notification Service
export const notificationService = new NotificationService();

// Email Service
export { emailService, EmailService };

// API Service
export { APIService };

// For backward compatibility
export default {
  registrationService,
  profileService,
  courtService,
  matchService,
  tournamentService,
  notificationService,
  emailService,
  APIService // Add APIService to the default export
};
