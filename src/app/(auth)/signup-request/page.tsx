'use client';

import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';

export default function SignupRequestPage() {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/auth/signup-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    fullName,
                    message,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit signup request');
            }

            setSuccess(true);
            setEmail('');
            setFullName('');
            setMessage('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center bg-black px-4 py-12 relative">
            {/* Background overlay */}
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            {/* Card container */}
            <Card className="w-full max-w-md bg-background dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Request Access
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        Fill out the form below and we&apos;ll review your request
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-green-900 dark:text-green-100">
                                        Request submitted successfully!
                                    </p>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        We&apos;ll review your request and send you an
                                        email shortly.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setSuccess(false)}
                                variant="outline"
                                className="w-full"
                            >
                                Submit Another Request
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFullName(e.target.value)
                                    }
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Why do you want to join?</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us a bit about yourself..."
                                    value={message}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLTextAreaElement>,
                                    ) => setMessage(e.target.value)}
                                    disabled={isLoading}
                                    className="resize-none"
                                    rows={4}
                                />
                            </div>

                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Submitting...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Submit Request
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter>
                    <p className="text-center w-full text-sm text-gray-600 dark:text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary hover:text-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
