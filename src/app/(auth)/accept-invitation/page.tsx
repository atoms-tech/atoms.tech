'use client';

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { acceptInvitation } from '@/app/(auth)/auth/actions';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AcceptInvitationPage() {
    const searchParams = useSearchParams();
    const invitation = searchParams?.get('invitation');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isPending, setIsPending] = useState(false);

    // Fetch invitation details on mount
    useEffect(() => {
        if (invitation) {
            // The invitation token is in the URL, we'll validate it on submit
            // For now, just store it
            console.log('Invitation token received:', invitation);
        }
    }, [invitation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setIsPending(true);

        // Validate passwords
        if (!password || !confirmPassword) {
            setError('Please enter and confirm your password');
            setIsPending(false);
            return;
        }

        if (password.length < 10) {
            setError('Password must be at least 10 characters long');
            setIsPending(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsPending(false);
            return;
        }

        if (!firstName || !lastName) {
            setError('Please enter your first and last name');
            setIsPending(false);
            return;
        }

        if (!invitation) {
            setError('Invalid or missing invitation token');
            setIsPending(false);
            return;
        }

        try {
            const result = await acceptInvitation({
                invitationToken: invitation,
                password,
                firstName,
                lastName,
            });

            if (result.success) {
                setSuccess(true);
                // Redirect will happen automatically via server action
            } else {
                setError(result.error || 'Failed to accept invitation');
            }
        } catch (err) {
            // Check if it's a Next.js redirect error (which is actually success)
            if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
                // This is a successful redirect, don't show error
                return;
            }

            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        } finally {
            setIsPending(false);
        }
    };

    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12 relative">
                <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
                <Card className="w-full max-w-md dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                            Invalid Invitation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span>No invitation token found in URL</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Please use the invitation link from your email.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Link
                            href="/login"
                            className="text-center w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                        >
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12 relative">
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            <Card className="w-full max-w-md dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Accept Invitation
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        Create your account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-300 mb-1">
                                            Account created successfully!
                                        </p>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Redirecting you to the application...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => setFirstName(e.target.value)}
                                        required
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => setLastName(e.target.value)}
                                        required
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter password (minimum 10 characters)"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Creating account...</span>
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!success && (
                    <CardFooter>
                        <p className="text-center w-full text-sm text-gray-600 dark:text-gray-300">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="font-medium text-primary hover:text-primary/80"
                            >
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
