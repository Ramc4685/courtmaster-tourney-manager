import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { TournamentFormValues } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export type ReviewStepWarning = {
  level: 'warning' | 'error';
  message: string;
};

interface ReviewStepProps {
  warningsByStep: Record<number, ReviewStepWarning[]>;
  onNavigateToStep: (stepNumber: number) => void;
  warningsAcknowledged: boolean;
  onWarningsAcknowledgedChange: (acknowledged: boolean) => void;
  hasBlockingErrors: boolean;
  stepLabels: string[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  warningsByStep,
  onNavigateToStep,
  warningsAcknowledged,
  onWarningsAcknowledgedChange,
  hasBlockingErrors,
  stepLabels,
}) => {
  const { getValues } = useFormContext<TournamentFormValues>();
  const values = getValues();
  const warningsEntries = useMemo(
    () => Object.entries(warningsByStep).filter(([, issues]) => issues.length > 0),
    [warningsByStep]
  );
  const hasWarnings = warningsEntries.length > 0;
  const hasNonBlockingWarnings = warningsEntries.some(([, issues]) =>
    issues.some(issue => issue.level === 'warning')
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Review Tournament Details</h3>

      {hasWarnings && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="text-orange-900 dark:text-orange-100">Validation Summary</CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Review the items below before finalizing your tournament.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasBlockingErrors && (
              <Alert variant="destructive">
                <AlertTitle>Critical issues detected</AlertTitle>
                <AlertDescription>
                  Resolve the items marked as errors before you can create your tournament.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {warningsEntries.map(([stepNumberString, issues]) => {
                const stepNumber = Number(stepNumberString);
                const label = stepLabels[stepNumber - 1] || `Step ${stepNumber}`;
                return (
                  <Card key={`warning-${stepNumber}`} className="border border-orange-200 dark:border-orange-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                          {label}
                        </CardTitle>
                        <CardDescription>
                          {issues.length} item{issues.length > 1 ? 's' : ''} needs attention
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateToStep(stepNumber)}
                      >
                        Edit step
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {issues.map((issue, index) => (
                          <li key={`${stepNumber}-${index}`} className="flex items-start space-x-2">
                            <Badge
                              variant={issue.level === 'error' ? 'destructive' : 'secondary'}
                              className={issue.level === 'error' ? 'bg-red-600' : 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100'}
                            >
                              {issue.level.toUpperCase()}
                            </Badge>
                            <span className="text-orange-900 dark:text-orange-100">{issue.message}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasNonBlockingWarnings && !hasBlockingErrors && (
              <div className="flex items-start space-x-2 rounded-md border border-orange-200 dark:border-orange-800 bg-card p-3">
                <Checkbox
                  id="acknowledge-warnings"
                  checked={warningsAcknowledged}
                  onCheckedChange={checked => onWarningsAcknowledgedChange(Boolean(checked))}
                />
                <label htmlFor="acknowledge-warnings" className="text-sm text-orange-900 dark:text-orange-100">
                  I understand there are outstanding warnings and choose to continue.
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {values.name}</p>
          <p><strong>Location:</strong> {values.location}</p>
          <p><strong>Game Type:</strong> {values.gameType}</p>
          <p><strong>Description:</strong> {values.description || 'N/A'}</p>
          <p><strong>Start Date:</strong> {format(values.startDate, 'PPP')}</p>
          <p><strong>End Date:</strong> {format(values.endDate, 'PPP')}</p>
          <p><strong>Overall Format:</strong> {values.format.replace(/_/g, ' ')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Divisions & Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {values.divisionDetails.map((division, divIndex) => (
            <div key={division.id} className="border rounded p-4">
              <h4 className="font-semibold mb-2">
                Division {divIndex + 1}: {division.name} ({division.type}{division.level ? ` - ${division.level}` : ''})
              </h4>
              {division.categories.length > 0 ? (
                division.categories.map((category, catIndex) => (
                  <div key={category.id} className="ml-4 mb-2 border-l pl-4">
                    <p><strong>Category {catIndex + 1}:</strong> {category.name}</p>
                    <p>Play Type: {category.playType}</p>
                    <p>Format: {category.format.replace(/_/g, ' ')}</p>
                    {category.maxTeams && <p>Max Teams: {category.maxTeams}</p>}
                    <p>Seeded: {category.seeded ? 'Yes' : 'No'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No categories configured.</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Registration Enabled:</strong> {values.registration.enabled ? 'Yes' : 'No'}</p>
          {values.registration.enabled && (
            <>
              <p><strong>Deadline:</strong> {values.registration.deadline ? format(values.registration.deadline, 'PPP') : 'N/A'}</p>
              <p><strong>Max Entries (Overall):</strong> {values.registration.maxEntries || 'Unlimited'}</p>
              <p><strong>Allow Waitlist:</strong> {values.registration.allowWaitlist ? 'Yes' : 'No'}</p>
              <p><strong>Require Player Profile:</strong> {values.registration.requirePlayerProfile ? 'Yes' : 'No'}</p>
              <p><strong>Require Digital Waiver:</strong> {values.registration.waiverRequired ? 'Yes' : 'No'}</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Points to Win Set:</strong> {values.scoringRules.pointsToWinSet}</p>
          <p><strong>Sets to Win Match:</strong> {values.scoringRules.setsToWinMatch}</p>
          <p><strong>Max Sets per Match:</strong> {values.scoringRules.maxSets}</p>
          <p><strong>Must Win by Two:</strong> {values.scoringRules.mustWinByTwo ? 'Yes' : 'No'}</p>
          <p><strong>Max Points per Set:</strong> {values.scoringRules.maxPointsPerSet}</p>
          <p><strong>Tiebreaker Format:</strong> {values.scoringRules.tiebreakerFormat || 'N/A'}</p>
        </CardContent>
      </Card>

      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-orange-800 dark:text-orange-100">Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 dark:text-orange-300">
            Please review all details carefully. Once created, some settings might be difficult to change. Click 'Create Tournament' to finalize.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewStep;
