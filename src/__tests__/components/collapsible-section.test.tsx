import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CollapsibleSection } from '@/components/ui/collapsible-section';

// Mock lucide-react
jest.mock('lucide-react', () => ({
    ChevronDown: () => <svg data-testid="chevron-down" />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the hook
jest.mock('@/hooks/useCollapsibleState', () => ({
    useCollapsibleState: jest.fn(() => ({
        isOpen: false,
        toggle: jest.fn(),
        setOpen: jest.fn(),
        id: 'test-id',
    })),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

describe('CollapsibleSection', () => {
    const mockToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useCollapsibleState } = require('@/hooks/useCollapsibleState');
        useCollapsibleState.mockReturnValue({
            isOpen: false,
            toggle: mockToggle,
            setOpen: jest.fn(),
            id: 'test-id',
        });
    });

    it('should render with title', () => {
        render(
            <CollapsibleSection id="test" title="Test Title">
                <div>Test Content</div>
            </CollapsibleSection>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should call toggle when header is clicked', async () => {
        const user = userEvent.setup();

        render(
            <CollapsibleSection id="test" title="Test Title">
                <div>Test Content</div>
            </CollapsibleSection>
        );

        const header = screen.getByRole('button');
        await user.click(header);

        expect(mockToggle).toHaveBeenCalledTimes(1);
    });
});
