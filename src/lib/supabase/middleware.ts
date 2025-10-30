import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase Middleware (Legacy)
 *
 * With WorkOS AuthKit, session management is handled by authkitMiddleware.
 * This function is kept for backward compatibility and does not perform auth checks.
 */
export async function updateSession(request: NextRequest) {
    return NextResponse.next({
        request,
    });
}
