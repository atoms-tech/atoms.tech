'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getUserOrganizationsServer } from '@/lib/db/server';
import { createClient } from '@/lib/supabase/supabaseServer';
import { COOKIE_NAME } from '@/lib/utils/cookieUtils';
import { OrganizationType } from '@/types';

export async function login(formData: FormData) {
    const supabase = await createClient();
    const cookieStore = await cookies();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    try {
        const { error, data: authData } = await supabase.auth.signInWithPassword(data);

        if (error || !authData.user) {
            return {
                error: error?.message || 'Invalid credentials',
                success: false,
            };
        }

        const organizations = await getUserOrganizationsServer(authData.user.id);

        let redirectUrl = '/home'; // Default fallback - route to /home by default

        // Find enterprise organization first
        const enterpriseOrg = organizations.find(
            (org) => org.type === OrganizationType.enterprise,
        );

        // Only set cookie if enterprise org exists or if no preferred_org_id is set yet
        const existingPreferredOrgId = cookieStore.get('preferred_org_id')?.value;

        if (enterpriseOrg) {
            // If enterprise org exists, always set it as preferred and redirect there
            redirectUrl = `/org/${enterpriseOrg.id}`;
            cookieStore.set('preferred_org_id', enterpriseOrg.id);
        } else if (!existingPreferredOrgId && organizations.length > 0) {
            // Only set a new preferred org if none exists and we have orgs
            const personalOrg = organizations.find(
                (org) => org.type === OrganizationType.personal,
            );

            if (personalOrg) {
                redirectUrl = `/org/${personalOrg.id}`;
                cookieStore.set('preferred_org_id', personalOrg.id);
            }
        }

        cookieStore.set('user_id', authData.user.id);

        revalidatePath('/', 'layout');
        return {
            success: true,
            redirectTo: redirectUrl,
        };
    } catch (error) {
        console.error('Error logging in:', error);
        return {
            error: 'An unexpected error occurred. Please try again.',
            success: false,
            data: error,
        };
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const name = formData.get('name') as string;

    try {
        //Clear the session if it exists
        await supabase.auth.signOut();

        const { data: authData, error } = await supabase.auth.signUp({
            ...data,
            options: {
                data: {
                    full_name: name,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/home`,
            },
        });

        if (error) {
            return {
                error: error.message,
                success: false,
            };
        }

        if (!authData.session) {
            return {
                message: 'Check your email to confirm your account',
                success: true,
            };
        }

        // Prefetch user data to make subsequent page loads faster
        if (authData.user) {
            await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();
        }

        revalidatePath('/', 'layout');
        redirect('/home');
    } catch (error) {
        return {
            error: 'An unexpected error occurred',
            success: false,
            data: error,
        };
    }
}

export async function signOut() {
    const supabase = await createClient();

    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        // Clear auth cookies on server side
        const cookieStore = await cookies();
        Object.values(COOKIE_NAME).forEach((name) => {
            cookieStore.set(name, '', {
                expires: new Date(0),
                path: '/',
            });
        });

        revalidatePath('/', 'layout');

        // Send a properly formatted JSON response
        return Response.json({ success: true });
    } catch (error) {
        console.error('Error signing out:', error);
        return Response.json({ success: false, error: 'Failed to sign out' });
    }
}
