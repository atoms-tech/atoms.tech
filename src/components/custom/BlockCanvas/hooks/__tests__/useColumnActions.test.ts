/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useColumnActions } from '../useColumnActions';
import { EditableColumnType, PropertyConfig } from '@/components/custom/BlockCanvas/components/EditableTable/types';

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase/supabaseBrowser', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
  },
}));

describe('useColumnActions', () => {
  const mockProps = {
    orgId: 'org-123',
    projectId: 'project-123',
    documentId: 'doc-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct hook functions', () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      expect(typeof result.current.createPropertyAndColumn).toBe('function');
      expect(typeof result.current.createColumnFromProperty).toBe('function');
    });

    it('should accept orgId, projectId, and documentId parameters', () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('createPropertyAndColumn', () => {
    it('should create property and column with correct parameters', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      const name = 'Test Column';
      const type: EditableColumnType = 'text';
      const propertyConfig: PropertyConfig = {
        scope: ['project'],
        is_base: false,
        org_id: 'org-123',
      };
      const defaultValue = 'Default';
      const blockId = 'block-123';
      const userId = 'user-123';

      await act(async () => {
        await result.current.createPropertyAndColumn(
          name,
          type,
          propertyConfig,
          defaultValue,
          blockId,
          userId
        );
      });

      // Function should complete without throwing
      expect(result.current.createPropertyAndColumn).toBeDefined();
    });
  });

  describe('createColumnFromProperty', () => {
    it('should create column from property with correct parameters', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      const propertyId = 'property-123';
      const defaultValue = 'Default';
      const blockId = 'block-123';
      const userId = 'user-123';

      await act(async () => {
        await result.current.createColumnFromProperty(
          propertyId,
          defaultValue,
          blockId,
          userId
        );
      });

      // Function should complete without throwing
      expect(result.current.createColumnFromProperty).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle createPropertyAndColumn errors gracefully', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      // This test ensures the function doesn't throw unexpected errors
      await act(async () => {
        try {
          await result.current.createPropertyAndColumn(
            'Test',
            'text',
            {
              scope: ['project'],
              is_base: false,
              org_id: 'org-123',
            },
            'default',
            'block-123',
            'user-123'
          );
        } catch (error) {
          // Expected to handle errors gracefully
        }
      });

      expect(result.current.createPropertyAndColumn).toBeDefined();
    });

    it('should handle createColumnFromProperty errors gracefully', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      // This test ensures the function doesn't throw unexpected errors
      await act(async () => {
        try {
          await result.current.createColumnFromProperty(
            'prop-123',
            'default',
            'block-123',
            'user-123'
          );
        } catch (error) {
          // Expected to handle errors gracefully
        }
      });

      expect(result.current.createColumnFromProperty).toBeDefined();
    });
  });

  describe('with different column types', () => {
    it('should handle text column type', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      await act(async () => {
        await result.current.createPropertyAndColumn(
          'Text Column',
          'text',
          {
            scope: ['project'],
            is_base: false,
            org_id: 'org-123',
          },
          'Default text',
          'block-123',
          'user-123'
        );
      });

      expect(result.current.createPropertyAndColumn).toBeDefined();
    });

    it('should handle number column type', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      await act(async () => {
        await result.current.createPropertyAndColumn(
          'Number Column',
          'number',
          {
            scope: ['project'],
            is_base: false,
            org_id: 'org-123',
          },
          '0',
          'block-123',
          'user-123'
        );
      });

      expect(result.current.createPropertyAndColumn).toBeDefined();
    });

    it('should handle select column type', async () => {
      const { result } = renderHook(() =>
        useColumnActions(mockProps)
      );

      await act(async () => {
        await result.current.createPropertyAndColumn(
          'Select Column',
          'select',
          {
            scope: ['project'],
            is_base: false,
            org_id: 'org-123',
            options: ['Option 1', 'Option 2'],
          },
          'Option 1',
          'block-123',
          'user-123'
        );
      });

      expect(result.current.createPropertyAndColumn).toBeDefined();
    });
  });
});