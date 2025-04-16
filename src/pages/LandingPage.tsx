
import React from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import PlayerView from '@/components/landing/PlayerView';
import PublicView from '@/components/landing/PublicView';
import AdminDashboard from '@/components/landing/AdminDashboard';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-2 text-primary" />
        <h1 className="text-3xl font-bold text-center mb-2">CourtMaster Tournament System</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          The complete tournament management solution for badminton events
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => navigate('/tournaments')}
            className="px-6"
          >
            Browse Tournaments
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/login')}
            className="px-6"
          >
            Sign In
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="public" className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="public">Public View</TabsTrigger>
          <TabsTrigger value="player">Player View</TabsTrigger>
          <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="public">
          <PublicView />
        </TabsContent>
        
        <TabsContent value="player">
          <PlayerView />
        </TabsContent>
        
        <TabsContent value="admin">
          <AdminDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingPage;
