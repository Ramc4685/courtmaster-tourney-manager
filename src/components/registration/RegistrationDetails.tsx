import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PlayerRegistrationWithStatus, TeamRegistrationWithStatus, TournamentRegistrationStatus } from '@/types/registration';
import { formatDate } from '@/utils/date';

interface RegistrationDetailsProps {
  registration: PlayerRegistrationWithStatus | TeamRegistrationWithStatus;
  onSaveNotes: (notes: string) => void;
  onUpdatePriority: (priority: number) => void;
  onAddComment: (comment: string) => void;
}

function isTeamRegistration(registration: PlayerRegistrationWithStatus | TeamRegistrationWithStatus): registration is TeamRegistrationWithStatus {
  return 'teamName' in registration;
}

export const RegistrationDetails: React.FC<RegistrationDetailsProps> = ({
  registration,
  onSaveNotes,
  onUpdatePriority,
  onAddComment,
}) => {
  const [notes, setNotes] = useState(registration.metadata.notes || '');
  const [priority, setPriority] = useState(registration.metadata.priority || 0);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setNotes(registration.metadata.notes || '');
    setPriority(registration.metadata.priority || 0);
  }, [registration]);

  const handleSaveNotes = () => {
    onSaveNotes(notes);
  };

  const handleUpdatePriority = () => {
    onUpdatePriority(priority);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const getStatusColor = (status: TournamentRegistrationStatus) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'WAITLIST': return 'bg-blue-500';
      case 'CHECKED_IN': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            {isTeamRegistration(registration) ? registration.teamName : `${registration.firstName} ${registration.lastName}`}
            <Badge className={`ml-2 ${getStatusColor(registration.status)}`}>
              {registration.status}
            </Badge>
          </div>
          <span className="text-sm text-gray-500">
            {formatDate(registration.createdAt)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
              rows={4}
            />
            <Button onClick={handleSaveNotes} className="mt-2">Save Notes</Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-24"
                min={0}
              />
              <Button onClick={handleUpdatePriority}>Update Priority</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Comments</label>
            <div className="space-y-2">
              {registration.metadata.comments?.map((comment) => (
                <div key={comment.id} className="bg-gray-100 p-2 rounded">
                  <div className="text-sm">{comment.text}</div>
                  <div className="text-xs text-gray-500">
                    {comment.createdBy} - {formatDate(new Date(comment.createdAt))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                  placeholder="Add a comment..."
                />
                <Button onClick={handleAddComment}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationDetails; 