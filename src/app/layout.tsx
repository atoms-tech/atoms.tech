import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components';
import type { Metadata } from 'next';
import { CookiesProvider } from 'next-client-cookies/server';
import { Geist, Geist_Mono } from 'next/font/google';

import Toaster from '@/components/ui/toaster';
import { QueryProvider } from '@/lib/providers/query.provider';
import { ThemeProvider } from '@/lib/providers/theme.provider';

import '@/styles/globals.css';

import GlobalErrorBoundary from './global-error';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'ATOMS',
    description: 'ATOMS.TECH - AI-powered requirements engineering',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <GlobalErrorBoundary>
            <html lang="en" suppressHydrationWarning>
                <head>
                    {/* <script
                        src="https://unpkg.com/react-scan/dist/auto.global.js"
                        async
                    /> */}
                </head>
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
                >
                    <AuthKitProvider>
                        <CookiesProvider>
                            <ThemeProvider
                                attribute="class"
                                defaultTheme="system"
                                enableSystem
                                disableTransitionOnChange
                            >
                                <QueryProvider>
                                    {children}
                                    <Toaster />
                                </QueryProvider>
                            </ThemeProvider>
                        </CookiesProvider>
                    </AuthKitProvider>
                    {/* Below Required for Glide overlays (e.g., dropdown editors) */}
                    <div
                        id="portal"
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            zIndex: 9999,
                        }}
                    />
                </body>
            </html>
        </GlobalErrorBoundary>
    );
}
