
// Re-export all services
import { APIService } from './apiService';
import { RegistrationService } from './registrationService';
import { ProfileService } from './profileService';
import { courtService } from './courtService';
import { matchService } from './matchService';
import { NotificationService } from './notificationService';
import { EmailService } from './emailService';

// API Service (base)
export const apiService = new APIService();

// Registration Service
export const registrationService = new RegistrationService();

// Profile Service
export const profileService = new ProfileService();

// Court Service
export { courtService };

// Match Service
export { matchService };

// Notification Service
export const notificationService = new NotificationService();

// Email Service
export const emailService = new EmailService();

// For backward compatibility
export default {
  apiService,
  registrationService,
  profileService,
  courtService,
  matchService,
  notificationService,
  emailService
};
