import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';
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
                const api = atomsApiClient();
                const block = await api.documents.getBlockById(blockId);

                if (!block) {
                    console.error(
                        '[updateBlockMetadata] Failed to fetch block content:',
                        'not found',
                    );
                    throw new Error('Block not found');
                }

                // Casting to unknown puts validation on us. Fallbacks included below.
                const currentContentRaw = (block as any)?.content ?? {};

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

                await api.documents.updateBlock(blockId, {
                    content: updatedContent as unknown as Json,
                } as any);

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
