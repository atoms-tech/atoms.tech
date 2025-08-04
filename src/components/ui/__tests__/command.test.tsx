/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '../command';

describe('Command', () => {
  const CommandExample = () => (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <span>Calendar</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Search Emoji</span>
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Billing</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );

  describe('Command', () => {
    it('renders command palette', () => {
      render(<CommandExample />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('has correct accessibility attributes', () => {
      render(<CommandExample />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('applies custom className', () => {
      render(
        <Command className="custom-command">
          <CommandInput />
        </Command>
      );
      
      const command = screen.getByRole('combobox').closest('[cmdk-root]');
      expect(command).toHaveClass('custom-command');
    });
  });

  describe('CommandInput', () => {
    it('renders search input', () => {
      render(<CommandExample />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('allows typing', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'calendar');
      
      expect(input).toHaveValue('calendar');
    });

    it('filters items based on input', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'calendar');
      
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('accepts custom placeholder', () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command..." />
        </Command>
      );
      
      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    });
  });

  describe('CommandList', () => {
    it('renders command list', () => {
      render(<CommandExample />);
      const list = screen.getByRole('listbox');
      expect(list).toBeInTheDocument();
    });

    it('contains command items', () => {
      render(<CommandExample />);
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('CommandItem', () => {
    it('renders command items', () => {
      render(<CommandExample />);
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Search Emoji')).toBeInTheDocument();
    });

    it('is selectable with keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      input.focus();
      
      await user.keyboard('{ArrowDown}');
      
      const firstItem = screen.getByText('Calendar').closest('[cmdk-item]');
      expect(firstItem).toHaveAttribute('aria-selected', 'true');
    });

    it('calls onSelect when clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Command>
          <CommandList>
            <CommandItem onSelect={onSelect}>Test Item</CommandItem>
          </CommandList>
        </Command>
      );
      
      await user.click(screen.getByText('Test Item'));
      expect(onSelect).toHaveBeenCalledWith('Test Item');
    });

    it('calls onSelect when Enter is pressed', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandItem onSelect={onSelect}>Test Item</CommandItem>
          </CommandList>
        </Command>
      );
      
      const input = screen.getByRole('combobox');
      input.focus();
      await user.keyboard('{ArrowDown}{Enter}');
      
      expect(onSelect).toHaveBeenCalledWith('Test Item');
    });

    it('can be disabled', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem disabled>Disabled Item</CommandItem>
          </CommandList>
        </Command>
      );
      
      const item = screen.getByText('Disabled Item').closest('[cmdk-item]');
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('CommandGroup', () => {
    it('renders group with heading', () => {
      render(<CommandExample />);
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('groups related items', () => {
      render(<CommandExample />);
      
      const suggestionsGroup = screen.getByText('Suggestions').closest('[cmdk-group]');
      expect(suggestionsGroup).toContainElement(screen.getByText('Calendar'));
      expect(suggestionsGroup).toContainElement(screen.getByText('Search Emoji'));
    });
  });

  describe('CommandEmpty', () => {
    it('shows when no results found', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'nonexistent');
      
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('hides when results are available', () => {
      render(<CommandExample />);
      expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
    });
  });

  describe('CommandSeparator', () => {
    it('renders separator', () => {
      render(<CommandExample />);
      const separator = screen.getByRole('separator');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('CommandShortcut', () => {
    it('renders keyboard shortcuts', () => {
      render(<CommandExample />);
      expect(screen.getByText('⌘K')).toBeInTheDocument();
      expect(screen.getByText('⌘J')).toBeInTheDocument();
    });
  });

  describe('CommandDialog', () => {
    const CommandDialogExample = ({ open = false, onOpenChange = jest.fn() }) => (
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );

    it('renders dialog when open', () => {
      render(<CommandDialogExample open={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CommandDialogExample open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when escape is pressed', async () => {
      const onOpenChange = jest.fn();
      const user = userEvent.setup();
      
      render(<CommandDialogExample open={true} onOpenChange={onOpenChange} />);
      
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('has correct dialog attributes', () => {
      render(<CommandDialogExample open={true} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('focuses input when opened', () => {
      render(<CommandDialogExample open={true} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      input.focus();
      
      await user.keyboard('{ArrowDown}');
      let selectedItem = screen.getByText('Calendar').closest('[cmdk-item]');
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
      
      await user.keyboard('{ArrowDown}');
      selectedItem = screen.getByText('Search Emoji').closest('[cmdk-item]');
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
      
      await user.keyboard('{ArrowUp}');
      selectedItem = screen.getByText('Calendar').closest('[cmdk-item]');
      expect(selectedItem).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps around at list boundaries', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandItem>First</CommandItem>
            <CommandItem>Last</CommandItem>
          </CommandList>
        </Command>
      );
      
      const input = screen.getByRole('combobox');
      input.focus();
      
      await user.keyboard('{ArrowUp}');
      const lastItem = screen.getByText('Last').closest('[cmdk-item]');
      expect(lastItem).toHaveAttribute('aria-selected', 'true');
    });

    it('skips disabled items', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandItem>First</CommandItem>
            <CommandItem disabled>Disabled</CommandItem>
            <CommandItem>Third</CommandItem>
          </CommandList>
        </Command>
      );
      
      const input = screen.getByRole('combobox');
      input.focus();
      
      await user.keyboard('{ArrowDown}{ArrowDown}');
      const thirdItem = screen.getByText('Third').closest('[cmdk-item]');
      expect(thirdItem).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Filtering', () => {
    it('filters case-insensitively', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'CALENDAR');
      
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });

    it('shows empty state when no matches', async () => {
      const user = userEvent.setup();
      render(<CommandExample />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'xyz');
      
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('supports custom filter function', async () => {
      const customFilter = jest.fn((value, search) => {
        return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
      });
      
      const user = userEvent.setup();
      render(
        <Command filter={customFilter}>
          <CommandInput />
          <CommandList>
            <CommandItem value="test">Test Item</CommandItem>
          </CommandList>
        </Command>
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      expect(customFilter).toHaveBeenCalledWith('test', 'test', []);
    });
  });
});