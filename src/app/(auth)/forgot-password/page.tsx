'use client';

import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { requestPasswordReset } from '@/app/(auth)/auth/actions';
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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setMessage('');
        setIsPending(true);

        try {
            const result = await requestPasswordReset(email);
            if (result.success) {
                setSuccess(true);
                setMessage(
                    result.message ||
                        'Password reset email has been sent. Please check your email.',
                );
            } else {
                setError(result.error || 'Failed to request password reset');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12 relative">
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            <Card className="w-full max-w-md dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Reset password
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        Enter your email to receive a password reset link
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
                                <div className="flex items-start gap-3 mb-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-300 mb-1">
                                            Email sent!
                                        </p>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            {message}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                                    💡 Check your spam folder if you don&#39;t see the
                                    email in your inbox.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Sending...</span>
                                    </div>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter>
                    <Link
                        href="/login"
                        className="text-center w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
