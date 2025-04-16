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
    <nav aria-label="Tournament Creation Progress" className="py-6">
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
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
                    'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
                    isCompleted ? 'bg-primary text-primary-foreground shadow-md' : '',
                    isCurrent ? 'border-2 border-primary bg-background shadow-sm' : '',
                    isUpcoming ? 'border-2 border-muted bg-background' : ''
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-label="Completed" />
                  ) : (
                    <Circle className={cn(
                      'h-5 w-5',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )} aria-hidden="true" />
                  )}
                </span>
                <span
                  className={cn(
                    'ml-4 text-sm font-medium transition-colors duration-200',
                    isCompleted ? 'text-foreground' : '',
                    isCurrent ? 'text-primary font-semibold' : '',
                    isUpcoming ? 'text-muted-foreground' : ''
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute right-0 top-5 h-0.5 w-full transition-colors duration-200',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}; 