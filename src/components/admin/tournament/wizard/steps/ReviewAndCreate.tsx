import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { TournamentFormValues } from '../../types';

interface ReviewAndCreateProps {
  data: TournamentFormValues;
  onSubmit: () => void;
}

export default function ReviewAndCreate({ data, onSubmit }: ReviewAndCreateProps) {
  const formatDate = (date: Date | undefined) => {
    return date ? new Date(date).toLocaleDateString() : 'Not set';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Review Tournament Details</Typography>

      <List>
        <ListItem>
          <ListItemText
            primary="Tournament Name"
            secondary={data.name || 'Not set'}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Location"
            secondary={data.location || 'Not set'}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Description"
            secondary={data.description || 'Not set'}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Dates"
            secondary={`Start: ${formatDate(data.startDate)} | End: ${formatDate(data.endDate)}`}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Categories"
            secondary={`${data.divisionDetails?.length || 0} divisions configured`}
          />
        </ListItem>
        <Divider />

        <ListItem>
          <ListItemText
            primary="Registration"
            secondary={`${data.registrationEnabled ? 'Enabled' : 'Disabled'}${
              data.registrationEnabled
                ? ` | Deadline: ${formatDate(data.registrationDeadline)}`
                : ''
            }`}
          />
        </ListItem>
        <Divider />

        {data.registrationEnabled && (
          <>
            <ListItem>
              <ListItemText
                primary="Maximum Teams"
                secondary={data.maxTeams || 'Unlimited'}
              />
            </ListItem>
            <Divider />

            <ListItem>
              <ListItemText
                primary="Player Profile Required"
                secondary={data.requirePlayerProfile ? 'Yes' : 'No'}
              />
            </ListItem>
            <Divider />
          </>
        )}

        <ListItem>
          <ListItemText
            primary="Scoring Rules"
            secondary={`Points to Win: ${data.scoringRules?.pointsToWin || 'Not set'} | Must Win by Two: ${
              data.scoringRules?.mustWinByTwo ? 'Yes' : 'No'
            } | Max Points: ${data.scoringRules?.maxPoints || 'Not set'}`}
          />
        </ListItem>
      </List>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onSubmit}
        >
          Create Tournament
        </Button>
      </Box>
    </Box>
  );
} 