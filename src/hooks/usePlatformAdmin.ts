import { useEffect, useState } from 'react';

interface PlatformAdminStatus {
    isPlatformAdmin: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to check if the current user is a platform admin
 * Works with WorkOS authentication
 */
export function usePlatformAdmin(): PlatformAdminStatus {
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debug: Log state changes
    useEffect(() => {
        console.log('[usePlatformAdmin] State changed:', {
            isPlatformAdmin,
            isLoading,
            error,
        });
    }, [isPlatformAdmin, isLoading, error]);

    useEffect(() => {
        let cancelled = false;

        const checkStatus = async () => {
            try {
                setIsLoading(true);
                setError(null);

                console.log('[usePlatformAdmin] Checking platform admin status...');

                // Use REST endpoint directly
                const response = await fetch('/api/platform/admin/check', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (cancelled) return;

                if (!response || !response.ok) {
                    console.error('[usePlatformAdmin] API check failed:', response?.status, response?.statusText);
                    
                    // If 404 or other error, assume not admin
                    if (!cancelled) {
                        setIsPlatformAdmin(false);
                        setIsLoading(false);
                        if (response?.status === 404) {
                            setError('Platform admin endpoint not found');
                        } else {
                            setError(`API error: ${response?.status} ${response?.statusText}`);
                        }
                    }
                    return;
                }

                const data = await response.json();
                console.log('[usePlatformAdmin] API response:', data);
                
                // Handle response format
                const adminStatus = data?.isPlatformAdmin ?? false;
                console.log('[usePlatformAdmin] Admin status:', adminStatus);
                
                if (!cancelled) {
                    setIsPlatformAdmin(adminStatus);
                    setIsLoading(false);
                    if (!adminStatus) {
                        setError(null); // Not an error, just not an admin
                    }
                }
            } catch (err) {
                if (cancelled) return;
                console.error('[usePlatformAdmin] Error checking platform admin status:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsPlatformAdmin(false);
                setIsLoading(false);
            }
        };

        void checkStatus();

        return () => {
            cancelled = true;
        };
    }, []); // Check whenever component mounts

    // Always return a valid object
    return {
        isPlatformAdmin: isPlatformAdmin ?? false,
        isLoading: isLoading ?? true,
        error: error ?? null,
    };
}