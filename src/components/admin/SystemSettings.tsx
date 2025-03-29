
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSettingsState {
  autoAssignCourts: boolean;
  maxConcurrentMatches: number;
  emailNotifications: boolean;
  publicViewEnabled: boolean;
  defaultScoringSystem: string;
  defaultMatchDuration: number;
}

const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettingsState>({
    autoAssignCourts: true,
    maxConcurrentMatches: 5,
    emailNotifications: false,
    publicViewEnabled: true,
    defaultScoringSystem: "badminton",
    defaultMatchDuration: 45,
  });

  const handleSaveSettings = () => {
    // In a real application, this would save to a database
    toast({
      title: "Settings saved",
      description: "Your system settings have been updated successfully."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" /> System Settings
        </CardTitle>
        <CardDescription>Configure global system settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Match Scheduling</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assign">Auto-assign Courts</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign available courts to scheduled matches
              </p>
            </div>
            <Switch
              id="auto-assign"
              checked={settings.autoAssignCourts}
              onCheckedChange={(checked) => setSettings({ ...settings, autoAssignCourts: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-matches">Maximum Concurrent Matches</Label>
            <Slider
              id="max-matches"
              min={1}
              max={20}
              step={1}
              value={[settings.maxConcurrentMatches]}
              onValueChange={(value) => setSettings({ ...settings, maxConcurrentMatches: value[0] })}
            />
            <p className="text-xs text-muted-foreground text-right">
              Current: {settings.maxConcurrentMatches} matches
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notifications</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifications for match updates and results
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Public View</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-view">Enable Public View</Label>
              <p className="text-sm text-muted-foreground">
                Allow public access to tournament information and results
              </p>
            </div>
            <Switch
              id="public-view"
              checked={settings.publicViewEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, publicViewEnabled: checked })}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Default Settings</h3>
          <div className="grid gap-2">
            <Label htmlFor="scoring-system">Default Scoring System</Label>
            <Input
              id="scoring-system"
              value={settings.defaultScoringSystem}
              onChange={(e) => setSettings({ ...settings, defaultScoringSystem: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="match-duration">Default Match Duration (minutes)</Label>
            <Slider
              id="match-duration"
              min={15}
              max={120}
              step={5}
              value={[settings.defaultMatchDuration]}
              onValueChange={(value) => setSettings({ ...settings, defaultMatchDuration: value[0] })}
            />
            <p className="text-xs text-muted-foreground text-right">
              Current: {settings.defaultMatchDuration} minutes
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} className="w-full">
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SystemSettings;
