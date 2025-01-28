export const styles = {
    // Layout
    maxWidth: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

    // Typography
    h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
    h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
    h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
    p: 'leading-7 [&:not(:first-child)]:mt-6',

    // Components
    button: {
        primary:
            'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        secondary:
            'inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80',
        ghost: 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground',
    },

    // Cards
    card: 'rounded-lg border bg-card p-6 shadow-sm',

    // Forms
    input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',

    // Transitions
    transition: 'transition-all duration-200 ease-in-out',

    // Containers
    container: {
        default: 'container mx-auto px-4 sm:px-6 lg:px-8',
        small: 'container mx-auto px-4 max-w-4xl',
        large: 'container mx-auto px-4 max-w-7xl',
    },
};

// Color palette
export const colors = {
    red: {
        primary: 'hsl(0, 72%, 51%)',
        light: 'hsl(0, 91%, 71%)',
        dark: 'hsl(0, 62.8%, 30.6%)',
    },
    neutral: {
        50: 'hsl(0, 0%, 98%)',
        100: 'hsl(240, 4.8%, 95.9%)',
        200: 'hsl(240, 5.9%, 90%)',
        300: 'hsl(240, 5.9%, 80%)',
        400: 'hsl(240, 5.9%, 70%)',
        500: 'hsl(240, 5.9%, 60%)',
        600: 'hsl(240, 5.9%, 50%)',
        700: 'hsl(240, 3.8%, 46.1%)',
        800: 'hsl(240, 3.7%, 15.9%)',
        900: 'hsl(240, 10%, 3.9%)',
        950: 'hsl(240, 10%, 3.9%)',
    },
};
