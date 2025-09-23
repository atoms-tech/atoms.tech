import {
    BaseRow,
    SaveContext,
    TableDataAdapter,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export function createTableRowsAdapter(): TableDataAdapter<BaseRow> {
    return {
        async saveRow(item: BaseRow, isNew: boolean, context?: SaveContext) {
            const { blockId } = context || {};
            const { id, position, height: _height, ...rowData } = item;
            if (isNew) {
                const insertPayload: Record<string, unknown> = {
                    id,
                    block_id: blockId,
                    row_data: rowData,
                    position: position ?? 0,
                };
                const { error } = await (
                    supabase.from as unknown as (table: string) => {
                        insert: (
                            payload: Record<string, unknown>,
                        ) => Promise<{ error: unknown | null }>;
                    }
                )('table_rows').insert(insertPayload);
                if (error) throw error;
            } else {
                const updatePayload: Record<string, unknown> = {
                    row_data: rowData,
                    ...(position != null ? { position } : {}),
                };
                const { error } = await (
                    supabase.from as unknown as (table: string) => {
                        update: (payload: Record<string, unknown>) => {
                            eq: (
                                field: string,
                                value: string,
                            ) => Promise<{ error: unknown | null }>;
                        };
                    }
                )('table_rows')
                    .update(updatePayload)
                    .eq('id', id);
                if (error) throw error;
            }
        },
        async deleteRow(item: BaseRow) {
            const { error } = await (
                supabase.from as unknown as (table: string) => {
                    delete: () => {
                        eq: (
                            field: string,
                            value: string,
                        ) => Promise<{ error: unknown | null }>;
                    };
                }
            )('table_rows')
                .delete()
                .eq('id', item.id);
            if (error) throw error;
        },
        async postSaveRefresh() {
            // No-op; caller should trigger a refetch via useTableRows.refresh
        },
    };
}
