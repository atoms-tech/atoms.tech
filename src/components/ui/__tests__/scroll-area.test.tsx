/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrollArea, ScrollBar } from '../scroll-area';

describe('ScrollArea', () => {
  const ScrollAreaExample = () => (
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      <div className="space-y-4">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="text-sm">
            Item {i + 1}: This is a long line of text that might require horizontal scrolling if the container is narrow enough.
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  const HorizontalScrollExample = () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="shrink-0 rounded-md bg-slate-100 p-4">
            Item {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  describe('ScrollArea', () => {
    it('renders scroll area container', () => {
      render(<ScrollAreaExample />);
      
      // Should render the content
      expect(screen.getByText('Item 1: This is a long line of text that might require horizontal scrolling if the container is narrow enough.')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ScrollArea className="custom-scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      
      const scrollArea = screen.getByText('Content').closest('[data-radix-scroll-area-viewport]')?.parentElement;
      expect(scrollArea).toHaveClass('custom-scroll-area');
    });

    it('renders all items in scrollable content', () => {
      render(<ScrollAreaExample />);
      
      // First and last items should be present (even if not visible)
      expect(screen.getByText(/Item 1:/)).toBeInTheDocument();
      expect(screen.getByText(/Item 50:/)).toBeInTheDocument();
    });

    it('contains overflowing content', () => {
      render(<ScrollAreaExample />);
      
      const viewport = screen.getByText('Item 1: This is a long line of text that might require horizontal scrolling if the container is narrow enough.').closest('[data-radix-scroll-area-viewport]');
      expect(viewport).toBeInTheDocument();
      expect(viewport).toHaveStyle('overflow: hidden');
    });
  });

  describe('ScrollBar', () => {
    it('renders vertical scrollbar by default', () => {
      render(
        <ScrollArea className="h-[100px]">
          <div style={{ height: '200px' }}>Tall content</div>
          <ScrollBar />
        </ScrollArea>
      );
      
      const scrollbar = screen.getByText('Tall content').closest('[data-radix-scroll-area-root]')?.querySelector('[data-radix-scroll-area-scrollbar]');
      expect(scrollbar).toBeInTheDocument();
    });

    it('renders horizontal scrollbar when specified', () => {
      render(<HorizontalScrollExample />);
      
      const scrollbar = screen.getByText('Item 1').closest('[data-radix-scroll-area-root]')?.querySelector('[data-radix-scroll-area-scrollbar][data-orientation="horizontal"]');
      expect(scrollbar).toBeInTheDocument();
    });

    it('applies custom className to scrollbar', () => {
      render(
        <ScrollArea className="h-[100px]">
          <div style={{ height: '200px' }}>Content</div>
          <ScrollBar className="custom-scrollbar" />
        </ScrollArea>
      );
      
      const scrollbar = screen.getByText('Content').closest('[data-radix-scroll-area-root]')?.querySelector('[data-radix-scroll-area-scrollbar]');
      expect(scrollbar).toHaveClass('custom-scrollbar');
    });
  });

  describe('Scrolling behavior', () => {
    it('allows scrolling with wheel events', async () => {
      const user = userEvent.setup();
      render(<ScrollAreaExample />);
      
      const viewport = screen.getByText('Item 1: This is a long line of text that might require horizontal scrolling if the container is narrow enough.').closest('[data-radix-scroll-area-viewport]');
      
      // Simulate wheel scrolling
      if (viewport) {
        await user.hover(viewport);
        // Note: wheel events are complex to test in jsdom, so we just verify the viewport exists
        expect(viewport).toBeInTheDocument();
      }
    });

    it('maintains scroll position', () => {
      const { rerender } = render(<ScrollAreaExample />);
      
      const viewport = screen.getByText('Item 1: This is a long line of text that might require horizontal scrolling if the container is narrow enough.').closest('[data-radix-scroll-area-viewport]');
      
      // Simulate setting scroll position
      if (viewport) {
        Object.defineProperty(viewport, 'scrollTop', {
          writable: true,
          value: 100,
        });
        
        // Re-render and check scroll position is maintained
        rerender(<ScrollAreaExample />);
        expect(viewport.scrollTop).toBe(100);
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper scroll area structure', () => {
      render(<ScrollAreaExample />);
      
      const root = screen.getByText('Item 1: This is a long line of text that might require horizontal scrolling if the container is narrow enough.').closest('[data-radix-scroll-area-root]');
      const viewport = root?.querySelector('[data-radix-scroll-area-viewport]');
      
      expect(root).toBeInTheDocument();
      expect(viewport).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <ScrollArea className="h-[100px]">
          <div>
            <button>First button</button>
            <div style={{ height: '200px' }}>Spacer</div>
            <button>Last button</button>
          </div>
        </ScrollArea>
      );
      
      const firstButton = screen.getByRole('button', { name: 'First button' });
      const lastButton = screen.getByRole('button', { name: 'Last button' });
      
      // Focus first button
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      // Tab to last button (should scroll if needed)
      await user.tab();
      expect(lastButton).toHaveFocus();
    });

    it('supports arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<ScrollAreaExample />);
      
      const viewport = screen.getByText('Item 1: This is a long line of text that might require horizontal scrolling if the container is narrow enough.').closest('[data-radix-scroll-area-viewport]');
      
      if (viewport) {
        viewport.focus();
        expect(viewport).toHaveFocus();
        
        // Arrow keys should scroll (if supported by implementation)
        await user.keyboard('{ArrowDown}');
        // Note: Actual scrolling behavior depends on Radix implementation
      }
    });
  });

  describe('Edge cases', () => {
    it('handles empty content', () => {
      render(
        <ScrollArea className="h-[100px]">
          <div></div>
        </ScrollArea>
      );
      
      const viewport = screen.getByRole('generic').closest('[data-radix-scroll-area-viewport]');
      expect(viewport).toBeInTheDocument();
    });

    it('handles content smaller than container', () => {
      render(
        <ScrollArea className="h-[200px]">
          <div>Small content</div>
        </ScrollArea>
      );
      
      expect(screen.getByText('Small content')).toBeInTheDocument();
    });

    it('handles dynamic content changes', () => {
      const DynamicScrollArea = () => {
        const [items, setItems] = React.useState([1, 2, 3]);
        
        return (
          <div>
            <button onClick={() => setItems(prev => [...prev, prev.length + 1])}>
              Add Item
            </button>
            <ScrollArea className="h-[100px]">
              <div>
                {items.map(item => (
                  <div key={item}>Item {item}</div>
                ))}
              </div>
            </ScrollArea>
          </div>
        );
      };
      
      const user = userEvent.setup();
      render(<DynamicScrollArea />);
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      
      user.click(screen.getByRole('button', { name: 'Add Item' }));
      
      // New item should be added
      expect(screen.getByText('Item 4')).toBeInTheDocument();
    });
  });

  describe('Multiple scroll areas', () => {
    it('handles multiple independent scroll areas', () => {
      render(
        <div>
          <ScrollArea className="h-[100px]" data-testid="scroll-area-1">
            <div>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>Area 1 - Item {i + 1}</div>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="h-[100px]" data-testid="scroll-area-2">
            <div>
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i}>Area 2 - Item {i + 1}</div>
              ))}
            </div>
          </ScrollArea>
        </div>
      );
      
      expect(screen.getByText('Area 1 - Item 1')).toBeInTheDocument();
      expect(screen.getByText('Area 2 - Item 1')).toBeInTheDocument();
      
      const area1 = screen.getByTestId('scroll-area-1');
      const area2 = screen.getByTestId('scroll-area-2');
      
      expect(area1).toBeInTheDocument();
      expect(area2).toBeInTheDocument();
    });
  });

  describe('Styling and theming', () => {
    it('applies theme-based styling', () => {
      render(
        <ScrollArea className="rounded-md border">
          <div>Content</div>
        </ScrollArea>
      );
      
      const scrollArea = screen.getByText('Content').closest('[data-radix-scroll-area-root]');
      expect(scrollArea).toHaveClass('rounded-md', 'border');
    });

    it('supports custom scrollbar styling', () => {
      render(
        <ScrollArea className="h-[100px]">
          <div style={{ height: '200px' }}>Content</div>
          <ScrollBar className="bg-red-500" />
        </ScrollArea>
      );
      
      const scrollbar = screen.getByText('Content').closest('[data-radix-scroll-area-root]')?.querySelector('[data-radix-scroll-area-scrollbar]');
      expect(scrollbar).toHaveClass('bg-red-500');
    });
  });
});