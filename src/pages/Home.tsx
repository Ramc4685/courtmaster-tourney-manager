
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Trophy, 
  Users, 
  Clock, 
  Activity, 
  ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth/AuthContext';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to CourtMaster</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Simplify tournament management with our comprehensive solution for indoor sports facilities.
        </p>
        
        {!isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link to="/login">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8" asChild>
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        ) : (
          <Button asChild size="lg" className="px-8">
            <Link to="/tournaments">View My Tournaments</Link>
          </Button>
        )}
      </section>
      
      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader className="pb-3">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Tournament Management</CardTitle>
              <CardDescription>Create and manage tournaments with ease</CardDescription>
            </CardHeader>
            <CardContent>
              Configure multiple tournament formats, customize scoring systems, and template-based tournament setup.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Registration System</CardTitle>
              <CardDescription>Streamline participant registration</CardDescription>
            </CardHeader>
            <CardContent>
              Self-service and administrative registration, digital waiver collection, and participant verification.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Trophy className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Real-time Scoring</CardTitle>
              <CardDescription>Keep scores updated instantly</CardDescription>
            </CardHeader>
            <CardContent>
              Real-time score entry, support for different scoring systems, and match history and statistics.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Clock className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Check-in & Front Desk</CardTitle>
              <CardDescription>Efficient participant processing</CardDescription>
            </CardHeader>
            <CardContent>
              Digital check-in, player verification, and tournament information distribution.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Activity className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>Gain valuable insights</CardDescription>
            </CardHeader>
            <CardContent>
              Tournament performance metrics, player statistics, and court utilization analysis.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Multi-Role System</CardTitle>
              <CardDescription>Different views for different roles</CardDescription>
            </CardHeader>
            <CardContent>
              Specialized interfaces for directors, front desk staff, scorekeepers, players, and spectators.
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Get Started Section */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your Tournament Management?</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Join CourtMaster today and experience seamless tournament operations from creation to completion.
        </p>
        
        <Button asChild size="lg" className="px-8">
          <Link to={isAuthenticated ? "/tournaments" : "/login"}>
            {isAuthenticated ? "Go to Dashboard" : "Get Started Now"} <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Home;
