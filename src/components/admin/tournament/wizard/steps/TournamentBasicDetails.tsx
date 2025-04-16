import React from 'react';
import { TextField, Box, FormControlLabel, Switch } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { TournamentFormValues } from '../../types';

interface TournamentBasicDetailsProps {
  data: TournamentFormValues;
  onChange: (data: Partial<TournamentFormValues>) => void;
}

export default function TournamentBasicDetails({ data, onChange }: TournamentBasicDetailsProps) {
  const handleChange = (field: keyof TournamentFormValues) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: event.target.value });
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    if (date) {
      onChange({ [field]: date });

      // Auto-set registration deadline if registration is enabled
      if (field === 'startDate' && data.registrationEnabled) {
        const deadline = new Date(date);
        deadline.setDate(deadline.getDate() - 1);
        onChange({ registrationDeadline: deadline });
      }
    }
  };

  const handleRegistrationToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = event.target.checked;
    const updates: Partial<TournamentFormValues> = {
      registrationEnabled: isEnabled
    };

    // Set registration deadline when enabling registration
    if (isEnabled && data.startDate) {
      const deadline = new Date(data.startDate);
      deadline.setDate(deadline.getDate() - 1);
      updates.registrationDeadline = deadline;
    }

    onChange(updates);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        label="Tournament Name"
        value={data.name || ''}
        onChange={handleChange('name')}
        fullWidth
      />

      <TextField
        required
        label="Location"
        value={data.location || ''}
        onChange={handleChange('location')}
        fullWidth
      />

      <TextField
        label="Description"
        value={data.description || ''}
        onChange={handleChange('description')}
        multiline
        rows={4}
        fullWidth
      />

      <DatePicker
        label="Start Date"
        value={data.startDate || null}
        onChange={handleDateChange('startDate')}
      />

      <DatePicker
        label="End Date"
        value={data.endDate || null}
        onChange={handleDateChange('endDate')}
        minDate={data.startDate || undefined}
      />

      <FormControlLabel
        control={
          <Switch
            checked={data.registrationEnabled || false}
            onChange={handleRegistrationToggle}
          />
        }
        label="Enable Registration"
      />

      {data.registrationEnabled && (
        <DatePicker
          label="Registration Deadline"
          value={data.registrationDeadline || null}
          onChange={(date) => date && onChange({ registrationDeadline: date })}
          maxDate={data.startDate || undefined}
        />
      )}
    </Box>
  );
} 