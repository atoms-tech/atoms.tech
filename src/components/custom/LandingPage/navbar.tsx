'use client';

import { Loader2, Menu, User, X } from 'lucide-react';
import { useCookies } from 'next-client-cookies';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useSignOut';

import { GridBackground } from './grid-background';

export function Navbar() {
    const cookies = useCookies();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, isLoading, userProfile } = useAuth();
    const { signOut, isLoading: isSigningOut } = useSignOut();
    const router = useRouter();
    const [loadingStates, setLoadingStates] = useState({
        dashboard: false,
        signIn: false,
        billing: false,
    });
    const [preferredOrgId, setPreferredOrgId] = useState<string | null>(null);

    useEffect(() => {
        const cookieOrgId = cookies.get('preferred_org_id');
        if (cookieOrgId) {
            setPreferredOrgId(cookieOrgId);

            if (isAuthenticated) {
                router.prefetch(`/org/${cookieOrgId}`);
            }
        }
    }, [router, isAuthenticated, cookies]);

    useEffect(() => {
        router.prefetch('/login');
        router.prefetch('/home');
    }, [router]);

    const navLinks = [
        { href: '/#features', label: 'Features' },
        { href: '/#how-it-works', label: 'How It Works' },
        { href: '/#industries', label: 'Industries' },
        { href: '/#contact', label: 'Contact' },
    ];

    const NavLink = ({ href, label }: { href: string; label: string }) => (
        <Link
            href={href}
            className="relative group text-lg text-white hover:text-gray-300 transition-colors uppercase font-bold"
            onClick={() => setIsMenuOpen(false)}
        >
            {label}
            <div className="absolute w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
        </Link>
    );

    const setLoading = useCallback(
        (key: keyof typeof loadingStates, isLoading: boolean) => {
            setLoadingStates((prev) => ({ ...prev, [key]: isLoading }));
        },
        [],
    );

    const handleSignIn = () => {
        setLoading('signIn', true);
        router.push('/login');
    };

    const handleDashboard = useCallback(() => {
        setLoading('dashboard', true);

        // If we have a preferred org, go directly there
        if (preferredOrgId) {
            router.push(`/org/${preferredOrgId}`);
        } else {
            router.push('/home');
        }
    }, [router, preferredOrgId, setLoading]);

    const handleBilling = () => {
        setLoading('billing', true);
        router.push('/billing');
    };

    const handleSignOut = () => {
        signOut();
    };

    // Cleanup loading states when component unmounts
    useEffect(() => {
        return () => {
            setLoadingStates({
                dashboard: false,
                signIn: false,
                billing: false,
            });
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 min-h-16 px-6 py-3 bg-black text-white border-b border-1px border-white z-50">
            {/* Show full-screen loading overlay when navigating to dashboard */}
            {loadingStates.dashboard && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight">
                            Loading dashboard...
                        </h2>
                        <p className="text-muted-foreground">
                            We&apos;re preparing your organization workspace
                        </p>
                    </div>
                </div>
            )}

            <div className="relative">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="atoms-logo flex">
                        <Image
                            src="/atoms.png"
                            alt="Atoms logo"
                            width={24}
                            height={24}
                            className="object-contain invert mx-2 w-auto h-auto sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px]"
                        />
                        <span className="font-semibold text-base sm:text-lg md:text-xl">
                            ATOMS.TECH
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-4 lg:space-x-8 xl:space-x-16">
                        {navLinks.map((link) => (
                            <NavLink key={link.href} {...link} />
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-4">
                        {isLoading ? (
                            <div className="h-9 w-24 bg-gray-700 animate-pulse rounded-md"></div>
                        ) : isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black hidden md:flex gap-2"
                                    >
                                        <User size={18} />
                                        <span className="max-w-32 truncate">
                                            {userProfile?.full_name ||
                                                'Account'}
                                        </span>
                                        {loadingStates.dashboard && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-[200px]"
                                >
                                    <DropdownMenuItem
                                        onClick={handleDashboard}
                                        disabled={loadingStates.dashboard}
                                    >
                                        {loadingStates.dashboard ? (
                                            <div className="flex items-center">
                                                <span className="mr-2">
                                                    Dashboard
                                                </span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'Dashboard'
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleBilling}
                                        disabled={loadingStates.billing}
                                    >
                                        {loadingStates.billing ? (
                                            <div className="flex items-center">
                                                <span className="mr-2">
                                                    Billing
                                                </span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'Billing'
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        disabled={isSigningOut}
                                    >
                                        {isSigningOut ? (
                                            <div className="flex items-center">
                                                <span className="mr-2">
                                                    Signing out
                                                </span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'Sign Out'
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                variant="outline"
                                className="btn-secondary bg-black hover:bg-white hover:text-black hidden md:flex"
                                onClick={handleSignIn}
                                disabled={loadingStates.signIn}
                            >
                                {loadingStates.signIn ? (
                                    <div className="flex items-center gap-2">
                                        <span>SIGNING IN</span>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : (
                                    'SIGN IN'
                                )}
                            </Button>
                        )}
                        <button
                            className="md:hidden text-white p-2 touch-manipulation"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div
                        className="absolute top-full left-0 right-0 bg-black border-t border-white md:hidden
                        animate-in slide-in-from-right duration-300 ease-in-out"
                    >
                        <nav className="flex flex-col space-y-4 p-4">
                            {navLinks.map((link) => (
                                <NavLink key={link.href} {...link} />
                            ))}
                            {isAuthenticated ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                        onClick={handleDashboard}
                                        disabled={loadingStates.dashboard}
                                    >
                                        {loadingStates.dashboard ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <span>LOADING</span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'DASHBOARD'
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                        onClick={handleBilling}
                                        disabled={loadingStates.billing}
                                    >
                                        {loadingStates.billing ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <span>LOADING</span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'BILLING'
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                        onClick={handleSignOut}
                                        disabled={isSigningOut}
                                    >
                                        {isSigningOut ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <span>SIGNING OUT</span>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            'SIGN OUT'
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                    onClick={handleSignIn}
                                    disabled={loadingStates.signIn}
                                >
                                    {loadingStates.signIn ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>SIGNING IN</span>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : (
                                        'SIGN IN'
                                    )}
                                </Button>
                            )}
                        </nav>
                    </div>
                )}
                <GridBackground />
            </div>
        </header>
    );
}
