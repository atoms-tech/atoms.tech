import { act, renderHook } from '@testing-library/react';
import { useContextStore } from '../context.store';

describe('useContextStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useContextStore.setState({
            currentUserId: null,
            currentOrgId: null,
            currentProjectId: null,
        });
    });

    it('should initialize with null values', () => {
        const { result } = renderHook(() => useContextStore());
        
        expect(result.current.currentUserId).toBeNull();
        expect(result.current.currentOrgId).toBeNull();
        expect(result.current.currentProjectId).toBeNull();
    });

    it('should set and get current user ID', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentUserId('user123');
        });
        
        expect(result.current.currentUserId).toBe('user123');
    });

    it('should set and get current organization ID', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentOrgId('org456');
        });
        
        expect(result.current.currentOrgId).toBe('org456');
    });

    it('should set and get current project ID', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentProjectId('project789');
        });
        
        expect(result.current.currentProjectId).toBe('project789');
    });

    it('should allow setting user ID to null', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentUserId('user123');
        });
        
        expect(result.current.currentUserId).toBe('user123');
        
        act(() => {
            result.current.setCurrentUserId(null);
        });
        
        expect(result.current.currentUserId).toBeNull();
    });

    it('should allow setting organization ID to null', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentOrgId('org456');
        });
        
        expect(result.current.currentOrgId).toBe('org456');
        
        act(() => {
            result.current.setCurrentOrgId(null);
        });
        
        expect(result.current.currentOrgId).toBeNull();
    });

    it('should allow setting project ID to null', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentProjectId('project789');
        });
        
        expect(result.current.currentProjectId).toBe('project789');
        
        act(() => {
            result.current.setCurrentProjectId(null);
        });
        
        expect(result.current.currentProjectId).toBeNull();
    });

    it('should handle multiple updates in sequence', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentUserId('user1');
            result.current.setCurrentOrgId('org1');
            result.current.setCurrentProjectId('project1');
        });
        
        expect(result.current.currentUserId).toBe('user1');
        expect(result.current.currentOrgId).toBe('org1');
        expect(result.current.currentProjectId).toBe('project1');
        
        act(() => {
            result.current.setCurrentUserId('user2');
            result.current.setCurrentOrgId('org2');
            result.current.setCurrentProjectId('project2');
        });
        
        expect(result.current.currentUserId).toBe('user2');
        expect(result.current.currentOrgId).toBe('org2');
        expect(result.current.currentProjectId).toBe('project2');
    });

    it('should maintain state independence between different IDs', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentUserId('user123');
        });
        
        expect(result.current.currentUserId).toBe('user123');
        expect(result.current.currentOrgId).toBeNull();
        expect(result.current.currentProjectId).toBeNull();
        
        act(() => {
            result.current.setCurrentOrgId('org456');
        });
        
        expect(result.current.currentUserId).toBe('user123');
        expect(result.current.currentOrgId).toBe('org456');
        expect(result.current.currentProjectId).toBeNull();
    });

    it('should handle empty string values', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            result.current.setCurrentUserId('');
            result.current.setCurrentOrgId('');
            result.current.setCurrentProjectId('');
        });
        
        expect(result.current.currentUserId).toBe('');
        expect(result.current.currentOrgId).toBe('');
        expect(result.current.currentProjectId).toBe('');
    });

    it('should handle very long ID strings', () => {
        const { result } = renderHook(() => useContextStore());
        
        const longId = 'a'.repeat(1000);
        
        act(() => {
            result.current.setCurrentUserId(longId);
        });
        
        expect(result.current.currentUserId).toBe(longId);
        expect(result.current.currentUserId.length).toBe(1000);
    });

    it('should handle special characters in IDs', () => {
        const { result } = renderHook(() => useContextStore());
        
        const specialId = 'user-123_test@example.com#section';
        
        act(() => {
            result.current.setCurrentUserId(specialId);
        });
        
        expect(result.current.currentUserId).toBe(specialId);
    });

    it('should persist state across multiple hook instances', () => {
        const { result: result1 } = renderHook(() => useContextStore());
        const { result: result2 } = renderHook(() => useContextStore());
        
        act(() => {
            result1.current.setCurrentUserId('shared-user');
        });
        
        expect(result1.current.currentUserId).toBe('shared-user');
        expect(result2.current.currentUserId).toBe('shared-user');
        
        act(() => {
            result2.current.setCurrentOrgId('shared-org');
        });
        
        expect(result1.current.currentOrgId).toBe('shared-org');
        expect(result2.current.currentOrgId).toBe('shared-org');
    });

    it('should provide all expected methods and properties', () => {
        const { result } = renderHook(() => useContextStore());
        
        expect(result.current).toHaveProperty('currentUserId');
        expect(result.current).toHaveProperty('setCurrentUserId');
        expect(result.current).toHaveProperty('currentOrgId');
        expect(result.current).toHaveProperty('setCurrentOrgId');
        expect(result.current).toHaveProperty('currentProjectId');
        expect(result.current).toHaveProperty('setCurrentProjectId');
        
        expect(typeof result.current.setCurrentUserId).toBe('function');
        expect(typeof result.current.setCurrentOrgId).toBe('function');
        expect(typeof result.current.setCurrentProjectId).toBe('function');
    });

    it('should handle rapid state changes', () => {
        const { result } = renderHook(() => useContextStore());
        
        act(() => {
            for (let i = 0; i < 100; i++) {
                result.current.setCurrentUserId(`user${i}`);
            }
        });
        
        expect(result.current.currentUserId).toBe('user99');
    });

    it('should handle concurrent updates from different hook instances', () => {
        const { result: result1 } = renderHook(() => useContextStore());
        const { result: result2 } = renderHook(() => useContextStore());
        
        act(() => {
            result1.current.setCurrentUserId('user1');
            result2.current.setCurrentUserId('user2');
            result1.current.setCurrentOrgId('org1');
            result2.current.setCurrentProjectId('project2');
        });
        
        // The last update should win
        expect(result1.current.currentUserId).toBe('user2');
        expect(result1.current.currentOrgId).toBe('org1');
        expect(result1.current.currentProjectId).toBe('project2');
        
        expect(result2.current.currentUserId).toBe('user2');
        expect(result2.current.currentOrgId).toBe('org1');
        expect(result2.current.currentProjectId).toBe('project2');
    });
});
