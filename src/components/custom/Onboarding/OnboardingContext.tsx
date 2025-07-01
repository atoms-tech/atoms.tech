'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  canSkip: boolean;
  userData: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    goals?: string[];
    organizationName?: string;
    projectName?: string;
    projectDescription?: string;
  };
  progress: {
    [key: number]: boolean;
  };
}

type OnboardingAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'UPDATE_USER_DATA'; data: Partial<OnboardingState['userData']> }
  | { type: 'COMPLETE_STEP'; step: number }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' };

const initialState: OnboardingState = {
  currentStep: 1,
  totalSteps: 6,
  isComplete: false,
  canSkip: true,
  userData: {},
  progress: {},
};

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
        progress: {
          ...state.progress,
          [state.currentStep]: true,
        },
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: Math.max(1, Math.min(action.step, state.totalSteps)),
      };

    case 'UPDATE_USER_DATA':
      return {
        ...state,
        userData: {
          ...state.userData,
          ...action.data,
        },
      };

    case 'COMPLETE_STEP':
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.step]: true,
        },
      };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        isComplete: true,
        progress: {
          ...state.progress,
          [state.currentStep]: true,
        },
      };

    case 'RESET_ONBOARDING':
      return initialState;

    default:
      return state;
  }
}

interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  updateUserData: (data: Partial<OnboardingState['userData']>) => void;
  completeStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  const contextValue: OnboardingContextType = {
    state,
    dispatch,
    nextStep: () => dispatch({ type: 'NEXT_STEP' }),
    previousStep: () => dispatch({ type: 'PREVIOUS_STEP' }),
    goToStep: (step: number) => dispatch({ type: 'GO_TO_STEP', step }),
    updateUserData: (data) => dispatch({ type: 'UPDATE_USER_DATA', data }),
    completeStep: (step: number) => dispatch({ type: 'COMPLETE_STEP', step }),
    completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
    resetOnboarding: () => dispatch({ type: 'RESET_ONBOARDING' }),
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
