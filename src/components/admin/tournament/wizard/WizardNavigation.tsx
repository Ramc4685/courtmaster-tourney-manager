import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardContext } from './WizardContext';

interface Step {
  id: string;
  title: string;
}

interface WizardNavigationProps {
  steps: Step[];
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({ steps }) => {
  const { currentStep } = useWizardContext();

  return (
    <nav aria-label="Progress" className="py-4">
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              'relative flex items-center',
              index !== steps.length - 1 ? 'w-full' : '',
              index === steps.length - 1 ? 'flex-1' : ''
            )}
          >
            <div className="flex items-center flex-1">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-2 border-primary'
                    : 'border-2 border-muted'
                )}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </span>
              <span
                className={cn(
                  'ml-3 text-sm font-medium',
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            {index !== steps.length - 1 && (
              <div
                className={cn(
                  'absolute right-0 top-4 h-0.5 w-full',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}; 