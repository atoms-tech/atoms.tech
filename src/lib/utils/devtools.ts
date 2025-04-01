/**
 * React DevTools Configuration Utility
 *
 * This file contains utilities for configuring React DevTools and profiling.
 * It's only used in development mode.
 */

// Add type declaration for React DevTools global hook
declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
            supportsFiber?: boolean;
            isDisabled?: boolean;
            // Use more specific index signature type for React DevTools hook properties
            [key: string]: boolean | number | string | object | undefined;
        };
    }
}

/**
 * Safely initializes React DevTools
 * This should be called in a client component
 */
export function initializeDevTools(): void {
    if (
        typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'development'
    ) {
        try {
            // We can't directly set the hook property as it may have only a getter
            // Instead, we'll just check if it exists and configure it if it does
            if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                // Enable React DevTools profiler
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = true;
                window.__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = false;
            } else {
                console.warn('React DevTools hook not found on window object');
            }
        } catch (error) {
            console.error('Failed to initialize React DevTools:', error);
        }
    }
}

/**
 * Safely patches React's internal hooks to avoid order issues
 * This helps prevent the "change in the order of Hooks" error
 */
export function patchReactHooks(): void {
    // This approach doesn't work well with React 19 and Next.js 15
    // Instead of patching React hooks (which is risky),
    // let's disable the problematic components in WDYR configuration
    console.log(
        'Hook patching is disabled - using exclusion patterns in WDYR instead',
    );
}
