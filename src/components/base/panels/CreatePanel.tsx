'use client';

import ProjectForm from '@/components/base/forms/ProjectForm';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';
import DocumentForm from '../forms/DocumentForm';

// import RequirementForm from '@/components/base/forms/RequirementForm';

export interface CreatePanelProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'project' | 'requirement' | 'document';
    projectId?: string; // For creating requirements under a project
    showTabs?: 'show' | 'project' | 'requirement' | 'document';
}

export function CreatePanel({
    isOpen,
    onClose,
    initialTab = 'project',
    projectId,
    showTabs = 'show',
}: CreatePanelProps) {
    const [activeTab, setActiveTab] = React.useState(initialTab);

    const handleClose = () => {
        onClose();
        // Reset to initial tab when closing
        setActiveTab(initialTab);
    };

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
                        {showTabs === 'project' && (
                            <ProjectForm onSuccess={handleClose} />
                        )}
                        {showTabs === 'requirement' && (
                            // <RequirementForm
                            //     projectId={projectId}
                            //     onSuccess={handleClose}
                            // />
                            <div>Requirement Form: Work in Progress</div>
                        )}
                        {showTabs === 'document' && (
                            <DocumentForm
                                projectId={projectId || ''}
                                onSuccess={handleClose}
                            />
                        )}
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
                                value as 'project' | 'requirement' | 'document',
                            )
                        }
                    >
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="project">Project</TabsTrigger>
                            <TabsTrigger value="requirement">
                                Requirement
                            </TabsTrigger>
                            <TabsTrigger value="document">Document</TabsTrigger>
                        </TabsList>

                        <TabsContent value="project" className="mt-6">
                            <ProjectForm onSuccess={handleClose} />
                        </TabsContent>

                        <TabsContent value="requirement" className="mt-6">
                            {/* <RequirementForm
                                projectId={projectId}
                                onSuccess={handleClose}
                            /> */}
                            <div>Requirement Form: Work in Progress</div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
}
