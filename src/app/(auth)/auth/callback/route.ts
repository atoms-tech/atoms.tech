import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/home'; // Add support for 'next' parameter
    const cookieStore = await cookies();

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    try {
        const supabase = await createClient();
        const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.user) {
            console.error('Auth error:', error);
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }

        cookieStore.set('user_id', data.user.id);
        revalidatePath('/', 'layout');

        const forwardedHost = request.headers.get('x-forwarded-host');
        const forwardedProto =
            request.headers.get('x-forwarded-proto') || 'https';
        const isLocalEnv = process.env.NODE_ENV === 'development';

        // For local development, use origin directly
        if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        // For production, prefer x-forwarded-host when available
        const baseUrl = forwardedHost
            ? `${forwardedProto}://${forwardedHost}`
            : origin;

        return NextResponse.redirect(`${baseUrl}${next}`);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
}
