import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
    try {
        // Clear the session cookie
        const cookieStore = await cookies();
        cookieStore.delete('wos-session');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Clear the session cookie
        const cookieStore = await cookies();
        cookieStore.delete('wos-session');

        // Redirect to login page
        return NextResponse.redirect(new URL('/login', request.url));
    } catch (error) {
        console.error('Signout error:', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}
