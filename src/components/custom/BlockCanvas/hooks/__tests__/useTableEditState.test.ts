/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useTableEditState } from '../useTableEditState';

describe('useTableEditState', () => {
  const mockData = [
    { id: '1', name: 'John', age: 30, city: 'New York' },
    { id: '2', name: 'Jane', age: 25, city: 'London' },
    { id: '3', name: 'Bob', age: 35, city: 'Paris' },
  ];

  const mockOnDataChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      expect(result.current.editingCell).toBeNull();
      expect(result.current.selectedCells).toEqual(new Set());
      expect(result.current.isEditing).toBe(false);
      expect(result.current.editHistory).toEqual([]);
      expect(result.current.redoHistory).toEqual([]);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should handle empty data', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: [],
          onDataChange: mockOnDataChange,
        })
      );

      expect(result.current.editingCell).toBeNull();
      expect(result.current.selectedCells).toEqual(new Set());
      expect(result.current.isEditing).toBe(false);
    });
  });

  describe('cell editing', () => {
    it('should start editing a cell', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.startEditing('1', 'name');
      });

      expect(result.current.editingCell).toEqual({ rowId: '1', columnId: 'name' });
      expect(result.current.isEditing).toBe(true);
    });

    it('should stop editing', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.startEditing('1', 'name');
      });

      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.stopEditing();
      });

      expect(result.current.editingCell).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });

    it('should save cell value', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.startEditing('1', 'name');
        result.current.saveCellValue('1', 'name', 'Johnny');
      });

      expect(mockOnDataChange).toHaveBeenCalledWith([
        { id: '1', name: 'Johnny', age: 30, city: 'New York' },
        { id: '2', name: 'Jane', age: 25, city: 'London' },
        { id: '3', name: 'Bob', age: 35, city: 'Paris' },
      ]);

      expect(result.current.editingCell).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });

    it('should cancel editing without saving', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.startEditing('1', 'name');
        result.current.cancelEditing();
      });

      expect(mockOnDataChange).not.toHaveBeenCalled();
      expect(result.current.editingCell).toBeNull();
      expect(result.current.isEditing).toBe(false);
    });

    it('should handle editing non-existent cell', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.saveCellValue('999', 'nonexistent', 'value');
      });

      // Should not crash and not call onDataChange
      expect(mockOnDataChange).not.toHaveBeenCalled();
    });
  });

  describe('cell selection', () => {
    it('should select single cell', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.selectCell('1', 'name');
      });

      expect(result.current.selectedCells).toEqual(new Set(['1:name']));
    });

    it('should toggle cell selection', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.toggleCellSelection('1', 'name');
      });

      expect(result.current.selectedCells).toEqual(new Set(['1:name']));

      act(() => {
        result.current.toggleCellSelection('1', 'name');
      });

      expect(result.current.selectedCells).toEqual(new Set());
    });

    it('should select multiple cells', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.toggleCellSelection('1', 'name');
        result.current.toggleCellSelection('1', 'age');
        result.current.toggleCellSelection('2', 'name');
      });

      expect(result.current.selectedCells).toEqual(new Set(['1:name', '1:age', '2:name']));
    });

    it('should clear selection', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.toggleCellSelection('1', 'name');
        result.current.toggleCellSelection('1', 'age');
      });

      expect(result.current.selectedCells.size).toBe(2);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedCells).toEqual(new Set());
    });

    it('should select range of cells', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.selectRange('1', 'name', '2', 'age');
      });

      // Should select all cells in the rectangular range
      expect(result.current.selectedCells.size).toBeGreaterThan(0);
      expect(result.current.selectedCells.has('1:name')).toBe(true);
      expect(result.current.selectedCells.has('2:age')).toBe(true);
    });
  });

  describe('undo/redo functionality', () => {
    it('should track edit history', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.saveCellValue('1', 'name', 'Johnny');
      });

      expect(result.current.editHistory.length).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should undo last change', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.saveCellValue('1', 'name', 'Johnny');
      });

      // Clear the mock to check undo call
      mockOnDataChange.mockClear();

      act(() => {
        result.current.undo();
      });

      expect(mockOnDataChange).toHaveBeenCalledWith(mockData);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should redo undone change', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.saveCellValue('1', 'name', 'Johnny');
      });

      act(() => {
        result.current.undo();
      });

      // Clear the mock to check redo call
      mockOnDataChange.mockClear();

      act(() => {
        result.current.redo();
      });

      expect(mockOnDataChange).toHaveBeenCalledWith([
        { id: '1', name: 'Johnny', age: 30, city: 'New York' },
        { id: '2', name: 'Jane', age: 25, city: 'London' },
        { id: '3', name: 'Bob', age: 35, city: 'Paris' },
      ]);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should clear redo history on new changes', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.saveCellValue('1', 'name', 'Johnny');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.saveCellValue('1', 'name', 'John Doe');
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.redoHistory).toEqual([]);
    });

    it('should limit history size', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
          maxHistorySize: 3,
        })
      );

      // Make more changes than the history limit
      act(() => {
        result.current.saveCellValue('1', 'name', 'Change1');
        result.current.saveCellValue('1', 'name', 'Change2');
        result.current.saveCellValue('1', 'name', 'Change3');
        result.current.saveCellValue('1', 'name', 'Change4');
      });

      expect(result.current.editHistory.length).toBe(3);
    });
  });

  describe('keyboard navigation', () => {
    it('should handle arrow key navigation', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.selectCell('1', 'name');
      });

      act(() => {
        result.current.handleKeyNavigation('ArrowRight');
      });

      expect(result.current.selectedCells.has('1:age')).toBe(true);

      act(() => {
        result.current.handleKeyNavigation('ArrowDown');
      });

      expect(result.current.selectedCells.has('2:age')).toBe(true);
    });

    it('should handle Enter key for editing', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.selectCell('1', 'name');
        result.current.handleKeyNavigation('Enter');
      });

      expect(result.current.isEditing).toBe(true);
      expect(result.current.editingCell).toEqual({ rowId: '1', columnId: 'name' });
    });

    it('should handle Escape key to cancel editing', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.startEditing('1', 'name');
        result.current.handleKeyNavigation('Escape');
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editingCell).toBeNull();
    });

    it('should handle Tab key navigation', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.selectCell('1', 'name');
        result.current.handleKeyNavigation('Tab');
      });

      expect(result.current.selectedCells.has('1:age')).toBe(true);

      act(() => {
        result.current.handleKeyNavigation('Tab', true); // Shift+Tab
      });

      expect(result.current.selectedCells.has('1:name')).toBe(true);
    });
  });

  describe('bulk operations', () => {
    it('should delete selected cells', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.toggleCellSelection('1', 'name');
        result.current.toggleCellSelection('2', 'age');
        result.current.deleteSelectedCells();
      });

      expect(mockOnDataChange).toHaveBeenCalledWith([
        { id: '1', name: '', age: 30, city: 'New York' },
        { id: '2', name: 'Jane', age: '', city: 'London' },
        { id: '3', name: 'Bob', age: 35, city: 'Paris' },
      ]);
    });

    it('should copy selected cells', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.toggleCellSelection('1', 'name');
        result.current.toggleCellSelection('1', 'age');
        result.current.copySelectedCells();
      });

      expect(result.current.clipboard).toEqual([
        { rowId: '1', columnId: 'name', value: 'John' },
        { rowId: '1', columnId: 'age', value: 30 },
      ]);
    });

    it('should paste clipboard data', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      // First copy some data
      act(() => {
        result.current.toggleCellSelection('1', 'name');
        result.current.copySelectedCells();
      });

      // Then select a different cell and paste
      act(() => {
        result.current.selectCell('2', 'name');
        result.current.pasteClipboard();
      });

      expect(mockOnDataChange).toHaveBeenCalledWith([
        { id: '1', name: 'John', age: 30, city: 'New York' },
        { id: '2', name: 'John', age: 25, city: 'London' },
        { id: '3', name: 'Bob', age: 35, city: 'Paris' },
      ]);
    });
  });

  describe('data validation', () => {
    it('should validate cell values before saving', () => {
      const validator = jest.fn((value, rowId, columnId) => {
        if (columnId === 'age' && isNaN(Number(value))) {
          return { isValid: false, error: 'Age must be a number' };
        }
        return { isValid: true };
      });

      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
          validator,
        })
      );

      act(() => {
        result.current.saveCellValue('1', 'age', 'not a number');
      });

      expect(validator).toHaveBeenCalledWith('not a number', '1', 'age');
      expect(mockOnDataChange).not.toHaveBeenCalled();
      expect(result.current.validationErrors.has('1:age')).toBe(true);
    });

    it('should clear validation errors on successful save', () => {
      const validator = jest.fn((value, rowId, columnId) => {
        if (columnId === 'age' && isNaN(Number(value))) {
          return { isValid: false, error: 'Age must be a number' };
        }
        return { isValid: true };
      });

      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
          validator,
        })
      );

      // First, create a validation error
      act(() => {
        result.current.saveCellValue('1', 'age', 'invalid');
      });

      expect(result.current.validationErrors.has('1:age')).toBe(true);

      // Then, fix the error
      act(() => {
        result.current.saveCellValue('1', 'age', '25');
      });

      expect(result.current.validationErrors.has('1:age')).toBe(false);
      expect(mockOnDataChange).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid editing operations', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.startEditing('1', 'name');
        result.current.startEditing('2', 'age'); // Should switch to new cell
      });

      expect(result.current.editingCell).toEqual({ rowId: '2', columnId: 'age' });
    });

    it('should handle editing while cells are selected', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      act(() => {
        result.current.selectCell('1', 'name');
        result.current.toggleCellSelection('1', 'age');
        result.current.startEditing('1', 'name');
      });

      expect(result.current.isEditing).toBe(true);
      expect(result.current.selectedCells.size).toBeGreaterThan(0);
    });

    it('should handle extremely long undo/redo chains', () => {
      const { result } = renderHook(() =>
        useTableEditState({
          data: mockData,
          onDataChange: mockOnDataChange,
        })
      );

      // Make many changes
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.saveCellValue('1', 'name', `Name${i}`);
        }
      });

      // Undo all changes
      act(() => {
        while (result.current.canUndo) {
          result.current.undo();
        }
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });
  });
});