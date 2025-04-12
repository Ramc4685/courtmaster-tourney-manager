
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const PublicView: React.FC = () => {
  return (
    <Card className="border shadow-md">
      <CardHeader className="border-b flex justify-between items-center">
        <CardTitle className="text-xl">KourtMaster</CardTitle>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Indoor Tournament</h2>
        </div>

        <Tabs defaultValue="bracket" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-0">
            <TabsTrigger value="bracket">Bracket</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bracket" className="py-4 px-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <div className="border p-2 w-24 text-center">Jones</div>
                <div className="border-t-2 border-r-2 h-8 w-4"></div>
                <div className="border-b-2 h-20 w-4"></div>
                <div className="border p-2 w-24 text-center">Davis Adams</div>
              </div>
              <div className="flex items-center mt-8">
                <div className="border p-2 w-24 text-center">Davis</div>
                <div className="border-t-2 border-r-2 h-8 w-4"></div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="announcements" className="py-4 px-4">
            <div className="bg-gray-50 p-3 rounded mb-2">
              <p className="text-sm">Match between <span className="font-medium">Whitde Lances</span> and <span className="font-medium">Taytemfram</span>: whitde begin sean.</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 border-t">
          <h3 className="font-medium mb-3">Upcoming Matches</h3>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div>Jones vs. Smith/Lee</div>
              <div>12:07 PM</div>
            </div>
            <div className="flex justify-between items-center">
              <div>Smith/Lee vs. Davis Ada</div>
              <div>12:30 PM</div>
            </div>
          </div>

          <h3 className="font-medium mb-3">Live Scores</h3>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div>Smith/Lee vs. Jones</div>
              <div className="font-medium">2-1</div>
            </div>
            <div className="flex justify-between items-center">
              <div>Jones vs. Davis Adams</div>
              <div className="font-medium">1-2</div>
            </div>
          </div>

          <h3 className="font-medium mb-3">Live Scores</h3>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <div>Court 1</div>
              <div className="font-medium">2-1</div>
            </div>
            <div className="flex justify-between items-center">
              <div>Court 2</div>
              <div className="font-medium">1-2</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicView;
