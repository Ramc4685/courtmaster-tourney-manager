
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LiveVideoLinkProps {
  tournamentId?: string;
  compact?: boolean;
}

const LiveVideoLink: React.FC<LiveVideoLinkProps> = ({ 
  tournamentId,
  compact = false 
}) => {
  const { toast } = useToast();
  const liveStreamUrl = tournamentId 
    ? `https://live.example.com/tournament/${tournamentId}` 
    : "https://live.example.com";

  const handleOpenStream = () => {
    // In a real implementation, this would open the live stream
    // For now, just display a toast and copy the link
    navigator.clipboard.writeText(liveStreamUrl);
    toast({
      title: "Live stream link copied",
      description: "The link has been copied to your clipboard."
    });
    
    // Open in a new tab
    window.open(liveStreamUrl, '_blank');
  };

  if (compact) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleOpenStream}
        className="flex items-center gap-1"
      >
        <Video className="h-4 w-4" />
        <span className="sr-only md:not-sr-only">Watch Live</span>
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-accent/20 rounded-lg">
      <Video className="h-5 w-5 text-red-500" />
      <span className="font-medium">Watch matches live!</span>
      <Button 
        variant="default" 
        size="sm" 
        onClick={handleOpenStream}
        className="ml-auto flex items-center gap-1"
      >
        <ExternalLink className="h-4 w-4" />
        Open Live Stream
      </Button>
    </div>
  );
};

export default LiveVideoLink;
