
// Re-export the API services
import { courtService } from './courtService';
import { matchService } from './matchService';
import { notificationService } from './notificationService';
import { emailService } from './emailService';
import { profileService } from './profileService';
import { APIService } from './APIService';

// Export the individual services
export {
  courtService,
  matchService,
  notificationService,
  emailService,
  profileService
};

// Create a new instance of the API service
const apiService = new APIService();

// Export the API service
export default apiService;
