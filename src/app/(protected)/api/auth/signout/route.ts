import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signout
 *
 * Signs out the user by clearing WorkOS session
 * This is handled by WorkOS AuthKit middleware
 */
export async function POST(_request: NextRequest) {
    try {
        // WorkOS AuthKit handles signout via middleware
        // This endpoint exists for compatibility with useAuth hook
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }
}
