'use client';

import { Table } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

    //scroll to requirement if requirementId is in sessionStorage
    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        //get requirementId from sessionStorage
        const requirementId = sessionStorage.getItem('jumpToRequirementId');
        console.log(
            'Checking sessionStorage for requirementId:',
            requirementId,
        );

        if (requirementId) {
            const timeout = setTimeout(() => {
                console.log(
                    'Attempting to find element with ID:',
                    `requirement-${requirementId}`,
                );

                // Additional check to ensure document is available
                if (typeof document !== 'undefined') {
                    const element = document.getElementById(
                        `requirement-${requirementId}`,
                    );

                    if (element) {
                        //clear the requirementId from sessionStorage only after finding the element
                        sessionStorage.removeItem('jumpToRequirementId');
                        console.log(
                            'Element found, cleared sessionStorage, scrolling to it',
                        );

                        //scroll to element
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        });

                        setTimeout(() => {
                            console.log('Adding highlight class');
                            element.style.backgroundColor =
                                'rgba(153, 59, 246, 0.3)';
                            element.classList.add('highlight-requirement');

                            setTimeout(() => {
                                console.log('Removing highlight');
                                element.style.backgroundColor = '';
                                element.classList.remove(
                                    'highlight-requirement',
                                );
                            }, 3000);
                        }, 100);
                    } else {
                        console.log(
                            'Element not found for requirementId:',
                            requirementId,
                        );
                    }
                }
            }, 1500);

            return () => clearTimeout(timeout);
        }
    }, []);

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
