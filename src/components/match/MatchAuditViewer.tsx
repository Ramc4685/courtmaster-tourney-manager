
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Match, AuditLog } from "@/types/tournament";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface MatchAuditViewerProps {
  match: Match;
  auditLogs?: AuditLog[];
}

const MatchAuditViewer: React.FC<MatchAuditViewerProps> = ({
  match,
  auditLogs = [],
}) => {
  // Filter out audit logs that don't have details
  const validAuditLogs = auditLogs.filter(log => !!log.details);

  // Function to render badges based on action type
  const getActionBadge = (action: string) => {
    switch (action) {
      case "SCORE_UPDATED":
        return <Badge variant="success">Score</Badge>;
      case "MATCH_STARTED":
        return <Badge variant="secondary">Started</Badge>; // Changed from "info" to "secondary"
      case "MATCH_COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "MATCH_CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "COURT_ASSIGNED":
        return <Badge variant="outline">Court</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  // Format the details for display
  const formatDetails = (details: Record<string, any> | string) => {
    if (typeof details === "string") {
      return details; // Just return the string as is
    }

    // Handle object details
    if (details.score) {
      return `Score: ${details.score}`;
    } else if (details.newStatus) {
      return `Status: ${details.newStatus}`;
    } else if (details.courtNumber) {
      return `Court: ${details.courtNumber}`;
    } else {
      // Try to create a readable message from the details
      return Object.entries(details)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join(", ");
    }
  };

  // If there are no audit logs, show a placeholder
  if (validAuditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Match History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No match history available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Match History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-4">
          <div className="space-y-4 pt-1 pb-4">
            {validAuditLogs.map((log, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getActionBadge(log.action)}
                    <span className="text-xs text-gray-500">
                      {log.userName || "System"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm pl-2 border-l-2 border-gray-200">
                  {typeof log.details === "string" ? log.details : formatDetails(log.details)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MatchAuditViewer;
