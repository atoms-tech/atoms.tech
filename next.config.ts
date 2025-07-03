import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Disable React compiler for faster builds - can re-enable later for production optimization
    experimental: {
        reactCompiler: false,
    },

    // Build performance optimizations (swcMinify is default in Next.js 15)

    // Optimize TypeScript checking
    typescript: {
        // Skip type checking during build for faster builds
        // Type checking is done separately in CI/CD
        ignoreBuildErrors: false,
    },

    // ESLint optimization
    eslint: {
        // Skip ESLint during build for faster builds
        // ESLint is run separately
        ignoreDuringBuilds: true,
    },

    images: {
        domains: ['lh3.googleusercontent.com'],
    },

    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        // Optimize for faster builds
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                        },
                    },
                },
            };
        }

        return config;
    },
};

export default nextConfig;
