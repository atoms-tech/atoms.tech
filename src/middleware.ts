import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Hard-bypass auth/session for the sandbox route (page and its API)
    const p = request.nextUrl.pathname;
    if (p === '/analyze_sandbox' || p.startsWith('/analyze_sandbox/')) {
        return NextResponse.next();
    }
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        //original line:
        //  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
        // Skip static assets and also skip analyze_sandbox paths for unauthenticated testing
        '/((?!_next/static|_next/image|favicon.ico|analyze_sandbox(?:/.*)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
    ],
};
