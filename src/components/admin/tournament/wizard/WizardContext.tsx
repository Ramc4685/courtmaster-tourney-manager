import React, { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { WizardFormValues } from './types';

interface WizardContextValue {
  currentStep: number;
  steps: { id: string; title: string; }[];
  form: UseFormReturn<WizardFormValues>;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<{
  children: React.ReactNode;
  value: WizardContextValue;
}> = ({ children, value }) => {
  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizardContext = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizardContext must be used within a WizardProvider');
  }
  return context;
}; 