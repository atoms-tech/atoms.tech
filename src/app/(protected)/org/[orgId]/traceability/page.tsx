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
        <div className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow">
            <Suspense fallback={<div>Loading traceability...</div>}>
                <TraceabilityPage orgId={orgId} />
            </Suspense>
        </div>
    );
}
