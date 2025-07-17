'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { useProjectTestCases } from '@/components/custom/RequirementsTesting/hooks/useTestReq';
import { TestReq } from '@/components/custom/RequirementsTesting/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database } from '@/types/base/database.types';

import { DataTable, columns } from './TanstackTestTable';

interface TestCaseViewProps {
    projectId: string;
}

type TestData = {
    id?: string;
    title: string;
    description: string;
    test_type: Database['public']['Enums']['test_type'];
    method: Database['public']['Enums']['test_method'];
    priority: Database['public']['Enums']['test_priority'];
    status: Database['public']['Enums']['test_status'];
    test_id?: string | null;
};

type TestFilters = {
    status: Database['public']['Enums']['test_status'][];
    type: Database['public']['Enums']['test_type'][];
    search: string;
};

// Separate search input component to prevent main table re-renders
function SearchInput({ onSearch }: { onSearch: (value: string) => void }) {
    const [value, setValue] = useState('');

    const debouncedSearch = useMemo(
        () =>
            debounce((searchValue: string) => {
                onSearch(searchValue);
            }, 300),
        [onSearch],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedSearch(newValue);
    };

    return (
        <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder="Search test cases..."
                value={value}
                onChange={handleChange}
                className="pl-9"
            />
        </div>
    );
}

// Separate pagination size selector to prevent re-renders
function PageSizeSelector({
    pageSize,
    onPageSizeChange,
    totalItems,
}: {
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    totalItems: number;
}) {
    return (
        <select
            className="p-2 border rounded-md bg-background"
            value={pageSize === totalItems ? 'all' : pageSize}
            onChange={(e) => {
                const value =
                    e.target.value === 'all' ? totalItems : parseInt(e.target.value, 10);
                onPageSizeChange(value);
            }}
        >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="all">All</option>
        </select>
    );
}

export default function TestCaseView({ projectId }: TestCaseViewProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const [editingTest, setEditingTest] = useState<TestData | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [filters, setFilters] = useState<TestFilters>({
        status: [],
        type: [],
        search: '',
    });

    const queryClient = useQueryClient();

    const handleSearch = useCallback((value: string) => {
        setFilters((prev) => ({
            ...prev,
            search: value,
        }));
    }, []);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
    }, []);

    // Fetch test cases with pagination
    const {
        data: testCasesData,
        isLoading,
        error,
    } = useProjectTestCases(projectId, filters, {
        page: currentPage,
        pageSize,
        orderBy: 'updated_at',
        orderDirection: 'desc',
    });

    // Mutations
    const updateTestReq = useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<TestReq>;
        }) => {
            const { data, error } = await supabase
                .from('test_req')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as TestReq;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.testReq.root });
            queryClient.invalidateQueries({
                queryKey: queryKeys.testReq.byProject(data.project_id!),
            });
            queryClient.setQueryData(queryKeys.testReq.detail(data.id!), data);
        },
    });

    const deleteTestReq = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('test_req')
                .update({ is_active: false })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as TestReq;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.testReq.root });
            queryClient.invalidateQueries({
                queryKey: queryKeys.testReq.byProject(data.project_id!),
            });
        },
    });

    // Handle updating a test case
    const handleUpdateTest = async () => {
        if (!editingTest?.id) return;

        try {
            await updateTestReq.mutateAsync({
                id: editingTest.id,
                updates: {
                    title: editingTest.title,
                    description: editingTest.description,
                    test_type: editingTest.test_type,
                    method: editingTest.method,
                    status: editingTest.status,
                    priority: editingTest.priority,
                    test_id: editingTest.test_id,
                },
            });

            setShowEditModal(false);
            setEditingTest(null);
        } catch (error) {
            console.error('Error updating test case:', error);
        }
    };

    // Handle deleting a test case
    const handleDeleteTest = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this test case?')) {
            try {
                await deleteTestReq.mutateAsync(id);
            } catch (error) {
                console.error('Error deleting test case:', error);
            }
        }
    };

    // Helper functions to get status and priority styles
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'blocked':
                return 'bg-red-100 text-red-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'text-red-600';
            case 'high':
                return 'text-orange-500';
            case 'medium':
                return 'text-blue-500';
            default:
                return 'text-gray-500';
        }
    };

    const handleEdit = (testCase: TestReq) => {
        setEditingTest({
            id: testCase.id,
            title: testCase.title,
            description: testCase.description || '',
            test_type: testCase.test_type,
            method: testCase.method,
            status: testCase.status,
            priority: testCase.priority,
            test_id: testCase.test_id,
        });
        setShowEditModal(true);
    };

    if (isLoading) {
        return <div className="p-6 text-center">Loading test cases...</div>;
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-500">
                Error loading test cases: {error.message}
            </div>
        );
    }

    const testCases = testCasesData?.data || [];
    const totalItems = testCasesData?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="bg-background">
            <div className="p-4 border-b flex items-center space-x-4">
                <div className="text-lg font-medium flex-shrink-0">
                    Test Cases ({totalItems})
                </div>
                <SearchInput onSearch={handleSearch} />
                <div className="flex-shrink-0">
                    <PageSizeSelector
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange}
                        totalItems={totalItems}
                    />
                </div>
            </div>

            <DataTable
                data={testCases}
                columns={columns}
                pageCount={totalPages}
                pageSize={pageSize}
                pageIndex={currentPage - 1}
                onPaginationChange={(pageIndex, newPageSize) => {
                    setCurrentPage(pageIndex + 1);
                    setPageSize(newPageSize);
                }}
                getStatusStyle={getStatusStyle}
                getPriorityStyle={getPriorityStyle}
                onEdit={handleEdit}
                onDelete={handleDeleteTest}
            />

            {/* Edit Test Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <div className="p-6">
                        <h3 className="text-lg font-medium mb-4">Edit Test Case</h3>

                        {editingTest && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Test ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        value={editingTest.test_id || ''}
                                        onChange={(e) =>
                                            setEditingTest({
                                                ...editingTest,
                                                test_id: e.target.value,
                                            })
                                        }
                                        placeholder="Enter test ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        value={editingTest.title}
                                        onChange={(e) =>
                                            setEditingTest({
                                                ...editingTest,
                                                title: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full p-2 border rounded"
                                        rows={3}
                                        value={editingTest.description}
                                        onChange={(e) =>
                                            setEditingTest({
                                                ...editingTest,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Type
                                        </label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={editingTest.test_type}
                                            onChange={(e) =>
                                                setEditingTest({
                                                    ...editingTest,
                                                    test_type: e.target
                                                        .value as Database['public']['Enums']['test_type'],
                                                })
                                            }
                                        >
                                            <option value="unit">Unit</option>
                                            <option value="integration">
                                                Integration
                                            </option>
                                            <option value="system">System</option>
                                            <option value="acceptance">Acceptance</option>
                                            <option value="performance">
                                                Performance
                                            </option>
                                            <option value="security">Security</option>
                                            <option value="usability">Usability</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Method
                                        </label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={editingTest.method}
                                            onChange={(e) =>
                                                setEditingTest({
                                                    ...editingTest,
                                                    method: e.target
                                                        .value as Database['public']['Enums']['test_method'],
                                                })
                                            }
                                        >
                                            <option value="manual">Manual</option>
                                            <option value="automated">Automated</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Status
                                        </label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={editingTest.status}
                                            onChange={(e) =>
                                                setEditingTest({
                                                    ...editingTest,
                                                    status: e.target
                                                        .value as Database['public']['Enums']['test_status'],
                                                })
                                            }
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="ready">Ready</option>
                                            <option value="in_progress">
                                                In Progress
                                            </option>
                                            <option value="blocked">Blocked</option>
                                            <option value="completed">Completed</option>
                                            <option value="obsolete">Obsolete</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Priority
                                        </label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={editingTest.priority}
                                            onChange={(e) =>
                                                setEditingTest({
                                                    ...editingTest,
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
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateTest}
                                disabled={updateTestReq.isPending}
                            >
                                {updateTestReq.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
