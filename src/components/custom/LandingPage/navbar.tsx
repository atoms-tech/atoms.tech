'use client';

import { Menu, User, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { OrganizationType } from '@/types/base/enums.types';

import { GridBackground } from './grid-background';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, isLoading, userProfile, signOut } = useAuth();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [preferredOrgId, setPreferredOrgId] = useState<string | null>(null);

    // Prefetch routes for faster navigation
    useEffect(() => {
        router.prefetch('/login');
        router.prefetch('/billing');

        // If authenticated, prefetch the home route and try to determine preferred org
        if (isAuthenticated && userProfile) {
            router.prefetch('/home');

            // Try to find the preferred organization
            const fetchPreferredOrg = async () => {
                try {
                    const { data: organizations } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('user_id', userProfile.id);

                    if (organizations && organizations.length > 0) {
                        // Prefer enterprise orgs, then personal orgs
                        const enterpriseOrg = organizations.find(
                            (org) => org.type === OrganizationType.enterprise,
                        );
                        const personalOrg = organizations.find(
                            (org) => org.type === OrganizationType.personal,
                        );

                        if (enterpriseOrg) {
                            setPreferredOrgId(enterpriseOrg.id);
                            router.prefetch(`/org/${enterpriseOrg.id}`);
                        } else if (personalOrg) {
                            setPreferredOrgId(personalOrg.id);
                            router.prefetch(`/org/${personalOrg.id}`);
                        }
                    }
                } catch (error) {
                    console.error(
                        'Error fetching preferred organization:',
                        error,
                    );
                }
            };

            fetchPreferredOrg();
        }
    }, [router, isAuthenticated, userProfile]);

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

    const handleSignIn = () => {
        startTransition(() => {
            router.push('/login');
        });
    };

    const handleDashboard = useCallback(() => {
        startTransition(() => {
            // If we have a preferred org, go directly there
            if (preferredOrgId) {
                router.push(`/org/${preferredOrgId}`);
            } else {
                // Otherwise use the /home route handler
                router.push('/home');
            }
        });
    }, [router, preferredOrgId]);

    const handleBilling = () => {
        startTransition(() => {
            router.push('/billing');
        });
    };

    const handleSignOut = () => {
        startTransition(async () => {
            await signOut();
        });
    };

    return (
        <header className="fixed top-0 left-0 right-0 min-h-16 px-6 py-3 bg-black text-white border-b border-1px border-white z-50">
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
                                        className={`btn-secondary bg-black hover:bg-white hover:text-black hidden md:flex gap-2 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                                        disabled={isPending}
                                    >
                                        <User size={18} />
                                        <span className="max-w-32 truncate">
                                            {userProfile?.full_name ||
                                                'Account'}
                                        </span>
                                        {isPending && (
                                            <span className="ml-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-[200px]"
                                >
                                    <DropdownMenuItem
                                        onClick={handleDashboard}
                                        disabled={isPending}
                                    >
                                        Dashboard
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleBilling}
                                        disabled={isPending}
                                    >
                                        Billing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        disabled={isPending}
                                    >
                                        {isPending
                                            ? 'Signing out...'
                                            : 'Sign Out'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                variant="outline"
                                className={`btn-secondary bg-black hover:bg-white hover:text-black hidden md:flex ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                                onClick={handleSignIn}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <span className="mr-2">SIGNING IN</span>
                                        <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                                    </>
                                ) : (
                                    'SIGN IN'
                                )}
                            </Button>
                        )}
                        <button
                            className="md:hidden text-white p-2 touch-manipulation"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                            disabled={isPending}
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
                                        className={`btn-secondary bg-black hover:bg-white hover:text-black w-full ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                                        onClick={handleDashboard}
                                        disabled={isPending}
                                    >
                                        {isPending ? 'LOADING...' : 'DASHBOARD'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`btn-secondary bg-black hover:bg-white hover:text-black w-full ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                                        onClick={handleBilling}
                                        disabled={isPending}
                                    >
                                        BILLING
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`btn-secondary bg-black hover:bg-white hover:text-black w-full ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                                        onClick={handleSignOut}
                                        disabled={isPending}
                                    >
                                        {isPending
                                            ? 'SIGNING OUT...'
                                            : 'SIGN OUT'}
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    className={`btn-secondary bg-black hover:bg-white hover:text-black w-full ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                                    onClick={handleSignIn}
                                    disabled={isPending}
                                >
                                    {isPending ? 'LOADING...' : 'SIGN IN'}
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
