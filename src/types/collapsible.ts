import { ReactNode } from 'react';

/**
 * Base configuration for collapsible components
 */
export interface CollapsibleConfig {
    /** Unique identifier for the collapsible section */
    id: string;
    /** Whether the section should be open by default */
    defaultOpen?: boolean;
    /** Custom key for localStorage persistence */
    persistKey?: string;
    /** Use sessionStorage instead of localStorage */
    sessionOnly?: boolean;
}

/**
 * State interface returned by useCollapsibleState hook
 */
export interface CollapsibleState {
    /** Current open/closed state */
    isOpen: boolean;
    /** Function to toggle the state */
    toggle: () => void;
    /** Function to set specific state */
    setOpen: (open: boolean) => void;
    /** The unique identifier */
    id: string;
}

/**
 * Animation types supported by collapsible components
 */
export type CollapsibleAnimationType = 'content' | 'fade' | 'scale' | 'slide' | 'staggered';

/**
 * Animation speed options
 */
export type CollapsibleAnimationSpeed = 'fast' | 'normal' | 'slow';

/**
 * Chevron/toggle position options
 */
export type ChevronPosition = 'left' | 'right';

/**
 * Icon types for collapsible toggles
 */
export type CollapsibleIconType = 'chevron' | 'plus-minus' | 'custom';

/**
 * Direction for collapsible animations
 */
export type CollapsibleDirection = 'horizontal' | 'vertical';

/**
 * Accordion selection modes
 */
export type AccordionType = 'single' | 'multiple';

/**
 * Props for custom header renderer
 */
export interface CollapsibleHeaderProps {
    /** Current open/closed state */
    isOpen: boolean;
    /** Function to toggle the state */
    toggle: () => void;
    /** Whether the section is disabled */
    disabled?: boolean;
}

/**
 * Custom header renderer function type
 */
export type CollapsibleHeaderRenderer = (props: CollapsibleHeaderProps) => ReactNode;

/**
 * Event handler types
 */
export interface CollapsibleEventHandlers {
    /** Called when the collapsible state changes */
    onToggle?: (isOpen: boolean) => void;
    /** Called when animation starts */
    onAnimationStart?: () => void;
    /** Called when animation completes */
    onAnimationComplete?: () => void;
}

/**
 * Accessibility options
 */
export interface CollapsibleAccessibilityOptions {
    /** Custom ARIA label for the toggle button */
    ariaLabel?: string;
    /** Custom ARIA description */
    ariaDescription?: string;
    /** Whether to announce state changes to screen readers */
    announceChanges?: boolean;
}

/**
 * Storage options for persistence
 */
export interface CollapsibleStorageOptions {
    /** Storage type to use */
    storageType?: 'localStorage' | 'sessionStorage';
    /** Custom storage key prefix */
    keyPrefix?: string;
    /** Whether to encrypt stored values */
    encrypt?: boolean;
    /** TTL for stored values (in milliseconds) */
    ttl?: number;
}

/**
 * Performance options
 */
export interface CollapsiblePerformanceOptions {
    /** Whether to use reduced motion */
    respectReducedMotion?: boolean;
    /** Whether to lazy load content */
    lazyLoad?: boolean;
    /** Debounce delay for rapid toggles */
    debounceDelay?: number;
}

/**
 * Complete configuration interface combining all options
 */
export interface CollapsibleFullConfig
    extends CollapsibleConfig,
        CollapsibleEventHandlers,
        CollapsibleAccessibilityOptions,
        CollapsibleStorageOptions,
        CollapsiblePerformanceOptions {
    /** Animation configuration */
    animation?: {
        type?: CollapsibleAnimationType;
        speed?: CollapsibleAnimationSpeed;
        direction?: CollapsibleDirection;
    };
    /** Visual configuration */
    visual?: {
        showChevron?: boolean;
        chevronPosition?: ChevronPosition;
        iconType?: CollapsibleIconType;
    };
}

/**
 * Group management interface
 */
export interface CollapsibleGroupState {
    /** Individual section states */
    states: CollapsibleState[];
    /** Expand all sections */
    expandAll: () => void;
    /** Collapse all sections */
    collapseAll: () => void;
    /** Toggle all sections */
    toggleAll: () => void;
    /** Whether all sections are open */
    allOpen: boolean;
    /** Whether all sections are closed */
    allClosed: boolean;
    /** Number of open sections */
    openCount: number;
}

/**
 * Accordion item definition
 */
export interface AccordionItem {
    /** Unique identifier */
    id: string;
    /** Header content */
    title: ReactNode;
    /** Body content */
    content: ReactNode;
    /** Whether the item is disabled */
    disabled?: boolean;
    /** Whether the item should be open by default */
    defaultOpen?: boolean;
    /** Custom CSS class for the item */
    className?: string;
    /** Custom data attributes */
    data?: Record<string, string>;
}

/**
 * Accordion configuration
 */
export interface AccordionConfig {
    /** Selection mode */
    type?: AccordionType;
    /** Whether to allow closing the open item in single mode */
    allowToggle?: boolean;
    /** Persistence configuration */
    persistence?: CollapsibleStorageOptions;
    /** Animation configuration */
    animation?: {
        type?: CollapsibleAnimationType;
        speed?: CollapsibleAnimationSpeed;
    };
}

/**
 * Event types for collapsible components
 */
export interface CollapsibleEvents {
    /** Fired when a section is toggled */
    'collapsible:toggle': CustomEvent<{ id: string; isOpen: boolean }>;
    /** Fired when a group operation is performed */
    'collapsible:group': CustomEvent<{ action: 'expandAll' | 'collapseAll' | 'toggleAll' }>;
    /** Fired when accordion selection changes */
    'accordion:change': CustomEvent<{ value: string | string[] }>;
}

/**
 * Utility type for extracting event detail types
 */
export type CollapsibleEventDetail<T extends keyof CollapsibleEvents> =
    CollapsibleEvents[T] extends CustomEvent<infer U> ? U : never;
