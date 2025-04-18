'use client';

import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
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
import { useDocumentStore } from '@/lib/store/document.store';
// Unused but might be needed in the future
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Block } from '@/types';
import { Json } from '@/types/base/database.types';

export function BlockCanvas({ documentId }: BlockCanvasProps) {
    const rolePermissions = React.useMemo(
        () =>
            ({
                owner: ['editBlock', 'deleteBlock', 'addBlock'],
                admin: ['editBlock', 'deleteBlock', 'addBlock'],
                maintainer: ['editBlock', 'deleteBlock', 'addBlock'],
                editor: ['editBlock', 'deleteBlock', 'addBlock'],
                viewer: [],
            }) as Record<
                'owner' | 'admin' | 'maintainer' | 'editor' | 'viewer',
                string[]
            >,
        [],
    );

    const {
        blocks: originalBlocks,
        loading,
        error,
        setDocument,
        blocks,
    } = useDocumentRealtime({
        documentId,
        _orgId: '',
        _projectId: '',
        _userProfile: null,
    });
    const { reorderBlocks, isEditMode, setIsEditMode } = useDocumentStore();
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const { userProfile } = useAuth();
    const { currentOrganization } = useOrganization();
    const params = useParams();

    // Explicitly type userRole
    const [userRole, setUserRole] = useState<
        'owner' | 'admin' | 'maintainer' | 'editor' | 'viewer' | null
    >(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            const projectId = params?.projectId || ''; // Extract project_id from the URL
            if (!projectId || !userProfile?.id) return;

            const { data, error } = await supabase
                .from('project_members')
                .select('role')
                .eq(
                    'project_id',
                    Array.isArray(projectId) ? projectId[0] : projectId,
                )
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
    const [enhancedBlocks, setEnhancedBlocks] = useState<
        BlockWithRequirements[]
    >([]);

    // Adapt the blocks to include order property
    useEffect(() => {
        // Skip re-processing if we're in the middle of adding a block
        // This prevents unnecessary re-renders
        if (isAddingBlockRef.current) {
            return;
        }

        if (originalBlocks) {
            const blocksWithOrder = originalBlocks.map(
                (block: BlockWithRequirements, index: number) => {
                    // Create a new object with all required properties
                    const enhancedBlock = {
                        ...block,
                        order: block.position || index, // Use position as order or fallback to index
                    } as BlockWithRequirements;

                    return enhancedBlock;
                },
            );
            setEnhancedBlocks(blocksWithOrder);
        }
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
            console.log(
                'Adding block of type:',
                type,
                'with content:',
                content,
            );
            // Set flag to prevent re-renders during block addition
            isAddingBlockRef.current = true;
            try {
                const result = await originalHandleAddBlock(type, content);
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
        [originalHandleAddBlock],
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
            return rolePermissions[
                (userRole || 'viewer') as keyof typeof rolePermissions
            ].includes(action);
        },
        [userRole],
    );

    const renderBlock = useCallback(
        (block: BlockWithRequirements) => {
            const isSelected = block.id === selectedBlockId;

            return (
                <SortableBlock
                    key={block.id}
                    block={block}
                    _isSelected={isSelected}
                    isEditMode={isEditMode && canPerformAction('editBlock')}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onUpdate={(content) =>
                        canPerformAction('editBlock') &&
                        handleUpdateBlock(block.id, content)
                    }
                    onDelete={() =>
                        canPerformAction('deleteBlock') &&
                        handleDeleteBlock(block.id)
                    }
                    onDoubleClick={() => {
                        if (canPerformAction('editBlock')) {
                            setSelectedBlockId(block.id);
                            setIsEditMode(true);
                        }
                    }}
                />
            );
        },
        [
            selectedBlockId,
            isEditMode,
            handleUpdateBlock,
            handleDeleteBlock,
            setIsEditMode,
            canPerformAction,
        ],
    );

    // Memoize the blocks to prevent unnecessary re-renders
    const memoizedBlocks = React.useMemo(() => {
        return enhancedBlocks?.map(renderBlock) || [];
    }, [enhancedBlocks, renderBlock]);

    const handleDragStart = (event: DragStartEvent) => {
        setSelectedBlockId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !enhancedBlocks) {
            return;
        }

        const oldIndex = enhancedBlocks.findIndex(
            (block) => block.id === active.id,
        );
        const newIndex = enhancedBlocks.findIndex(
            (block) => block.id === over.id,
        );

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

    // Don't render blocks until they're loaded
    if (loading) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState
                    isLoading={true}
                    isError={false}
                    error={null}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState
                    isLoading={false}
                    isError={true}
                    error={error}
                />
            </div>
        );
    }

    return (
        <div className="relative min-h-[500px] space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={
                        enhancedBlocks?.map(
                            (block: BlockWithRequirements) => block.id,
                        ) || []
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
                        onClick={() =>
                            handleAddBlock(BlockType.table, {
                                requirements: [],
                            })
                        }
                    >
                        <Table className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
