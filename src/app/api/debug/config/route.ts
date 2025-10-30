import { NextResponse } from 'next/server';

export const GET = () => {
    const config = {
        WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID ? '(set)' : '(NOT SET)',
        WORKOS_API_KEY: process.env.WORKOS_API_KEY ? '(set)' : '(NOT SET)',
        NEXT_PUBLIC_WORKOS_REDIRECT_URI: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
        WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD
            ? '(set)'
            : '(NOT SET)',
        NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(config);
};
