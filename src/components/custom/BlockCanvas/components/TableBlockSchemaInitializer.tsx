import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';

import {
    BlockPropertySchema,
    BlockWithRequirements,
} from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

interface TableBlockSchemaInitializerProps {
    block: BlockWithRequirements;
    blockPropertySchemas: BlockPropertySchema[] | undefined;
    isLoadingSchemas: boolean;
    createBlockPropertySchemas: () => Promise<BlockPropertySchema[]>;
}

export const TableBlockSchemaInitializer: React.FC<
    TableBlockSchemaInitializerProps
> = ({
    block,
    blockPropertySchemas,
    isLoadingSchemas,
    createBlockPropertySchemas,
}) => {
    const queryClient = useQueryClient();

    // Setup realtime subscription for block property schemas
    useEffect(() => {
        const channel = supabase
            .channel(`block_property_schemas_${block.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'block_property_schemas',
                    filter: `block_id=eq.${block.id}`,
                },
                () => {
                    // Invalidate the query to trigger a refetch
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.blockPropertySchemas.byBlock(
                            block.id,
                        ),
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [block.id, queryClient]);

    // Create block property schemas if they don't exist yet
    useEffect(() => {
        const createSchemas = async () => {
            try {
                await createBlockPropertySchemas();
            } catch (error) {
                console.error(error);
                // Error handling is done in the parent component
            }
        };

        if (
            !isLoadingSchemas &&
            blockPropertySchemas?.length === 0 &&
            block.type === 'table'
        ) {
            createSchemas();
        }
    }, [
        blockPropertySchemas,
        block.type,
        createBlockPropertySchemas,
        isLoadingSchemas,
    ]);

    // Manually check database for schemas if we're stuck loading
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isLoadingSchemas) {
            timeoutId = setTimeout(async () => {
                try {
                    const { data, error } = await supabase
                        .from('block_property_schemas')
                        .select('*')
                        .eq('block_id', block.id)
                        .eq('is_deleted', false);

                    if (!error && data?.length === 0) {
                        try {
                            const schemas = await createBlockPropertySchemas();
                            console.log('schemas', schemas);
                            // Force a query invalidation to refresh the UI
                            queryClient.invalidateQueries({
                                queryKey:
                                    queryKeys.blockPropertySchemas.byBlock(
                                        block.id,
                                    ),
                            });
                        } catch (createError) {
                            console.error(createError);
                            // Error handling is done in the parent component
                        }
                    }
                } catch (err) {
                    console.error(err);
                    // Error handling is done in the parent component
                }
            }, 5000); // Check after 5 seconds of loading
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isLoadingSchemas, block.id, createBlockPropertySchemas, queryClient]);

    // This is a utility component that doesn't render anything
    return null;
};
