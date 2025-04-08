'use client';

import { Suspense, lazy, useState } from 'react';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Lazy load form components to reduce initial bundle size
const ProjectForm = lazy(() => import('@/components/base/forms/ProjectForm'));
const DocumentForm = lazy(() => import('@/components/base/forms/DocumentForm'));
const OrganizationForm = lazy(
    () => import('@/components/base/forms/OrganizationForm'),
);

// Fallback loading component
const FormLoader = () => (
    <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading form...</div>
    </div>
);

export interface CreatePanelProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'project' | 'requirement' | 'document' | 'organization';
    projectId?: string;
    showTabs?: 'show' | 'project' | 'requirement' | 'document' | 'organization';
    organizationId?: string;
}

export function CreatePanel({
    isOpen,
    onClose,
    initialTab = 'project',
    projectId,
    showTabs = 'show',
    organizationId,
}: CreatePanelProps) {
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleClose = () => {
        onClose();
        // Reset to initial tab when closing
        setActiveTab(initialTab);
    };

    // Don't render anything if not open
    if (!isOpen) return null;

    // If showTabs is not 'show', render only the specified form
    if (showTabs !== 'show') {
        return (
            <Sheet open={isOpen} onOpenChange={handleClose}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            Create New{' '}
                            {showTabs.charAt(0).toUpperCase() +
                                showTabs.slice(1)}
                        </SheetTitle>
                        <SheetDescription>
                            Fill in the details below
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6">
                        <Suspense fallback={<FormLoader />}>
                            {showTabs === 'project' && (
                                <ProjectForm
                                    onSuccess={handleClose}
                                    organizationId={organizationId}
                                />
                            )}
                            {showTabs === 'requirement' && (
                                <div>Requirement Form: Work in Progress</div>
                            )}
                            {showTabs === 'document' && (
                                <DocumentForm
                                    projectId={projectId || ''}
                                    onSuccess={handleClose}
                                />
                            )}
                            {showTabs === 'organization' && (
                                <OrganizationForm onSuccess={handleClose} />
                            )}
                        </Suspense>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    // Original implementation with tabs
    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create New Item</SheetTitle>
                    <SheetDescription>
                        Select the type of item you want to create
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-6">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value: string) =>
                            setActiveTab(
                                value as
                                    | 'project'
                                    | 'requirement'
                                    | 'document'
                                    | 'organization',
                            )
                        }
                    >
                        <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="project">Project</TabsTrigger>
                            <TabsTrigger value="requirement">
                                Requirement
                            </TabsTrigger>
                            <TabsTrigger value="organization">
                                Organization
                            </TabsTrigger>
                        </TabsList>

                        <Suspense fallback={<FormLoader />}>
                            <TabsContent value="project" className="mt-6">
                                <ProjectForm
                                    onSuccess={handleClose}
                                    organizationId={organizationId}
                                />
                            </TabsContent>

                            <TabsContent value="requirement" className="mt-6">
                                <div>Requirement Form: Work in Progress</div>
                            </TabsContent>

                            <TabsContent value="organization" className="mt-6">
                                <OrganizationForm onSuccess={handleClose} />
                            </TabsContent>
                        </Suspense>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
