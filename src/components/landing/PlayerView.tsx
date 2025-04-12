
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const PlayerView: React.FC = () => {
  return (
    <Card className="border shadow-md">
      <CardHeader className="border-b flex justify-between items-center">
        <CardTitle className="text-xl">KourtMaster</CardTitle>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Welcome, Jordan</h2>
        </div>

        <div className="p-4 border-b">
          <h3 className="font-medium mb-2">Next Match</h3>
          <div className="mb-1">
            <span className="font-semibold">Jones vs.</span>
            <span className="text-xs mx-2">vs</span>
            <span className="font-semibold">Davis Adams</span>
          </div>
          <div className="text-sm text-gray-600">3:00 PM</div>
        </div>

        <div className="p-4 border-b">
          <h3 className="font-medium mb-2">My Schedule</h3>
          <div className="flex justify-between items-center mb-2">
            <div>Jones</div>
            <div className="flex items-center">
              <span className="mr-2">12:00 PM</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>Smith/Lee</div>
            <div className="flex items-center">
              <span className="mr-2">12:00 PM</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <h3 className="font-medium mb-2">Match Results</h3>
          <div className="flex justify-between items-center mb-2">
            <div>Jones</div>
            <div className="flex items-center">
              <span className="mr-2">2-0</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <div>Smith/Lee</div>
            <div className="flex items-center">
              <span className="mr-2">1-2</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>Jones</div>
            <div className="flex items-center">
              <span className="mr-2">2</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>Davis Adams</div>
            <div className="flex items-center">
              <span className="mr-2">1</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerView;
