import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export const ReviewStep = () => {
  const form = useFormContext<WizardFormValues>();
  const values = form.getValues();
  const divisionDetails = values.divisionDetails || [];

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Tournament Name</h4>
              <p className="text-muted-foreground">{values.name}</p>
            </div>
            <div>
              <h4 className="font-medium">Location</h4>
              <p className="text-muted-foreground">{values.location}</p>
            </div>
            <div>
              <h4 className="font-medium">Game Type</h4>
              <p className="text-muted-foreground">{values.gameType.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <h4 className="font-medium">Start Date</h4>
              <p className="text-muted-foreground">{formatDate(values.startDate)}</p>
            </div>
            <div>
              <h4 className="font-medium">End Date</h4>
              <p className="text-muted-foreground">{formatDate(values.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Points to Win</h4>
              <p className="text-muted-foreground">{values.scoringRules.pointsToWin}</p>
            </div>
            <div>
              <h4 className="font-medium">Must Win By Two</h4>
              <p className="text-muted-foreground">{values.scoringRules.mustWinByTwo ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <h4 className="font-medium">Maximum Points</h4>
              <p className="text-muted-foreground">{values.scoringRules.maxPoints}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Divisions & Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {divisionDetails.map((division, index) => (
            <div key={division.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{division.name || `Division ${index + 1}`}</h3>
                <span className="text-sm text-muted-foreground">{division.type.replace(/_/g, ' ')}</span>
              </div>
              {division.categories?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  {division.categories.map((category) => (
                    <div key={category.id} className="space-y-1">
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.playType.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-4">No categories added</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Registration Enabled</h4>
              <p className="text-muted-foreground">{values.registrationEnabled ? 'Yes' : 'No'}</p>
            </div>
            {values.registrationEnabled && (
              <>
                <div>
                  <h4 className="font-medium">Registration Deadline</h4>
                  <p className="text-muted-foreground">{formatDate(values.registrationDeadline)}</p>
                </div>
                <div>
                  <h4 className="font-medium">Require Player Profile</h4>
                  <p className="text-muted-foreground">{values.requirePlayerProfile ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Maximum Teams</h4>
                  <p className="text-muted-foreground">{values.maxTeams || 'Unlimited'}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 