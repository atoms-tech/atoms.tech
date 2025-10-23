import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server';

/**
 * GET /auth/callback
 *
 * OAuth callback route for WorkOS AuthKit
 *
 * This route:
 * 1. Receives authorization code from WorkOS
 * 2. Exchanges code for authenticated user
 * 3. Creates encrypted session
 * 4. Redirects to dashboard
 *
 * Configuration:
 * - Must match NEXT_PUBLIC_WORKOS_REDIRECT_URI in environment
 * - Must be configured in WorkOS Dashboard under Redirects
 */
const authHandler = handleAuth();

export const GET = async (request: NextRequest) => {
    console.log('=== CALLBACK ROUTE ===');
    console.log('URL:', request.url);
    console.log('Search params:', request.nextUrl.searchParams.toString());
    console.log('Code:', request.nextUrl.searchParams.get('code'));
    console.log('State:', request.nextUrl.searchParams.get('state'));

    try {
        const response = await authHandler(request);
        console.log('Auth handler response status:', response?.status);
        console.log(
            'Set-Cookie header:',
            response?.headers.get('set-cookie') ? '(present)' : '(not set)',
        );
        return response;
    } catch (error) {
        console.error('Callback error:', error);
        throw error;
    }
};
