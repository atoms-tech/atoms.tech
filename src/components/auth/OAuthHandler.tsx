'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase/supabaseBrowser';

/**
 * Component that handles OAuth code exchange when redirected to root URL
 * This fixes the issue where GitHub OAuth redirects to /?code=... instead of /auth/callback
 */
export function OAuthHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleOAuthCode = async () => {
            const code = searchParams.get('code');
            
            if (code) {
                console.log('OAuthHandler: Found OAuth code, exchanging for session...');
                
                try {
                    // Exchange the code for a session
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    
                    if (error) {
                        console.error('OAuth code exchange error:', error);
                        // Redirect to login with error
                        router.push('/login?error=Authentication failed');
                        return;
                    }
                    
                    console.log('OAuthHandler: Successfully exchanged code for session');
                    
                    // Clear the code from URL and redirect to home
                    const url = new URL(window.location.href);
                    url.searchParams.delete('code');
                    url.searchParams.delete('state');
                    
                    // Redirect to home without the code parameter
                    router.replace('/home');
                    
                } catch (error) {
                    console.error('Unexpected OAuth error:', error);
                    router.push('/login?error=Authentication failed');
                }
            }
        };

        handleOAuthCode();
    }, [searchParams, router]);

    // This component doesn't render anything visible
    return null;
}
