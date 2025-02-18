'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { GridBackground } from './grid-background';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                            className="object-contain invert mx-2 w-auto h-auto
                                sm:w-[28px] sm:h-[28px]
                                md:w-[32px] md:h-[32px]"
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
                        <Button
                            variant="outline"
                            className="btn-secondary bg-black hover:bg-white hover:text-black hidden md:flex"
                            onClick={() => redirect('/login')}
                        >
                            SIGN IN
                        </Button>
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
                            <Button
                                variant="outline"
                                className="btn-secondary bg-black hover:bg-white hover:text-black w-full"
                                onClick={() => redirect('/login')}
                            >
                                SIGN IN
                            </Button>
                        </nav>
                    </div>
                )}
                <GridBackground />
            </div>
        </header>
    );
}
