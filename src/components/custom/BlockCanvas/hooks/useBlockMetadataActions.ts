import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Json } from '@/types/base/database.types';

export interface ColumnMetadata {
    columnId: string;
    position: number;
    width?: number;
    name?: string;
}

export interface RequirementMetadata {
    requirementId: string;
    position: number;
    height?: number;
}

export interface RowMetadata {
    rowId: string;
    position: number;
    height?: number;
}

export interface BlockTableMetadata {
    columns: ColumnMetadata[];
    requirements: RequirementMetadata[];
    // Optional alternate key for generic tables
    rows?: RowMetadata[];
    // Preserve the table kind so we don't switch pipelines inadvertently
    tableKind?: string;
}

export const useBlockMetadataActions = () => {
    const queryClient = useQueryClient();
    const { getClientOrThrow } = useAuthenticatedSupabase();

    const updateBlockMetadata = useCallback(
        async (blockId: string, partialMetadata: Partial<BlockTableMetadata>) => {
            if (!blockId) {
                throw new Error('[updateBlockMetadata] blockId is required.');
            }

            try {
                const supabase = getClientOrThrow();

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
                    columns: Array.isArray(
                        (safeContent as Partial<BlockTableMetadata>).columns,
                    )
                        ? ((safeContent as Partial<BlockTableMetadata>)
                              .columns as ColumnMetadata[])
                        : [],
                    requirements: Array.isArray(
                        (safeContent as Partial<BlockTableMetadata>).requirements,
                    )
                        ? ((safeContent as Partial<BlockTableMetadata>)
                              .requirements as RequirementMetadata[])
                        : [],
                    rows: Array.isArray((safeContent as Partial<BlockTableMetadata>).rows)
                        ? ((safeContent as Partial<BlockTableMetadata>)
                              .rows as RowMetadata[])
                        : undefined,
                    tableKind: (safeContent as Partial<BlockTableMetadata>).tableKind,
                };

                // ensures renamed column names are not overwritten by stale data
                const updatedContent: BlockTableMetadata = {
                    ...currentContent,
                    columns:
                        partialMetadata.columns !== undefined
                            ? partialMetadata.columns
                            : currentContent.columns,
                    requirements:
                        partialMetadata.requirements !== undefined
                            ? partialMetadata.requirements
                            : currentContent.requirements,
                    rows:
                        partialMetadata.rows !== undefined
                            ? partialMetadata.rows
                            : currentContent.rows,
                    // Ensure tableKind is never lost even if not present in partialMetadata
                    tableKind:
                        (partialMetadata as Partial<BlockTableMetadata>).tableKind ??
                        currentContent.tableKind,
                };

                const { data: updateResult, error: updateError } = await supabase
                    .from('blocks')
                    .update({ content: updatedContent as unknown as Json })
                    .eq('id', blockId)
                    .select('content');

                if (updateError) {
                    console.error(
                        '[updateBlockMetadata] Failed to update content: ',
                        updateError,
                    );
                    throw updateError;
                }

                const savedContent = updateResult?.[0]?.content as unknown as {
                    columns?: { columnId?: string; name?: string }[];
                };

                const savedColumns = savedContent?.columns || [];

                // Verify that if we updated columns, the saved columns match what we sent
                if (partialMetadata.columns !== undefined) {
                    const sentColumnNames = partialMetadata.columns.map((c) => ({
                        columnId: c.columnId,
                        name: c.name,
                    }));
                    const savedColumnNames = savedColumns.map(
                        (c: { columnId?: string; name?: string }) => ({
                            columnId: c.columnId,
                            name: c.name,
                        }),
                    );
                    const namesMatch =
                        JSON.stringify(sentColumnNames) ===
                        JSON.stringify(savedColumnNames);

                    if (!namesMatch) {
                        console.error(
                            '[updateBlockMetadata] CRITICAL: Saved columns do not match sent columns!',
                            {
                                sent: sentColumnNames,
                                saved: savedColumnNames,
                            },
                        );
                    }
                }

                await queryClient.invalidateQueries({
                    queryKey: queryKeys.blocks.detail(blockId),
                });
            } catch (err) {
                console.error('[updateBlockMetadata] Unexpected error:', err);
                throw err;
            }
        },
        [getClientOrThrow, queryClient],
    );

    return {
        updateBlockMetadata,
    };
};
