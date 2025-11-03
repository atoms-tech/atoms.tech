import { Suspense } from 'react';

import TraceabilityPage from './TraceabilityPage.client';

interface TraceabilityPageProps {
    params: Promise<{
        orgId: string;
    }>;
}

export default async function Traceability({ params }: TraceabilityPageProps) {
    const { orgId } = await params;

    return (
        <div className="flex h-full w-full flex-col">
            <Suspense fallback={<div>Loading traceability...</div>}>
                <TraceabilityPage orgId={orgId} />
            </Suspense>
        </div>
    );
}
