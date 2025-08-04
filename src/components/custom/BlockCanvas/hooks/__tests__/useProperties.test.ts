/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useProperties } from '../useProperties';

describe('useProperties', () => {
  const mockInitialProperties = {
    width: 100,
    height: 200,
    color: '#ffffff',
    visible: true,
    opacity: 0.8,
  };

  const mockOnPropertiesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with provided properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      expect(result.current.properties).toEqual(mockInitialProperties);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.validationErrors).toEqual({});
    });

    it('should initialize with empty properties if none provided', () => {
      const { result } = renderHook(() =>
        useProperties({
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      expect(result.current.properties).toEqual({});
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should handle null or undefined initial properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: null,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      expect(result.current.properties).toEqual({});
    });
  });

  describe('property updates', () => {
    it('should update a single property', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.updateProperty('width', 150);
      });

      expect(result.current.properties.width).toBe(150);
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith({
        ...mockInitialProperties,
        width: 150,
      });
    });

    it('should update multiple properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      const updates = { width: 150, height: 250 };

      act(() => {
        result.current.updateProperties(updates);
      });

      expect(result.current.properties).toEqual({
        ...mockInitialProperties,
        ...updates,
      });
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith({
        ...mockInitialProperties,
        ...updates,
      });
    });

    it('should add new properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.updateProperty('newProperty', 'newValue');
      });

      expect(result.current.properties.newProperty).toBe('newValue');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should delete properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.deleteProperty('color');
      });

      expect(result.current.properties.color).toBeUndefined();
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith({
        width: 100,
        height: 200,
        visible: true,
        opacity: 0.8,
      });
    });

    it('should handle deleting non-existent properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.deleteProperty('nonExistent');
      });

      expect(result.current.properties).toEqual(mockInitialProperties);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(mockOnPropertiesChange).not.toHaveBeenCalled();
    });
  });

  describe('property validation', () => {
    const validator = jest.fn((key, value) => {
      if (key === 'width' && value < 0) {
        return { isValid: false, error: 'Width must be positive' };
      }
      if (key === 'color' && !value.startsWith('#')) {
        return { isValid: false, error: 'Color must be a hex value' };
      }
      return { isValid: true };
    });

    it('should validate properties on update', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          validator,
        })
      );

      act(() => {
        result.current.updateProperty('width', -10);
      });

      expect(validator).toHaveBeenCalledWith('width', -10);
      expect(result.current.validationErrors.width).toBe('Width must be positive');
      expect(result.current.isValid).toBe(false);
      expect(mockOnPropertiesChange).not.toHaveBeenCalled();
    });

    it('should clear validation errors on successful update', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          validator,
        })
      );

      // First, create an error
      act(() => {
        result.current.updateProperty('width', -10);
      });

      expect(result.current.validationErrors.width).toBeDefined();

      // Then, fix the error
      act(() => {
        result.current.updateProperty('width', 200);
      });

      expect(result.current.validationErrors.width).toBeUndefined();
      expect(result.current.isValid).toBe(true);
      expect(mockOnPropertiesChange).toHaveBeenCalled();
    });

    it('should validate all properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: { width: -10, color: 'red' },
          onPropertiesChange: mockOnPropertiesChange,
          validator,
        })
      );

      act(() => {
        result.current.validateAll();
      });

      expect(result.current.validationErrors.width).toBe('Width must be positive');
      expect(result.current.validationErrors.color).toBe('Color must be a hex value');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('property history', () => {
    it('should track property changes', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          trackHistory: true,
        })
      );

      act(() => {
        result.current.updateProperty('width', 150);
        result.current.updateProperty('height', 250);
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should undo property changes', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          trackHistory: true,
        })
      );

      act(() => {
        result.current.updateProperty('width', 150);
      });

      // Clear mock to check undo call
      mockOnPropertiesChange.mockClear();

      act(() => {
        result.current.undo();
      });

      expect(result.current.properties.width).toBe(100);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith(mockInitialProperties);
    });

    it('should redo property changes', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          trackHistory: true,
        })
      );

      act(() => {
        result.current.updateProperty('width', 150);
        result.current.undo();
      });

      // Clear mock to check redo call
      mockOnPropertiesChange.mockClear();

      act(() => {
        result.current.redo();
      });

      expect(result.current.properties.width).toBe(150);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith({
        ...mockInitialProperties,
        width: 150,
      });
    });

    it('should clear redo history on new changes', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          trackHistory: true,
        })
      );

      act(() => {
        result.current.updateProperty('width', 150);
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.updateProperty('height', 300);
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should limit history size', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          trackHistory: true,
          maxHistorySize: 3,
        })
      );

      act(() => {
        result.current.updateProperty('width', 150);
        result.current.updateProperty('height', 250);
        result.current.updateProperty('opacity', 0.5);
        result.current.updateProperty('visible', false);
      });

      expect(result.current.history).toHaveLength(3);
    });
  });

  describe('property groups', () => {
    it('should get properties by group', () => {
      const propertiesWithGroups = {
        width: 100,
        height: 200,
        x: 10,
        y: 20,
        color: '#ffffff',
        backgroundColor: '#000000',
      };

      const groupConfig = {
        size: ['width', 'height'],
        position: ['x', 'y'],
        colors: ['color', 'backgroundColor'],
      };

      const { result } = renderHook(() =>
        useProperties({
          initialProperties: propertiesWithGroups,
          onPropertiesChange: mockOnPropertiesChange,
          groupConfig,
        })
      );

      const sizeProperties = result.current.getPropertiesByGroup('size');
      expect(sizeProperties).toEqual({ width: 100, height: 200 });

      const colorProperties = result.current.getPropertiesByGroup('colors');
      expect(colorProperties).toEqual({ color: '#ffffff', backgroundColor: '#000000' });
    });

    it('should update properties by group', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          groupConfig: {
            size: ['width', 'height'],
            colors: ['color', 'backgroundColor'],
          },
        })
      );

      act(() => {
        result.current.updatePropertiesByGroup('size', { width: 300, height: 400 });
      });

      expect(result.current.properties.width).toBe(300);
      expect(result.current.properties.height).toBe(400);
      expect(mockOnPropertiesChange).toHaveBeenCalled();
    });
  });

  describe('property transformations', () => {
    const transformer = jest.fn((key, value) => {
      if (key === 'width' && typeof value === 'string') {
        return parseInt(value, 10);
      }
      if (key === 'color' && value.length === 3) {
        return `#${value}`; // Add # prefix for short colors
      }
      return value;
    });

    it('should transform property values', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          transformer,
        })
      );

      act(() => {
        result.current.updateProperty('width', '250');
      });

      expect(transformer).toHaveBeenCalledWith('width', '250');
      expect(result.current.properties.width).toBe(250);
    });

    it('should transform color values', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
          transformer,
        })
      );

      act(() => {
        result.current.updateProperty('color', 'fff');
      });

      expect(result.current.properties.color).toBe('#fff');
    });
  });

  describe('property reset', () => {
    it('should reset to initial properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.updateProperty('width', 300);
        result.current.updateProperty('height', 400);
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.properties).toEqual(mockInitialProperties);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith(mockInitialProperties);
    });

    it('should reset specific properties', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.updateProperty('width', 300);
        result.current.updateProperty('height', 400);
      });

      act(() => {
        result.current.resetProperty('width');
      });

      expect(result.current.properties.width).toBe(100);
      expect(result.current.properties.height).toBe(400);
    });
  });

  describe('property serialization', () => {
    it('should serialize properties to JSON', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      const serialized = result.current.serialize();
      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toEqual(mockInitialProperties);
    });

    it('should deserialize properties from JSON', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: {},
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      const serialized = JSON.stringify(mockInitialProperties);

      act(() => {
        result.current.deserialize(serialized);
      });

      expect(result.current.properties).toEqual(mockInitialProperties);
      expect(mockOnPropertiesChange).toHaveBeenCalledWith(mockInitialProperties);
    });

    it('should handle invalid JSON gracefully', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.deserialize('invalid json');
      });

      // Properties should remain unchanged
      expect(result.current.properties).toEqual(mockInitialProperties);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid property updates', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.updateProperty('width', i);
        }
      });

      expect(result.current.properties.width).toBe(99);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should handle complex nested objects', () => {
      const complexProperties = {
        style: {
          border: { width: 1, color: '#000' },
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
        },
        metadata: {
          tags: ['tag1', 'tag2'],
          author: 'user',
        },
      };

      const { result } = renderHook(() =>
        useProperties({
          initialProperties: complexProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.updateProperty('style.border.width', 2);
      });

      expect(result.current.properties.style.border.width).toBe(2);
    });

    it('should handle property names with special characters', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        result.current.updateProperty('data-attribute', 'value');
        result.current.updateProperty('property with spaces', 'value');
        result.current.updateProperty('property.with.dots', 'value');
      });

      expect(result.current.properties['data-attribute']).toBe('value');
      expect(result.current.properties['property with spaces']).toBe('value');
      expect(result.current.properties['property.with.dots']).toBe('value');
    });

    it('should handle concurrent updates safely', () => {
      const { result } = renderHook(() =>
        useProperties({
          initialProperties: mockInitialProperties,
          onPropertiesChange: mockOnPropertiesChange,
        })
      );

      act(() => {
        // Simulate concurrent updates
        result.current.updateProperty('width', 200);
        result.current.updateProperty('height', 300);
        result.current.updateProperties({ width: 250, opacity: 0.5 });
      });

      // Final state should be consistent
      expect(result.current.properties.width).toBe(250);
      expect(result.current.properties.height).toBe(300);
      expect(result.current.properties.opacity).toBe(0.5);
    });
  });
});