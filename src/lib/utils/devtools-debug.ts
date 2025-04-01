/**
 * Debug utilities for React DevTools
 * This file helps diagnose issues with development tools setup
 */

/**
 * Checks React DevTools environment and logs debug information
 */
export async function debugReactDevTools(): Promise<void> {
    if (
        typeof window === 'undefined' ||
        process.env.NODE_ENV !== 'development'
    ) {
        console.log('Debug only runs in browser during development');
        return;
    }

    // Check for React DevTools global hook
    console.group('React DevTools Debug Info');
    const hasDevToolsHook = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    console.log('DevTools Hook Present:', hasDevToolsHook);

    if (hasDevToolsHook && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        console.log('supportsFiber:', hook.supportsFiber);
        console.log('isDisabled:', hook.isDisabled);
        console.log(
            'Extension ID:',
            hook.rendererInterfaces ? 'Connected' : 'Not connected',
        );
    }
    console.groupEnd();

    // Check React version
    try {
        const ReactModule = await import('react');
        const ReactDOMModule = await import('react-dom');
        console.group('React Version Info');
        console.log('React version:', ReactModule.version);
        console.log('ReactDOM version:', ReactDOMModule.version);
        console.groupEnd();
    } catch (e) {
        console.error('Failed to get React version:', e);
    }
}

// Add this to the window object for easy console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as unknown as Record<string, unknown>).debugReactDevTools =
        debugReactDevTools;
    console.log('Debug function available via window.debugReactDevTools()');
}
