import React, { useState } from 'react';
import { pilotConfig, usePilotConfig, PilotConfiguration } from '@/lib/pilot/PilotConfig';
import HealthCheck from '@/components/health/HealthCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  { id: 'welcome', name: 'Welcome & Validation' },
  { id: 'venue', name: 'Venue Setup' },
  { id: 'admin', name: 'Admin Account' },
  { id: 'data', name: 'Data & Sync' },
  { id: 'finalize', name: 'Finalize' },
];

interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
  onFinish?: () => void;
}

const WelcomeStep = ({ onNext }: StepProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Welcome to CourtMaster Pilot Setup</CardTitle>
      <CardDescription>Let's validate your system before configuring the pilot.</CardDescription>
    </CardHeader>
    <CardContent>
      <HealthCheck />
      <Button onClick={() => onNext?.()} className="mt-4">Continue to Venue Setup <ArrowRight className="ml-2 h-4 w-4" /></Button>
    </CardContent>
  </Card>
);

const VenueStep = ({ onNext, onBack }: StepProps) => {
  const config = usePilotConfig();
  const handleUpdate = (field: keyof PilotConfiguration['venue'], value: any) => {
    pilotConfig.updateConfig({ venue: { ...config.venue, [field]: value } });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Venue Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="venue-name">Venue Name</Label>
          <Input id="venue-name" value={config.venue?.name} onChange={(e) => handleUpdate('name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue-courts">Number of Courts</Label>
          <Input id="venue-courts" type="number" value={config.venue?.courts} onChange={(e) => handleUpdate('courts', parseInt(e.target.value, 10))} />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onBack?.()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button onClick={() => onNext?.()}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminStep = ({ onNext, onBack }: StepProps) => {
  // Placeholder for admin creation logic
  return (
    <Card>
      <CardHeader><CardTitle>Create Admin Account</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email">Admin Email</Label>
          <Input id="admin-email" type="email" placeholder="admin@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input id="admin-password" type="password" />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onBack?.()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button onClick={() => onNext?.()}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DataStep = ({ onNext, onBack }: StepProps) => {
  // Placeholder for data import/export and backup config
  return (
    <Card>
      <CardHeader><CardTitle>Data & Sync Configuration</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p>Configure data import, export, and backup settings.</p>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onBack?.()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          <Button onClick={() => onNext?.()}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FinalizeStep = ({ onFinish }: StepProps) => (
  <Card>
    <CardHeader><CardTitle>Finalize Setup</CardTitle></CardHeader>
    <CardContent>
      <p>You are all set! Click finish to save your configuration and start using CourtMaster.</p>
      <Button onClick={() => onFinish?.()} className="mt-4">Finish Setup</Button>
    </CardContent>
  </Card>
);

export function PilotSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSetupComplete, setIsSetupComplete] = useState(localStorage.getItem('pilotSetupComplete') === 'true');

  const handleFinish = () => {
    localStorage.setItem('pilotSetupComplete', 'true');
    setIsSetupComplete(true);
  };

  if (isSetupComplete) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Pilot Setup Complete!</h2>
        <p>You can now proceed to your dashboard.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  const CurrentStepComponent = [
    WelcomeStep,
    VenueStep,
    AdminStep,
    DataStep,
    FinalizeStep
  ][currentStep];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-center">CourtMaster Pilot Setup</h1>
        <p className="text-center text-muted-foreground">Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}</p>
      </div>
      <CurrentStepComponent 
        onNext={() => setCurrentStep(s => s + 1)} 
        onBack={() => setCurrentStep(s => s - 1)}
        onFinish={handleFinish}
      />
    </div>
  );
}