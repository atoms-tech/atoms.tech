import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to check if user is a platform admin
 * This can be used to protect platform admin routes
 */
export async function checkPlatformAdminAccess(request: NextRequest): Promise<boolean> {
    try {
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.substring(7);

        // In a real implementation, you would decode the JWT token to get user info
        // For now, we'll use a simple approach by checking the session via API
        const response = await fetch(`${request.nextUrl.origin}/api/platform/admin/check`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.isPlatformAdmin || false;
    } catch (error) {
        console.error('Error checking platform admin access:', error);
        return false;
    }
}

/**
 * Higher-order function to wrap API routes with platform admin protection
 */
export function withPlatformAdminProtection<T extends unknown[]>(
    handler: (...args: T) => Promise<NextResponse>
) {
    return async (...args: T): Promise<NextResponse> => {
        const request = args[0] as NextRequest;
        
        const hasAccess = await checkPlatformAdminAccess(request);
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Forbidden: Platform admin access required' },
                { status: 403 }
            );
        }

        return handler(...args);
    };
}