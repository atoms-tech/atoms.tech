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
};

export default nextConfig;
