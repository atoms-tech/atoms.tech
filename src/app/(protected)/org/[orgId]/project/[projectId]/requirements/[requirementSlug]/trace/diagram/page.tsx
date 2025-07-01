'use client';

import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

// Dynamically import React Flow component to prevent SSR issues
const TraceLinksGraph = dynamic(() => import('@/components/TraceLinksGraph'), {
    ssr: false,
});

export default function TraceDiagramPage() {
    const params = useParams();
    // const searchParams = useSearchParams(); // Reserved for future use
    const requirementId = params.requirementSlug as string;

    return (
        <div className="container mx-auto py-6">
            <Card className="bg-background shadow-none">
                <CardHeader className="px-6 py-4">
                    <CardTitle className="text-2xl font-bold">
                        Trace Links Diagram
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Click on any requirement node to navigate to its details
                        page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="border border-border rounded-lg overflow-hidden">
                        <TraceLinksGraph requirementId={requirementId} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
