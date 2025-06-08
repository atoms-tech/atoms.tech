import { Variants } from 'framer-motion';

/**
 * Animation configuration for collapsible components
 * Optimized for smooth 60fps performance with reduced motion support
 */

export const collapsibleTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
    duration: 0.3,
} as const;

export const fastTransition = {
    type: 'tween',
    duration: 0.2,
    ease: 'easeInOut',
} as const;

export const slowTransition = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 1,
    duration: 0.5,
} as const;

/**
 * Content animation variants for expand/collapse
 * Uses height-based animations for smooth transitions
 */
export const contentVariants: Variants = {
    collapsed: {
        height: 0,
        opacity: 0,
        overflow: 'hidden',
        transition: collapsibleTransition,
    },
    expanded: {
        height: 'auto',
        opacity: 1,
        overflow: 'visible',
        transition: {
            ...collapsibleTransition,
            opacity: {
                duration: 0.2,
                delay: 0.1,
            },
        },
    },
};

/**
 * Chevron/arrow icon rotation variants
 */
export const chevronVariants: Variants = {
    collapsed: {
        rotate: 0,
        transition: fastTransition,
    },
    expanded: {
        rotate: 180,
        transition: fastTransition,
    },
};

/**
 * Fade-based variants for simple show/hide animations
 */
export const fadeVariants: Variants = {
    collapsed: {
        opacity: 0,
        transition: fastTransition,
    },
    expanded: {
        opacity: 1,
        transition: {
            ...fastTransition,
            delay: 0.1,
        },
    },
};

/**
 * Scale-based variants for more dramatic animations
 */
export const scaleVariants: Variants = {
    collapsed: {
        scale: 0.95,
        opacity: 0,
        transition: collapsibleTransition,
    },
    expanded: {
        scale: 1,
        opacity: 1,
        transition: collapsibleTransition,
    },
};

/**
 * Slide variants for horizontal collapsing
 */
export const slideVariants: Variants = {
    collapsed: {
        width: 0,
        opacity: 0,
        overflow: 'hidden',
        transition: collapsibleTransition,
    },
    expanded: {
        width: 'auto',
        opacity: 1,
        overflow: 'visible',
        transition: {
            ...collapsibleTransition,
            opacity: {
                duration: 0.2,
                delay: 0.1,
            },
        },
    },
};

/**
 * Staggered animation for multiple collapsible items
 */
export const staggeredVariants: Variants = {
    collapsed: {
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
    expanded: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

/**
 * Child variants for staggered animations
 */
export const staggerChildVariants: Variants = {
    collapsed: {
        opacity: 0,
        y: -10,
        transition: fastTransition,
    },
    expanded: {
        opacity: 1,
        y: 0,
        transition: fastTransition,
    },
};

/**
 * Utility function to get appropriate variants based on animation type
 */
export function getCollapsibleVariants(
    type: 'content' | 'fade' | 'scale' | 'slide' | 'staggered' = 'content'
): Variants {
    switch (type) {
        case 'fade':
            return fadeVariants;
        case 'scale':
            return scaleVariants;
        case 'slide':
            return slideVariants;
        case 'staggered':
            return staggeredVariants;
        case 'content':
        default:
            return contentVariants;
    }
}

/**
 * Utility function to get transition config based on speed preference
 */
export function getTransition(speed: 'fast' | 'normal' | 'slow' = 'normal') {
    switch (speed) {
        case 'fast':
            return fastTransition;
        case 'slow':
            return slowTransition;
        case 'normal':
        default:
            return collapsibleTransition;
    }
}

/**
 * Reduced motion variants for accessibility
 */
export const reducedMotionVariants: Variants = {
    collapsed: {
        display: 'none',
    },
    expanded: {
        display: 'block',
    },
};

/**
 * Get variants with reduced motion support
 */
export function getAccessibleVariants(
    type: 'content' | 'fade' | 'scale' | 'slide' | 'staggered' = 'content',
    prefersReducedMotion = false
): Variants {
    if (prefersReducedMotion) {
        return reducedMotionVariants;
    }
    return getCollapsibleVariants(type);
}
