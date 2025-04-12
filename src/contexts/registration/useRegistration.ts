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
  TeamMember
} from "@/types/registration";
import { registrationService, profileService, notificationService, emailService } from "@/services/api";
import { Profile, Notification, Registration } from "@/types/entities";
import { useStore } from '@/stores/store';

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
      const registrations = await registrationService.listRegistrations({ tournament_id: tournamentId });
      
      const playerRegs = registrations
        .filter((reg) => !reg.partner_id)
        .map((reg): PlayerRegistrationWithStatus => ({
          id: reg.id,
          tournamentId: reg.tournament_id,
          status: reg.status as TournamentRegistrationStatus,
          metadata: reg.metadata as RegistrationMetadata,
          createdAt: new Date(reg.created_at),
          updatedAt: new Date(reg.updated_at),
          firstName: (reg.metadata as RegistrationMetadata)?.playerName?.split(' ')[0] || '',
          lastName: (reg.metadata as RegistrationMetadata)?.playerName?.split(' ')[1] || '',
          email: (reg.metadata as RegistrationMetadata)?.contactEmail || '',
          phone: (reg.metadata as RegistrationMetadata)?.contactPhone || '',
          player_id: reg.player_id,
          division_id: reg.division_id,
        }));

      const teamRegs = registrations
        .filter((reg) => !!reg.partner_id || (reg.metadata as any)?.teamName)
        .map((reg): TeamRegistrationWithStatus => ({
          id: reg.id,
          tournamentId: reg.tournament_id,
          status: reg.status as TournamentRegistrationStatus,
          metadata: reg.metadata as RegistrationMetadata,
          createdAt: new Date(reg.created_at),
          updatedAt: new Date(reg.updated_at),
          teamName: (reg.metadata as RegistrationMetadata & { teamName?: string })?.teamName || '',
          captainName: (reg.metadata as RegistrationMetadata & { captainName?: string })?.captainName || '',
          captainEmail: (reg.metadata as RegistrationMetadata)?.contactEmail || '',
          captainPhone: (reg.metadata as RegistrationMetadata)?.contactPhone || '',
          members: (reg.metadata as RegistrationMetadata & { members?: TeamMember[] })?.members || [],
          player_id: reg.player_id,
          division_id: reg.division_id,
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
      const registrationPayload: Omit<Registration, 'id' | 'created_at' | 'updated_at'> = {
        tournament_id: tournamentId,
        player_id: data.player_id,
        division_id: data.division_id,
        partner_id: null,
        status: 'PENDING',
        metadata: {
          playerName: `${data.firstName} ${data.lastName}`,
          contactEmail: data.email,
          contactPhone: data.phone || '',
          teamSize: 1,
          division: '',
          emergencyContact: { name: '', phone: '', relationship: '' },
          waiverSigned: false,
          paymentStatus: 'PENDING',
        },
        notes: null,
        priority: 0,
      };

      const registration = await registrationService.register(registrationPayload);

      await notificationService.createNotification({
        user_id: data.player_id,
        title: 'Registration Successful',
        message: `You have successfully registered for the tournament (Player: ${data.firstName} ${data.lastName}).`,
        type: 'registration_confirmation',
        read: false,
      });

      try {
        const userProfile = await profileService.getProfile(data.player_id);
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
           console.log(`Email notifications disabled for user ${data.player_id}`);
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
        createdAt: new Date(registration.created_at),
        updatedAt: new Date(registration.updated_at),
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
      const primaryMember = data.members[0];
      if (!primaryMember) {
        throw new Error("Team must have at least one member.");
      }

      const registrationPayload: Omit<Registration, 'id' | 'created_at' | 'updated_at'> = {
        tournament_id: tournamentId,
        player_id: primaryMember.player_id,
        division_id: data.division_id,
        partner_id: null,
        status: 'PENDING',
        metadata: {
          teamName: data.teamName,
          teamSize: data.members.length,
          captainName: data.captainName,
          contactEmail: data.captainEmail,
          contactPhone: data.captainPhone || '',
          members: data.members,
          division: '',
          emergencyContact: { name: '', phone: '', relationship: '' },
          waiverSigned: false,
          paymentStatus: 'PENDING',
        },
        notes: null,
        priority: 0,
      };

      const registration = await registrationService.register(registrationPayload);

      await notificationService.createNotification({
        user_id: primaryMember.player_id,
        title: 'Team Registration Successful',
        message: `Your team "${data.teamName}" has successfully registered for the tournament.`,
        type: 'registration_confirmation',
        read: false,
      });

      try {
        const captainEmail = data.captainEmail;
        const captainProfile = await profileService.getProfile(primaryMember.player_id);
        if (captainProfile?.preferences?.notifications?.email) {
           const emailHtml = `
            <h1>Team Registration Confirmed!</h1>
            <p>Hi ${data.captainName},</p>
            <p>Your team "${data.teamName}" has successfully registered for the tournament.</p>
            <p>Tournament ID: ${tournamentId}</p>
            <p>We look forward to seeing your team there!</p>
          `;
          await emailService.sendEmail({
            to: captainEmail,
            subject: 'Tournament Team Registration Confirmation',
            html: emailHtml,
          });
           console.log(`Sent team registration confirmation email to ${captainEmail}`);
        } else {
          console.log(`Email notifications disabled for captain ${primaryMember.player_id}`);
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
        createdAt: new Date(registration.created_at),
        updatedAt: new Date(registration.updated_at),
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
        complete: (results) => {
          const players = results.data.map((row: any) => ({
            firstName: row["First Name"],
            lastName: row["Last Name"],
            email: row["Email"],
            phone: row["Phone"] || "",
          }));

          players.forEach((player: PlayerRegistration) => {
            get().registerPlayer(tournamentId, player);
          });
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
      }));

      players.forEach((player: PlayerRegistration) => {
        get().registerPlayer(tournamentId, player);
      });
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
        complete: (results) => {
          const teams = results.data.map((row: any) => ({
            teamName: row["Team Name"],
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
          }));

          teams.forEach((team: TeamRegistration) => {
            get().registerTeam(tournamentId, team);
          });
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
      }));

      teams.forEach((team: TeamRegistration) => {
        get().registerTeam(tournamentId, team);
      });
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
          waitlistPromotionHistory: [
            ...(currentMetadata.waitlistPromotionHistory || []),
            {
              date: new Date().toISOString(),
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
        user_id: currentRegistration.player_id,
        title: 'Waitlist Update',
        message: `An update regarding your waitlist status for the tournament is available.`,
        type: 'waitlist_notification',
        read: false,
      });

      // Send email notification if enabled
      try {
        const userProfile = await profileService.getProfile(currentRegistration.player_id);
        const recipientEmail = userProfile?.email; // Get email from profile

        if (recipientEmail && userProfile?.preferences?.notifications?.email) {
           const emailHtml = `
            <h1>Waitlist Update</h1>
            <p>Hi ${currentMetadata.playerName || 'Player'},</p>
            <p>There's an update regarding your waitlist status for the tournament (ID: ${currentRegistration.tournament_id}).</p>
            <p>Please check the tournament page for more details.</p>
          `;
          await emailService.sendEmail({
            to: recipientEmail,
            subject: 'Tournament Waitlist Update',
            html: emailHtml,
          });
          console.log(`Sent waitlist notification email to ${recipientEmail}`);
        } else {
          console.log(`Email notifications disabled or email not found for user ${currentRegistration.player_id}`);
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