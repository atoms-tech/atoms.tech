import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Ignore pages that don't need authentication
    if (
        request.nextUrl.pathname !== '/' &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/signup')
    ) {
        // no user, potentially respond by redirecting the user to the login page
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
        // Check if user is approved
        const { data, error } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', user.id || '')
            .single();
        // Redirect to /request-approval if not approved
        if (
            (error || !data.is_approved) &&
            !request.nextUrl.pathname.startsWith('/request-approval')
        ) {
            const url = request.nextUrl.clone();
            url.pathname = '/request-approval';
            const myNewResponse = NextResponse.redirect(url);
            supabaseResponse.cookies
                .getAll()
                .forEach(({ name, value }) => myNewResponse.cookies.set(name, value));
            return myNewResponse;
        }
        const segments = request.nextUrl.pathname.split('/').filter(Boolean);
        // Check if user is allowed in the admin page
        if (segments[0] === 'admin') {
            const { data, error } = await supabase
                .from('profiles')
                .select('job_title')
                .eq('id', user.id || '')
                .single();
            if (error || data.job_title !== 'admin') {
                // unauthorized to see admin page
                const url = request.nextUrl.clone();
                url.pathname = '/home/user';
                const myNewResponse = NextResponse.redirect(url);
                supabaseResponse.cookies
                    .getAll()
                    .forEach(({ name, value }) => myNewResponse.cookies.set(name, value));
                return myNewResponse;
            }
        }
        // Check if user is allowed in the organization
        if (segments.length > 1 && segments[0] === 'org') {
            const { data, error } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', segments[1] || '')
                .eq('user_id', user.id || '')
                .single();
            if (error || !data) {
                // unauthorized to see organization
                const url = request.nextUrl.clone();
                url.pathname = '/home/user';
                const myNewResponse = NextResponse.redirect(url);
                supabaseResponse.cookies
                    .getAll()
                    .forEach(({ name, value }) => myNewResponse.cookies.set(name, value));
                return myNewResponse;
            }
        }
        // Check if user is allowed in the project
        if (segments.length > 3 && segments[2] === 'project') {
            const { data, error } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', segments[3] || '')
                .eq('user_id', user.id || '')
                .single();
            if (error || !data) {
                // unauthorized to see project
                const url = request.nextUrl.clone();
                url.pathname = '/org/' + segments[1];
                const myNewResponse = NextResponse.redirect(url);
                supabaseResponse.cookies
                    .getAll()
                    .forEach(({ name, value }) => myNewResponse.cookies.set(name, value));
                return myNewResponse;
            }
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
}
