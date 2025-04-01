import type { Metadata } from 'next';
import { CookiesProvider } from 'next-client-cookies/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

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
    title: 'Atoms',
    description: 'Atoms.tech - AI-powered requirements engineering',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <GlobalErrorBoundary>
            <html lang="en" suppressHydrationWarning>
                {/* <head>
                    <script 
                        src="https://unpkg.com/react-scan/dist/auto.global.js"
                        async
                    />
                </head> */}
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                    <CookiesProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <QueryProvider>
                                {children}
                                <Toaster position="bottom-right" />
                            </QueryProvider>
                        </ThemeProvider>
                    </CookiesProvider>
                </body>
            </html>
        </GlobalErrorBoundary>
    );
}
