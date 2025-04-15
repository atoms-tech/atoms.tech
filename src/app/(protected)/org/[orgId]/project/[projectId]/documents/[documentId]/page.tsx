'use client';

import { useParams } from 'next/navigation';

import { BlockCanvas } from '@/components/custom/BlockCanvas';
import LayoutView from '@/components/views/LayoutView';

export default function DocumentPage() {
    const params = useParams();
    const documentId = params.documentId as string;

    return (
        <LayoutView>
            <div>
                <BlockCanvas documentId={documentId} />
            </div>
        </LayoutView>
    );
}
