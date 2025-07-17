import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { clearAllAuthCookies } from '@/lib/utils/cookieUtils';

export const useSignOut = () => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const signOut = async () => {
        try {
            setIsLoading(true);

            // Clear all React Query cache
            queryClient.clear();

            // Call the sign out endpoint
            const response = await fetch('/auth/signout', {
                method: 'POST',
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to sign out');
            }

            // Clear client-side cookies
            clearAllAuthCookies();

            // Redirect to login
            router.push('/login');
        } catch (error) {
            console.error('Error during sign out:', error);
            // Still clear cookies on error
            clearAllAuthCookies();
            // Force reload to login page
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        signOut,
        isLoading,
    };
};
