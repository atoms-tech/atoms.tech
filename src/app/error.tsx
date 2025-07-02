'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ErrorCard } from '@/components/ui/error-card';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log error to your error reporting service
        console.error('Application error:', error);
    }, [error]);

    // Handle specific error types
    const getErrorMessage = () => {
        if (error.message.includes('FUNCTION_INVOCATION_TIMEOUT')) {
            return 'The request took too long to process. Please try again or contact support if the issue persists.';
        }
        if (
            error.message.includes('504') ||
            error.message.includes('Gateway Timeout')
        ) {
            return 'The server is temporarily unavailable. Please try again in a few moments.';
        }
        if (error.message.includes('Network')) {
            return 'Network connection issue. Please check your internet connection and try again.';
        }
        return (
            error.message || 'An unexpected error occurred. Please try again.'
        );
    };

    const getErrorTitle = () => {
        if (
            error.message.includes('FUNCTION_INVOCATION_TIMEOUT') ||
            error.message.includes('504')
        ) {
            return 'Request Timeout';
        }
        if (error.message.includes('Network')) {
            return 'Connection Error';
        }
        return 'Application Error';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <ErrorCard
                title={getErrorTitle()}
                message={getErrorMessage()}
                retryButton={{
                    onClick: () => reset(),
                    text: 'Try Again',
                }}
                redirectButton={{
                    onClick: () => router.push('/'),
                    text: 'Go Home',
                }}
            />

            {/* Additional debugging info in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-2xl">
                    <h3 className="font-semibold mb-2">Debug Information:</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Error:</strong> {error.message}
                    </p>
                    {error.digest && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Digest:</strong> {error.digest}
                        </p>
                    )}
                    <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                            Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-auto">
                            {error.stack}
                        </pre>
                    </details>
                </div>
            )}
        </div>
    );
}
