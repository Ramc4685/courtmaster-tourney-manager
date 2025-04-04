import React from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Match, AuditLog } from "@/types/tournament";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Clipboard, UserCircle, Clock } from "lucide-react";

interface MatchAuditViewerProps {
  match: Match;
}

const MatchAuditViewer: React.FC<MatchAuditViewerProps> = ({ match }) => {
  const [open, setOpen] = React.useState(false);

  // Format audit log details for display
  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details) return "No details";
    
    return Object.entries(details)
      .filter(([key, value]) => value !== undefined)
      .map(([key, value]) => {
        // Format date objects
        if (value instanceof Date) {
          return `${key}: ${value.toLocaleString()}`;
        }
        
        // Handle nested objects/arrays
        if (typeof value === "object") {
          return `${key}: ${JSON.stringify(value)}`;
        }
        
        return `${key}: ${value}`;
      })
      .join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <Clipboard className="h-4 w-4 mr-2" />
          View Audit Log
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Match Audit Log</DialogTitle>
        </DialogHeader>
        
        {/* Match Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Match Details</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Match Number:</span>
              <span>{match.matchNumber || "Not assigned"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Teams:</span>
              <span>{match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Status:</span>
              <span>{match.status}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Timeline</div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Created:</span>
              <span>{match.createdAt ? new Date(match.createdAt).toLocaleString() : "Unknown"}</span>
            </div>
            {match.endTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Ended:</span>
                <span>{new Date(match.endTime).toLocaleString()}</span>
              </div>
            )}
            {match.scorerName && (
              <div className="flex items-center gap-2 text-sm">
                <UserCircle className="h-4 w-4" />
                <span className="font-semibold">Scorer:</span>
                <span>{match.scorerName}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Audit Log Table */}
        <div className="border rounded-md max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {match.auditLogs && match.auditLogs.length > 0 ? (
                match.auditLogs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.user_id}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatDetails(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No audit logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchAuditViewer;
