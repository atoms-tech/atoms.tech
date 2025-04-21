# Table State Management for BlockCanvas

This document outlines the improved state management approach for the `BlockCanvas` component's table functionality.

## Problem

The previous implementation used multiple disconnected `useState` hooks to manage related state:

```typescript
const [localData, setLocalData] = useState<T[]>([]);
const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdate[]>(
    [],
);
const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    columnId: string;
} | null>(null);
const [editingData, setEditingData] = useState<Record<string, T>>({});
```

This approach has several drawbacks:

- Related state is fragmented
- Updates to multiple state values require multiple setter calls
- It's difficult to ensure consistency between related state values
- Logic for state updates is scattered across the component

## Solution

We've implemented a consolidated state management approach using:

1. **Zustand store** - A centralized store that manages all table editing state
2. **Custom hook** - A hook that provides a clean API for components to use the store
3. **Example component** - A sample implementation showing how to use the new approach

### 1. Zustand Store

The `tableEdit.store.ts` file defines a Zustand store that:

- Consolidates all related state in a single place
- Provides actions that handle updating multiple pieces of state consistently
- Uses immutability for predictable state updates

```typescript
// Core state interface
export interface TableEditState<T> {
    data: T[];
    pendingSaves: Set<string>;
    optimisticUpdates: OptimisticUpdate[];
    selectedCell: { rowIndex: number; columnId: string } | null;
    editingData: Record<string, Partial<T>>;
    // ... more state properties and actions
}
```

### 2. Custom Hook

The `useTableEditState` hook in `hooks/useTableEditState.ts`:

- Provides a clean API for components to use the store
- Handles optimistic updates automatically
- Includes helpers for common operations like updating cells
- Manages side effects like saving changes to the server

```typescript
const {
    data,
    pendingSaves,
    selectedCell,
    updateCellValue,
    saveChanges,
    cancelEdit,
    // ... more properties and actions
} = useTableEditState<YourDataType>({
    initialData,
    onSave: handleSave,
    onDelete: handleDelete,
});
```

### 3. Example Component

The `ExampleWithTableState` component demonstrates:

- How to initialize the state with data
- How to handle cell editing
- How to save changes
- How to provide visual feedback for pending changes

## Benefits

This approach provides several benefits:

1. **Centralized state management** - All related state is in one place
2. **Predictable updates** - Actions ensure consistency between state values
3. **Reusable logic** - The store and hook can be used by any component
4. **Optimistic updates** - Changes are reflected immediately while saving in the background
5. **TypeScript support** - Full type safety throughout the implementation

## How to Use

### 1. Import the hook

```typescript
import { useTableEditState } from '@/components/custom/BlockCanvas/hooks/useTableEditState';
```

### 2. Define your data type

```typescript
interface MyItemType {
    id: string;
    name: string;
    // ... your data properties
}
```

### 3. Use the hook in your component

```typescript
function MyTableComponent({ initialData }) {
    const {
        data,
        pendingSaves,
        updateCellValue,
        saveChanges,
        // ... other utilities
    } = useTableEditState<MyItemType>({
        initialData,
        onSave: async (itemId, changes) => {
            // Save to your backend
            await api.updateItem(itemId, changes);
        },
        onDelete: async (itemId) => {
            // Delete from your backend
            await api.deleteItem(itemId);
        },
    });

    // ... your component logic
}
```

### 4. Render your table with editing capabilities

See the `ExampleWithTableState` component for a complete implementation example.

## Migration Path

To migrate existing table components:

1. Replace multiple `useState` calls with the `useTableEditState` hook
2. Update references to state values to use the values from the hook
3. Replace direct setter calls with the actions provided by the hook
4. Update event handlers to use the helpers (updateCellValue, saveChanges, etc.)

## Advanced Usage

The store has been designed to be extensible. See `tableEdit.store.ts` for details on:

- Creating custom instances with `createTableEditStore()`
- Adding custom actions to the store
- Extending the state with additional properties
