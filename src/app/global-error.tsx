'use client';

import React, { ErrorInfo } from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error to an error reporting service
        console.error('Error caught in GlobalErrorBoundary:', error, errorInfo);
        // You can also send the error to an external service here
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="error-boundary">
                    <h1>Something went wrong.</h1>
                    <p>
                        {this.state.error?.message ||
                            'An unexpected error occurred.'}
                    </p>
                    <button onClick={this.handleRetry}>Try Again</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
