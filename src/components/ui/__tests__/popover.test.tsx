/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../popover';

describe('Popover', () => {
  const PopoverExample = ({ onOpenChange = jest.fn() }) => (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger>Open popover</PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="width">Width</label>
              <input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="maxWidth">Max. width</label>
              <input
                id="maxWidth"
                defaultValue="300px"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="height">Height</label>
              <input
                id="height"
                defaultValue="25px"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  describe('Popover', () => {
    it('renders trigger button', () => {
      render(<PopoverExample />);
      expect(screen.getByRole('button', { name: 'Open popover' })).toBeInTheDocument();
    });

    it('opens popover when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<PopoverExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open popover' }));
      
      expect(screen.getByText('Dimensions')).toBeInTheDocument();
      expect(screen.getByLabelText('Width')).toBeInTheDocument();
    });

    it('has correct accessibility attributes', async () => {
      const user = userEvent.setup();
      render(<PopoverExample />);
      
      const trigger = screen.getByRole('button', { name: 'Open popover' });
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      
      const content = screen.getByRole('dialog');
      expect(content).toBeInTheDocument();
    });

    it('closes popover when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Outside</button>
          <PopoverExample />
        </div>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open popover' }));
      expect(screen.getByText('Dimensions')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Outside' }));
      expect(screen.queryByText('Dimensions')).not.toBeInTheDocument();
    });

    it('closes popover when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<PopoverExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open popover' }));
      expect(screen.getByText('Dimensions')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Dimensions')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when state changes', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      render(<PopoverExample onOpenChange={onOpenChange} />);
      
      await user.click(screen.getByRole('button', { name: 'Open popover' }));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('maintains focus within popover', async () => {
      const user = userEvent.setup();
      render(<PopoverExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open popover' }));
      
      const widthInput = screen.getByLabelText('Width');
      widthInput.focus();
      expect(widthInput).toHaveFocus();
    });

    it('returns focus to trigger when closed', async () => {
      const user = userEvent.setup();
      render(<PopoverExample />);
      
      const trigger = screen.getByRole('button', { name: 'Open popover' });
      await user.click(trigger);
      await user.keyboard('{Escape}');
      
      expect(trigger).toHaveFocus();
    });
  });

  describe('PopoverTrigger', () => {
    it('accepts custom trigger element', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button data-testid="custom-trigger">Custom Trigger</button>
          </PopoverTrigger>
          <PopoverContent>
            <p>Content</p>
          </PopoverContent>
        </Popover>
      );
      
      const trigger = screen.getByTestId('custom-trigger');
      expect(trigger).toBeInTheDocument();
      
      await user.click(trigger);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('works with disabled trigger', () => {
      render(
        <Popover>
          <PopoverTrigger disabled>Disabled Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      
      const trigger = screen.getByRole('button', { name: 'Disabled Trigger' });
      expect(trigger).toBeDisabled();
    });
  });

  describe('PopoverContent', () => {
    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className="custom-content">
            <p>Content</p>
          </PopoverContent>
        </Popover>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('custom-content');
    });

    it('supports different alignments', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align="end">
            <p>Content</p>
          </PopoverContent>
        </Popover>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('supports different sides', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side="bottom">
            <p>Content</p>
          </PopoverContent>
        </Popover>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('supports side offset', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent sideOffset={10}>
            <p>Content</p>
          </PopoverContent>
        </Popover>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Controlled mode', () => {
    it('works in controlled mode', async () => {
      const ControlledPopover = () => {
        const [open, setOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open Controlled</button>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverContent>
                <button onClick={() => setOpen(false)}>Close</button>
              </PopoverContent>
            </Popover>
          </div>
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledPopover />);
      
      await user.click(screen.getByRole('button', { name: 'Open Controlled' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('respects controlled open state', () => {
      const { rerender } = render(
        <Popover open={false}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      rerender(
        <Popover open={true}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles rapid open/close operations', async () => {
      const user = userEvent.setup();
      render(<PopoverExample />);
      
      const trigger = screen.getByRole('button', { name: 'Open popover' });
      
      // Rapidly click trigger multiple times
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);
      
      // Should be closed after odd number of clicks
      expect(screen.queryByText('Dimensions')).not.toBeInTheDocument();
    });

    it('works with nested interactive elements', async () => {
      const onButtonClick = jest.fn();
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <button onClick={onButtonClick}>Nested Button</button>
            <input placeholder="Nested Input" />
          </PopoverContent>
        </Popover>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const nestedButton = screen.getByRole('button', { name: 'Nested Button' });
      await user.click(nestedButton);
      expect(onButtonClick).toHaveBeenCalledTimes(1);
      
      const nestedInput = screen.getByPlaceholderText('Nested Input');
      await user.type(nestedInput, 'test');
      expect(nestedInput).toHaveValue('test');
    });

    it('handles content that changes size', async () => {
      const DynamicPopover = () => {
        const [expanded, setExpanded] = React.useState(false);
        
        return (
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent>
              <button onClick={() => setExpanded(!expanded)}>
                Toggle Size
              </button>
              {expanded && (
                <div style={{ width: 400, height: 200 }}>
                  Large content that changes the popover size
                </div>
              )}
            </PopoverContent>
          </Popover>
        );
      };
      
      const user = userEvent.setup();
      render(<DynamicPopover />);
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await user.click(screen.getByRole('button', { name: 'Toggle Size' }));
      
      expect(screen.getByText('Large content that changes the popover size')).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('handles collision detection', async () => {
      const user = userEvent.setup();
      render(
        <div style={{ padding: '10px', height: '100vh' }}>
          <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
            <Popover>
              <PopoverTrigger>Corner Trigger</PopoverTrigger>
              <PopoverContent>
                <div style={{ width: 200, height: 100 }}>
                  Content that might overflow
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );
      
      await user.click(screen.getByRole('button', { name: 'Corner Trigger' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});