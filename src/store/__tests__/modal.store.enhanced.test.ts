import { act, renderHook } from '@testing-library/react';
import { useModalStore } from '../modal.store';

describe('useModalStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useModalStore.setState({ modals: {} });
    });

    it('should initialize with empty modals', () => {
        const { result } = renderHook(() => useModalStore());
        
        expect(result.current.modals).toEqual({});
    });

    it('should open a modal', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.openModal('testModal');
        });
        
        expect(result.current.modals.testModal).toEqual({
            isOpen: true,
            data: undefined,
        });
    });

    it('should open a modal with data', () => {
        const { result } = renderHook(() => useModalStore());
        const modalData = { id: 123, name: 'Test' };
        
        act(() => {
            result.current.openModal('testModal', modalData);
        });
        
        expect(result.current.modals.testModal).toEqual({
            isOpen: true,
            data: modalData,
        });
    });

    it('should close a modal', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.openModal('testModal', { test: 'data' });
        });
        
        expect(result.current.modals.testModal.isOpen).toBe(true);
        
        act(() => {
            result.current.closeModal('testModal');
        });
        
        expect(result.current.modals.testModal.isOpen).toBe(false);
        expect(result.current.modals.testModal.data).toEqual({ test: 'data' });
    });

    it('should toggle a modal from closed to open', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.toggleModal('testModal', { toggle: 'data' });
        });
        
        expect(result.current.modals.testModal).toEqual({
            isOpen: true,
            data: { toggle: 'data' },
        });
    });

    it('should toggle a modal from open to closed', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.openModal('testModal', { initial: 'data' });
        });
        
        expect(result.current.modals.testModal.isOpen).toBe(true);
        
        act(() => {
            result.current.toggleModal('testModal');
        });
        
        expect(result.current.modals.testModal.isOpen).toBe(false);
    });

    it('should check if modal is open', () => {
        const { result } = renderHook(() => useModalStore());
        
        expect(result.current.isModalOpen('testModal')).toBe(false);
        
        act(() => {
            result.current.openModal('testModal');
        });
        
        expect(result.current.isModalOpen('testModal')).toBe(true);
        
        act(() => {
            result.current.closeModal('testModal');
        });
        
        expect(result.current.isModalOpen('testModal')).toBe(false);
    });

    it('should return false for non-existent modal', () => {
        const { result } = renderHook(() => useModalStore());
        
        expect(result.current.isModalOpen('nonExistentModal')).toBe(false);
    });

    it('should get modal data', () => {
        const { result } = renderHook(() => useModalStore());
        const testData = { id: 456, message: 'Hello' };
        
        act(() => {
            result.current.openModal('testModal', testData);
        });
        
        expect(result.current.getModalData('testModal')).toEqual(testData);
    });

    it('should return undefined for non-existent modal data', () => {
        const { result } = renderHook(() => useModalStore());
        
        expect(result.current.getModalData('nonExistentModal')).toBeUndefined();
    });

    it('should update modal data', () => {
        const { result } = renderHook(() => useModalStore());
        const initialData = { count: 1 };
        const updatedData = { count: 2, newField: 'added' };
        
        act(() => {
            result.current.openModal('testModal', initialData);
        });
        
        expect(result.current.getModalData('testModal')).toEqual(initialData);
        
        act(() => {
            result.current.updateModalData('testModal', updatedData);
        });
        
        expect(result.current.getModalData('testModal')).toEqual(updatedData);
        expect(result.current.modals.testModal.isOpen).toBe(true);
    });

    it('should handle multiple modals independently', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.openModal('modal1', { type: 'first' });
            result.current.openModal('modal2', { type: 'second' });
        });
        
        expect(result.current.isModalOpen('modal1')).toBe(true);
        expect(result.current.isModalOpen('modal2')).toBe(true);
        expect(result.current.getModalData('modal1')).toEqual({ type: 'first' });
        expect(result.current.getModalData('modal2')).toEqual({ type: 'second' });
        
        act(() => {
            result.current.closeModal('modal1');
        });
        
        expect(result.current.isModalOpen('modal1')).toBe(false);
        expect(result.current.isModalOpen('modal2')).toBe(true);
    });

    it('should handle modal data of different types', () => {
        const { result } = renderHook(() => useModalStore());
        
        const testCases = [
            { name: 'string', data: 'hello world' },
            { name: 'number', data: 42 },
            { name: 'boolean', data: true },
            { name: 'array', data: [1, 2, 3] },
            { name: 'object', data: { nested: { value: 'deep' } } },
            { name: 'null', data: null },
            { name: 'undefined', data: undefined },
        ];
        
        testCases.forEach(({ name, data }) => {
            act(() => {
                result.current.openModal(name, data);
            });
            
            expect(result.current.getModalData(name)).toEqual(data);
        });
    });

    it('should handle rapid modal operations', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            for (let i = 0; i < 10; i++) {
                result.current.openModal('rapidModal', { iteration: i });
                result.current.closeModal('rapidModal');
            }
        });
        
        expect(result.current.isModalOpen('rapidModal')).toBe(false);
        expect(result.current.getModalData('rapidModal')).toEqual({ iteration: 9 });
    });

    it('should maintain modal state when updating data of closed modal', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.openModal('testModal', { initial: true });
            result.current.closeModal('testModal');
        });
        
        expect(result.current.isModalOpen('testModal')).toBe(false);
        
        act(() => {
            result.current.updateModalData('testModal', { updated: true });
        });
        
        expect(result.current.isModalOpen('testModal')).toBe(false);
        expect(result.current.getModalData('testModal')).toEqual({ updated: true });
    });

    it('should handle closing non-existent modal gracefully', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.closeModal('nonExistentModal');
        });
        
        expect(result.current.modals.nonExistentModal).toEqual({
            isOpen: false,
        });
    });

    it('should handle updating data for non-existent modal', () => {
        const { result } = renderHook(() => useModalStore());
        
        act(() => {
            result.current.updateModalData('nonExistentModal', { new: 'data' });
        });
        
        expect(result.current.modals.nonExistentModal).toEqual({
            data: { new: 'data' },
        });
    });

    it('should persist state across multiple hook instances', () => {
        const { result: result1 } = renderHook(() => useModalStore());
        const { result: result2 } = renderHook(() => useModalStore());
        
        act(() => {
            result1.current.openModal('sharedModal', { shared: true });
        });
        
        expect(result1.current.isModalOpen('sharedModal')).toBe(true);
        expect(result2.current.isModalOpen('sharedModal')).toBe(true);
        expect(result2.current.getModalData('sharedModal')).toEqual({ shared: true });
        
        act(() => {
            result2.current.closeModal('sharedModal');
        });
        
        expect(result1.current.isModalOpen('sharedModal')).toBe(false);
        expect(result2.current.isModalOpen('sharedModal')).toBe(false);
    });

    it('should provide all expected methods and properties', () => {
        const { result } = renderHook(() => useModalStore());
        
        expect(result.current).toHaveProperty('modals');
        expect(result.current).toHaveProperty('openModal');
        expect(result.current).toHaveProperty('closeModal');
        expect(result.current).toHaveProperty('toggleModal');
        expect(result.current).toHaveProperty('isModalOpen');
        expect(result.current).toHaveProperty('getModalData');
        expect(result.current).toHaveProperty('updateModalData');
        
        expect(typeof result.current.openModal).toBe('function');
        expect(typeof result.current.closeModal).toBe('function');
        expect(typeof result.current.toggleModal).toBe('function');
        expect(typeof result.current.isModalOpen).toBe('function');
        expect(typeof result.current.getModalData).toBe('function');
        expect(typeof result.current.updateModalData).toBe('function');
    });

    it('should handle complex modal workflows', () => {
        const { result } = renderHook(() => useModalStore());
        
        // Complex workflow: open -> update data -> toggle -> update again -> close
        act(() => {
            result.current.openModal('workflowModal', { step: 1 });
        });
        
        expect(result.current.isModalOpen('workflowModal')).toBe(true);
        expect(result.current.getModalData('workflowModal')).toEqual({ step: 1 });
        
        act(() => {
            result.current.updateModalData('workflowModal', { step: 2, validated: true });
        });
        
        expect(result.current.isModalOpen('workflowModal')).toBe(true);
        expect(result.current.getModalData('workflowModal')).toEqual({ step: 2, validated: true });
        
        act(() => {
            result.current.toggleModal('workflowModal');
        });
        
        expect(result.current.isModalOpen('workflowModal')).toBe(false);
        
        act(() => {
            result.current.updateModalData('workflowModal', { step: 3, closed: true });
        });
        
        expect(result.current.isModalOpen('workflowModal')).toBe(false);
        expect(result.current.getModalData('workflowModal')).toEqual({ step: 3, closed: true });
        
        act(() => {
            result.current.toggleModal('workflowModal', { step: 4, reopened: true });
        });
        
        expect(result.current.isModalOpen('workflowModal')).toBe(true);
        expect(result.current.getModalData('workflowModal')).toEqual({ step: 4, reopened: true });
    });
});
