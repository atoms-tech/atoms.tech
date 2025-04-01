'use client';

import { useParams } from 'next/navigation';

import { BlockCanvas } from '@/components/custom/BlockCanvas';

export default function DocumentPage() {
    const params = useParams();
    const documentId = params.documentId as string;

    return (
        <div>
            <BlockCanvas documentId={documentId} />
        </div>
    );
}
