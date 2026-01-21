import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Onboarding step interface
interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the target element
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'input' | 'wait';
    element?: string;
    value?: string;
    duration?: number;
  };
  skippable?: boolean;
  required?: boolean;
}

// Onboarding flow interface
interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  role?: string; // User role this flow is for
  steps: OnboardingStep[];
  prerequisites?: string[];
  estimatedTime?: number; // in minutes
}

// User progress interface
interface UserProgress {
  completedFlows: string[];
  completedSteps: string[];
  currentFlow?: string;
  currentStep?: number;
  skippedSteps: string[];
  lastActive: string;
}

// Onboarding context interface
interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentFlow: OnboardingFlow | null;
  currentStep: OnboardingStep | null;
  currentStepIndex: number;
  progress: UserProgress;
  availableFlows: OnboardingFlow[];
  startOnboarding: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  skipFlow: () => void;
  completeStep: () => void;
  completeFlow: () => void;
  resetProgress: () => void;
  updateProgress: (updates: Partial<UserProgress>) => void;
  isStepCompleted: (stepId: string) => boolean;
  isFlowCompleted: (flowId: string) => boolean;
  shouldShowOnboarding: () => boolean;
}

// Default onboarding flows
const defaultOnboardingFlows: OnboardingFlow[] = [
  {
    id: 'tournament-organizer-basics',
    name: 'Tournament Organizer Basics',
    description: 'Learn the fundamentals of organizing tournaments',
    role: 'ORGANIZER',
    estimatedTime: 10,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to CourtMaster!',
        content: 'Welcome to CourtMaster! This quick tour will help you get started with organizing your first tournament.',
        placement: 'center',
        skippable: false,
        required: true,
      },
      {
        id: 'create-tournament',
        title: 'Create Your First Tournament',
        content: 'Click here to create a new tournament. You can set up the format, rules, and participant limits.',
        target: '[data-onboarding="create-tournament"]',
        placement: 'bottom',
        action: {
          type: 'click',
          element: '[data-onboarding="create-tournament"]',
        },
      },
      {
        id: 'tournament-settings',
        title: 'Tournament Settings',
        content: 'Configure your tournament settings including format, scoring system, and schedule.',
        target: '[data-onboarding="tournament-settings"]',
        placement: 'right',
      },
      {
        id: 'invite-participants',
        title: 'Invite Participants',
        content: 'Add teams or individual players to your tournament using the participant management tools.',
        target: '[data-onboarding="invite-participants"]',
        placement: 'left',
      },
      {
        id: 'manage-matches',
        title: 'Manage Matches',
        content: 'View and manage tournament matches, update scores, and track progress.',
        target: '[data-onboarding="manage-matches"]',
        placement: 'top',
      },
    ],
  },
  {
    id: 'staff-member-basics',
    name: 'Staff Member Basics',
    description: 'Learn how to assist with tournament operations',
    role: 'STAFF',
    estimatedTime: 5,
    steps: [
      {
        id: 'staff-welcome',
        title: 'Welcome Staff Member!',
        content: 'As a staff member, you can help manage matches, update scores, and assist participants.',
        placement: 'center',
        skippable: false,
      },
      {
        id: 'score-entry',
        title: 'Score Entry',
        content: 'Learn how to enter match scores quickly and accurately.',
        target: '[data-onboarding="score-entry"]',
        placement: 'bottom',
      },
      {
        id: 'participant-support',
        title: 'Participant Support',
        content: 'Help participants with check-in, questions, and technical issues.',
        target: '[data-onboarding="participant-support"]',
        placement: 'right',
      },
    ],
  },
  {
    id: 'player-basics',
    name: 'Player Basics',
    description: 'Learn how to participate in tournaments',
    role: 'PLAYER',
    estimatedTime: 3,
    steps: [
      {
        id: 'player-welcome',
        title: 'Welcome Player!',
        content: 'Learn how to join tournaments, view your matches, and track your progress.',
        placement: 'center',
        skippable: false,
      },
      {
        id: 'join-tournament',
        title: 'Join a Tournament',
        content: 'Browse available tournaments and register to participate.',
        target: '[data-onboarding="join-tournament"]',
        placement: 'bottom',
      },
      {
        id: 'view-schedule',
        title: 'View Your Schedule',
        content: 'Check your upcoming matches and tournament schedule.',
        target: '[data-onboarding="view-schedule"]',
        placement: 'top',
      },
    ],
  },
];

// Default user progress
const defaultProgress: UserProgress = {
  completedFlows: [],
  completedSteps: [],
  skippedSteps: [],
  lastActive: new Date().toISOString(),
};

// Create onboarding context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Onboarding provider props
interface OnboardingProviderProps {
  children: React.ReactNode;
  userRole?: string;
}

// Onboarding tooltip component
const OnboardingTooltip: React.FC<{
  step: OnboardingStep;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepIndex: number;
  totalSteps: number;
}> = ({ step, onNext, onPrevious, onSkip, onComplete, isFirst, isLast, stepIndex, totalSteps }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          const rect = targetElement.getBoundingClientRect();
          const tooltipWidth = 320;
          const tooltipHeight = 200;
          
          let top = rect.top;
          let left = rect.left;
          
          switch (step.placement) {
            case 'top':
              top = rect.top - tooltipHeight - 10;
              left = rect.left + (rect.width - tooltipWidth) / 2;
              break;
            case 'bottom':
              top = rect.bottom + 10;
              left = rect.left + (rect.width - tooltipWidth) / 2;
              break;
            case 'left':
              top = rect.top + (rect.height - tooltipHeight) / 2;
              left = rect.left - tooltipWidth - 10;
              break;
            case 'right':
              top = rect.top + (rect.height - tooltipHeight) / 2;
              left = rect.right + 10;
              break;
            case 'center':
            default:
              top = (window.innerHeight - tooltipHeight) / 2;
              left = (window.innerWidth - tooltipWidth) / 2;
              break;
          }
          
          // Ensure tooltip stays within viewport
          top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
          left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
          
          setPosition({ top, left });
          setVisible(true);
        }
      } else {
        // Center the tooltip if no target
        setPosition({
          top: (window.innerHeight - 200) / 2,
          left: (window.innerWidth - 320) / 2,
        });
        setVisible(true);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step.target, step.placement]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="onboarding-backdrop" />
      
      {/* Spotlight */}
      {step.target && (
        <div className="onboarding-spotlight" />
      )}
      
      {/* Tooltip */}
      <div
        className="onboarding-tooltip"
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-content"
      >
        <div className="onboarding-header">
          <h3 id="onboarding-title" className="onboarding-title">
            {step.title}
          </h3>
          <div className="onboarding-progress">
            {stepIndex + 1} of {totalSteps}
          </div>
        </div>
        
        <div id="onboarding-content" className="onboarding-content">
          {step.content}
        </div>
        
        <div className="onboarding-actions">
          {!isFirst && (
            <button
              className="onboarding-button onboarding-button--secondary"
              onClick={onPrevious}
            >
              Previous
            </button>
          )}
          
          {step.skippable !== false && (
            <button
              className="onboarding-button onboarding-button--ghost"
              onClick={onSkip}
            >
              Skip
            </button>
          )}
          
          {isLast ? (
            <button
              className="onboarding-button onboarding-button--primary"
              onClick={onComplete}
            >
              Complete
            </button>
          ) : (
            <button
              className="onboarding-button onboarding-button--primary"
              onClick={onNext}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// Onboarding provider component
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children, userRole }) => {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);
  const [availableFlows] = useState<OnboardingFlow[]>(defaultOnboardingFlows);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress({ ...defaultProgress, ...parsed });
      } catch (error) {
        console.warn('Failed to parse onboarding progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress: UserProgress) => {
    localStorage.setItem('onboarding-progress', JSON.stringify(newProgress));
    setProgress(newProgress);
  }, []);

  // Update progress
  const updateProgress = useCallback((updates: Partial<UserProgress>) => {
    const newProgress = { ...progress, ...updates, lastActive: new Date().toISOString() };
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Start onboarding flow
  const startOnboarding = useCallback((flowId: string) => {
    const flow = availableFlows.find(f => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
      setCurrentStepIndex(0);
      setIsOnboardingActive(true);
      updateProgress({ currentFlow: flowId, currentStep: 0 });
    }
  }, [availableFlows, updateProgress]);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (currentFlow && currentStepIndex < currentFlow.steps.length - 1) {
      const newStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(newStepIndex);
      updateProgress({ currentStep: newStepIndex });
    }
  }, [currentFlow, currentStepIndex, updateProgress]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const newStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(newStepIndex);
      updateProgress({ currentStep: newStepIndex });
    }
  }, [currentStepIndex, updateProgress]);

  // Skip current step
  const skipStep = useCallback(() => {
    if (currentFlow) {
      const currentStep = currentFlow.steps[currentStepIndex];
      const newSkippedSteps = [...progress.skippedSteps, currentStep.id];
      updateProgress({ skippedSteps: newSkippedSteps });
      
      if (currentStepIndex < currentFlow.steps.length - 1) {
        nextStep();
      } else {
        completeFlow();
      }
    }
  }, [currentFlow, currentStepIndex, progress.skippedSteps, updateProgress, nextStep]);

  // Skip entire flow
  const skipFlow = useCallback(() => {
    if (currentFlow) {
      const flowSteps = currentFlow.steps.map(step => step.id);
      const newSkippedSteps = [...progress.skippedSteps, ...flowSteps];
      updateProgress({ 
        skippedSteps: newSkippedSteps,
        currentFlow: undefined,
        currentStep: undefined,
      });
      setIsOnboardingActive(false);
      setCurrentFlow(null);
      setCurrentStepIndex(0);
    }
  }, [currentFlow, progress.skippedSteps, updateProgress]);

  // Complete current step
  const completeStep = useCallback(() => {
    if (currentFlow) {
      const currentStep = currentFlow.steps[currentStepIndex];
      const newCompletedSteps = [...progress.completedSteps, currentStep.id];
      updateProgress({ completedSteps: newCompletedSteps });
      
      if (currentStepIndex < currentFlow.steps.length - 1) {
        nextStep();
      } else {
        completeFlow();
      }
    }
  }, [currentFlow, currentStepIndex, progress.completedSteps, updateProgress, nextStep]);

  // Complete current flow
  const completeFlow = useCallback(() => {
    if (currentFlow) {
      const newCompletedFlows = [...progress.completedFlows, currentFlow.id];
      const allStepsCompleted = currentFlow.steps
        .filter(step => !progress.skippedSteps.includes(step.id))
        .map(step => step.id);
      const newCompletedSteps = [...new Set([...progress.completedSteps, ...allStepsCompleted])];
      
      updateProgress({
        completedFlows: newCompletedFlows,
        completedSteps: newCompletedSteps,
        currentFlow: undefined,
        currentStep: undefined,
      });
      
      setIsOnboardingActive(false);
      setCurrentFlow(null);
      setCurrentStepIndex(0);
    }
  }, [currentFlow, progress.completedSteps, progress.skippedSteps, updateProgress]);

  // Reset progress
  const resetProgress = useCallback(() => {
    saveProgress(defaultProgress);
    setIsOnboardingActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
  }, [saveProgress]);

  // Check if step is completed
  const isStepCompleted = useCallback((stepId: string) => {
    return progress.completedSteps.includes(stepId);
  }, [progress.completedSteps]);

  // Check if flow is completed
  const isFlowCompleted = useCallback((flowId: string) => {
    return progress.completedFlows.includes(flowId);
  }, [progress.completedFlows]);

  // Check if onboarding should be shown
  const shouldShowOnboarding = useCallback(() => {
    if (!userRole) return false;
    
    const roleFlows = availableFlows.filter(flow => 
      !flow.role || flow.role === userRole
    );
    
    const hasIncompleteFlows = roleFlows.some(flow => 
      !isFlowCompleted(flow.id)
    );
    
    return hasIncompleteFlows;
  }, [userRole, availableFlows, isFlowCompleted]);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (userRole && shouldShowOnboarding() && progress.completedFlows.length === 0) {
      const roleFlow = availableFlows.find(flow => 
        flow.role === userRole || !flow.role
      );
      
      if (roleFlow && !isOnboardingActive) {
        // Delay to allow UI to render
        setTimeout(() => {
          startOnboarding(roleFlow.id);
        }, 1000);
      }
    }
  }, [userRole, shouldShowOnboarding, progress.completedFlows.length, availableFlows, isOnboardingActive, startOnboarding]);

  // Current step
  const currentStep = currentFlow ? currentFlow.steps[currentStepIndex] : null;

  // Context value
  const contextValue: OnboardingContextType = {
    isOnboardingActive,
    currentFlow,
    currentStep,
    currentStepIndex,
    progress,
    availableFlows,
    startOnboarding,
    nextStep,
    previousStep,
    skipStep,
    skipFlow,
    completeStep,
    completeFlow,
    resetProgress,
    updateProgress,
    isStepCompleted,
    isFlowCompleted,
    shouldShowOnboarding,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* Onboarding tooltip */}
      {isOnboardingActive && currentStep && (
        <OnboardingTooltip
          step={currentStep}
          onNext={completeStep}
          onPrevious={previousStep}
          onSkip={skipStep}
          onComplete={completeFlow}
          isFirst={currentStepIndex === 0}
          isLast={currentFlow ? currentStepIndex === currentFlow.steps.length - 1 : false}
          stepIndex={currentStepIndex}
          totalSteps={currentFlow ? currentFlow.steps.length : 0}
        />
      )}
      
      {/* Onboarding styles */}
      <style>{`
        .onboarding-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          animation: fadeIn 0.3s ease;
        }
        
        .onboarding-spotlight {
          position: fixed;
          border: 2px solid var(--primary-color, #007bff);
          border-radius: 8px;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          animation: pulse 2s infinite;
        }
        
        .onboarding-tooltip {
          position: fixed;
          width: 320px;
          max-width: calc(100vw - 20px);
          background: var(--bg-primary, white);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          z-index: 10000;
          animation: slideIn 0.3s ease;
        }
        
        .onboarding-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 0;
        }
        
        .onboarding-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #333);
        }
        
        .onboarding-progress {
          font-size: 12px;
          color: var(--text-secondary, #666);
          background: var(--bg-secondary, #f8f9fa);
          padding: 4px 8px;
          border-radius: 12px;
        }
        
        .onboarding-content {
          padding: 16px 20px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-primary, #333);
        }
        
        .onboarding-actions {
          display: flex;
          gap: 8px;
          padding: 0 20px 20px;
          justify-content: flex-end;
        }
        
        .onboarding-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 36px;
        }
        
        .onboarding-button--primary {
          background: var(--primary-color, #007bff);
          color: white;
        }
        
        .onboarding-button--primary:hover {
          background: var(--primary-dark, #0056b3);
        }
        
        .onboarding-button--secondary {
          background: var(--bg-secondary, #f8f9fa);
          color: var(--text-primary, #333);
          border: 1px solid var(--border-color, #e0e0e0);
        }
        
        .onboarding-button--secondary:hover {
          background: var(--bg-tertiary, #e9ecef);
        }
        
        .onboarding-button--ghost {
          background: transparent;
          color: var(--text-secondary, #666);
        }
        
        .onboarding-button--ghost:hover {
          background: var(--bg-secondary, #f8f9fa);
        }
        
        .onboarding-button:focus {
          outline: 2px solid var(--focus-ring-color, #007bff);
          outline-offset: 2px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(0, 123, 255, 0), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .onboarding-tooltip {
            width: calc(100vw - 20px);
            left: 10px !important;
            right: 10px;
          }
          
          .onboarding-actions {
            flex-direction: column;
          }
          
          .onboarding-button {
            width: 100%;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .onboarding-backdrop,
          .onboarding-tooltip {
            animation: none;
          }
          
          .onboarding-spotlight {
            animation: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .onboarding-tooltip {
            border: 2px solid var(--text-primary, #000);
          }
          
          .onboarding-button {
            border: 2px solid var(--text-primary, #000);
          }
        }
      `}</style>
    </OnboardingContext.Provider>
  );
};

// Hook to use onboarding context
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// Onboarding flow selector component
export const OnboardingFlowSelector: React.FC = () => {
  const { availableFlows, startOnboarding, isFlowCompleted, shouldShowOnboarding } = useOnboarding();

  if (!shouldShowOnboarding()) {
    return null;
  }

  return (
    <div className="onboarding-flow-selector">
      <h3>Get Started with CourtMaster</h3>
      <p>Choose a tutorial to learn the basics:</p>
      
      <div className="flow-list">
        {availableFlows.map((flow) => (
          <div
            key={flow.id}
            className={`flow-item ${isFlowCompleted(flow.id) ? 'completed' : ''}`}
          >
            <div className="flow-info">
              <h4>{flow.name}</h4>
              <p>{flow.description}</p>
              {flow.estimatedTime && (
                <span className="flow-time">~{flow.estimatedTime} minutes</span>
              )}
            </div>
            
            <button
              className="flow-button"
              onClick={() => startOnboarding(flow.id)}
              disabled={isFlowCompleted(flow.id)}
            >
              {isFlowCompleted(flow.id) ? 'Completed ✓' : 'Start Tutorial'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
