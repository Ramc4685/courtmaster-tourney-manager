import { Registration, RegistrationStatus } from '../models/registration';
import { RegistrationRepository } from '@/infrastructure/repositories/registration.repository';
import { NotificationService } from './notification.service';
import { ValidationError } from './errors';

export interface RegisterPlayerDTO {
  tournamentId: string;
  playerId: string;
  divisionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface RegisterTeamDTO extends RegisterPlayerDTO {
  teamName: string;
  teamMembers: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isTeamCaptain?: boolean;
  }>;
}

export class RegistrationService {
  constructor(
    private readonly repository: RegistrationRepository,
    private readonly notificationService: NotificationService
  ) {}

  private validateRegistration(data: RegisterPlayerDTO | RegisterTeamDTO) {
    if (!data.tournamentId) throw new ValidationError('Tournament ID is required');
    if (!data.divisionId) throw new ValidationError('Division ID is required');
    if (!data.firstName) throw new ValidationError('First name is required');
    if (!data.lastName) throw new ValidationError('Last name is required');
    if (!data.email) throw new ValidationError('Email is required');
    if (!data.email.includes('@')) throw new ValidationError('Invalid email format');

    if ('teamName' in data) {
      if (!data.teamName) throw new ValidationError('Team name is required');
      if (!data.teamMembers?.length) throw new ValidationError('Team must have at least one member');
      
      data.teamMembers.forEach((member, index) => {
        if (!member.firstName) throw new ValidationError(`Team member ${index + 1} first name is required`);
        if (!member.lastName) throw new ValidationError(`Team member ${index + 1} last name is required`);
        if (!member.email) throw new ValidationError(`Team member ${index + 1} email is required`);
        if (!member.email.includes('@')) throw new ValidationError(`Team member ${index + 1} has invalid email format`);
      });
    }
  }

  async registerPlayer(data: RegisterPlayerDTO): Promise<Registration> {
    this.validateRegistration(data);

    const registration = await this.repository.create({
      tournamentId: data.tournamentId,
      playerId: data.playerId,
      divisionId: data.divisionId,
      status: RegistrationStatus.PENDING,
      type: 'INDIVIDUAL',
      metadata: {
        playerName: `${data.firstName} ${data.lastName}`,
        contactEmail: data.email,
        phone: data.phone
      },
      notes: null,
      priority: 0
    });

    await this.notificationService.sendRegistrationConfirmation({
      userId: data.playerId,
      tournamentId: data.tournamentId,
      registrationId: registration.id,
      playerName: `${data.firstName} ${data.lastName}`,
      email: data.email
    });

    return registration;
  }

  async registerTeam(data: RegisterTeamDTO): Promise<Registration> {
    this.validateRegistration(data);

    const registration = await this.repository.create({
      tournamentId: data.tournamentId,
      playerId: data.playerId,
      divisionId: data.divisionId,
      status: RegistrationStatus.PENDING,
      type: 'TEAM',
      metadata: {
        playerName: `${data.firstName} ${data.lastName}`,
        contactEmail: data.email,
        phone: data.phone,
        teamSize: data.teamMembers.length + 1,
        teamMembers: [
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            isTeamCaptain: true
          },
          ...data.teamMembers
        ]
      },
      notes: null,
      priority: 0
    });

    await this.notificationService.sendTeamRegistrationConfirmation({
      userId: data.playerId,
      tournamentId: data.tournamentId,
      registrationId: registration.id,
      teamName: data.teamName,
      captainName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      teamMembers: data.teamMembers
    });

    return registration;
  }

  async updateStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const registration = await this.repository.findById(id);
    
    if (status === RegistrationStatus.CONFIRMED && registration.status === RegistrationStatus.WAITLISTED) {
      // Remove from waitlist when confirming
      const metadata = { ...registration.metadata };
      delete metadata.waitlistPosition;
      await this.repository.update(id, { metadata });
    }

    const updated = await this.repository.updateStatus(id, status);

    await this.notificationService.sendStatusUpdate({
      userId: updated.playerId!,
      tournamentId: updated.tournamentId,
      registrationId: updated.id,
      status: status,
      playerName: updated.metadata?.playerName || ''
    });

    return updated;
  }

  async updateWaitlistPosition(id: string, newPosition: number): Promise<Registration> {
    if (newPosition < 0) throw new ValidationError('Waitlist position cannot be negative');
    
    const registration = await this.repository.findById(id);
    if (registration.status !== RegistrationStatus.WAITLISTED) {
      throw new ValidationError('Only waitlisted registrations can have positions updated');
    }

    return this.repository.updateWaitlistPosition(id, newPosition);
  }

  async addComment(id: string, comment: { text: string; createdBy: string }): Promise<Registration> {
    if (!comment.text?.trim()) throw new ValidationError('Comment text is required');
    if (!comment.createdBy) throw new ValidationError('Comment creator is required');

    const registration = await this.repository.findById(id);
    const metadata = {
      ...registration.metadata,
      comments: [
        ...(registration.metadata?.comments || []),
        {
          id: crypto.randomUUID(),
          text: comment.text,
          createdAt: new Date(),
          createdBy: comment.createdBy
        }
      ]
    };

    return this.repository.update(id, { metadata });
  }

  async findByTournament(tournamentId: string): Promise<Registration[]> {
    return this.repository.findByTournament(tournamentId);
  }

  async findById(id: string): Promise<Registration> {
    return this.repository.findById(id);
  }
} 