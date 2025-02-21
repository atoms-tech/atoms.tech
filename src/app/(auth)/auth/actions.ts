'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/supabaseServer';

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        redirect('/login?error=Invalid credentials');
    }

    revalidatePath('/', 'layout');
    redirect('/home');
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
            };
        }

        if (!authData.session) {
            return {
                message: 'Check your email to confirm your account',
            };
        }

        revalidatePath('/', 'layout');
        redirect('/home');
    } catch {
        return {
            error: 'An unexpected error occurred',
        };
    }
}

export async function signOut() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }

    revalidatePath('/', 'layout');
    redirect('/login');
}
