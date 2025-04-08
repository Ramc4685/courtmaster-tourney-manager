import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ScoringView() {
  const { id } = useParams();

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Match Scoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Scoring interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
} 