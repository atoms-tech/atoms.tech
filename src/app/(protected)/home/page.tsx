'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the user dashboard
        router.replace('/home/user');
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );
}
