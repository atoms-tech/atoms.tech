'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/supabaseServer';
import { OrganizationType } from '@/types/base/enums.types';

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    try {
        const { error, data: authData } =
            await supabase.auth.signInWithPassword(data);

        if (error) {
            return {
                error: error.message || 'Invalid credentials',
                success: false,
            };
        }

        if (authData.user) {
            // Prefetch user profile
            const { data: _profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            // Prefetch organizations
            const { data: organizations } = await supabase
                .from('organizations')
                .select('*')
                .eq('user_id', authData.user.id);

            // Determine where to redirect based on organizations
            if (organizations && organizations.length > 0) {
                // Find enterprise organization
                const enterpriseOrg = organizations.find(
                    (org) => org.type === OrganizationType.enterprise,
                );

                // Find personal organization
                const personalOrg = organizations.find(
                    (org) => org.type === OrganizationType.personal,
                );

                if (enterpriseOrg) {
                    // Prefetch enterprise org data
                    await supabase
                        .from('organization_members')
                        .select('*')
                        .eq('organization_id', enterpriseOrg.id)
                        .eq('user_id', authData.user.id);

                    revalidatePath('/', 'layout');
                    redirect(`/org/${enterpriseOrg.id}`);
                } else if (personalOrg) {
                    revalidatePath('/', 'layout');
                    redirect(`/org/${personalOrg.id}`);
                }
            }
        }

        // Default redirect if no specific org found
        revalidatePath('/', 'layout');
        redirect('/home');
    } catch (error) {
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

        revalidatePath('/', 'layout');
        redirect('/login');
    } catch (error) {
        console.error('Error signing out:', error);
        // Still redirect even if there's an error
        redirect('/login');
    }
}
