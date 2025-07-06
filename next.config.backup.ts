import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Disable React compiler for faster builds - can re-enable later for production optimization
    experimental: {
        reactCompiler: false,
    },

    // Optimize TypeScript checking
    typescript: {
        // Skip type checking during build for faster builds
        // Type checking is done separately in CI/CD
        ignoreBuildErrors: true,
    },

    // ESLint optimization
    eslint: {
        // Skip ESLint during build for faster builds
        // ESLint is run separately
        ignoreDuringBuilds: true,
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
        // Supported formats - Next.js will serve the best format for each browser
        formats: ['image/avif', 'image/webp'],
        // Image sizes for responsive images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Minimize layout shift
        minimumCacheTTL: 31536000, // 1 year cache
        // Disable static imports for dynamic optimization
        dangerouslyAllowSVG: false,
        contentDispositionType: 'attachment',
        contentSecurityPolicy:
            "default-src 'self'; script-src 'none'; sandbox;",
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
