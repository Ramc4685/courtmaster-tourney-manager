import { Registration, RegistrationMetadata, RegistrationStatus } from './registration.model';

export class RegistrationImpl implements Registration {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  tournamentId: string;
  playerId: string | null;
  divisionId: string | null;
  partnerId: string | null;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  notes: string | null;
  priority: number;
  type: 'INDIVIDUAL' | 'TEAM';

  constructor(data: Partial<Registration>) {
    Object.assign(this, data);
    this.metadata = this.metadata || {};
  }

  isWaitlisted(): boolean {
    return this.status === RegistrationStatus.WAITLISTED;
  }

  canBeApproved(): boolean {
    return [RegistrationStatus.PENDING, RegistrationStatus.WAITLISTED].includes(this.status);
  }

  getWaitlistPosition(): number | null {
    return this.metadata.waitlistPosition || null;
  }

  addComment(text: string, userId: string): void {
    if (!this.metadata.comments) {
      this.metadata.comments = [];
    }

    this.metadata.comments.push({
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      createdBy: userId
    });

    this.updatedAt = new Date();
  }

  updateWaitlistPosition(newPosition: number, reason?: string): void {
    const oldPosition = this.metadata.waitlistPosition;
    
    if (!this.metadata.waitlistHistory) {
      this.metadata.waitlistHistory = [];
    }

    this.metadata.waitlistHistory.push({
      date: new Date().toISOString(),
      fromPosition: oldPosition || 0,
      toPosition: newPosition,
      reason
    });

    this.metadata.waitlistPosition = newPosition;
    this.updatedAt = new Date();
  }
} 