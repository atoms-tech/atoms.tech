'use client';

import {
    ThemeProvider as NextThemesProvider,
    type ThemeProviderProps,
} from 'next-themes';
import type { ReactNode } from 'react';

interface CustomThemeProviderProps extends ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
