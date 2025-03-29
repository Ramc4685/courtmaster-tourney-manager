
import React, { useState } from "react";
import { Settings, Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tournament } from "@/types/tournament";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TournamentScoringSettingsSection from "@/components/tournament/TournamentScoringSettingsSection";

interface TournamentSettingsProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
}

const TournamentSettings: React.FC<TournamentSettingsProps> = ({
  tournament,
  onUpdateTournament,
}) => {
  // Extract tournament settings or use defaults
  const [emailNotifications, setEmailNotifications] = useState(
    tournament.metadata?.emailNotifications || false
  );

  const handleEmailNotificationsChange = (checked: boolean) => {
    setEmailNotifications(checked);
    
    // Update tournament metadata
    const updatedTournament = {
      ...tournament,
      metadata: {
        ...tournament.metadata,
        emailNotifications: checked
      },
      updatedAt: new Date()
    };
    
    onUpdateTournament(updatedTournament);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Tournament Settings
        </CardTitle>
        <CardDescription>Configure tournament-wide settings and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scoring Settings Section */}
        <TournamentScoringSettingsSection 
          tournament={tournament} 
          onUpdateTournament={onUpdateTournament} 
        />
        
        <Separator />
        
        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Settings</h3>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="email-notifications" className="font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email to Players When Game Is Assigned
                </div>
              </Label>
              <p className="text-sm text-muted-foreground">
                Players will receive an email notification when they are assigned to a court
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={handleEmailNotificationsChange}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Coming Soon Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Advanced Features</h3>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
          
          <TooltipProvider>
            <div className="space-y-3 opacity-70">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    SMS Notifications for Court Changes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS alerts when court assignments change
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Switch disabled />
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Automatic Match Time Estimation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Predict match durations based on historical data
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Switch disabled />
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentSettings;
