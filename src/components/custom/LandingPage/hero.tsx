'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Hero() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [loadingStates, setLoadingStates] = useState({
        getStarted: false,
        tryDemo: false,
    });

    const setLoading = (
        key: keyof typeof loadingStates,
        isLoading: boolean,
    ) => {
        setLoadingStates((prev) => ({ ...prev, [key]: isLoading }));
    };

    const handleGetStarted = () => {
        setLoading('getStarted', true);
        if (isAuthenticated) {
            router.push('/home');
        } else {
            router.push('/login');
        }
    };

    const handleTryDemo = () => {
        setLoading('tryDemo', true);
        router.push('/demo');
    };

    return (
        <section className="bg-[url('/../../../nodesbackground.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center  text-white relative overflow-hidden">
            {/* Full-screen loading overlay when navigating */}
            {(loadingStates.getStarted || loadingStates.tryDemo) && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight">
                            {loadingStates.getStarted
                                ? 'Getting started...'
                                : 'Loading demo...'}
                        </h2>
                        <p className="text-muted-foreground">
                            Please wait while we prepare your experience
                        </p>
                    </div>
                </div>
            )}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
            <div className="absolute inset-0 bg-black opacity-80" />
            <div className="container mx-auto px-4 py-32 relative z-20">
                <h2 className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] font-black leading-none mb-16 text-white">
                    REQUIREMENT TOOLS SUCK OURS DOESN&apos;T
                </h2>
                <div className="space-y-4 mb-16">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                        WRITE LIKE WORD
                    </p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                        ORGANIZE LIKE EXCEL
                    </p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                        LET AI HANDLE PRECISION, COMPLIANCE, AND TRACEABILITY
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-start items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <Button
                        className="btn-primary w-full sm:w-auto"
                        onClick={handleGetStarted}
                        disabled={loadingStates.getStarted}
                    >
                        {loadingStates.getStarted ? (
                            <div className="flex items-center gap-2">
                                <span>LOADING</span>
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : (
                            'GET STARTED'
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="btn-secondary w-full sm:w-auto bg-black hover:bg-white hover:text-black"
                        onClick={handleTryDemo}
                        disabled={loadingStates.tryDemo}
                    >
                        {loadingStates.tryDemo ? (
                            <div className="flex items-center gap-2">
                                <span>LOADING</span>
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : (
                            'TRY DEMO'
                        )}
                    </Button>
                </div>
            </div>
        </section>
    );
}
