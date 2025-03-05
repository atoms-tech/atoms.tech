import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';
import { OrganizationType } from '@/types/base/enums.types';

export async function GET(request: NextRequest) {
    try {
        // Get the current user
        const user = await getAuthUserServer();

        // Fetch organizations on the server side
        const organizations = await getUserOrganizationsServer(user.user.id);

        // Find personal organization (playground)
        const personalOrg = organizations.find(
            (org) => org.type === OrganizationType.personal,
        );

        // Find enterprise organization - user is a member of any enterprise org
        const enterpriseOrg = organizations.find(
            (org) => org.type === OrganizationType.enterprise,
        );

        // Determine the redirect URL
        let redirectUrl = '/home/user'; // Default fallback

        if (enterpriseOrg) {
            // If user is a member of an enterprise org, route to that first
            redirectUrl = `/org/${enterpriseOrg.id}`;
        } else if (personalOrg) {
            // Otherwise, route to personal playground
            redirectUrl = `/org/${personalOrg.id}`;
        }

        // Return a redirect response
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
        console.error('Error in home route handler:', error);
        // If there's an error, redirect to the user dashboard as a fallback
        return NextResponse.redirect(new URL('/home/user', request.url));
    }
}
