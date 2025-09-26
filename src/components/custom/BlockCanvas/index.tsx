'use client';

import {
    CollisionDetection,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    KeyboardSensor,
    PointerSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Table, Type } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { AddTableDialog } from '@/components/custom/BlockCanvas/components/AddTableDialog';
import { SortableBlock } from '@/components/custom/BlockCanvas/components/SortableBlock';
import { TableBlockLoadingState } from '@/components/custom/BlockCanvas/components/TableBlockLoadingState';
import { useBlockActions } from '@/components/custom/BlockCanvas/hooks/useBlockActions';
import {
    BlockCanvasProps,
    BlockType,
    BlockWithRequirements,
} from '@/components/custom/BlockCanvas/types';
import { Button } from '@/components/ui/button';
import { useDocumentRealtime } from '@/hooks/queries/useDocumentRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/lib/providers/organization.provider';
// Unused but might be needed in the future
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { useDocumentStore } from '@/store/document.store';
import { Block } from '@/types';
import { Json } from '@/types/base/database.types';

export function BlockCanvas({
    documentId,
    _useTanStackTables = false,
    _useGlideTables = false,
}: BlockCanvasProps) {
    const rolePermissions = React.useMemo(
        () =>
            ({
                owner: ['editBlock', 'deleteBlock', 'addBlock'],
                editor: ['editBlock', 'deleteBlock', 'addBlock'],
                viewer: [],
            }) as Record<'owner' | 'editor' | 'viewer', string[]>,
        [],
    );

    const {
        blocks: originalBlocks,
        loading,
        error,
        setDocument,
        blocks,
        hydrateBlockRelations,
        refetchDocument,
    } = useDocumentRealtime({
        documentId,
        _orgId: '',
        _projectId: '',
        _userProfile: null,
    });
    const { reorderBlocks, setUseTanStackTables, setUseGlideTables } = useDocumentStore();
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
    const [linePosition, setLinePosition] = useState<'top' | 'bottom' | ''>('');
    const { userProfile } = useAuth();
    const { currentOrganization } = useOrganization();
    const params = useParams();

    // Explicitly type userRole
    const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            const projectId = params?.projectId || ''; // Extract project_id from the URL
            if (!projectId || !userProfile?.id) return;

            const { data, error } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', Array.isArray(projectId) ? projectId[0] : projectId)
                .eq('user_id', userProfile.id)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return;
            }

            setUserRole(data?.role || null);
        };

        fetchUserRole();
    }, [params?.projectId, userProfile?.id]);

    // Use a ref to track if we're in the middle of adding a block
    // This helps prevent unnecessary re-renders
    const isAddingBlockRef = React.useRef(false);

    // Get org_id and project_id from URL params for new blocks
    const orgId = currentOrganization?.id as string;
    const projectId = params?.projectId as string;

    // Add order property to each block if it doesn't exist
    const [enhancedBlocks, setEnhancedBlocks] = useState<BlockWithRequirements[]>([]);

    // Adapt the blocks to include order property
    useEffect(() => {
        if (!originalBlocks) return;

        const blocksWithOrder = originalBlocks.map(
            (block: BlockWithRequirements, index: number) => {
                const enhancedBlock = {
                    ...block,
                    order: block.position || index,
                } as BlockWithRequirements;

                return enhancedBlock;
            },
        );
        setEnhancedBlocks(blocksWithOrder);
    }, [originalBlocks, orgId, projectId]);

    // Wrapper for setLocalBlocks that adds order
    const setEnhancedLocalBlocks = useCallback(
        (updater: React.SetStateAction<BlockWithRequirements[]>) => {
            const processBlocks = (
                blocks: BlockWithRequirements[],
            ): BlockWithRequirements[] => {
                return blocks.map(
                    (block: BlockWithRequirements, index: number) =>
                        ({
                            ...block,
                            order: index,
                        }) as BlockWithRequirements,
                );
            };

            if (typeof updater === 'function') {
                const prevBlocks = blocks || [];
                const newBlocks = updater(prevBlocks);
                setDocument(processBlocks(newBlocks));
            } else {
                setDocument(processBlocks(updater));
            }
        },
        [setDocument, blocks],
    );

    const {
        handleAddBlock: originalHandleAddBlock,
        handleUpdateBlock,
        handleDeleteBlock,
        handleReorder,
        _createDefaultBlockColumns,
    } = useBlockActions({
        documentId,
        userProfile,
        blocks: enhancedBlocks,
        setLocalBlocks: setEnhancedLocalBlocks,
        orgId,
        projectId,
    });

    // Wrap handleAddBlock to manage the isAddingBlock flag
    const handleAddBlock = useCallback(
        async (type: BlockType, content: Json) => {
            console.log('Adding block of type:', type, 'with content:', content);
            // Set flag to prevent re-renders during block addition
            isAddingBlockRef.current = true;
            try {
                const result = await originalHandleAddBlock(type, content);
                // If a table block was created, opportunistically hydrate its relations once
                if (result?.id && type === BlockType.table) {
                    try {
                        if (typeof hydrateBlockRelations === 'function') {
                            await hydrateBlockRelations(result.id);
                        }
                        // As a reliable fallback, do a full refetch to hydrate columns/requirements
                        if (typeof refetchDocument === 'function') {
                            await refetchDocument({ silent: false });
                            // Some DBs need a brief delay for column/property joins
                            setTimeout(() => {
                                refetchDocument({ silent: true }).catch(() => {});
                            }, 300);
                        }
                    } catch (e) {
                        console.warn('Table relations hydration failed (non-fatal):', e);
                    }
                }
                console.log('Block added successfully:', result);
                return result;
            } catch (error) {
                console.error('Error adding block:', error);
                throw error;
            } finally {
                // Reset flag after block is added
                isAddingBlockRef.current = false;
            }
        },
        [originalHandleAddBlock, hydrateBlockRelations, refetchDocument],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const canPerformAction = useCallback(
        (action: string) => {
            // Graceful fallback: if role hasn't been determined but user is authenticated,
            // allow core authoring actions so users aren't blocked by role fetch issues.
            if (!userRole && userProfile?.id) {
                if (action === 'addBlock' || action === 'editBlock') return true;
            }

            return rolePermissions[
                (userRole || 'viewer') as keyof typeof rolePermissions
            ].includes(action);
        },
        [userRole, rolePermissions, userProfile?.id],
    );

    // Table creation dialog state and handler must be declared before any early returns
    const [isAddTableOpen, setIsAddTableOpen] = useState(false);

    // Currently doesnt pass info, is getting hyjacked somewhere... Needs invesigation/rework.
    const createTableWithLayout = useCallback(
        async (layout: 'blank' | 'requirements_default', name: string) => {
            // We always create type='table' (DB constraint), and encode generic/requirements
            // via content.tableKind. 'blank' → genericTable, 'requirements_default' → requirements.
            const content: Json = {
                tableKind: layout === 'blank' ? 'genericTable' : 'requirements',
                columns: [],
                requirements: [],
                rows: [],
            } as unknown as Json;
            const created = await handleAddBlock(BlockType.table, content);
            if (created?.id && name) {
                await handleUpdateBlock(created.id, { name });
            }
        },
        [handleAddBlock, handleUpdateBlock],
    );

    const renderBlock = useCallback(
        (block: BlockWithRequirements) => {
            return (
                <SortableBlock
                    key={block.id}
                    block={block}
                    isOver={block.id === overId}
                    linePosition={linePosition}
                    onUpdate={(content) =>
                        canPerformAction('editBlock') &&
                        handleUpdateBlock(block.id, content)
                    }
                    onDelete={() =>
                        canPerformAction('deleteBlock') && handleDeleteBlock(block.id)
                    }
                    userProfile={userProfile} // Pass userprofile to table each block, prevent refetch for each table block.
                />
            );
        },
        [
            overId,
            linePosition,
            userProfile,
            canPerformAction,
            handleUpdateBlock,
            handleDeleteBlock,
        ],
    );

    // Memoize the blocks to prevent unnecessary re-renders
    const memoizedBlocks = React.useMemo(() => {
        return enhancedBlocks?.map(renderBlock) || [];
    }, [enhancedBlocks, renderBlock]);

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) {
            return;
        }
        setOverId(over.id !== active.id ? over.id : null);
        const oldIndex = enhancedBlocks.findIndex((block) => block.id === active.id);
        const newIndex = enhancedBlocks.findIndex((block) => block.id === over.id);
        setLinePosition(oldIndex > newIndex ? 'top' : 'bottom');
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setOverId(null);
        setLinePosition('');

        const { active, over } = event;

        if (!over || active.id === over.id || !enhancedBlocks) {
            return;
        }

        const oldIndex = enhancedBlocks.findIndex((block) => block.id === active.id);
        const newIndex = enhancedBlocks.findIndex((block) => block.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newBlocks = arrayMove(enhancedBlocks, oldIndex, newIndex).map(
                (block: BlockWithRequirements, index: number) => ({
                    ...block,
                    position: index,
                    order: index, // Ensure order is set
                }),
            );

            // Update local state immediately for smooth UI
            setEnhancedLocalBlocks(newBlocks);

            // Update document store
            reorderBlocks(newBlocks as Block[]);

            // Trigger server update
            handleReorder(newBlocks);
        }
    };

    // Set the use flag for selected table in the document store when it changes
    useEffect(() => {
        setUseTanStackTables(_useTanStackTables);
    }, [_useTanStackTables, setUseTanStackTables]);

    useEffect(() => {
        setUseGlideTables?.(_useGlideTables);
    }, [_useGlideTables, setUseGlideTables]);

    // Don't render blocks until they're loaded
    if (loading) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState isLoading={true} isError={false} error={null} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState isLoading={false} isError={true} error={error} />
            </div>
        );
    }

    // removed duplicate dialog state and handler

    return (
        <div className="relative min-h-[500px] space-y-4 pl-4">
            <DndContext
                sensors={sensors}
                collisionDetection={betweenTwoMidpoints}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={
                        enhancedBlocks?.map((block: BlockWithRequirements) => block.id) ||
                        []
                    }
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">{memoizedBlocks}</div>
                </SortableContext>
            </DndContext>
            {canPerformAction('addBlock') && (
                <div className="flex gap-2 mt-4 z-10 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            handleAddBlock(BlockType.text, {
                                format: 'markdown',
                                text: '',
                            })
                        }
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddTableOpen(true)}
                    >
                        <Table className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <AddTableDialog
                isOpen={isAddTableOpen}
                onClose={() => setIsAddTableOpen(false)}
                onCreate={async (layout, name) => {
                    await createTableWithLayout(layout, name);
                }}
            />
        </div>
    );
}

/*
On a high level view, this algorithm determines where a currently dragged block should go.
If the top of the dragged block is above the midpoint of a specific block, it will go above that block.
Otherwise, if the dragged block is below the midpoint of a specific block, it will go below that block.
Please exercise caution as minor changes can completely change the dragging behavior. 
*/
const betweenTwoMidpoints: CollisionDetection = ({
    collisionRect,
    droppableRects,
    droppableContainers,
    active,
}) => {
    const offsetFromTop = 20;
    const topOfDrag = collisionRect.top + offsetFromTop;

    const containers = droppableContainers
        .map((c) => {
            const rect = droppableRects.get(c.id);
            if (!rect) return null;

            return { id: c.id, midY: rect.top + rect.height / 2 };
        })
        .filter(Boolean) as { id: string; midY: number }[];

    // Sort containers by their midpoints from top to bottom
    containers.sort((a, b) => a.midY - b.midY);

    if (containers.length === 1) {
        return [{ id: containers[0].id }];
    }

    // Check container position relative to container that is holding the dragged block
    let isBelow = 0;
    const activeContainerId = active.id;
    for (let i = 0; i < containers.length; i++) {
        const container = containers[i];

        isBelow = container.id === activeContainerId ? 1 : isBelow;

        // Edge Cases below require different calculations.
        if (i === 0) {
            if (topOfDrag <= containers[i + isBelow].midY) {
                return [{ id: container.id }];
            }
        } else if (i === containers.length - 1 && topOfDrag >= containers[i - 1].midY) {
            return [{ id: container.id }];
        } else if (
            topOfDrag >= containers[i - 1].midY &&
            topOfDrag <= containers[i + isBelow].midY
        ) {
            return [{ id: container.id }];
        }
    }

    return [];
};
