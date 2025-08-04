/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../dropdown-menu';

describe('DropdownMenu', () => {
  const DropdownMenuExample = ({ onSelect = jest.fn() }) => (
    <DropdownMenu>
      <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSelect}>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSelect}>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSelect}>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSelect}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  describe('DropdownMenu', () => {
    it('renders trigger button', () => {
      render(<DropdownMenuExample />);
      expect(screen.getByRole('button', { name: 'Open Menu' })).toBeInTheDocument();
    });

    it('opens menu when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('has correct accessibility attributes', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      const trigger = screen.getByRole('button', { name: 'Open Menu' });
      await user.click(trigger);
      
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-labelledby', trigger.id);
    });

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Outside</button>
          <DropdownMenuExample />
        </div>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Outside' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes menu when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('accepts custom trigger element', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid="custom-trigger">Custom Trigger</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      const trigger = screen.getByTestId('custom-trigger');
      expect(trigger).toBeInTheDocument();
      
      await user.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuContent', () => {
    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const menu = screen.getByRole('menu');
      expect(menu).toHaveClass('custom-content');
    });

    it('supports different alignments', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuItem', () => {
    it('calls onSelect when clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<DropdownMenuExample onSelect={onSelect} />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      await user.click(screen.getByText('Profile'));
      
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onSelect when Enter is pressed', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(<DropdownMenuExample onSelect={onSelect} />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      const profileItem = screen.getByText('Profile');
      profileItem.focus();
      await user.keyboard('{Enter}');
      
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled onSelect={onSelect}>
              Disabled Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await user.click(screen.getByText('Disabled Item'));
      
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('supports inset styling', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>
              Inset Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const item = screen.getByText('Inset Item');
      expect(item).toHaveClass('pl-8');
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('toggles checked state when clicked', async () => {
      const user = userEvent.setup();
      const [checked, setChecked] = [false, jest.fn()];
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={checked}
              onCheckedChange={setChecked}
            >
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await user.click(screen.getByText('Checkbox Item'));
      
      expect(setChecked).toHaveBeenCalledWith(true);
    });

    it('has correct accessibility attributes', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>
              Checked Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const item = screen.getByText('Checked Item');
      expect(item).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('DropdownMenuRadioGroup', () => {
    it('manages radio selection', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1" onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await user.click(screen.getByText('Option 2'));
      
      expect(onValueChange).toHaveBeenCalledWith('option2');
    });

    it('has correct accessibility attributes', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">
                Selected Option
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Unselected Option
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const selectedItem = screen.getByText('Selected Option');
      const unselectedItem = screen.getByText('Unselected Option');
      
      expect(selectedItem).toHaveAttribute('aria-checked', 'true');
      expect(unselectedItem).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders label text', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      expect(screen.getByText('My Account')).toBeInTheDocument();
    });

    it('has correct semantic role', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Section Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const label = screen.getByText('Section Label');
      expect(label).toBeInTheDocument();
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders separator', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      const separators = screen.getAllByRole('separator');
      expect(separators).toHaveLength(2);
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      expect(screen.getByText('⇧⌘P')).toBeInTheDocument();
      expect(screen.getByText('⌘B')).toBeInTheDocument();
      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuSub', () => {
    const SubMenuExample = () => (
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Regular Item</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Save Page As...</DropdownMenuItem>
              <DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
              <DropdownMenuItem>Name Window...</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    it('opens submenu on hover', async () => {
      const user = userEvent.setup();
      render(<SubMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      await user.hover(screen.getByText('More Tools'));
      
      expect(screen.getByText('Save Page As...')).toBeInTheDocument();
    });

    it('opens submenu on arrow key', async () => {
      const user = userEvent.setup();
      render(<SubMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      const subTrigger = screen.getByText('More Tools');
      subTrigger.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(screen.getByText('Save Page As...')).toBeInTheDocument();
    });

    it('has correct accessibility attributes', async () => {
      const user = userEvent.setup();
      render(<SubMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      const subTrigger = screen.getByText('More Tools');
      expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      // First item should be focused
      expect(screen.getByText('Profile')).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Billing')).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Settings')).toHaveFocus();
    });

    it('wraps around at list boundaries', async () => {
      const user = userEvent.setup();
      render(<DropdownMenuExample />);
      
      await user.click(screen.getByRole('button', { name: 'Open Menu' }));
      
      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('Logout')).toHaveFocus();
    });

    it('skips disabled items', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>First</DropdownMenuItem>
            <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
            <DropdownMenuItem>Third</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Third')).toHaveFocus();
    });

    it('skips separators and labels', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Label</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      expect(screen.getByText('Item')).toHaveFocus();
    });
  });

  describe('Controlled mode', () => {
    it('works in controlled mode', async () => {
      const ControlledDropdown = () => {
        const [open, setOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open Controlled</button>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuContent>
                <DropdownMenuItem>Item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledDropdown />);
      
      await user.click(screen.getByRole('button', { name: 'Open Controlled' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});