'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from './button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from './card';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Enhanced Error Boundary component for React 19
 * Provides better error handling with recovery mechanisms
 */
export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    private resetTimeoutId: number | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error to console and external services
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });

        // Call the onError callback if provided
        this.props.onError?.(error, errorInfo);

        // Log to error reporting service
        this.logErrorToService(error, errorInfo);
    }

    componentDidUpdate(prevProps: ErrorBoundaryProps): void {
        const { resetKeys } = this.props;
        const { hasError } = this.state;

        // Reset error state if resetKeys change
        if (hasError && resetKeys && resetKeys !== prevProps.resetKeys) {
            const hasResetKeyChanged = resetKeys.some(
                (key, index) => prevProps.resetKeys?.[index] !== key,
            );

            if (hasResetKeyChanged) {
                this.resetErrorBoundary();
            }
        }
    }

    componentWillUnmount(): void {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }

    logErrorToService = (_error: Error, _errorInfo: ErrorInfo): void => {
        // In production, you would send this to your error tracking service
        // e.g., Sentry, LogRocket, Bugsnag, etc.
        if (process.env.NODE_ENV === 'production') {
            // Example: Sentry.captureException(error, { extra: errorInfo });
        }
    };

    resetErrorBoundary = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleRetry = (): void => {
        // Add a small delay to prevent immediate re-errors
        this.resetTimeoutId = window.setTimeout(() => {
            this.resetErrorBoundary();
        }, 100);
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            // Custom fallback UI
            if (fallback) {
                return fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-[200px] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-red-900 dark:text-red-100">
                                Something went wrong
                            </CardTitle>
                            <CardDescription>
                                An unexpected error occurred while rendering
                                this component.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {process.env.NODE_ENV === 'development' &&
                                error && (
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Error details:
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                            {error.message}
                                        </p>
                                    </div>
                                )}
                            <div className="flex flex-col space-y-2">
                                <Button
                                    onClick={this.handleRetry}
                                    className="w-full"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                    className="w-full"
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return children;
    }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

/**
 * Hook to reset error boundary programmatically
 */
export function useErrorBoundary() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetBoundary = React.useCallback(() => {
        setError(null);
    }, []);

    const captureError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return {
        resetBoundary,
        captureError,
    };
}
