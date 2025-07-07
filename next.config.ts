import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        // Enable React compiler for improved performance
        reactCompiler: true,
    },
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
    eslint: {
        // Temporarily ignore ESLint errors during builds
        ignoreDuringBuilds: true,
    },
    // Security headers configuration
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    // Add Vary header to prevent cache poisoning
                    {
                        key: 'Vary',
                        value: 'Accept-Encoding, User-Agent',
                    },
                ],
            },
        ];
    },
    // Development server security (only in development)
    ...(process.env.NODE_ENV === 'development' && {
        async rewrites() {
            return [
                {
                    source: '/dev-server/:path*',
                    destination: '/api/dev-server-proxy/:path*',
                },
            ];
        },
    }),
};

export default nextConfig;
