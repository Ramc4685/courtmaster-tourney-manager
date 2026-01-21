import React, { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameType } from '@/types/tournament-enums';
import { Calendar, MapPin, Trophy, Info, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface LocationSuggestion {
  name: string;
  formatted_address: string;
}

export const BasicInfoStep = () => {
  const { control, watch, setValue, formState } = useFormContext<WizardFormValues>();
  const { touchedFields, dirtyFields } = formState;
  const { isMobile } = useMobileOptimization();
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid' | 'pending'>>({});
  const { toast } = useToast();

  // Watch form values for real-time validation
  const formValues = watch();
  const { name, location, startDate, endDate, gameType, description } = formValues;

  // Helper to check if a field has been interacted with
  const isFieldTouched = (fieldName: string) => {
    return touchedFields[fieldName as keyof typeof touchedFields] || dirtyFields[fieldName as keyof typeof dirtyFields];
  };

  // Real-time field validation - only show errors after user interaction
  useEffect(() => {
    const validateFields = () => {
      const status: Record<string, 'valid' | 'invalid' | 'pending'> = {};

      // Tournament name validation (required)
      if (name === undefined || name === null || name === '') {
        // Only show invalid if user has touched the field
        status.name = isFieldTouched('name') ? 'invalid' : 'pending';
      } else {
        status.name = name.length >= 3 && name.length <= 100 ? 'valid' : 'invalid';
      }

      // Location validation (required)
      if (location === undefined || location === null || location === '') {
        status.location = isFieldTouched('location') ? 'invalid' : 'pending';
      } else {
        status.location = location.length >= 3 ? 'valid' : 'invalid';
      }

      // Date validation (both required)
      if (!startDate) {
        status.startDate = isFieldTouched('startDate') ? 'invalid' : 'pending';
      } else if (!endDate) {
        status.endDate = isFieldTouched('endDate') ? 'invalid' : 'pending';
        // Still validate start date if provided
        const start = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        status.startDate = start >= today ? 'valid' : 'invalid';
      } else {
        // Both dates provided, validate them
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isStartDateValid = start >= today;
        const isEndDateValid = end >= start;
        const durationValid = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) <= 30; // Max 30 days

        status.startDate = isStartDateValid ? 'valid' : 'invalid';
        status.endDate = isEndDateValid && durationValid ? 'valid' : 'invalid';
      }

      // Game type validation (required)
      if (!gameType) {
        status.gameType = isFieldTouched('gameType') ? 'invalid' : 'pending';
      } else {
        status.gameType = Object.values(GameType).includes(gameType) ? 'valid' : 'invalid';
      }

      setValidationStatus(status);
    };

    const timeoutId = setTimeout(validateFields, 300); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [name, location, startDate, endDate, gameType, touchedFields, dirtyFields]);

  // Mock location suggestions (in a real app, this would call a geocoding API)
  const handleLocationSearch = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Mock suggestions - in production, integrate with Google Places API or similar
    const mockSuggestions: LocationSuggestion[] = [
      { name: `${query} Sports Center`, formatted_address: `${query} Sports Complex, Sports City` },
      { name: `${query} Community Center`, formatted_address: `${query} Community Center, Local Area` },
      { name: `${query} Athletic Club`, formatted_address: `${query} Athletic Club, Recreation District` },
    ];

    setLocationSuggestions(mockSuggestions);
    setShowLocationSuggestions(true);
  };

  const gameTypeDescriptions = useMemo(() => ({
    [GameType.BADMINTON]: 'Racquet sport played with shuttlecock',
    [GameType.TENNIS]: 'Racquet sport played with tennis ball',
    [GameType.TABLE_TENNIS]: 'Indoor racquet sport on table',
    [GameType.SQUASH]: 'Racquet sport in enclosed court',
    [GameType.PICKLEBALL]: 'Paddle sport combining tennis, badminton, and ping-pong',
  }), []);

  const getValidationIcon = (fieldName: string) => {
    const status = validationStatus[fieldName];
    if (status === 'valid') return <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />;
    if (status === 'invalid') return <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />;
    return null;
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxEndDate = () => {
    if (!startDate) return '';
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 30); // Max 30 days duration
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Tournament Details</h3>
          <p className="text-sm text-muted-foreground">Enter the basic information for your tournament</p>
        </div>
      </div>

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="tournament-name">
              Tournament Name <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                id="tournament-name"
                placeholder="e.g., Spring Championship 2024"
                aria-describedby="tournament-name-description"
                autoComplete="off"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Choose a descriptive name (3-100 characters)
            </FormDescription>
            <FormMessage id="tournament-name-description" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="tournament-location">
              <MapPin className="h-4 w-4 inline mr-1" />
              Venue Location <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  id="tournament-location"
                  placeholder="Start typing venue name or address..."
                  aria-describedby="tournament-location-description"
                  autoComplete="off"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleLocationSearch(e.target.value);
                  }}
                  onFocus={() => {
                    if (field.value && locationSuggestions.length > 0) {
                      setShowLocationSuggestions(true);
                    }
                  }}
                />

                {/* Location suggestions dropdown */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        onClick={() => {
                          setValue('location', suggestion.formatted_address);
                          setShowLocationSuggestions(false);
                        }}
                      >
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-sm text-muted-foreground">{suggestion.formatted_address}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
            <FormDescription>
              Enter the venue name or address where the tournament will be held
            </FormDescription>
            <FormMessage id="tournament-location-description" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="gameType"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="game-type" className="flex items-center space-x-2">
              <span>Game Type</span>
              {getValidationIcon('gameType')}
              <span>Game Type</span>
              {getValidationIcon('gameType')}
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                // Auto-adjust scoring rules based on game type
                if (value === GameType.TABLE_TENNIS) {
                  setValue('scoringRules.pointsToWinSet', 11);
                  setValue('scoringRules.setsToWinMatch', 3);
                  setValue('scoringRules.maxSets', 5);
                } else if (value === GameType.TENNIS) {
                  setValue('scoringRules.pointsToWinSet', 6);
                  setValue('scoringRules.setsToWinMatch', 2);
                  setValue('scoringRules.maxSets', 3);
                }
              }}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger
                  id="game-type"
                  className={cn(
                    validationStatus.gameType === 'valid' && "border-green-500",
                    validationStatus.gameType === 'invalid' && "border-red-500"
                  )}
                >
                  <SelectValue placeholder="Choose your sport" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(GameType).map((type) => (
                  <SelectItem key={type} value={type} className="cursor-pointer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {gameTypeDescriptions[type]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              This will set default scoring rules and division options
            </FormDescription>
            <FormMessage id="game-type-description" />
          </FormItem>
        )}
      />

      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
      )}>
        <FormField
          control={control}
          name="startDate"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel htmlFor="start-date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Start Date</span>
                {getValidationIcon('startDate')}
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="start-date"
                    type="date"
                    min={getMinDate()}
                    aria-describedby="start-date-description"
                    className={cn(
                      "pr-10",
                      validationStatus.startDate === 'valid' && "border-green-500",
                      validationStatus.startDate === 'invalid' && "border-red-500"
                    )}
                    {...field}
                    value={formatDateForInput(value)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      onChange(newDate);
                      // Auto-adjust end date if it's before start date
                      if (endDate && newDate > endDate) {
                        setValue('endDate', newDate);
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getValidationIcon('startDate')}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Tournament cannot start in the past
              </FormDescription>
              <FormMessage id="start-date-description" />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endDate"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel htmlFor="end-date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>End Date</span>
                {getValidationIcon('endDate')}
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="end-date"
                    type="date"
                    min={startDate ? formatDateForInput(startDate) : getMinDate()}
                    max={getMaxEndDate()}
                    aria-describedby="end-date-description"
                    className={cn(
                      "pr-10",
                      validationStatus.endDate === 'valid' && "border-green-500",
                      validationStatus.endDate === 'invalid' && "border-red-500"
                    )}
                    {...field}
                    value={formatDateForInput(value)}
                    onChange={(e) => onChange(new Date(e.target.value))}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getValidationIcon('endDate')}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Maximum tournament duration: 30 days
              </FormDescription>
              <FormMessage id="end-date-description" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="tournament-description" className="flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span>Description</span>
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </FormLabel>
            <FormControl>
              <Textarea
                id="tournament-description"
                placeholder="Describe your tournament, rules, prizes, or any special information for participants..."
                aria-describedby="tournament-description-description"
                className={cn(
                  "min-h-[80px] resize-none",
                  isMobile && "min-h-[60px]"
                )}
                maxLength={500}
                {...field}
              />
            </FormControl>
            <FormDescription className="flex justify-between">
              <span>Help participants understand what to expect</span>
              <span className="text-xs text-muted-foreground">
                {field.value?.length || 0}/500
              </span>
            </FormDescription>
            <FormMessage id="tournament-description-description" />
          </FormItem>
        )}
      />

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step Progress</span>
          <Badge variant={Object.keys(validationStatus).filter(key => validationStatus[key] === 'valid').length >= 5 ? 'default' : 'secondary'}>
            {Object.keys(validationStatus).filter(key => validationStatus[key] === 'valid').length}/5 required fields
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={cn("flex items-center space-x-1", validationStatus.name === 'valid' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
            {validationStatus.name === 'valid' ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            <span>Tournament Name</span>
          </div>
          <div className={cn("flex items-center space-x-1", validationStatus.location === 'valid' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
            {validationStatus.location === 'valid' ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            <span>Location</span>
          </div>
          <div className={cn("flex items-center space-x-1", validationStatus.gameType === 'valid' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
            {validationStatus.gameType === 'valid' ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            <span>Game Type</span>
          </div>
          <div className={cn("flex items-center space-x-1", validationStatus.startDate === 'valid' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
            {validationStatus.startDate === 'valid' ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            <span>Start Date</span>
          </div>
          <div className={cn("flex items-center space-x-1", validationStatus.endDate === 'valid' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
            {validationStatus.endDate === 'valid' ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            <span>End Date</span>
          </div>
        </div>
      </div>

      {/* Quick tips for mobile users */}
      {isMobile && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">Mobile Tips:</p>
              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                <li>Tap date fields to open the mobile date picker</li>
                <li>Your progress is automatically saved</li>
                <li>All fields with a checkmark are correctly filled</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showLocationSuggestions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowLocationSuggestions(false)}
        />
      )}
    </div>
  );
};