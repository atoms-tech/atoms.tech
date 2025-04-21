'use client';

import React, {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { useDocumentStore } from '@/store/document.store';

// Define comprehensive viewport breakpoints
export const BREAKPOINTS = {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

// Comprehensive layout state type
export type LayoutViewMode = 'standard' | 'wide';
export type SidebarState = 'expanded' | 'collapsed';

export interface LayoutState {
    // Loading state
    isLayoutReady: boolean;

    // Sidebar state
    sidebarState: SidebarState;
    toggleSidebar: () => void;

    // Responsive state
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    currentBreakpoint: keyof typeof BREAKPOINTS;

    // Layout view (width)
    layoutViewMode: LayoutViewMode;
    setLayoutViewMode: (mode: LayoutViewMode) => void;

    // Edit mode
    isEditMode: boolean;
    setIsEditMode: (isEditMode: boolean) => void;

    // Navigation state
    currentPath: string;
    setCurrentPath: (path: string) => void;

    // Document state
    documentName: string | null;
    isDocumentPage: boolean;
}

// Create the context with undefined initial value
const LayoutContext = createContext<LayoutState | undefined>(undefined);

interface LayoutProviderProps {
    children: ReactNode;
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
    // Loading state
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    // Sidebar state
    const [sidebarState, setSidebarState] = useState<SidebarState>('expanded');

    // Responsive state
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    const [currentBreakpoint, setCurrentBreakpoint] =
        useState<keyof typeof BREAKPOINTS>('lg');

    // Layout view (width)
    const [layoutViewMode, setLayoutViewMode] =
        useState<LayoutViewMode>('standard');

    // Get edit mode from document store
    const { isEditMode, setIsEditMode } = useDocumentStore();

    // Navigation state
    const [currentPath, setCurrentPath] = useState('');

    // Document state
    const [documentName, setDocumentName] = useState<string | null>(null);
    const isDocumentPage = useMemo(
        () => currentPath.includes('/documents/'),
        [currentPath],
    );

    // Toggle sidebar handler using useCallback for performance
    const toggleSidebar = useCallback(() => {
        setSidebarState((prev) =>
            prev === 'expanded' ? 'collapsed' : 'expanded',
        );
    }, []);

    // Efficient resize handler with debounce
    useEffect(() => {
        let resizeTimer: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {
                const width = window.innerWidth;

                // Determine current breakpoint
                let newBreakpoint: keyof typeof BREAKPOINTS = 'xs';
                if (width >= BREAKPOINTS['2xl']) newBreakpoint = '2xl';
                else if (width >= BREAKPOINTS.xl) newBreakpoint = 'xl';
                else if (width >= BREAKPOINTS.lg) newBreakpoint = 'lg';
                else if (width >= BREAKPOINTS.md) newBreakpoint = 'md';
                else if (width >= BREAKPOINTS.sm) newBreakpoint = 'sm';

                // Set device type state
                const newIsMobile = width < BREAKPOINTS.sm;
                const newIsTablet =
                    width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
                const newIsDesktop = width >= BREAKPOINTS.lg;

                setCurrentBreakpoint(newBreakpoint);
                setIsMobile(newIsMobile);
                setIsTablet(newIsTablet);
                setIsDesktop(newIsDesktop);

                // Auto-collapse sidebar on mobile if it's expanded
                if (newIsMobile && sidebarState === 'expanded') {
                    setSidebarState('collapsed');
                }

                // Mark layout as ready after initial sizing
                if (!isLayoutReady) {
                    setIsLayoutReady(true);
                }
            }, 50); // Reduced to 50ms for faster initial load
        };

        // Initial check
        handleResize();

        // Add listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, [sidebarState, isLayoutReady]); // Added isLayoutReady as a dependency

    // Extract document name from path
    useEffect(() => {
        if (isDocumentPage) {
            const pathParts = currentPath.split('/');
            const docIndex = pathParts.findIndex(
                (part) => part === 'documents',
            );
            if (docIndex !== -1 && docIndex < pathParts.length - 1) {
                setDocumentName(pathParts[docIndex + 1]);
            }
        } else {
            setDocumentName(null);
        }
    }, [currentPath, isDocumentPage]);

    // Memoize context value to prevent unnecessary renders
    const contextValue = useMemo(
        () => ({
            isLayoutReady,
            sidebarState,
            toggleSidebar,
            isMobile,
            isTablet,
            isDesktop,
            currentBreakpoint,
            layoutViewMode,
            setLayoutViewMode,
            isEditMode,
            setIsEditMode,
            currentPath,
            setCurrentPath,
            documentName,
            isDocumentPage,
        }),
        [
            isLayoutReady,
            sidebarState,
            toggleSidebar,
            isMobile,
            isTablet,
            isDesktop,
            currentBreakpoint,
            layoutViewMode,
            isEditMode,
            currentPath,
            documentName,
            isDocumentPage,
            setIsEditMode,
        ],
    );

    return (
        <LayoutContext.Provider value={contextValue}>
            {children}
        </LayoutContext.Provider>
    );
};

// Custom hook for consuming the context
export const useLayout = (): LayoutState => {
    const context = useContext(LayoutContext);

    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }

    return context;
};
