
import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import PlayerView from '@/components/landing/PlayerView';
import PublicView from '@/components/landing/PublicView';
import AdminDashboard from '@/components/landing/AdminDashboard';

const LandingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-court-blue">CourtMaster Tournament System</h1>
      
      <Tabs defaultValue="public" className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="player">Player View</TabsTrigger>
          <TabsTrigger value="public">Public View</TabsTrigger>
          <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="player">
          <PlayerView />
        </TabsContent>
        
        <TabsContent value="public">
          <PublicView />
        </TabsContent>
        
        <TabsContent value="admin">
          <AdminDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPage;
