import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        // Enable React compiler for improved performance
        reactCompiler: false,
    },
    images: {
        domains: ['lh3.googleusercontent.com'],
    },
};

export default nextConfig;
