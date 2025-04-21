'use client';

import { Table } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import {
    BlockCanvas,
    BlockCanvasTanStack,
} from '@/components/custom/BlockCanvas/indexExport';
import { Button } from '@/components/ui/button';
import LayoutView from '@/components/views/LayoutView';

export default function DocumentPage() {
    const params = useParams();
    const documentId = params?.documentId as string;
    const [useTanStackTable, setUseTanStackTable] = useState(false);

    return (
        <LayoutView>
            <div className="space-y-4">
                <div className="flex justify-end mb-4 px-4">
                    <Button
                        variant={useTanStackTable ? 'default' : 'outline'}
                        onClick={() => setUseTanStackTable(!useTanStackTable)}
                        className="flex items-center gap-2"
                    >
                        <Table className="h-4 w-4" />
                        {useTanStackTable
                            ? 'Using TanStack Table'
                            : 'Switch to TanStack Table'}
                    </Button>
                </div>
                {useTanStackTable ? (
                    <BlockCanvasTanStack documentId={documentId} />
                ) : (
                    <BlockCanvas documentId={documentId} />
                )}
            </div>
        </LayoutView>
    );
}
