import { act, renderHook } from '@testing-library/react';

import { useCollapsibleState } from '@/hooks/useCollapsibleState';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('useCollapsibleState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() =>
            useCollapsibleState({
                id: 'test-section',
                defaultOpen: false,
            })
        );

        expect(result.current.isOpen).toBe(false);
        expect(result.current.id).toBe('test-section');
        expect(typeof result.current.toggle).toBe('function');
        expect(typeof result.current.setOpen).toBe('function');
    });

    it('should toggle state correctly', () => {
        const { result } = renderHook(() =>
            useCollapsibleState({
                id: 'test-section',
                defaultOpen: false,
            })
        );

        expect(result.current.isOpen).toBe(false);

        act(() => {
            result.current.toggle();
        });

        expect(result.current.isOpen).toBe(true);
    });
});
