import React from 'react';
import { useFormContext } from 'react-hook-form';
import { TournamentFormValues } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ReviewStep: React.FC = () => {
  const { getValues } = useFormContext<TournamentFormValues>();
  const values = getValues();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Review Tournament Details</h3>
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
              <h4 className="font-semibold mb-2">Division {divIndex + 1}: {division.name} ({division.type}{division.level ? ` - ${division.level}` : ''})</h4>
              {division.categories.map((category, catIndex) => (
                <div key={category.id} className="ml-4 mb-2 border-l pl-4">
                  <p><strong>Category {catIndex + 1}:</strong> {category.name}</p>
                  <p>Play Type: {category.playType}</p>
                  <p>Format: {category.format.replace(/_/g, ' ')}</p>
                  {category.maxTeams && <p>Max Teams: {category.maxTeams}</p>}
                  <p>Seeded: {category.seeded ? 'Yes' : 'No'}</p>
                </div>
              ))}
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
              {/* <p><strong>Fee Amount:</strong> {values.registration.feeAmount ? `$${values.registration.feeAmount}` : 'Free'}</p> */}
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
      
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
            <CardTitle className="text-yellow-800">Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-yellow-700">Please review all details carefully. Once created, some settings might be difficult to change. Click 'Create Tournament' to finalize.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewStep;

