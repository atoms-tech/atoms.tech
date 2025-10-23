import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

/**
 * Middleware to handle WorkOS AuthKit session management.
 * This must run on all routes that call withAuth() so that
 * the user context is available.
 */
export const middleware = authkitMiddleware({
    debug: false,
    // Enable eager auth to ensure session is available on all routes
    eagerAuth: true,
});

export const config = {
    // Match all routes EXCEPT static assets and Next.js internals.
    // Includes API routes so withAuth() can access the session context on protected API routes.
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
