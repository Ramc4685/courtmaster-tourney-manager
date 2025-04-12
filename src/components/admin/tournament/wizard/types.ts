import { TournamentFormValues } from '../types';

export type WizardFormValues = TournamentFormValues;

export type WizardContextType = {
  currentStep: number;
  totalSteps: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isStepComplete: boolean;
  setStepComplete: (complete: boolean) => void;
}; 