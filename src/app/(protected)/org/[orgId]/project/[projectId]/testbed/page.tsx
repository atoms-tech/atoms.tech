'use client';

import { ChevronDown, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import TraceabilityMatrixView from '@/components/custom/RequirementsTesting/TestMatrix/components/TestMatrix';
import TestCaseView from '@/components/custom/RequirementsTesting/TestTable/TestTable';
import { useCreateTestReq } from '@/components/custom/RequirementsTesting/hooks/useTestReq';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/types/base/database.types';

export default function TestBed() {
    const [viewMode, setViewMode] = useState<'Test Cases' | 'Traceability Matrix'>(
        'Test Cases',
    );
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTestData, setNewTestData] = useState({
        title: '',
        description: '',
        test_type: 'unit' as Database['public']['Enums']['test_type'],
        method: 'manual' as Database['public']['Enums']['test_method'],
        priority: 'medium' as Database['public']['Enums']['test_priority'],
        status: 'draft' as Database['public']['Enums']['test_status'],
        test_id: '',
    });
    const params = useParams();
    const projectId = params?.projectId as string || '';
    const { toast } = useToast();
    const createTestReq = useCreateTestReq();

    const handleCreateTest = async () => {
        if (!newTestData.title) {
            toast({
                title: 'Error',
                description: 'Title is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            await createTestReq.mutateAsync({
                ...newTestData,
                project_id: projectId as string,
                is_active: true,
            });

            toast({
                title: 'Success',
                description: 'Test case created successfully',
                variant: 'default',
            });

            setShowAddModal(false);
            setNewTestData({
                title: '',
                description: '',
                test_type: 'unit',
                method: 'manual',
                priority: 'medium',
                status: 'draft',
                test_id: '',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Failed to create test case',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-7xl">
            <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-light tracking-tight">
                        Verification Tracing
                    </h1>

                    <div className="flex items-center gap-3">
                        <div className="relative min-w-[180px]">
                            <select
                                className="w-full appearance-none bg-background border border-border px-4 h-10 rounded-md 
                                         text-sm font-medium
                                         focus:ring-2 focus:ring-accent/20 focus:border-accent hover:border-accent/50 transition-colors
                                         dark:bg-background dark:border-border dark:text-foreground"
                                value={viewMode}
                                onChange={(e) =>
                                    setViewMode(
                                        e.target.value as
                                            | 'Test Cases'
                                            | 'Traceability Matrix',
                                    )
                                }
                            >
                                <option>Test Cases</option>
                                <option>Traceability Matrix</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/70 pointer-events-none" />
                        </div>

                        <Button
                            onClick={() => setShowAddModal(true)}
                            className="bg-accent text-accent-foreground h-10 px-4 rounded-md font-medium
                                     hover:bg-accent/90 dark:bg-accent/90 dark:text-accent-foreground dark:hover:bg-accent/70 
                                     transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Test</span>
                        </Button>
                    </div>
                </div>

                <div className="bg-card dark:bg-card text-card-foreground rounded-lg border border-border">
                    {viewMode === 'Test Cases' ? (
                        <TestCaseView projectId={projectId as string} />
                    ) : (
                        <TraceabilityMatrixView projectId={projectId as string} />
                    )}
                </div>
            </div>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[600px] border-0 p-0 bg-background dark:bg-background">
                    <div className="border-b border-border p-6">
                        <DialogTitle className="text-xl font-light tracking-tight">
                            Add New Test Case
                        </DialogTitle>
                    </div>

                    <div className="space-y-6 p-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm mb-2 text-muted-foreground">
                                    Test ID
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border-b border-border bg-transparent focus:border-accent transition-colors outline-none
                                             dark:border-border dark:text-foreground dark:focus:border-accent"
                                    value={newTestData.test_id}
                                    onChange={(e) =>
                                        setNewTestData({
                                            ...newTestData,
                                            test_id: e.target.value,
                                        })
                                    }
                                    placeholder="Enter test ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-2 text-muted-foreground">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border-b border-border bg-transparent focus:border-accent transition-colors outline-none
                                             dark:border-border dark:text-foreground dark:focus:border-accent"
                                    value={newTestData.title}
                                    onChange={(e) =>
                                        setNewTestData({
                                            ...newTestData,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Test case title"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-2 text-muted-foreground">
                                Description
                            </label>
                            <textarea
                                className="w-full p-2 border border-border bg-transparent focus:border-accent transition-colors outline-none min-h-[100px] resize-none rounded-md
                                         dark:border-border dark:text-foreground dark:focus:border-accent"
                                value={newTestData.description}
                                onChange={(e) =>
                                    setNewTestData({
                                        ...newTestData,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Test case description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm mb-2 text-muted-foreground">
                                    Type
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2 border-b border-border bg-transparent focus:border-accent transition-colors outline-none appearance-none
                                                 dark:border-border dark:text-foreground dark:focus:border-accent"
                                        value={newTestData.test_type}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                test_type: e.target
                                                    .value as Database['public']['Enums']['test_type'],
                                            })
                                        }
                                    >
                                        <option value="unit">Unit</option>
                                        <option value="integration">Integration</option>
                                        <option value="system">System</option>
                                        <option value="acceptance">Acceptance</option>
                                        <option value="performance">Performance</option>
                                        <option value="security">Security</option>
                                        <option value="usability">Usability</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm mb-2 text-muted-foreground">
                                    Method
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2 border-b border-border bg-transparent focus:border-accent transition-colors outline-none appearance-none
                                                 dark:border-border dark:text-foreground dark:focus:border-accent"
                                        value={newTestData.method}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                method: e.target
                                                    .value as Database['public']['Enums']['test_method'],
                                            })
                                        }
                                    >
                                        <option value="manual">Manual</option>
                                        <option value="automated">Automated</option>
                                        <option value="matrix">Test Matrix</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm mb-2 text-muted-foreground">
                                    Priority
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2 border-b border-border bg-transparent focus:border-accent transition-colors outline-none appearance-none
                                                 dark:border-border dark:text-foreground dark:focus:border-accent"
                                        value={newTestData.priority}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                priority: e.target
                                                    .value as Database['public']['Enums']['test_priority'],
                                            })
                                        }
                                    >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 p-6 border-t border-border bg-muted/50 dark:bg-muted/10">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className="border-border hover:bg-muted dark:border-border dark:hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTest}
                            disabled={!newTestData.title || createTestReq.isPending}
                            className="bg-accent text-accent-foreground hover:bg-accent/90 dark:bg-accent/90 dark:text-accent-foreground dark:hover:bg-accent/70"
                        >
                            {createTestReq.isPending ? 'Creating...' : 'Create Test Case'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
