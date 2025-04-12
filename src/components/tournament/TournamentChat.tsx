import React, { useState, useEffect, useRef, useCallback } from 'react';
import { messageService } from '@/services/api';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

// Assuming TournamentMessage type is defined in api.ts or types/entities
interface TournamentMessage {
  id: string;
  tournament_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // TODO: Add sender profile data if fetched by service
  sender?: { display_name: string | null, avatar_url: string | null }; 
}

interface TournamentChatProps {
  tournamentId: string;
}

export const TournamentChat: React.FC<TournamentChatProps> = ({ tournamentId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TournamentMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Simple scroll to bottom for new messages
    setTimeout(() => { // Timeout ensures DOM has updated
      const scrollElement = scrollAreaRef.current?.children[1] as HTMLElement; // Access viewport div
      if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }, 50);
  };

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!tournamentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedMessages = await messageService.listMessages(tournamentId);
      setMessages(fetchedMessages);
      scrollToBottom();
    } catch (err) {
      setError('Failed to load messages.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!tournamentId) return;

    const channelName = `tournament_chat_${tournamentId}`;
    const channel = supabase.channel(channelName);

    const handleNewMessage = (payload: any) => {
      console.log('New message received:', payload);
      const newMessageData = payload.new as TournamentMessage;
      // Add sender info if it was included in the payload (requires adjusting DB function/select)
      // newMessageData.sender = payload.new.sender; 
      setMessages((currentMessages) => [...currentMessages, newMessageData]);
      scrollToBottom();
    };

    channel
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'tournament_messages', filter: `tournament_id=eq.${tournamentId}` }, 
          handleNewMessage
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channelName}`);
        } else {
          console.error(`Subscription error on ${channelName}:`, status, err);
          setError('Chat connection error.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from ${channelName}`);
    };
  }, [tournamentId]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user || !tournamentId) return;

    const contentToSend = newMessage.trim();
    setNewMessage(''); // Clear input optimistically

    try {
      // The realtime subscription will add the message to the list
      await messageService.sendMessage(tournamentId, user.id, contentToSend);
      // scrollToBottom(); // Scroll handled by subscription now
    } catch (err) {
      setError('Failed to send message.');
      setNewMessage(contentToSend); // Restore input on error
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {isLoading && <p className="text-center text-muted-foreground">Loading messages...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!isLoading && messages.length === 0 && <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>}
        {messages.map((msg) => {
          const isSender = msg.sender_id === user?.id;
          // TODO: Fetch/use actual sender display name and avatar
          const senderName = isSender ? 'You' : (msg.sender?.display_name || `User ${msg.sender_id.substring(0, 6)}`);
          const avatarUrl = isSender ? user?.avatar_url : msg.sender?.avatar_url;
          return (
            <div key={msg.id} className={`flex gap-3 my-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {!isSender && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{senderName.substring(0, 1)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`p-3 rounded-lg max-w-[75%] ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {!isSender && <p className="text-xs font-semibold mb-1">{senderName}</p>}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1 text-right">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
              </div>
              {isSender && (
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={!user}
          />
          <Button type="submit" disabled={!newMessage.trim() || !user}>
             <Send className="h-4 w-4"/>
          </Button>
        </form>
      </div>
    </div>
  );
}; 