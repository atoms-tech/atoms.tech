'use client';

import { MailCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function ConfirmEmailMessage() {
    const searchParams = useSearchParams();
    const message = searchParams.get('message');

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../geoLandscape.jpg')] bg-cover bg-center px-4 py-12">
            <Card className="w-full max-w-md bg-background shadow-sm dark:shadow-lg border-gray-200 dark:border-gray-700">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary dark:bg-primary/20 rounded-full">
                            <MailCheck className="h-8 w-8 text-primary " />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Check your email
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-gray-400">
                        We&apos;ve sent you a confirmation link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
                        {message ||
                            'Please check your email and click the confirmation link to complete your registration.'}
                    </p>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                        If you don&apos;t see the email, check your spam folder.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
