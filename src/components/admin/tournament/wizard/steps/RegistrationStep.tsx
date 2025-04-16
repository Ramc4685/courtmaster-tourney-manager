import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardFormValues } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RegistrationTab from '../../RegistrationTab';

export const RegistrationStep = () => {
  const form = useFormContext<WizardFormValues>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrationTab form={form} />
        </CardContent>
      </Card>
    </div>
  );
}; 