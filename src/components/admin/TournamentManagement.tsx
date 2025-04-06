
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, Trophy } from "lucide-react";
import { useTournament } from "@/contexts/tournament/useTournament";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const TournamentManagement: React.FC = () => {
  const { tournaments } = useTournament();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" /> Tournament Management
        </CardTitle>
        <CardDescription>View and manage all tournaments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Button variant="outline" size="sm">
            Filter Tournaments
          </Button>
          <Link to="/tournaments/create">
            <Button size="sm">Create Tournament</Button>
          </Link>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Matches</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No tournaments found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              tournaments.map(tournament => (
                <TableRow key={tournament.id}>
                  <TableCell className="font-medium">{tournament.name}</TableCell>
                  <TableCell>{tournament.format.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        tournament.status === "IN_PROGRESS" ? "default" :
                        tournament.status === "COMPLETED" ? "outline" :
                        "secondary"
                      }
                    >
                      {tournament.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(tournament.startDate), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>{tournament.teams.length}</TableCell>
                  <TableCell>{tournament.matches.length}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/tournaments/${tournament.id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TournamentManagement;
