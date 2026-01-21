import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Users
} from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import { eventBus, EventType } from '../../events/eventBus';
import { PlayerRegistration, TeamRegistration, RegistrationStatus } from '../../types/entities';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

interface SearchResult {
  id: string;
  type: 'player' | 'team';
  name: string;
  email?: string;
  phone?: string;
  status: RegistrationStatus;
  category?: string;
  teamMembers?: string[];
  waiver?: boolean;
  emergencyContact?: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  tournamentId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchRegistrations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const [playerRegistrations, teamRegistrations] = await Promise.all([
        registrationService.getPlayerRegistrations(tournamentId),
        registrationService.getTeamRegistrations(tournamentId)
      ]);

      const results: SearchResult[] = [];

      // Search player registrations
      playerRegistrations
        .filter(reg =>
          reg.playerName?.toLowerCase().includes(query.toLowerCase()) ||
          reg.email?.toLowerCase().includes(query.toLowerCase()) ||
          reg.registrationId?.toLowerCase().includes(query.toLowerCase())
        )
        .forEach(reg => {
          results.push({
            id: reg.id,
            type: 'player',
            name: reg.playerName || 'Unknown Player',
            email: reg.email,
            phone: reg.phoneNumber,
            status: reg.status,
            category: reg.category,
            waiver: reg.waiverSigned,
            emergencyContact: reg.emergencyContact
          });
        });

      // Search team registrations
      teamRegistrations
        .filter(reg =>
          reg.teamName?.toLowerCase().includes(query.toLowerCase()) ||
          reg.captainEmail?.toLowerCase().includes(query.toLowerCase()) ||
          reg.registrationId?.toLowerCase().includes(query.toLowerCase())
        )
        .forEach(reg => {
          results.push({
            id: reg.id,
            type: 'team',
            name: reg.teamName || 'Unknown Team',
            email: reg.captainEmail,
            phone: reg.captainPhone,
            status: reg.status,
            category: reg.category,
            teamMembers: reg.teamMembers?.map(member => member.name) || [],
            waiver: reg.waiverSigned,
            emergencyContact: reg.emergencyContact
          });
        });

      setSearchResults(results);
    } catch (err) {
      console.error('Error searching registrations:', err);
      setError('Failed to search registrations');
    } finally {
      setSearching(false);
    }
  }, [tournamentId]);

  const handleCheckIn = async (registration: SearchResult) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (registration.type === 'player') {
        await registrationService.updatePlayerRegistrationStatus(
          registration.id,
          RegistrationStatus.CHECKED_IN
        );
      } else {
        await registrationService.updateTeamRegistrationStatus(
          registration.id,
          RegistrationStatus.CHECKED_IN
        );
      }

      // Emit event for real-time updates
      eventBus.emit(EventType.CHECK_IN_COMPLETED, {
        registrationId: registration.id,
        type: registration.type,
        name: registration.name,
        tournamentId
      });

      setSuccess(`${registration.name} checked in successfully!`);
      setSelectedRegistration(null);
      setSearchQuery('');
      setSearchResults([]);

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error checking in registration:', err);
      setError('Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCheckIn = async () => {
    if (!selectedRegistration) return;

    if (selectedRegistration.type === 'team') {
      await handleCheckIn(selectedRegistration);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.APPROVED:
        return <Badge variant="secondary">Approved</Badge>;
      case RegistrationStatus.CHECKED_IN:
        return <Badge variant="default">Checked In</Badge>;
      case RegistrationStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      case RegistrationStatus.WAITLISTED:
        return <Badge variant="destructive">Waitlisted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canCheckIn = (registration: SearchResult) => {
    return registration.status === RegistrationStatus.APPROVED ||
           registration.status === RegistrationStatus.PENDING;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRegistrations(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchRegistrations]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRegistration(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Player/Team Check-in
          </DialogTitle>
          <DialogDescription>
            Search for registered players or teams to check them in for the tournament.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by name, email, or registration ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Enter name, email, or registration ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Label>Search Results ({searchResults.length})</Label>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRegistration?.id === result.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRegistration(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.type === 'player' ? (
                        <User className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Users className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.email}
                          {result.category && ` • ${result.category}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      {result.status === RegistrationStatus.CHECKED_IN && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Registration Details */}
          {selectedRegistration && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label>Registration Details</Label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-lg">{selectedRegistration.name}</h4>
                    {getStatusBadge(selectedRegistration.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedRegistration.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedRegistration.email}</span>
                      </div>
                    )}
                    {selectedRegistration.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedRegistration.phone}</span>
                      </div>
                    )}
                    {selectedRegistration.category && (
                      <div>
                        <strong>Category:</strong> {selectedRegistration.category}
                      </div>
                    )}
                    <div>
                      <strong>Waiver:</strong>{' '}
                      {selectedRegistration.waiver ? (
                        <span className="text-green-600">Signed</span>
                      ) : (
                        <span className="text-red-600">Not Signed</span>
                      )}
                    </div>
                  </div>

                  {selectedRegistration.teamMembers && selectedRegistration.teamMembers.length > 0 && (
                    <div>
                      <strong>Team Members:</strong>
                      <ul className="mt-1 text-sm text-muted-foreground">
                        {selectedRegistration.teamMembers.map((member, index) => (
                          <li key={index}>• {member}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRegistration.emergencyContact && (
                    <div>
                      <strong>Emergency Contact:</strong> {selectedRegistration.emergencyContact}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {selectedRegistration && canCheckIn(selectedRegistration) && (
            <Button
              onClick={() => handleCheckIn(selectedRegistration)}
              disabled={loading || selectedRegistration.status === RegistrationStatus.CHECKED_IN}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Check In {selectedRegistration.type === 'team' ? 'Team' : 'Player'}
            </Button>
          )}
          {selectedRegistration && !canCheckIn(selectedRegistration) && (
            <Button disabled variant="outline">
              {selectedRegistration.status === RegistrationStatus.CHECKED_IN
                ? 'Already Checked In'
                : 'Cannot Check In'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};