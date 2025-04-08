import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicView() {
  const { id } = useParams();

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Public View</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Public tournament information coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
} 