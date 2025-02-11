'use client';

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
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signup } from '../auth/actions';
import ConfirmEmailMessage from './message';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get('message');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(searchParams.get('error') || '');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const errorMsg = searchParams.get('error');
        if (errorMsg) setError(errorMsg);
    }, [searchParams]);

    // If we have a message, show the confirmation message component
    if (message) {
        return <ConfirmEmailMessage />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            const result = await signup(formData);

            if (result?.error) {
                setError(result.error);
            } else if (result?.message) {
                // Handle success message (email confirmation required)
                router.push(
                    `/signup?message=${encodeURIComponent(result.message)}`,
                );
            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-sm dark:shadow-lg border-gray-200 dark:border-gray-700">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Create your account
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-gray-400">
                        Sign up to get started
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
                                    id="name"
                                    type="text"
                                    placeholder="Full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 
                    focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500
                    text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 
                    focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500
                    text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                                    className="rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 
                    focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500
                    text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                    className="rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 
                    focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500 dark:focus:ring-red-500
                    text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600
                text-white font-medium py-2 rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-500"
                        >
                            {isLoading ? 'Signing up...' : 'Sign up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-center w-full text-sm text-gray-600 dark:text-gray-300">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-500"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
