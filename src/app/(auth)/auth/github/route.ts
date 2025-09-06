import { redirect } from 'next/navigation';

import { atomsApiServer } from '@/lib/atoms-api/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const api = await atomsApiServer();

    const { data, error } = await api.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${requestUrl.origin}/auth/callback`,
        },
    });

    if (error) {
        return redirect('/login?error=Could not authenticate with GitHub');
    }

    return redirect(data.url);
}
