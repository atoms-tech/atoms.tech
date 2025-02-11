'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function ConfirmEmailMessage() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-sm dark:shadow-lg border-gray-200 dark:border-gray-700">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <MailCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Check your email
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-gray-400">
                        We've sent you a confirmation link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
                        {message ||
                            'Please check your email and click the confirmation link to complete your registration.'}
                    </p>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        If you don't see the email, check your spam folder.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
