import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        // Enable React compiler for improved performance
        reactCompiler: true,
    },
};

export default nextConfig;
