'use client';

import { SiGithub } from '@icons-pack/react-simple-icons';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useEffect, useState, useTransition } from 'react';

import { login } from '@/app/(auth)/auth/actions';
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
import { Separator } from '@/components/ui/separator';

// Create a separate client component for the login form
function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        router.prefetch('/home/user');
        router.prefetch('/org/[orgId]');
    }, [router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        startTransition(async () => {
            try {
                const result = await login(formData);

                if (result.success && result.redirectTo) {
                    router.push(result.redirectTo);
                } else {
                    setError(result.error || 'An unexpected error occurred');
                }
            } catch (error) {
                console.error('Error logging in:', error);
                setError('An unexpected error occurred');
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12 relative">
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            <Card className="w-full max-w-md dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className=""
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-gray-200 dark:bg-muted" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-gray-500 dark:text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/auth/google')}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                try {
                                    router.push('/auth/github');
                                } catch (error) {
                                    console.error('GitHub OAuth error:', error);
                                    setError(
                                        'Failed to connect to GitHub. Please try again.',
                                    );
                                }
                            }}
                        >
                            <SiGithub className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-center w-full text-sm text-gray-600 dark:text-gray-300">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/signup"
                            className="font-medium text-primary hover:text-primary/80"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

// Main page component with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
