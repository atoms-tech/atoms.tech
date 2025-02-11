'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useQuery } from '@tanstack/react-query';
import { Check, Scale, Target, Wand } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function RequirementPage() {
    const { requirementSlug } = useParams<{ requirementSlug: string }>();

    // Fetch requirement details
    const { data: requirement, isLoading } = useQuery({
        queryKey: ['requirement', requirementSlug],
        queryFn: async () => {
            const { data: project } = await supabase
                .from('requirements')
                .select('*')
                .eq('id', requirementSlug)
                .single();

            if (!project) {
                throw new Error('Project not found');
            }

            return project;
        },
    });

    const handleAnalyze = () => {
        // TODO: Implement AI analysis
        console.log('Analyzing requirement...');
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Requirement</h2>
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">
                            {requirement?.name}
                        </h3>
                        <textarea
                            className="w-full h-32 p-2 border rounded-md text-muted-foreground"
                            value={requirement?.description}
                            readOnly
                        />
                        <div className="mt-4">
                            <Button onClick={handleAnalyze} className="gap-2">
                                <Wand className="h-4 w-4" />
                                Analyze with AI
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Analysis Blocks */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">AI Analysis</h2>

                    {/* Quality Score */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">
                                    Quality Score
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Analysis of requirement clarity,
                                    completeness, and testability.
                                </p>
                                <div className="mt-2 font-mono">
                                    Score: 85/100
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Improvements */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Check className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">
                                    Suggested Improvements
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Recommendations to enhance requirement
                                    quality.
                                </p>
                                <ul className="mt-2 space-y-2 text-sm">
                                    <li>
                                        • Add measurable acceptance criteria
                                    </li>
                                    <li>• Clarify performance expectations</li>
                                    <li>• Remove ambiguous terms</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* Compliance */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Scale className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">
                                    Standard Compliance
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Alignment with industry standards and best
                                    practices.
                                </p>
                                <div className="mt-2 space-y-1 text-sm">
                                    <div>ISO/IEC 29148: Partial</div>
                                    <div>INCOSE Guide: Compliant</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
