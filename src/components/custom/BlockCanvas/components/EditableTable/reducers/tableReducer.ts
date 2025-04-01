import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';

export interface TableState<T> {
    localIsEditMode: boolean;
    editingData: Record<string, T>;
    isAddingNew: boolean;
    sortKey: string | null;
    sortOrder: 'asc' | 'desc';
    hoveredCell: { row: number; col: number } | null;
    itemToDelete: T | null;
    deleteConfirmOpen: boolean;
    editingTimeouts: Record<string, NodeJS.Timeout>;
    selectedCell: { row: number; col: number } | null;
}

export type TableAction<T> =
    | { type: 'SET_EDIT_MODE'; payload: boolean }
    | {
          type: 'SET_SORT';
          payload: { key: string | null; order: 'asc' | 'desc' };
      }
    | { type: 'START_ADD_ROW' }
    | { type: 'CANCEL_ADD_ROW' }
    | {
          type: 'SET_CELL_VALUE';
          payload: { itemId: string; accessor: keyof T; value: CellValue };
      }
    | { type: 'OPEN_DELETE_CONFIRM'; payload: T }
    | { type: 'CLOSE_DELETE_CONFIRM' }
    | { type: 'SET_INITIAL_EDIT_DATA'; payload: Record<string, T> }
    | {
          type: 'SET_TIMEOUT';
          payload: { itemId: string; timeoutId: NodeJS.Timeout };
      }
    | { type: 'CLEAR_TIMEOUT'; payload: string }
    | { type: 'RESET_EDIT_STATE' }
    | {
          type: 'SET_HOVERED_CELL';
          payload: { row: number; col: number } | null;
      }
    | {
          type: 'SET_SELECTED_CELL';
          payload: { row: number; col: number } | null;
      };

export function tableReducer<T>(
    state: TableState<T>,
    action: TableAction<T>,
): TableState<T> {
    switch (action.type) {
        case 'SET_EDIT_MODE':
            return { ...state, localIsEditMode: action.payload };

        case 'SET_SORT':
            return {
                ...state,
                sortKey: action.payload.key,
                sortOrder: action.payload.order,
            };

        case 'START_ADD_ROW':
            return { ...state, isAddingNew: true };

        case 'CANCEL_ADD_ROW':
            const { new: _, ...restEditingData } = state.editingData;
            return {
                ...state,
                isAddingNew: false,
                editingData: restEditingData,
            };

        case 'SET_CELL_VALUE':
            return {
                ...state,
                editingData: {
                    ...state.editingData,
                    [action.payload.itemId]: {
                        ...state.editingData[action.payload.itemId],
                        [action.payload.accessor]: action.payload.value,
                    },
                },
            };

        case 'OPEN_DELETE_CONFIRM':
            return {
                ...state,
                itemToDelete: action.payload,
                deleteConfirmOpen: true,
            };

        case 'CLOSE_DELETE_CONFIRM':
            return {
                ...state,
                deleteConfirmOpen: false,
                itemToDelete: null,
            };

        case 'SET_INITIAL_EDIT_DATA':
            return {
                ...state,
                editingData: action.payload,
            };

        case 'SET_TIMEOUT':
            return {
                ...state,
                editingTimeouts: {
                    ...state.editingTimeouts,
                    [action.payload.itemId]: action.payload.timeoutId,
                },
            };

        case 'CLEAR_TIMEOUT':
            const { [action.payload]: __, ...remainingTimeouts } =
                state.editingTimeouts;
            return {
                ...state,
                editingTimeouts: remainingTimeouts,
            };

        case 'SET_HOVERED_CELL':
            return {
                ...state,
                hoveredCell: action.payload,
            };

        case 'SET_SELECTED_CELL':
            return {
                ...state,
                selectedCell: action.payload,
            };

        case 'RESET_EDIT_STATE':
            // Clear all timeouts first
            Object.values(state.editingTimeouts).forEach(clearTimeout);
            return {
                ...state,
                editingData: {},
                isAddingNew: false,
                editingTimeouts: {},
                localIsEditMode: false,
                selectedCell: null,
            };

        default:
            return state;
    }
}
