/**
 * Enhanced Registration Service Hook for CourtMaster Tournament Management System
 * 
 * Provides registration functionality with support for:
 * - Multi-sport registrations with sport-specific settings
 * - Offline registration capabilities
 * - Waiver management integration
 * - Tournament templates
 * - Event bus integration
 */

import { useState, useCallback } from 'react';
import { ID } from 'appwrite';
import { databases, COLLECTIONS, APPWRITE_DATABASE_ID } from '../../lib/appwrite';
import { 
  PlayerRegistration, 
  TeamRegistration, 
  RegistrationWithStatus, 
  RegistrationType
} from '../../types/registration';
import { RegistrationStatus } from '../../types/tournament-enums';
import { useRegistrationOfflineSync } from '../../hooks/useOfflineSync';
import eventBus, { EventType } from '../../events/eventBus';
import { useToast } from '../../hooks/use-toast';
import SportRulesFactory from '../../services/rules/SportRulesFactory';

interface UseRegistrationOptions {
  enableOfflineSupport?: boolean;
  autoRefresh?: boolean;
}

export interface RegistrationFormData {
  tournament_id: string;
  division_id: string;
  player_id?: string;
  team_id?: string;
  partner_id?: string;
  partner_email?: string;
  status?: RegistrationStatus;
  payment_status?: 'pending' | 'completed' | 'refunded';
  payment_amount?: number;
  payment_method?: string;
  payment_id?: string;
  checked_in?: boolean;
  checked_in_at?: string;
  waiver_signed?: boolean;
  waiver_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  preferences?: Record<string, any>;
  sport_specific_data?: Record<string, any>;
  type: RegistrationType;
}

export interface WaiverData {
  id: string;
  registration_id: string;
  tournament_id: string;
  user_id: string;
  signed_at: string;
  waiver_version: string;
  signature_data: string;
  form_data: Record<string, any>;
}

export const useRegistrationService = (options: UseRegistrationOptions = {}) => {
  const { enableOfflineSupport = true, autoRefresh = true } = options;
  const { toast } = useToast();
  
  const [registrations, setRegistrations] = useState<RegistrationWithStatus[]>([]);
  const [playerRegistrations, setPlayerRegistrations] = useState<RegistrationWithStatus[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<RegistrationWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Get offline sync capabilities for registration
  const {
    isOnline,
    queueRegistrationCreate,
    queueRegistrationUpdate,
    syncNow,
    pendingRegistrations
  } = useRegistrationOfflineSync('');
  
  /**
   * Fetch all registrations for a tournament
   */
  const fetchRegistrations = useCallback(async (tournamentId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Get tournament details to determine sport type
      const tournamentDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId
      );
      
      const sportType = tournamentDoc.sport_type || 'badminton'; // Default to badminton if not specified
      
      // Fetch all registrations for this tournament
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          // Filter by tournament ID
          databases.query.equal('tournament_id', tournamentId)
        ]
      );
      
      // Process and categorize registrations
      const allRegistrations = response.documents.map(doc => ({
        ...doc,
        sport_type: sportType
      })) as RegistrationWithStatus[];
      
      const playerRegs = allRegistrations.filter(reg => reg.type === 'player');
      const teamRegs = allRegistrations.filter(reg => reg.type === 'team');
      
      setRegistrations(allRegistrations);
      setPlayerRegistrations(playerRegs);
      setTeamRegistrations(teamRegs);
      
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching registrations');
      
      if (!isOnline) {
        toast({
          title: 'Offline Mode',
          description: 'Working with cached registration data. Changes will sync when back online.',
          variant: 'default'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, toast]);
  
  /**
   * Create a new registration
   */
  const createRegistration = useCallback(async (data: RegistrationFormData): Promise<string | null> => {
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare registration data
      const registrationData = {
        ...data,
        id: ID.unique(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: data.status || 'pending'
      };
      
      if (isOnline) {
        // Create registration in Appwrite
        const response = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          ID.unique(),
          registrationData
        );
        
        // Emit event
        eventBus.emit(EventType.REGISTRATION_CREATED, {
          registrationId: response.$id,
          tournamentId: data.tournament_id,
          type: data.type,
          status: data.status || 'pending'
        }, 'RegistrationService');
        
        // Update local state
        if (data.type === 'player') {
          setPlayerRegistrations(prev => [response as RegistrationWithStatus, ...prev]);
        } else {
          setTeamRegistrations(prev => [response as RegistrationWithStatus, ...prev]);
        }
        setRegistrations(prev => [response as RegistrationWithStatus, ...prev]);
        
        return response.$id;
      } else {
        // Queue for offline sync
        const tempId = await queueRegistrationCreate(registrationData);
        
        // Update local state with temporary ID
        const tempRegistration = {
          ...registrationData,
          $id: tempId,
          id: tempId
        } as RegistrationWithStatus;
        
        if (data.type === 'player') {
          setPlayerRegistrations(prev => [tempRegistration, ...prev]);
        } else {
          setTeamRegistrations(prev => [tempRegistration, ...prev]);
        }
        setRegistrations(prev => [tempRegistration, ...prev]);
        
        toast({
          title: 'Saved Offline',
          description: 'Registration saved locally and will sync when online.',
        });
        
        return tempId;
      }
    } catch (err) {
      console.error('Error creating registration:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating registration');
      
      toast({
        title: 'Registration Failed',
        description: err instanceof Error ? err.message : 'Failed to create registration',
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queueRegistrationCreate, toast]);
  
  /**
   * Update registration status
   */
  const updateRegistrationStatus = useCallback(async (id: string, status: RegistrationStatus): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (isOnline) {
        // Update in Appwrite
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id,
          updateData
        );
      } else {
        // Queue for offline sync
        await queueRegistrationUpdate(id, updateData);
        
        toast({
          title: 'Updated Offline',
          description: 'Registration status updated locally and will sync when online.',
        });
      }
      
      // Update local state
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...updateData } : reg
        )
      );
      
      setPlayerRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...updateData } : reg
        )
      );
      
      setTeamRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...updateData } : reg
        )
      );
      
      // Emit event
      const registration = registrations.find(reg => reg.id === id || reg.$id === id);
      if (registration) {
        const eventType = 
          status === 'approved' ? EventType.REGISTRATION_APPROVED :
          status === 'rejected' ? EventType.REGISTRATION_REJECTED :
          status === 'waitlisted' ? EventType.REGISTRATION_WAITLISTED :
          EventType.REGISTRATION_UPDATED;
        
        eventBus.emit(eventType, {
          registrationId: id,
          tournamentId: registration.tournament_id,
          type: registration.type,
          status
        }, 'RegistrationService');
      }
      
      return true;
    } catch (err) {
      console.error('Error updating registration status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating registration');
      
      toast({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Failed to update registration status',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queueRegistrationUpdate, registrations, toast]);
  
  /**
   * Update registration details
   */
  const updateRegistration = useCallback(async (id: string, data: Partial<RegistrationFormData>): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      if (isOnline) {
        // Update in Appwrite
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id,
          updateData
        );
      } else {
        // Queue for offline sync
        await queueRegistrationUpdate(id, updateData);
        
        toast({
          title: 'Updated Offline',
          description: 'Registration updated locally and will sync when online.',
        });
      }
      
      // Update local state
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...updateData } : reg
        )
      );
      
      setPlayerRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...updateData } : reg
        )
      );
      
      setTeamRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...updateData } : reg
        )
      );
      
      // Emit event
      eventBus.emit(EventType.REGISTRATION_UPDATED, {
        registrationId: id,
        tournamentId: data.tournament_id,
        data: updateData
      }, 'RegistrationService');
      
      return true;
    } catch (err) {
      console.error('Error updating registration:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating registration');
      
      toast({
        title: 'Update Failed',
        description: err instanceof Error ? err.message : 'Failed to update registration',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queueRegistrationUpdate, toast]);
  
  /**
   * Check in a participant
   */
  const checkIn = useCallback(async (id: string, userId?: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      const checkInData = {
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: userId,
        updated_at: new Date().toISOString()
      };
      
      if (isOnline) {
        // Update in Appwrite
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          id,
          checkInData
        );
      } else {
        // Queue for offline sync
        await queueRegistrationUpdate(id, checkInData);
        
        toast({
          title: 'Checked In Offline',
          description: 'Check-in recorded locally and will sync when online.',
        });
      }
      
      // Update local state
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...checkInData } : reg
        )
      );
      
      setPlayerRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...checkInData } : reg
        )
      );
      
      setTeamRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === id || reg.$id === id ? { ...reg, ...checkInData } : reg
        )
      );
      
      // Emit event
      const registration = registrations.find(reg => reg.id === id || reg.$id === id);
      if (registration) {
        eventBus.emit(EventType.PARTICIPANT_CHECKED_IN, {
          registrationId: id,
          tournamentId: registration.tournament_id,
          type: registration.type,
          checkedInAt: checkInData.checked_in_at
        }, 'RegistrationService');
      }
      
      return true;
    } catch (err) {
      console.error('Error checking in participant:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during check-in');
      
      toast({
        title: 'Check-in Failed',
        description: err instanceof Error ? err.message : 'Failed to check in participant',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queueRegistrationUpdate, registrations, toast]);
  
  /**
   * Record waiver signature for a registration
   */
  const submitWaiver = useCallback(async (registrationId: string, waiverData: WaiverData): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      // First update the registration to indicate waiver was signed
      const updateData = {
        waiver_signed: true,
        waiver_id: waiverData.id,
        updated_at: new Date().toISOString()
      };
      
      if (isOnline) {
        // Update registration in Appwrite
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.REGISTRATIONS,
          registrationId,
          updateData
        );
        
        // Create waiver document in Appwrite
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.WAIVERS,
          ID.unique(),
          {
            ...waiverData,
            created_at: new Date().toISOString()
          }
        );
      } else {
        // Queue for offline sync - registration update
        await queueRegistrationUpdate(registrationId, updateData);
        
        // Waiver would be created when back online
        toast({
          title: 'Waiver Saved Offline',
          description: 'Waiver recorded locally and will sync when online.',
        });
      }
      
      // Update local state
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId || reg.$id === registrationId ? { ...reg, ...updateData } : reg
        )
      );
      
      setPlayerRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId || reg.$id === registrationId ? { ...reg, ...updateData } : reg
        )
      );
      
      setTeamRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId || reg.$id === registrationId ? { ...reg, ...updateData } : reg
        )
      );
      
      // Emit event
      const registration = registrations.find(reg => reg.id === registrationId || reg.$id === registrationId);
      if (registration) {
        eventBus.emit(EventType.WAIVER_SIGNED, {
          registrationId,
          tournamentId: registration.tournament_id,
          waiverId: waiverData.id
        }, 'RegistrationService');
      }
      
      return true;
    } catch (err) {
      console.error('Error submitting waiver:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while submitting waiver');
      
      toast({
        title: 'Waiver Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to submit waiver',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, queueRegistrationUpdate, registrations, toast]);
  
  /**
   * Get sport-specific registration requirements
   */
  const getSportRequirements = useCallback((sportType: string) => {
    // Get sport rules
    const sportRules = SportRulesFactory.getRules(sportType);
    
    if (!sportRules) {
      return {
        isTeamSport: false,
        teamSize: 1,
        divisions: [],
        requiredFields: ['firstName', 'lastName', 'email', 'phone']
      };
    }
    
    // Get common divisions
    const divisions = 'getCommonDivisionTypes' in sportRules 
      ? (sportRules as any).getCommonDivisionTypes() 
      : [];
    
    return {
      isTeamSport: sportRules.isTeamSport,
      teamSize: sportRules.teamSize,
      divisions,
      requiredFields: [
        'firstName', 
        'lastName', 
        'email', 
        'phone',
        ...(sportRules.isTeamSport ? ['teamName'] : [])
      ]
    };
  }, []);
  
  /**
   * Get a single registration by ID
   */
  const getRegistration = useCallback(async (id: string): Promise<RegistrationWithStatus | null> => {
    try {
      const doc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        id
      );
      
      return doc as RegistrationWithStatus;
    } catch (err) {
      console.error('Error fetching registration:', err);
      return null;
    }
  }, []);
  
  /**
   * Get registrations for a specific player
   */
  const getPlayerRegistrations = useCallback(async (playerId: string): Promise<RegistrationWithStatus[]> => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          databases.query.equal('player_id', playerId)
        ]
      );
      
      return response.documents as RegistrationWithStatus[];
    } catch (err) {
      console.error('Error fetching player registrations:', err);
      return [];
    }
  }, []);
  
  /**
   * Bulk update registration status
   */
  const bulkUpdateStatus = useCallback(async (
    ids: string[], 
    status: RegistrationStatus, 
    type: 'player' | 'team'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError('');
    
    try {
      for (const id of ids) {
        await updateRegistrationStatus(id, status);
      }
      
      return true;
    } catch (err) {
      console.error('Error performing bulk update:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during bulk update');
      
      toast({
        title: 'Bulk Update Failed',
        description: err instanceof Error ? err.message : 'Failed to update registrations',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateRegistrationStatus, toast]);
  
  return {
    registrations,
    playerRegistrations,
    teamRegistrations,
    isLoading,
    error,
    isOnline,
    pendingRegistrations,
    fetchRegistrations,
    createRegistration,
    updateRegistrationStatus,
    updateRegistration,
    checkIn,
    submitWaiver,
    getSportRequirements,
    getRegistration,
    getPlayerRegistrations,
    bulkUpdateStatus,
    syncNow
  };
};

export default useRegistrationService;
