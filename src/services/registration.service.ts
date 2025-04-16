import { Registration, RegistrationMetadata } from '@/types/models';
import { RegistrationRepository } from '@/repositories/registration.repository';
import { NotificationService } from './notification.service';
import { ProfileService } from './profile.service';
import { EmailService } from './email.service';
import { RegistrationStatus } from '@/types/registration';

export class RegistrationService {
  constructor(
    private readonly repository: RegistrationRepository = new RegistrationRepository(),
    private readonly notificationService = new NotificationService(),
    private readonly profileService = new ProfileService(),
    private readonly emailService = new EmailService()
  ) {}

  async register(data: {
    tournament_id: string;
    player_id: string;
    division_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    team_name?: string;
    team_members?: Array<{
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      is_team_captain?: boolean;
    }>;
  }): Promise<Registration> {
    const metadata: RegistrationMetadata = {
      playerName: `${data.first_name} ${data.last_name}`,
      contactEmail: data.email,
      contactPhone: data.phone || '',
      teamSize: data.team_members ? data.team_members.length : 1,
      waiverSigned: false,
      paymentStatus: 'PENDING'
    };

    if (data.team_name) {
      metadata.teamName = data.team_name;
      metadata.captainName = `${data.first_name} ${data.last_name}`;
      metadata.captainEmail = data.email;
      metadata.captainPhone = data.phone;
    }

    const registration = await this.repository.create({
      tournament_id: data.tournament_id,
      player_id: data.player_id,
      division_id: data.division_id,
      partner_id: null,
      status: RegistrationStatus.PENDING,
      metadata,
      notes: null,
      priority: 0
    });

    // Send notifications
    await this.notificationService.create({
      user_id: data.player_id,
      title: 'Registration Successful',
      message: data.team_name 
        ? `Your team "${data.team_name}" has been registered for the tournament.`
        : `You have been registered for the tournament.`,
      type: 'registration_confirmation',
      read: false
    });

    // Send email if enabled
    try {
      const profile = await this.profileService.findById(data.player_id);
      if (profile?.preferences?.notifications?.email) {
        const emailHtml = this.generateConfirmationEmail(registration);
        await this.emailService.send({
          to: data.email,
          subject: 'Tournament Registration Confirmation',
          html: emailHtml
        });
      }
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return registration;
  }

  async updateStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    return this.repository.updateStatus(id, status);
  }

  async updateWaitlistPosition(id: string, newPosition: number): Promise<Registration> {
    const registration = await this.repository.findById(id);
    const metadata = {
      ...registration.metadata,
      waitlistPosition: newPosition,
      waitlistHistory: [
        ...(registration.metadata.waitlistHistory || []),
        {
          timestamp: new Date().toISOString(),
          reason: 'Position updated',
          fromPosition: registration.metadata.waitlistPosition || 0,
          toPosition: newPosition
        }
      ]
    };

    return this.repository.updateMetadata(id, metadata);
  }

  async findByTournament(tournament_id: string): Promise<Registration[]> {
    return this.repository.findByTournament(tournament_id);
  }

  private generateConfirmationEmail(registration: Registration): string {
    const isTeam = !!registration.metadata.teamName;
    
    return `
      <h1>${isTeam ? 'Team Registration Confirmed!' : 'Registration Confirmed!'}</h1>
      <p>Hi ${registration.metadata.playerName},</p>
      ${isTeam 
        ? `<p>Your team "${registration.metadata.teamName}" has been successfully registered for the tournament.</p>`
        : '<p>You have been successfully registered for the tournament.</p>'
      }
      <p>Tournament ID: ${registration.tournament_id}</p>
      <p>We look forward to seeing you there!</p>
    `;
  }
} 