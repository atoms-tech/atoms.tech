'use client';

/**
 * InstallationProgressModal Component
 * 
 * Shows installation progress with step-by-step indicators
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type InstallationStep = 
  | 'oauth' 
  | 'download' 
  | 'install' 
  | 'configure' 
  | 'connect' 
  | 'validate' 
  | 'test';

export interface InstallationStepStatus {
  step: InstallationStep;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

interface InstallationProgressModalProps {
  open: boolean;
  serverName: string;
  transportType: 'stdio' | 'http' | 'sse';
  requiresAuth: boolean;
  authType?: string;
  steps: InstallationStepStatus[];
  currentStep: number;
  error?: string;
  onClose: () => void;
}

export function InstallationProgressModal({
  open,
  serverName,
  transportType: _transportType,
  requiresAuth: _requiresAuth,
  authType: _authType,
  steps,
  currentStep: _currentStep,
  error,
  onClose,
}: InstallationProgressModalProps) {
  const progressPercentage = steps.length > 0 
    ? (steps.filter(s => s.status === 'success').length / steps.length) * 100 
    : 0;

  const allComplete = steps.every(s => s.status === 'success');
  const hasError = steps.some(s => s.status === 'error') || !!error;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !allComplete && !hasError && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasError ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : allComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            Installing {serverName}
          </DialogTitle>
          <DialogDescription>
            {hasError 
              ? 'Installation failed' 
              : allComplete 
                ? 'Installation completed successfully' 
                : 'Please wait while we install and configure the server'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {steps.filter(s => s.status === 'success').length} / {steps.length} steps
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.step}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  step.status === 'error'
                    ? 'border-destructive bg-destructive/5'
                    : step.status === 'success'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : step.status === 'loading'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : step.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : step.status === 'loading' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${
                      step.status === 'error' ? 'text-destructive' : ''
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'loading' && (
                      <span className="text-xs text-muted-foreground">In progress...</span>
                    )}
                  </div>
                  {step.message && (
                    <p className={`text-xs mt-1 ${
                      step.status === 'error' 
                        ? 'text-destructive' 
                        : 'text-muted-foreground'
                    }`}>
                      {step.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {allComplete && !hasError && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Server installed successfully! You can now use it in your conversations.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {(allComplete || hasError) && (
            <Button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium"
            >
              {hasError ? 'Close' : 'Done'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
