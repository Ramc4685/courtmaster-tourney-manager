
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink, Copy, Check, Tv2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface LiveVideoLinkProps {
  tournamentId?: string;
  compact?: boolean;
}

const LiveVideoLink: React.FC<LiveVideoLinkProps> = ({ 
  tournamentId,
  compact = false 
}) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Generate the streaming URLs
  const streamingUrl = tournamentId 
    ? `https://scoreboard.example.com/tournament/${tournamentId}` 
    : "https://scoreboard.example.com/livestream";
    
  const obsUrl = tournamentId
    ? `https://obs.example.com/tournament/${tournamentId}?source=browser`
    : "https://obs.example.com/livestream?source=browser";
  
  // Generate iframe embed code
  const embedCode = `<iframe src="${streamingUrl}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyLink = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: `${type} link copied`,
      description: "The link has been copied to your clipboard."
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-1"
      >
        <Video className="h-4 w-4" />
        <span className="sr-only md:not-sr-only">Stream Controls</span>
      </Button>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-accent/20 rounded-lg">
        <Tv2 className="h-5 w-5 text-red-500" />
        <span className="font-medium">Stream match scores!</span>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setDialogOpen(true)}
          className="ml-auto flex items-center gap-1"
        >
          <ExternalLink className="h-4 w-4" />
          Streaming Options
        </Button>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Streaming & Scoreboard Options</DialogTitle>
            <DialogDescription>
              Use these links to integrate live scores with streaming platforms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="font-medium text-sm">Scoreboard URL (for OBS Browser Source)</label>
              <div className="flex gap-2">
                <Input 
                  value={obsUrl} 
                  readOnly 
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyLink(obsUrl, "OBS")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add this URL as a Browser Source in OBS or other streaming software.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium text-sm">Public Scoreboard URL</label>
              <div className="flex gap-2">
                <Input 
                  value={streamingUrl} 
                  readOnly 
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyLink(streamingUrl, "Scoreboard")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with viewers to access the live scoreboard.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="font-medium text-sm">Embed Code</label>
              <div className="flex gap-2">
                <Input 
                  value={embedCode} 
                  readOnly 
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyLink(embedCode, "Embed")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Embed the scoreboard in websites or stream overlays.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LiveVideoLink;
