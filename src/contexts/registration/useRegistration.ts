import { create } from "zustand";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  PlayerRegistration,
  TeamRegistration,
  PlayerRegistrationWithStatus,
  TeamRegistrationWithStatus,
  RegistrationMetadata,
  TournamentRegistrationStatus,
  TeamMember,
  RegistrationStatus,
  TournamentRegistration
} from "@/types/registration";
import { registrationService, profileService, notificationService, emailService } from "@/services/api";
import { Profile, Notification } from "@/types/entities";
import { useStore } from '@/stores/store';
import { APIService } from '@/services/api';

interface RegistrationStore {
  playerRegistrations: PlayerRegistrationWithStatus[];
  teamRegistrations: TeamRegistrationWithStatus[];
  isLoading: boolean;
  error: string | null;
  registerPlayer: (tournamentId: string, data: PlayerRegistration) => Promise<void>;
  registerTeam: (tournamentId: string, data: TeamRegistration) => Promise<void>;
  importPlayersFromCSV: (tournamentId: string, file: File) => Promise<void>;
  importPlayersFromExcel: (tournamentId: string, file: File) => Promise<void>;
  importTeamsFromCSV: (tournamentId: string, file: File) => Promise<void>;
  importTeamsFromExcel: (tournamentId: string, file: File) => Promise<void>;
  updatePlayerStatus: (id: string, status: TournamentRegistrationStatus) => Promise<void>;
  updateTeamStatus: (id: string, status: TournamentRegistrationStatus) => Promise<void>;
  fetchRegistrations: (tournamentId: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: TournamentRegistrationStatus, type: "player" | "team") => Promise<void>;
  updateWaitlistPosition: (id: string, newPosition: number) => Promise<void>;
  notifyWaitlisted: (id: string) => Promise<void>;
}

const useRegistrationStore = create<RegistrationStore>((set, get) => ({
  playerRegistrations: [],
  teamRegistrations: [],
  isLoading: false,
  error: null,

  fetchRegistrations: async (tournamentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const registrations = await registrationService.listRegistrations({ tournamentId });
      
      const playerRegs = registrations
        .filter((reg) => !reg.partnerId)
        .map((reg): PlayerRegistrationWithStatus => ({
          id: reg.id,
          tournamentId: reg.tournamentId,
          status: reg.status as TournamentRegistrationStatus,
          metadata: reg.metadata as RegistrationMetadata,
          createdAt: new Date(reg.createdAt),
          updatedAt: new Date(reg.updatedAt),
          firstName: (reg.metadata as RegistrationMetadata)?.playerName?.split(' ')[0] || '',
          lastName: (reg.metadata as RegistrationMetadata)?.playerName?.split(' ')[1] || '',
          email: (reg.metadata as RegistrationMetadata)?.contactEmail || '',
          phone: (reg.metadata as RegistrationMetadata)?.contactPhone || '',
          playerId: reg.playerId,
          divisionId: reg.divisionId,
          type: "player"
        }));

      const teamRegs = registrations
        .filter((reg) => !!reg.partnerId || (reg.metadata as any)?.teamName)
        .map((reg): TeamRegistrationWithStatus => ({
          id: reg.id,
          tournamentId: reg.tournamentId,
          status: reg.status as TournamentRegistrationStatus,
          metadata: reg.metadata as RegistrationMetadata,
          createdAt: new Date(reg.createdAt),
          updatedAt: new Date(reg.updatedAt),
          teamName: (reg.metadata as RegistrationMetadata)?.teamName || '',
          captainName: (reg.metadata as RegistrationMetadata)?.captainName || '',
          captainEmail: (reg.metadata as RegistrationMetadata)?.contactEmail || '',
          captainPhone: (reg.metadata as RegistrationMetadata)?.contactPhone || '',
          members: (reg.metadata as RegistrationMetadata)?.members || [],
          playerId: reg.playerId,
          divisionId: reg.divisionId,
          type: "team"
        }));

      set({
        playerRegistrations: playerRegs,
        teamRegistrations: teamRegs,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch registrations",
        isLoading: false,
      });
    }
  },

  registerPlayer: async (tournamentId: string, data: PlayerRegistration) => {
    set({ isLoading: true, error: null });
    try {
      const registrationPayload: Omit<TournamentRegistration, 'id'> = {
        tournamentId,
        playerId: data.playerId,
        divisionId: data.divisionId,
        partnerId: null,
        status: RegistrationStatus.PENDING,
        metadata: {
          playerName: `${data.firstName} ${data.lastName}`,
          contactEmail: data.email,
          contactPhone: data.phone || '',
          teamSize: 1,
          division: '',
          emergencyContact: '',
          waiverSigned: false,
          paymentStatus: 'PENDING',
        },
        notes: null,
        priority: 0,
        type: 'player',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const registration = await registrationService.register(registrationPayload);

      // Create notification for player
      await notificationService.createNotification({
        userId: data.playerId,
        title: 'Registration Successful',
        message: `You have successfully registered for the tournament (Player: ${data.firstName} ${data.lastName}).`,
        type: 'registration_confirmation',
        read: false,
        updatedAt: new Date()
      });

      try {
        const userProfile = await profileService.getProfile(data.playerId);
        if (userProfile?.preferences?.notifications?.email) {
           const emailHtml = `
            <h1>Registration Confirmed!</h1>
            <p>Hi ${data.firstName},</p>
            <p>You have successfully registered for the tournament.</p>
            <p>Tournament ID: ${tournamentId}</p>
            <p>We look forward to seeing you there!</p>
          `;
          await emailService.sendEmail({
            to: data.email,
            subject: 'Tournament Registration Confirmation',
            html: emailHtml,
          });
          console.log(`Sent registration confirmation email to ${data.email}`);
        } else {
           console.log(`Email notifications disabled for user ${data.playerId}`);
        }
      } catch (emailError) {
         console.error("Failed to send registration confirmation email:", emailError);
      }

      const newPlayerReg: PlayerRegistrationWithStatus = {
        ...data,
        id: registration.id,
        tournamentId,
        status: registration.status as TournamentRegistrationStatus,
        metadata: registration.metadata as RegistrationMetadata,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
        type: "player"
      };

      set((state) => ({
        playerRegistrations: [...state.playerRegistrations, newPlayerReg],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error registering player:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to register player",
        isLoading: false,
      });
    }
  },

  registerTeam: async (tournamentId: string, data: TeamRegistration) => {
    set({ isLoading: true, error: null });
    try {
      const primaryMember = data.members?.[0];
      if (!primaryMember) {
        throw new Error("Team must have at least one member.");
      }

      const registrationPayload: Omit<TournamentRegistration, 'id'> = {
        tournamentId,
        playerId: primaryMember.playerId || null,
        divisionId: data.divisionId || null,
        partnerId: null,
        status: RegistrationStatus.PENDING,
        metadata: {
          teamName: data.teamName,
          teamSize: data.members.length,
          division: '',
          emergencyContact: '',
          waiverSigned: false,
          paymentStatus: 'PENDING',
          captainName: data.captainName,
          captainEmail: data.captainEmail,
          captainPhone: data.captainPhone,
          members: data.members.map(member => ({
            firstName: member.firstName || '',
            lastName: member.lastName || '',
            name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
            email: member.email || '',
            phone: member.phone || '',
            isTeamCaptain: member.isTeamCaptain || false,
            playerId: member.playerId || null
          }))
        },
        notes: null,
        priority: 0,
        type: 'team',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const registration = await registrationService.register(registrationPayload);

      // Create notification for team captain
      await notificationService.createNotification({
        userId: primaryMember.playerId || '',
        title: 'Team Registration Successful',
        message: `Your team "${data.teamName}" has been successfully registered for the tournament.`,
        type: 'registration_confirmation',
        read: false,
        updatedAt: new Date()
      });

      // Send email confirmation if enabled
      try {
        if (primaryMember.playerId) {
          const captainProfile = await profileService.getProfile(primaryMember.playerId);
          if (captainProfile?.preferences?.notifications?.email) {
            const emailHtml = `
              <h1>Team Registration Confirmed!</h1>
              <p>Hi ${data.captainName},</p>
              <p>Your team "${data.teamName}" has been successfully registered for the tournament.</p>
              <p>Tournament ID: ${tournamentId}</p>
              <p>Team Members:</p>
              <ul>
                ${data.members.map(m => `<li>${m.firstName} ${m.lastName}</li>`).join('')}
              </ul>
              <p>We look forward to seeing your team there!</p>
            `;
            await emailService.sendEmail({
              to: data.captainEmail,
              subject: 'Tournament Team Registration Confirmation',
              html: emailHtml,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send team registration confirmation email:", emailError);
      }

      const newTeamReg: TeamRegistrationWithStatus = {
        ...data,
        id: registration.id,
        tournamentId,
        status: registration.status as TournamentRegistrationStatus,
        metadata: registration.metadata as RegistrationMetadata,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
        type: "team"
      };

      set((state) => ({
        teamRegistrations: [...state.teamRegistrations, newTeamReg],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error registering team:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to register team",
        isLoading: false,
      });
    }
  },

  importPlayersFromCSV: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          const players = results.data.map((row: any) => ({
            firstName: row["First Name"],
            lastName: row["Last Name"],
            email: row["Email"],
            phone: row["Phone"] || "",
            playerId: "",
            divisionId: "",
            status: RegistrationStatus.PENDING,
            metadata: {},
            type: "player" as const
          }));

          for (const player of players) {
            await get().registerPlayer(tournamentId, player as PlayerRegistration);
          }
        },
        error: (error) => {
          set({ error: error.message, isLoading: false });
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import players from CSV",
        isLoading: false,
      });
    }
  },

  importPlayersFromExcel: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const players = data.map((row: any) => ({
        firstName: row["First Name"],
        lastName: row["Last Name"],
        email: row["Email"],
        phone: row["Phone"] || "",
        playerId: "",
        divisionId: "",
        status: RegistrationStatus.PENDING,
        metadata: {},
        type: "player" as const
      }));

      for (const player of players) {
        await get().registerPlayer(tournamentId, player as PlayerRegistration);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import players from Excel",
        isLoading: false,
      });
    }
  },

  importTeamsFromCSV: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          const teams = results.data.map((row: any) => ({
            teamName: row["Team Name"],
            captainName: row["Captain Name"] || "",
            captainEmail: row["Captain Email"] || "",
            captainPhone: row["Captain Phone"] || "",
            members: row["Member Names"]
              .split(",")
              .map((name: string) => {
                const [firstName, lastName] = name.trim().split(" ");
                return {
                  firstName,
                  lastName,
                  email: "",
                  phone: "",
                  isTeamCaptain: false,
                };
              }),
            playerId: "",
            divisionId: "",
            status: RegistrationStatus.PENDING,
            metadata: {},
            type: "team" as const
          }));

          for (const team of teams) {
            await get().registerTeam(tournamentId, team as TeamRegistration);
          }
        },
        error: (error) => {
          set({ error: error.message, isLoading: false });
        },
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import teams from CSV",
        isLoading: false,
      });
    }
  },

  importTeamsFromExcel: async (tournamentId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const teams = data.map((row: any) => ({
        teamName: row["Team Name"],
        captainName: row["Captain Name"] || "",
        captainEmail: row["Captain Email"] || "",
        captainPhone: row["Captain Phone"] || "",
        members: row["Member Names"]
          .split(",")
          .map((name: string) => {
            const [firstName, lastName] = name.trim().split(" ");
            return {
              firstName,
              lastName,
              email: "",
              phone: "",
              isTeamCaptain: false,
            };
          }),
        playerId: "",
        divisionId: "",
        status: RegistrationStatus.PENDING,
        metadata: {},
        type: "team" as const
      }));

      for (const team of teams) {
        await get().registerTeam(tournamentId, team as TeamRegistration);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to import teams from Excel",
        isLoading: false,
      });
    }
  },

  updatePlayerStatus: async (id: string, status: TournamentRegistrationStatus) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.updateRegistration(id, { status });
      set((state) => ({
        playerRegistrations: state.playerRegistrations.map((reg) =>
          reg.id === id ? { ...reg, status: registration.status as TournamentRegistrationStatus } : reg
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to update player status:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update player status",
        isLoading: false,
      });
    }
  },

  updateTeamStatus: async (id: string, status: TournamentRegistrationStatus) => {
    set({ isLoading: true, error: null });
    try {
      const registration = await registrationService.updateRegistration(id, { status });
      set((state) => ({
        teamRegistrations: state.teamRegistrations.map((reg) =>
          reg.id === id ? { ...reg, status: registration.status as TournamentRegistrationStatus } : reg
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to update team status:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update team status",
        isLoading: false,
      });
    }
  },

  bulkUpdateStatus: async (ids: string[], status: TournamentRegistrationStatus, type: "player" | "team") => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all(
        ids.map(id => registrationService.updateRegistration(id, { status }))
      );

      set((state) => ({
        playerRegistrations: type === "player"
          ? state.playerRegistrations.map((reg) =>
              ids.includes(reg.id) ? { ...reg, status } : reg
            )
          : state.playerRegistrations,
        teamRegistrations: type === "team"
          ? state.teamRegistrations.map((reg) =>
              ids.includes(reg.id) ? { ...reg, status } : reg
            )
          : state.teamRegistrations,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to bulk update registrations:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update registrations",
        isLoading: false,
      });
    }
  },

  updateWaitlistPosition: async (id: string, newPosition: number) => {
    set({ isLoading: true, error: null });
    try {
      const currentRegistration = await registrationService.getRegistration(id);
      const currentMetadata = (currentRegistration.metadata || {}) as RegistrationMetadata;

      const registration = await registrationService.updateRegistration(id, {
        metadata: {
          ...currentMetadata,
          waitlistPosition: newPosition,
          waitlistHistory: [
            ...(currentMetadata.waitlistHistory || []),
            {
              timestamp: new Date().toISOString(),
              reason: 'Position updated',
              fromPosition: currentMetadata.waitlistPosition || 0,
              toPosition: newPosition,
            },
          ],
        },
      });
      const newMetadata = registration.metadata as RegistrationMetadata;
      set((state) => ({
        playerRegistrations: state.playerRegistrations.map((reg) =>
          reg.id === id ? { ...reg, metadata: newMetadata } : reg
        ),
        teamRegistrations: state.teamRegistrations.map((reg) =>
          reg.id === id ? { ...reg, metadata: newMetadata } : reg
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to update waitlist position:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update waitlist position",
        isLoading: false,
      });
    }
  },

  notifyWaitlisted: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentRegistration = await registrationService.getRegistration(id);
      if (!currentRegistration) {
        throw new Error(`Registration with ID ${id} not found.`);
      }
      const currentMetadata = (currentRegistration.metadata || {}) as RegistrationMetadata;

      // Update the last notified timestamp in the database
      const registration = await registrationService.updateRegistration(id, {
        metadata: {
          ...currentMetadata,
          waitlistNotified: new Date().toISOString(),
        },
      });
      const newMetadata = registration.metadata as RegistrationMetadata;

      // Update local state
      set((state) => ({
        playerRegistrations: state.playerRegistrations.map((reg) =>
          reg.id === id ? { ...reg, metadata: newMetadata } : reg
        ),
        teamRegistrations: state.teamRegistrations.map((reg) =>
          reg.id === id ? { ...reg, metadata: newMetadata } : reg
        ),
        isLoading: false,
      }));

      // Send in-app notification
      await notificationService.createNotification({
        userId: currentRegistration.playerId || '',
        title: 'Waitlist Update',
        message: `An update regarding your waitlist status for the tournament is available.`,
        type: 'waitlist_notification',
        read: false,
        updatedAt: new Date()
      });

      // Send email notification if enabled
      try {
        const userProfile = await profileService.getProfile(currentRegistration.playerId);
        const recipientEmail = userProfile?.email;

        if (recipientEmail && userProfile?.preferences?.notifications?.email) {
           const emailHtml = `
            <h1>Waitlist Update</h1>
            <p>Hi ${currentMetadata.playerName || 'Player'},</p>
            <p>There's an update regarding your waitlist status for the tournament (ID: ${currentRegistration.tournamentId}).</p>
            <p>Please check the tournament page for more details.</p>
          `;
          await emailService.sendEmail({
            to: recipientEmail,
            subject: 'Tournament Waitlist Update',
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error("Failed to send waitlist notification email:", emailError);
      }

    } catch (error) {
      console.error("Failed to update notification status:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update notification status",
        isLoading: false,
      });
    }
  },
}));

export const useRegistration = () => {
  const store = useRegistrationStore();
  return {
    ...store,
  };
}; 