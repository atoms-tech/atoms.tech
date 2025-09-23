'use client';

import { Code2, Link as LinkIcon, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Hero() {
    const router = useRouter();
    const { isAuthenticated, userProfile } = useAuth();
    const [loadingStates, setLoadingStates] = useState({
        getStarted: false,
        tryDemo: false,
    });

    const setLoading = (key: keyof typeof loadingStates, isLoading: boolean) => {
        setLoadingStates((prev) => ({ ...prev, [key]: isLoading }));
    };

    const handleGetStarted = () => {
        setLoading('getStarted', true);
        if (isAuthenticated) {
            router.push('/home/user');
        } else {
            router.push('/login');
        }
    };

    const handleTryDemo = () => {
        setLoading('tryDemo', true);
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        const orgId = userProfile?.personal_organization_id;
        router.push(`/org/${orgId}/demo`);
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
                <h2 className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] font-black leading-none text-white">
                    YOUR REQUIREMENTS WERE DEAD
                </h2>
                <h2 className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] font-black leading-none mb-16 text-white">
                    WE BROUGHT THEM TO LIFE
                </h2>
                <div className="space-y-6 mb-16">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-8">
                        WRITE LIKE WORD · ORGANIZE LIKE EXCEL · AUTOMATE EVERYTHING ELSE
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                        <div className="group bg-gradient-to-br from-white/5 to-white/2 border border-white/10 px-5 py-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[80px] rounded-md">
                            <div className="flex items-start gap-3 h-full">
                                <div className="p-2 bg-white/10 rounded-lg transition-colors duration-300 flex-shrink-0">
                                    <MessageSquare className="h-4 w-4 text-gray-300 transition-colors duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-200 font-bold text-sm sm:text-base mb-1 transition-colors duration-300">
                                        Chat
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-300 transition-colors duration-300 leading-relaxed">
                                        Your specs speak human now—ask questions, rewrite,
                                        fix nonsense
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-gradient-to-br from-white/5 to-white/2 border border-white/10 px-5 py-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[80px] rounded-md">
                            <div className="flex items-start gap-3 h-full">
                                <div className="p-2 bg-white/10 rounded-lg transition-colors duration-300 flex-shrink-0">
                                    <Trash2 className="h-4 w-4 text-gray-300 transition-colors duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-200 font-bold text-sm sm:text-base mb-1 transition-colors duration-300">
                                        Clean
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-300 transition-colors duration-300 leading-relaxed">
                                        Duplicates and contradictions? Destroyed before QA
                                        or customers notice
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-gradient-to-br from-white/5 to-white/2 border border-white/10 px-5 py-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[80px] rounded-md">
                            <div className="flex items-start gap-3 h-full">
                                <div className="p-2 bg-white/10 rounded-lg transition-colors duration-300 flex-shrink-0">
                                    <Code2 className="h-4 w-4 text-gray-300 transition-colors duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-200 font-bold text-sm sm:text-base mb-1 transition-colors duration-300">
                                        Code
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-300 transition-colors duration-300 leading-relaxed">
                                        Real code, straight from your system design. Not
                                        vibes
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="group bg-gradient-to-br from-white/5 to-white/2 border border-white/10 px-5 py-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer min-h-[80px] rounded-md">
                            <div className="flex items-start gap-3 h-full">
                                <div className="p-2 bg-white/10 rounded-lg transition-colors duration-300 flex-shrink-0">
                                    <LinkIcon className="h-4 w-4 text-gray-300 transition-colors duration-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-200 font-bold text-sm sm:text-base mb-1 transition-colors duration-300">
                                        Connect
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-300 transition-colors duration-300 leading-relaxed">
                                        Emails, tickets, docs—in one place. Stop creating
                                        meetings; start saving hours
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-start items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <Button
                        className="w-full sm:w-auto bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
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
