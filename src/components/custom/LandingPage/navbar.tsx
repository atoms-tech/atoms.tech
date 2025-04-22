'use client';

import { Loader2, Menu, User, X } from 'lucide-react';
import { useCookies } from 'next-client-cookies';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useSignOut';
import { supabase } from '@/lib/supabase/supabaseBrowser';

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
    const [, setPreferredOrgId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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
        {
            href: '/#how-it-works',
            label: 'How It Works',
            shortLabel: 'How It Works',
        },
        { href: '/#industries', label: 'Industries' },
        { href: '/#contact', label: 'Contact' },
    ];

    const NavLink = ({
        href,
        label,
        shortLabel,
    }: {
        href: string;
        label: string;
        shortLabel?: string;
    }) => (
        <Link
            href={href}
            className="relative group text-lg text-white hover:text-gray-300 transition-colors uppercase font-bold whitespace-nowrap"
            onClick={() => setIsMenuOpen(false)}
        >
            <span className="hidden md:inline lg:hidden">
                {shortLabel || label}
            </span>
            <span className="inline md:hidden lg:inline">{label}</span>
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

    const handleDashboard = useCallback(async () => {
        setLoading('dashboard', true);

        try {
            // Fetch the user's profile to get pinned_organization_id and personal_organization_id
            const { data, error } = await supabase
                .from('profiles')
                .select('pinned_organization_id, personal_organization_id')
                .eq('id', userProfile?.id || '')
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                setLoading('dashboard', false);
                return;
            }

            if (data) {
                let targetOrgId = data.pinned_organization_id;

                if (!targetOrgId && data.personal_organization_id) {
                    // If no pinned organization, set it to personal_organization_id by default
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            pinned_organization_id:
                                data.personal_organization_id,
                        })
                        .eq('id', userProfile?.id || '');

                    if (!updateError) {
                        targetOrgId = data.personal_organization_id;
                    } else {
                        console.error(
                            'Error updating pinned organization:',
                            updateError,
                        );
                        setLoading('dashboard', false);
                        return;
                    }
                }

                if (targetOrgId) {
                    console.log(
                        'Navigating to pinned organization:',
                        targetOrgId,
                    );
                    router.push(`/org/${targetOrgId}`);
                } else {
                    console.log('No pinned or personal organization found');
                    router.push('/home'); // Fallback to home if no organization is found
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading('dashboard', false);
        }
    }, [router, userProfile?.id, setLoading]);

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
        <header className="fixed top-0 left-0 right-0 min-h-16 px-4 sm:px-6 py-3 bg-black/90 backdrop-blur-md text-white border-b border-1px border-white z-50">
            {/* Show full-screen loading overlay when navigating to dashboard */}
            {loadingStates.dashboard && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4 text-center px-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Loading dashboard...
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            We&apos;re preparing your organization workspace
                        </p>
                    </div>
                </div>
            )}

            <div className="relative">
                <div className="container mx-auto flex justify-between items-center">
                    <Link
                        href="/"
                        className="atoms-logo flex items-center group"
                        onMouseEnter={() => {
                            setIsAnimating(true);
                            if (videoRef.current) {
                                videoRef.current.currentTime = 0;
                                videoRef.current.play();
                            }
                        }}
                    >
                        <div className="relative mx-1 sm:mx-2 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                            <Image
                                src="/AtomsLogo.svg"
                                alt="Atoms logo"
                                width={48}
                                height={48}
                                className={`object-contain invert absolute transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                                priority
                            />
                            <video
                                ref={videoRef}
                                className={`atoms-logo-video object-contain absolute transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                                width={48}
                                height={48}
                                playsInline
                                preload="auto"
                                muted
                                aria-label="Atoms logo animation"
                                src="/AtomsAnimation.mp4"
                                poster="/AtomsLogo.svg"
                                onEnded={() => setIsAnimating(false)}
                            />
                        </div>
                        <span className="font-medium text-base sm:text-lg md:text-2xl tracking-tight">
                            ATOMS
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex lg:space-x-8 xl:space-x-16">
                        {navLinks.map((link) => (
                            <NavLink key={link.href} {...link} />
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {isLoading ? (
                            <div className="h-9 w-24 bg-gray-700 animate-pulse rounded-md"></div>
                        ) : isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black hidden lg:flex gap-2"
                                        size="sm"
                                    >
                                        <User size={16} />
                                        <span className="max-w-24 lg:max-w-32 truncate">
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
                                        className="py-2"
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
                                        className="py-2"
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
                                        className="py-2"
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
                                className="btn-secondary bg-black hover:bg-white hover:text-black hidden lg:flex"
                                onClick={handleSignIn}
                                disabled={loadingStates.signIn}
                                size="sm"
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
                            className="lg:hidden text-white p-1.5 sm:p-2 rounded-md hover:bg-white/10 transition-colors touch-manipulation"
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
                        className="absolute top-full left-0 right-0 bg-black border-t border-white lg:hidden
                        animate-in slide-in-from-right duration-300 ease-in-out z-40 max-h-[calc(100vh-64px)] overflow-y-auto"
                    >
                        <nav className="flex flex-col space-y-4 p-4">
                            {navLinks.map((link) => (
                                <NavLink key={link.href} {...link} />
                            ))}
                            {isAuthenticated ? (
                                <>
                                    <Button
                                        variant="outline"
                                        className="btn-secondary bg-black hover:bg-white hover:text-black w-full mt-2"
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
                                    className="btn-secondary bg-black hover:bg-white hover:text-black w-full mt-2"
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
