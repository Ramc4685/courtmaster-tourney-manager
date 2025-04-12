
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TrophyIcon, CalendarIcon, UsersIcon, BarChart3Icon } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/tournaments/create">
            Create Tournament
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              2 tournaments in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Next event in 2 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered Players
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">
              +12 since last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +8 today
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <TrophyIcon className="w-8 h-8 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">Spring Badminton Open</h3>
                    <p className="text-sm text-muted-foreground">Apr 10 - Apr 12, 2025</p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                  In Progress
                </div>
              </div>
              
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <TrophyIcon className="w-8 h-8 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">Weekend Tennis Challenge</h3>
                    <p className="text-sm text-muted-foreground">Apr 5 - Apr 6, 2025</p>
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  Completed
                </div>
              </div>
              
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <TrophyIcon className="w-8 h-8 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">Summer Pickleball Tournament</h3>
                    <p className="text-sm text-muted-foreground">Apr 20 - Apr 22, 2025</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                  Registration
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/tournaments/create">
                  <TrophyIcon className="mr-2 h-4 w-4" />
                  New Tournament
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/schedule">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Create Schedule
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/players">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Manage Players
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/analytics">
                  <BarChart3Icon className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
