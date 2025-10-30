'use client';

import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { resetPassword } from '@/app/(auth)/auth/actions';
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

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setIsPending(true);

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            setError('Please enter and confirm your new password');
            setIsPending(false);
            return;
        }

        if (newPassword.length < 10) {
            setError('Password must be at least 10 characters long');
            setIsPending(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setIsPending(false);
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token');
            setIsPending(false);
            return;
        }

        try {
            const result = await resetPassword(token, newPassword);
            if (result.success) {
                setSuccess(true);
            } else {
                setError(result.error || 'Failed to reset password');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsPending(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12 relative">
                <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
                <Card className="w-full max-w-md dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                            Invalid Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span>Password reset link is missing or invalid</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Please request a new password reset link from the login page.
                        </p>
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center px-4 py-12 relative">
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            <Card className="w-full max-w-md dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Set new password
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        Enter your new password below
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
                                            Password reset successful!
                                        </p>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Your password has been updated. You can now
                                            log in with your new password.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="new-password"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    New Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password (minimum 10 characters)"
                                        value={newPassword}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => setNewPassword(e.target.value)}
                                        required
                                        disabled={isPending}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="confirm-password"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isPending}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(!showConfirmPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Resetting...</span>
                                    </div>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {success && (
                    <CardFooter>
                        <Link
                            href="/login"
                            className="text-center w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to login
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
