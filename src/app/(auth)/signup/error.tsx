'use client';

import { ErrorCard } from '@/components/ui/error-card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignupError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log error to your error reporting service
        console.error(error);
    }, [error]);

    return (
        <ErrorCard
            title="Signup Error"
            message={error.message}
            retryButton={{
                onClick: () => reset(),
                text: 'Try Again',
            }}
            redirectButton={{
                onClick: () => router.push('/login'),
                text: 'Login Instead',
            }}
        />
    );
}
