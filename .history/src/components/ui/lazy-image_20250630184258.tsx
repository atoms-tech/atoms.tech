'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    fallback?: string;
    placeholder?: React.ReactNode;
    onLoad?: () => void;
    onError?: () => void;
}

export function LazyImage({
    src,
    alt,
    className,
    fallback = '/placeholder-avatar.png',
    placeholder,
    onLoad,
    onError,
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const currentImg = imgRef.current;

        if (!currentImg) return;

        // Create intersection observer for lazy loading
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observerRef.current?.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before the image comes into view
                threshold: 0.1,
            },
        );

        observerRef.current.observe(currentImg);

        return () => {
            if (observerRef.current && currentImg) {
                observerRef.current.unobserve(currentImg);
            }
        };
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    const imageSrc = hasError ? fallback : src;
    const shouldLoad = isInView || isLoaded;

    return (
        <div className={cn('relative overflow-hidden', className)}>
            {/* Placeholder while loading */}
            {!isLoaded && (
                <div
                    className={cn(
                        'absolute inset-0 flex items-center justify-center bg-muted animate-pulse',
                        className,
                    )}
                >
                    {placeholder || (
                        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full" />
                    )}
                </div>
            )}

            {/* Actual image */}
            <img
                ref={imgRef}
                src={shouldLoad ? imageSrc : undefined}
                alt={alt}
                className={cn(
                    'transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                    className,
                )}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
                decoding="async"
            />
        </div>
    );
}
