'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Signup is invite-only. Redirect to signup-request page.
 */
export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/signup-request');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12">
            <div className="text-center text-white">
                <p>Redirecting to request access...</p>
            </div>
        </div>
    );
}
