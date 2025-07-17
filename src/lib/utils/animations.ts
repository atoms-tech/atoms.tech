export const transitionConfig = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.8,
    duration: 0.4,
} as const;

export const listVariants = {
    full: {
        width: '100%',
        transition: transitionConfig,
    },
    half: {
        width: '50%',
        transition: transitionConfig,
    },
} as const;

export const detailsVariants = {
    hidden: {
        width: 0,
        x: '100%',
        opacity: 0,
        transition: {
            ...transitionConfig,
            opacity: { duration: 0.2 },
            x: { duration: 0.3 },
        },
    },
    visible: {
        width: '25%',
        x: '0%',
        opacity: 1,
        transition: {
            ...transitionConfig,
            opacity: { duration: 0.3, delay: 0.1 },
            x: { duration: 0.3 },
        },
    },
} as const;
