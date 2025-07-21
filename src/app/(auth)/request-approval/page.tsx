'use client';

import { AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// import { supabase } from '@/lib/supabase/supabaseBrowser';

// Create a separate client component for the approval form
function ApprovalForm() {
    const searchParams = useSearchParams();

    const [reason, setReason] = useState<string>('');
    const [company, setCompany] = useState<string>('');
    const [role, setRole] = useState<string>('');
    const [error, setError] = useState<string>(searchParams.get('error') || '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const errorMsg = searchParams.get('error');
        if (errorMsg) setError(errorMsg);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        /*
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('reason', reason);
            formData.append('company', company);
            formData.append('role', role);

            const { error } = await supabase
                .from('approval_forms')
                .insert({reason: formData.get('reason'),
                company: formData.get('company'),
                    role: formData.get('role'),
                    })

            if (error) {
                setError(error);
            } else {
                // Handle success message

            }
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
        */
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center bg-black px-4 py-12 relative">
            {/* Background overlay */}
            <div className="pointer-events-none absolute inset-0 bg-black opacity-80" />
            {/* Card container */}
            <Card className="w-full max-w-md bg-background dark:bg-black/40 backdrop-blur-md shadow-sm dark:shadow-lg relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                        Request Approval
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500 dark:text-muted-foreground">
                        We need additional information before approving you to use our
                        platform.
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
                                    id="reason"
                                    type="text"
                                    placeholder="Reason for Using Atoms.tech*"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="company"
                                    type="text"
                                    placeholder="Company Name*"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    id="role"
                                    type="text"
                                    placeholder="Role / Job Title*"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            disabled
                            type="submit"
                            className="w-full font-medium py-2 rounded-lg"
                        >
                            {isLoading ? 'Sending Form...' : 'Submit'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// Main page component with Suspense boundary
export default function RequestApprovalPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ApprovalForm />
        </Suspense>
    );
}
