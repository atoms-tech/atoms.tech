'use client';

import {
    ColDef,
    GridReadyEvent,
    SelectionChangedEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useCallback, useMemo, useState } from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { formatDistanceToNow } from 'date-fns';
import {
    Calendar,
    Download,
    Eye,
    Filter,
    History,
    RefreshCw,
    RotateCcw,
    Search,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRestoreVersion } from '@/hooks/mutations/useVersionRestore';
import { usePaginatedAnalyticsActivities } from '@/hooks/queries/useAnalytics';
import {
    AnalyticsActivity,
    AnalyticsDataGridProps,
} from '@/types/analytics.types';

export function AnalyticsDataGrid({
    orgId,
    projectId,
    initialFilters,
    height = 600,
    enableExport = true,
    enableRestore = true,
}: AnalyticsDataGridProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
    const [selectedRows, setSelectedRows] = useState<AnalyticsActivity[]>([]);

    const {
        data,
        isLoading,
        error,
        refetch,
        params,
        setFilters,
        setPageSize,
        nextPage,
        previousPage,
        hasNextPage,
        hasPreviousPage,
        currentPage,
        totalPages,
    } = usePaginatedAnalyticsActivities(orgId, projectId, initialFilters);

    const restoreVersionMutation = useRestoreVersion();

    // Column definitions for AG Grid
    const columnDefs = useMemo<ColDef[]>(
        () => [
            {
                headerName: 'Time',
                field: 'created_at',
                width: 180,
                valueFormatter: (params) => {
                    if (!params.value) return '';
                    return formatDistanceToNow(new Date(params.value), {
                        addSuffix: true,
                    });
                },
                sortable: true,
                filter: 'agDateColumnFilter',
            },
            {
                headerName: 'User',
                field: 'actor_name',
                width: 150,
                sortable: true,
                filter: 'agTextColumnFilter',
                cellRenderer: (params: any) => {
                    const { actor_name, actor_email } = params.data;
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">
                                {actor_name || 'Unknown'}
                            </span>
                            {actor_email && (
                                <span className="text-xs text-muted-foreground">
                                    {actor_email}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                headerName: 'Action',
                field: 'action',
                width: 120,
                sortable: true,
                filter: 'agTextColumnFilter',
                cellRenderer: (params: any) => {
                    const action = params.value;
                    const getActionColor = (action: string) => {
                        switch (action) {
                            case 'created':
                                return 'bg-green-100 text-green-800';
                            case 'updated':
                                return 'bg-blue-100 text-blue-800';
                            case 'deleted':
                                return 'bg-red-100 text-red-800';
                            case 'restored':
                                return 'bg-purple-100 text-purple-800';
                            default:
                                return 'bg-gray-100 text-gray-800';
                        }
                    };

                    return (
                        <Badge className={`${getActionColor(action)} border-0`}>
                            {action}
                        </Badge>
                    );
                },
            },
            {
                headerName: 'Entity Type',
                field: 'entity_type',
                width: 130,
                sortable: true,
                filter: 'agTextColumnFilter',
                cellRenderer: (params: any) => {
                    const type = params.value;
                    return (
                        <Badge variant="outline" className="capitalize">
                            {type}
                        </Badge>
                    );
                },
            },
            {
                headerName: 'Entity ID',
                field: 'entity_id',
                width: 200,
                sortable: true,
                filter: 'agTextColumnFilter',
                cellRenderer: (params: any) => (
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {params.value?.slice(0, 8)}...
                    </code>
                ),
            },
            {
                headerName: 'Changes',
                field: 'changes_summary',
                flex: 1,
                sortable: false,
                filter: 'agTextColumnFilter',
                cellRenderer: (params: any) => (
                    <span className="text-sm text-muted-foreground">
                        {params.value || 'No details available'}
                    </span>
                ),
            },
            {
                headerName: 'Actions',
                field: 'actions',
                width: 150,
                sortable: false,
                filter: false,
                cellRenderer: (params: any) => {
                    const activity: AnalyticsActivity = params.data;

                    return (
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(activity)}
                                className="h-7 w-7 p-0"
                            >
                                <Eye className="h-3 w-3" />
                            </Button>

                            {enableRestore && activity.action !== 'deleted' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRestore(activity)}
                                    disabled={restoreVersionMutation.isPending}
                                    className="h-7 w-7 p-0"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewHistory(activity)}
                                className="h-7 w-7 p-0"
                            >
                                <History className="h-3 w-3" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [enableRestore, restoreVersionMutation.isPending],
    );

    // Event handlers
    const handleGridReady = useCallback((event: GridReadyEvent) => {
        // Grid is ready
    }, []);

    const handleSelectionChanged = useCallback(
        (event: SelectionChangedEvent) => {
            const selectedNodes = event.api.getSelectedNodes();
            const selectedData = selectedNodes.map((node) => node.data);
            setSelectedRows(selectedData);
        },
        [],
    );

    const handleViewDetails = useCallback((activity: AnalyticsActivity) => {
        // TODO: Open details modal
        console.log('View details for:', activity);
    }, []);

    const handleRestore = useCallback(
        (activity: AnalyticsActivity) => {
            if (!activity.entity_id || !activity.entity_type) return;

            // Validate entity type is supported for restoration
            const validEntityTypes = [
                'document',
                'block',
                'requirement',
            ] as const;
            if (!validEntityTypes.includes(activity.entity_type as any)) {
                console.warn(
                    `Entity type ${activity.entity_type} is not supported for restoration`,
                );
                return;
            }

            restoreVersionMutation.mutate({
                entityId: activity.entity_id,
                entityType: activity.entity_type as
                    | 'document'
                    | 'block'
                    | 'requirement',
                targetVersion: 1, // TODO: Get actual version from activity
                auditLogId: activity.id,
                reason: 'Restored from analytics grid',
            });
        },
        [restoreVersionMutation],
    );

    const handleViewHistory = useCallback((activity: AnalyticsActivity) => {
        // TODO: Open version history modal
        console.log('View history for:', activity);
    }, []);

    const handleSearch = useCallback(() => {
        setFilters({
            search: searchTerm || undefined,
        });
    }, [searchTerm, setFilters]);

    const handleActionFilter = useCallback(
        (action: string) => {
            setSelectedAction(action);
            setFilters({
                actions: action === 'all' ? undefined : [action],
            });
        },
        [setFilters],
    );

    const handleEntityTypeFilter = useCallback(
        (entityType: string) => {
            setSelectedEntityType(entityType);
            setFilters({
                entityTypes: entityType === 'all' ? undefined : [entityType],
            });
        },
        [setFilters],
    );

    const handleExport = useCallback(() => {
        // TODO: Implement export functionality
        console.log('Export data');
    }, []);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-red-500">
                Error loading analytics data: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2 items-center">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                            className="pl-8 w-64"
                        />
                    </div>

                    <Select
                        value={selectedAction}
                        onValueChange={handleActionFilter}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="created">Created</SelectItem>
                            <SelectItem value="updated">Updated</SelectItem>
                            <SelectItem value="deleted">Deleted</SelectItem>
                            <SelectItem value="restored">Restored</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedEntityType}
                        onValueChange={handleEntityTypeFilter}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Entity Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="document">Documents</SelectItem>
                            <SelectItem value="block">Blocks</SelectItem>
                            <SelectItem value="requirement">
                                Requirements
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>

                    {enableExport && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </div>

            {/* Data Grid */}
            <div className="ag-theme-alpine" style={{ height }}>
                <AgGridReact
                    rowData={data?.data || []}
                    columnDefs={columnDefs}
                    onGridReady={handleGridReady}
                    onSelectionChanged={handleSelectionChanged}
                    rowSelection="multiple"
                    suppressRowClickSelection={true}
                    animateRows={true}
                    pagination={false} // We handle pagination manually
                    loading={isLoading}
                    noRowsOverlayComponent={() => (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Filter className="h-8 w-8 mb-2" />
                            <p>No activities found</p>
                        </div>
                    )}
                />
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {data?.data.length || 0} of {data?.total || 0}{' '}
                    activities
                    {selectedRows.length > 0 && (
                        <span className="ml-2">
                            ({selectedRows.length} selected)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={previousPage}
                        disabled={!hasPreviousPage || isLoading}
                    >
                        Previous
                    </Button>

                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={nextPage}
                        disabled={!hasNextPage || isLoading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
