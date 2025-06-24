'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { TableLibrarySelector } from '@/components/custom/BlockCanvas/components/TableLibrarySelector';
import { BlockCanvas } from '@/components/custom/BlockCanvas/indexExport';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import LayoutView from '@/components/views/LayoutView';
import { useDocumentStore } from '@/store/document.store';

export default function DocumentPage() {
    const params = useParams();
    const documentId = params?.documentId as string;
    const { tableLibrary } = useDocumentStore();

    //scroll to requirement if requirementId is in sessionStorage
    useEffect(() => {
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
                            element.classList.remove('highlight-requirement');
                        }, 3000);
                    }, 100);
                } else {
                    console.log(
                        'Element not found for requirementId:',
                        requirementId,
                    );
                }
            }, 1500);

            return () => clearTimeout(timeout);
        }
    }, []);

    return (
        <LayoutView>
            <div className="space-y-6">
                {/* Table Library Selection Card */}
                <Card className="border bg-card text-card-foreground shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-semibold leading-none tracking-tight">
                            Table Implementation
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Choose the table library for all tables in this
                            document. Changes apply immediately.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                                Current Implementation:{' '}
                                <span className="font-mono text-primary">
                                    {tableLibrary}
                                </span>
                            </span>
                            <TableLibrarySelector showFeatures={false} />
                        </div>
                    </CardContent>
                </Card>

                {/* Document Canvas */}
                <BlockCanvas documentId={documentId} />
            </div>
        </LayoutView>
    );
}
