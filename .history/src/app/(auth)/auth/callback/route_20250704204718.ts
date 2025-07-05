import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const _next = searchParams.get('next') || '/home'; // Add support for 'next' parameter

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Auth error:', error);
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }

        // After successful authentication, redirect to home instead of landing page
        // This ensures the user goes to a protected route where auth state is properly managed
        const redirectPath = '/home';

        const forwardedHost = request.headers.get('x-forwarded-host');
        const forwardedProto =
            request.headers.get('x-forwarded-proto') || 'https';
        const isLocalEnv = process.env.NODE_ENV === 'development';

        // For local development, use origin directly
        if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${redirectPath}`);
        }

        // For production, prefer x-forwarded-host when available
        const baseUrl = forwardedHost
            ? `${forwardedProto}://${forwardedHost}`
            : origin;

        return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
}
