import { RegistrationStatus } from '../models/registration';

interface BaseNotificationData {
  userId: string;
  tournamentId: string;
  registrationId: string;
  playerName: string;
  email: string;
}

interface TeamRegistrationData extends BaseNotificationData {
  teamName: string;
  captainName: string;
  teamMembers: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }>;
}

interface StatusUpdateData {
  userId: string;
  tournamentId: string;
  registrationId: string;
  status: RegistrationStatus;
  playerName: string;
}

export class NotificationService {
  async sendRegistrationConfirmation(data: BaseNotificationData): Promise<void> {
    // TODO: Implement actual notification sending
    console.log('Sending registration confirmation:', data);
  }

  async sendTeamRegistrationConfirmation(data: TeamRegistrationData): Promise<void> {
    // TODO: Implement actual notification sending
    console.log('Sending team registration confirmation:', data);
  }

  async sendStatusUpdate(data: StatusUpdateData): Promise<void> {
    // TODO: Implement actual notification sending
    console.log('Sending status update notification:', data);
  }
} 