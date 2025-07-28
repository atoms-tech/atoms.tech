'use client';

import { Suspense } from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Main page component with Suspense boundary
export default function RequestApprovalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center bg-black px-4 py-12 relative">
                {/* Background overlay */}
                <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
                {/* Card container */}
                <Card className="w-full max-w-md bg-background dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                            Pending User Approval
                        </CardTitle>
                        <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                            Please contact{' '}
                            <a
                                className="font-bold text-violet-600"
                                href="mailto:hello@atoms.tech"
                            >
                                hello@atoms.tech
                            </a>{' '}
                            to approve you.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </Suspense>
    );
}
