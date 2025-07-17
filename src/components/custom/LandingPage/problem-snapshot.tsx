import { AlertTriangle, CheckCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export interface ProblemSnapshotProps {
    painPoint: string;
    solution: string;
}

export function ProblemSnapshot({
    painPoint = 'Writing compliant requirements is slow, error‑prone—and bogged down by bloated legacy tools.',
    solution = 'A Word‑simple, spreadsheet‑smart workspace with built‑in AI that cuts effort by 50%—checking compliance, sharpening language, and keeping everything traceable.',
}: ProblemSnapshotProps) {
    return (
        <section className="py-16 md:py-16 lg:py-16 relative bg-black text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-10 md:mb-20">
                    STREAMLINE YOUR REQUIREMENTS PROCESS
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="overflow-hidden bg-red-950/20 dark:bg-red-950/20 border-red-900 dark:border-red-900">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 rounded-full p-2 bg-red-900/30">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                                        The Pain
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {painPoint}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-[#9B51E0] bg-[#9B51E0]/10 dark:bg-[#9B51E0]/10 dark:border-[#9B51E0]">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 rounded-full p-2 bg-[#9B51E0]/30">
                                    <CheckCircle className="h-5 w-5 text-[#9B51E0] text-[#9B51E0]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#9B51E0] dark:text-[#9B51E0] mb-2">
                                        The Fix
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {solution}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
