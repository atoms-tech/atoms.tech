'use client';

import type { ReactNode } from 'react';
import { Component, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error | unknown) {
        // Update state so the next render will show the fallback UI
        const errorObj = error instanceof Error 
            ? error 
            : new Error(error ? String(error) : 'Unknown error');
        return { hasError: true, error: errorObj, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error to an error reporting service
        console.error('Error caught in GlobalErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });
        // You can also send the error to an external service here
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-screen p-4">
                    <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4">
                        <h1 className="text-2xl font-bold text-destructive">Something went wrong.</h1>
                        <p className="text-muted-foreground">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        {this.state.errorInfo && (
                            <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer">Error details</summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                        <button 
                            onClick={this.handleRetry}
                            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
