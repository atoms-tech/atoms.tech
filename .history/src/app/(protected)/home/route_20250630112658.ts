import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const preferredOrgId = cookieStore.get('preferred_org_id')?.value;

    if (preferredOrgId) {
        return NextResponse.redirect(
            new URL(`/org/${preferredOrgId}`, request.url),
        );
    }

    return NextResponse.redirect(new URL('/home/user', request.url));
}
