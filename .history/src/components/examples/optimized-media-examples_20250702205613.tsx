'use client';

import { OptimizedImage, OptimizedBackgroundImage, OptimizedAvatar } from '@/components/ui/optimized-image';
import { OptimizedVideo, useVideoPreloader } from '@/components/ui/optimized-video';

/**
 * Example usage of optimized media components
 * This file demonstrates best practices for using the image and video optimization components
 */
export function OptimizedMediaExamples() {
    // Preload critical videos for better performance
    useVideoPreloader(['/Analysis.gif', '/WriteRequirement.gif']);

    return (
        <div className="space-y-8 p-6">
            <h2 className="text-2xl font-bold">Optimized Media Components Examples</h2>

            {/* Hero Background Image */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Hero Background Image</h3>
                <OptimizedBackgroundImage
                    src="/nodesbackground.jpg"
                    alt="Nodes background"
                    backgroundType="NODES_BACKGROUND"
                    className="h-64 rounded-lg"
                    priority // Load immediately for above-the-fold content
                >
                    <div className="flex items-center justify-center h-full">
                        <h1 className="text-white text-4xl font-bold">Welcome to Atoms.tech</h1>
                    </div>
                </OptimizedBackgroundImage>
            </section>

            {/* Regular Optimized Images */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Optimized Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logo with high quality */}
                    <OptimizedImage
                        src="/atom.png"
                        alt="Atoms.tech logo"
                        width={200}
                        height={200}
                        config="ICON"
                        className="rounded-lg"
                        priority={false}
                        responsive={true}
                        performanceTracking={true}
                    />

                    {/* Regular image with fallback */}
                    <OptimizedImage
                        src="/some-image.jpg"
                        alt="Example image"
                        width={400}
                        height={300}
                        fallback="/atom.png"
                        className="rounded-lg"
                        onLoad={() => {
                            console.log('Image loaded');
                        }}
                        onError={() => {
                            console.error('Image failed to load');
                        }}
                    />
                </div>
            </section>

            {/* Avatar Examples */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Avatar Images</h3>
                <div className="flex space-x-4">
                    <OptimizedAvatar
                        src="https://lh3.googleusercontent.com/a/default-user"
                        alt="User avatar"
                        size={64}
                        fallbackInitials="JD"
                    />
                    <OptimizedAvatar
                        src="/atom.png"
                        alt="Company logo"
                        size={48}
                        fallbackInitials="AT"
                    />
                </div>
            </section>

            {/* Video Examples */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Optimized Videos (GIF Replacement)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Analysis demo video */}
                    <div className="space-y-2">
                        <h4 className="font-medium">Analysis Demo</h4>
                        <OptimizedVideo
                            gifSrc="/Analysis.gif"
                            alt="Analysis demonstration"
                            className="rounded-lg h-48"
                            priority={false}
                            autoPlay={true}
                            loop={true}
                            muted={true}
                            quality="high"
                            performanceTracking={true}
                            onLoad={() => console.log('Analysis video loaded')}
                        />
                    </div>

                    {/* Write requirement demo */}
                    <div className="space-y-2">
                        <h4 className="font-medium">Write Requirement Demo</h4>
                        <OptimizedVideo
                            gifSrc="/WriteRequirement.gif"
                            alt="Write requirement demonstration"
                            className="rounded-lg h-48"
                            priority={false}
                            autoPlay={false}
                            controls={true}
                            quality="medium"
                            fallbackToGif={true}
                        />
                    </div>

                    {/* Requirement to diagram demo */}
                    <div className="space-y-2">
                        <h4 className="font-medium">Requirement to Diagram Demo</h4>
                        <OptimizedVideo
                            gifSrc="/RequirementToDiagram.gif"
                            alt="Requirement to diagram demonstration"
                            className="rounded-lg h-48 md:col-span-2"
                            priority={false}
                            quality="high"
                            retryOnError={true}
                        />
                    </div>
                </div>
            </section>

            {/* Performance Tips */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Performance Optimization Tips</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <ul className="space-y-2 text-sm">
                        <li>• Use <code>priority={true}</code> for above-the-fold images</li>
                        <li>• Enable <code>responsive={true}</code> for images that change size based on viewport</li>
                        <li>• Use <code>OptimizedVideo</code> instead of GIFs for animations</li>
                        <li>• Provide fallback images for critical content</li>
                        <li>• Enable performance tracking in development mode</li>
                        <li>• Use appropriate quality settings based on image importance</li>
                        <li>• Preload critical videos using <code>useVideoPreloader</code></li>
                    </ul>
                </div>
            </section>

            {/* Performance Metrics Display */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm">
                        Open your browser&apos;s developer tools to see performance metrics for optimized images.
                        In development mode, detailed loading information is logged to the console.
                    </p>
                </div>
            </section>
        </div>
    );
}

/**
 * Lightweight example for production use
 */
export function ProductionMediaExample() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hero image */}
            <OptimizedImage
                src="/atom.png"
                alt="Atoms.tech"
                width={300}
                height={300}
                config="HERO_BACKGROUND"
                priority
                className="col-span-full md:col-span-1"
            />

            {/* Demo videos */}
            <OptimizedVideo
                gifSrc="/Analysis.gif"
                alt="Analysis demo"
                className="col-span-1 aspect-video"
                quality="high"
            />

            <OptimizedVideo
                gifSrc="/WriteRequirement.gif"
                alt="Write requirement demo"
                className="col-span-1 aspect-video"
                quality="high"
            />
        </div>
    );
}