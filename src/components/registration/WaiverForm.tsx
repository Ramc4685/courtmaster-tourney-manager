
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WaiverFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const WaiverForm: React.FC<WaiverFormProps> = ({ open, onOpenChange, onAccept }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedLiability, setAcceptedLiability] = useState(false);
  const [acceptedMediaUse, setAcceptedMediaUse] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (acceptedTerms && acceptedLiability && acceptedMediaUse) {
      onAccept();
      onOpenChange(false);
    }
  };

  const allAccepted = acceptedTerms && acceptedLiability && acceptedMediaUse;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tournament Waiver and Release</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[300px] overflow-y-auto border p-4 rounded-md">
            <h3 className="font-semibold mb-2">Terms and Conditions</h3>
            <p className="text-sm text-gray-600">
              By participating in this tournament, I acknowledge that I have read and understood the tournament rules.
              I agree to comply with all rules, regulations, and code of conduct established by the tournament organizers.
            </p>
            
            <h3 className="font-semibold mb-2 mt-4">Waiver of Liability</h3>
            <p className="text-sm text-gray-600">
              I understand that participation involves physical activity and risks of injury. I waive all claims against
              the organizers, venues, and sponsors for any injuries, losses, or damages sustained in connection with my participation.
            </p>
            
            <h3 className="font-semibold mb-2 mt-4">Media Release</h3>
            <p className="text-sm text-gray-600">
              I grant permission to the tournament organizers to use my name, image, voice, and performance in photographs,
              videos, and recordings for promotional, broadcasting, and archival purposes without compensation.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms} 
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} 
              />
              <Label htmlFor="terms" className="text-sm">
                I have read and accept the tournament terms and conditions
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="liability" 
                checked={acceptedLiability} 
                onCheckedChange={(checked) => setAcceptedLiability(checked as boolean)} 
              />
              <Label htmlFor="liability" className="text-sm">
                I accept the waiver of liability
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="media" 
                checked={acceptedMediaUse} 
                onCheckedChange={(checked) => setAcceptedMediaUse(checked as boolean)} 
              />
              <Label htmlFor="media" className="text-sm">
                I accept the media release terms
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!allAccepted}
            >
              Accept & Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WaiverForm;
