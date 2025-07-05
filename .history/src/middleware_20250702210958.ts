import { type NextRequest, NextResponse } from 'next/server';

// import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // Temporarily bypass middleware to test if it's causing the hang
    console.log('Middleware hit:', request.nextUrl.pathname);
    return NextResponse.next();
    // return await updateSession(request);
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)',
    ],
};
