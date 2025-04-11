
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface WaiverFormProps {
  tournamentName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const WaiverForm: React.FC<WaiverFormProps> = ({
  tournamentName,
  onAccept,
  onDecline
}) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Liability Waiver for {tournamentName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700 max-h-60 overflow-y-auto p-4 border rounded-md bg-gray-50">
          <p className="mb-2">By participating in the tournament, I acknowledge the risks associated with playing badminton and related activities.</p>
          <p className="mb-2">I, the undersigned participant, hereby release {tournamentName}, its staff, and all related parties from any claims, liability, or causes of action arising from my participation.</p>
          <p className="mb-2">I certify that I am in good health and physically able to participate in the tournament. I agree to follow all rules and regulations established by the tournament organizers.</p>
          <p className="mb-2">I understand that photographs and videos may be taken during the event, and I grant permission for my likeness to be used for promotional or informational purposes.</p>
          <p>This waiver shall remain in effect for the duration of the tournament.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="acceptWaiver" checked={accepted} onCheckedChange={(checked) => setAccepted(checked === true)} />
          <label htmlFor="acceptWaiver" className="text-sm font-medium">
            I have read and agree to the liability waiver
          </label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onDecline}>
          Decline
        </Button>
        <Button disabled={!accepted} onClick={onAccept}>
          Accept and Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WaiverForm;
