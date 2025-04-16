import React from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { TournamentFormValues } from '../../types';

interface RegistrationSetupProps {
  data: TournamentFormValues;
  onChange: (data: Partial<TournamentFormValues>) => void;
}

export default function RegistrationSetup({ data, onChange }: RegistrationSetupProps) {
  const handleChange = (field: keyof TournamentFormValues, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Registration Settings</Typography>

      <FormControlLabel
        control={
          <Switch
            checked={data.registrationEnabled || false}
            onChange={(e) => handleChange('registrationEnabled', e.target.checked)}
          />
        }
        label="Enable Registration"
      />

      {data.registrationEnabled && (
        <>
          <TextField
            type="number"
            label="Maximum Teams"
            value={data.maxTeams || ''}
            onChange={(e) => handleChange('maxTeams', parseInt(e.target.value))}
            fullWidth
          />

          <DatePicker
            label="Registration Deadline"
            value={data.registrationDeadline || null}
            onChange={(date) => date && handleChange('registrationDeadline', date)}
            maxDate={data.startDate || undefined}
          />

          <FormControlLabel
            control={
              <Switch
                checked={data.requirePlayerProfile || false}
                onChange={(e) => handleChange('requirePlayerProfile', e.target.checked)}
              />
            }
            label="Require Player Profile"
          />
        </>
      )}
    </Box>
  );
} 