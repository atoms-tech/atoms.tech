import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Json } from '@/types/base/database.types';

export interface ColumnMetadata {
    columnId: string;
    position: number;
    width?: number;
}

export interface RequirementMetadata {
    requirementId: string;
    position: number;
    height?: number;
}

export interface BlockTableMetadata {
    columns: ColumnMetadata[];
    requirements: RequirementMetadata[];
}

export const useBlockMetadataActions = () => {
    const queryClient = useQueryClient();

    // Replace block level metadata entry. Grab current version and merge passed changes.
    const updateBlockMetadata = useCallback(
        async (
            blockId: string,
            partialMetadata: Partial<BlockTableMetadata>, // you can update only `columns`, or only `requirements`, or both
        ) => {
            if (!blockId) {
                throw new Error('[updateBlockMetadata] blockId is required.');
            }

            try {
                //console.debug('[updateBlockMetadata] Updating metadata for blockId:', blockId);

                // Fetch existing content to preserve other fields
                const { data: blockData, error: fetchError } = await supabase
                    .from('blocks')
                    .select('content')
                    .eq('id', blockId)
                    .single();

                if (fetchError) {
                    console.error(
                        '[updateBlockMetadata] Failed to fetch block content:',
                        fetchError,
                    );
                    throw fetchError;
                }

                // Casting to unknown puts validation on us. Fallbacks included below.
                const currentContentRaw = blockData?.content ?? {};

                function isBlockTableMetadata(
                    obj: unknown,
                ): obj is Partial<BlockTableMetadata> {
                    return typeof obj === 'object' && obj !== null;
                }

                const safeContent = isBlockTableMetadata(currentContentRaw)
                    ? currentContentRaw
                    : {};

                const currentContent: BlockTableMetadata = {
                    columns: Array.isArray(safeContent.columns)
                        ? safeContent.columns
                        : [],
                    requirements: Array.isArray(safeContent.requirements)
                        ? safeContent.requirements
                        : [],
                };

                const updatedContent: BlockTableMetadata = {
                    ...currentContent,
                    ...partialMetadata,
                };

                //console.debug('[updateBlockMetadata] Content to be sent:', JSON.stringify(updatedContent, null, 2));

                const { error: updateError } = await supabase
                    .from('blocks')
                    .update({ content: updatedContent as unknown as Json })
                    .eq('id', blockId);

                if (updateError) {
                    console.error(
                        '[updateBlockMetadata] Failed to update content: ',
                        updateError,
                    );
                    throw updateError;
                }

                console.debug(
                    '[updateBlockMetadata] Successfully updated block metadata for block: ',
                    blockId,
                );

                await queryClient.invalidateQueries({
                    queryKey: queryKeys.blocks.detail(blockId),
                });
            } catch (err) {
                console.error('[updateBlockMetadata] Unexpected error:', err);
                throw err;
            }
        },
        [queryClient],
    );

    return {
        updateBlockMetadata,
    };
};
