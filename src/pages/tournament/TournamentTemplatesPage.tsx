import React from "react";
import { useTournament } from "@/contexts/tournament/useTournament";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle, Copy, ClipboardList } from "lucide-react";

export const TournamentTemplatesPage = () => {
  const { selectedTournament, isLoading } = useTournament();
  const { toast } = useToast();

  // Sample tournament template data
  // In a real application, these would be fetched from an API
  const templates = [
    { 
      id: "template-1",
      name: "Basketball Tournament", 
      description: "3-on-3 basketball tournament with bracket elimination",
      sportType: "Basketball",
      divisions: 2,
      playersPerTeam: 3
    },
    {
      id: "template-2",
      name: "Volleyball League", 
      description: "6-team round robin volleyball league with playoffs",
      sportType: "Volleyball",
      divisions: 1,
      playersPerTeam: 6
    },
    {
      id: "template-3",
      name: "Tennis Singles Tournament", 
      description: "Single elimination tennis tournament for individual players",
      sportType: "Tennis",
      divisions: 3,
      playersPerTeam: 1
    }
  ];

  const handleUseTemplate = (templateId: string) => {
    toast({
      title: "Template Selected",
      description: "This functionality is under development.",
    });
  };

  const handleDuplicateTemplate = (templateId: string) => {
    toast({
      title: "Template Duplicated",
      description: "This functionality is under development.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tournament Templates</h1>
          <p className="text-muted-foreground">
            Use a template to quickly create tournaments with predefined settings
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
          <TabsTrigger value="community">Community Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.sportType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Divisions: {template.divisions}</span>
                    <span>Players per team: {template.playersPerTeam}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleDuplicateTemplate(template.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button size="sm" onClick={() => handleUseTemplate(template.id)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-templates">
          <div className="flex items-center justify-center p-12 border rounded-md bg-card mt-6">
            <p className="text-muted-foreground">You haven't created any templates yet</p>
          </div>
        </TabsContent>

        <TabsContent value="community">
          <div className="flex items-center justify-center p-12 border rounded-md bg-card mt-6">
            <p className="text-muted-foreground">Community templates feature coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentTemplatesPage;
