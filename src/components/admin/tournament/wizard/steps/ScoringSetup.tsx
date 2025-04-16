import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { TournamentFormValues } from '../../types';

interface ScoringSetupProps {
  data: TournamentFormValues;
  onChange: (data: Partial<TournamentFormValues>) => void;
}

export default function ScoringSetup({ data, onChange }: ScoringSetupProps) {
  const currentSettings = {
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    ...data.scoringRules
  };

  const handleScoringChange = (field: keyof typeof currentSettings, value: any) => {
    onChange({
      scoringRules: {
        ...currentSettings,
        [field]: value
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Scoring Rules</Typography>

      <TextField
        type="number"
        label="Points to Win"
        value={currentSettings.pointsToWin}
        onChange={(e) => handleScoringChange('pointsToWin', parseInt(e.target.value))}
        fullWidth
      />

      <FormControlLabel
        control={
          <Switch
            checked={currentSettings.mustWinByTwo}
            onChange={(e) => handleScoringChange('mustWinByTwo', e.target.checked)}
          />
        }
        label="Must Win by Two Points"
      />

      {currentSettings.mustWinByTwo && (
        <TextField
          type="number"
          label="Maximum Points"
          value={currentSettings.maxPoints}
          onChange={(e) => handleScoringChange('maxPoints', parseInt(e.target.value))}
          fullWidth
        />
      )}
    </Box>
  );
} 