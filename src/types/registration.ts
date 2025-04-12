
export enum RegistrationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  WAITLISTED = "WAITLISTED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED"
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  categoryId: string;
  playerId: string;
  partnerId?: string;
  status: RegistrationStatus;
  metadata: {
    checkInTime?: string;
    playerName: string;
    teamSize: number;
    division: string;
    contactEmail: string;
    contactPhone: string;
    paymentStatus?: string;
    notes?: string;
    specialRequests?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    previousParticipation?: boolean;
    skillLevel?: string;
    waitlistPosition?: number;
    waitlistPromotionHistory?: {
      timestamp: string;
      reason: string;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
  category: any;
}

export interface PlayerRegistrationWithStatus extends TournamentRegistration {
  createdAt: Date;
  updatedAt: Date;
}
