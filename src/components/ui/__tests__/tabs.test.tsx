/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../tabs';

describe('Tabs', () => {
  const TabsExample = ({ defaultValue = 'account', onValueChange = jest.fn() }) => (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div>Account settings content</div>
      </TabsContent>
      <TabsContent value="password">
        <div>Password settings content</div>
      </TabsContent>
      <TabsContent value="settings">
        <div>General settings content</div>
      </TabsContent>
    </Tabs>
  );

  describe('Tabs', () => {
    it('renders tabs container', () => {
      render(<TabsExample />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Password' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
    });

    it('shows default tab content', () => {
      render(<TabsExample defaultValue="account" />);
      
      expect(screen.getByText('Account settings content')).toBeInTheDocument();
      expect(screen.queryByText('Password settings content')).not.toBeInTheDocument();
      expect(screen.queryByText('General settings content')).not.toBeInTheDocument();
    });

    it('has correct accessibility attributes', () => {
      render(<TabsExample />);
      
      const tablist = screen.getByRole('tablist');
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      
      expect(tablist).toBeInTheDocument();
      expect(accountTab).toHaveAttribute('aria-selected', 'true');
      expect(passwordTab).toHaveAttribute('aria-selected', 'false');
      
      const accountPanel = screen.getByRole('tabpanel');
      expect(accountPanel).toHaveAttribute('aria-labelledby', accountTab.id);
    });

    it('applies custom className', () => {
      render(
        <Tabs className="custom-tabs" defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Content</TabsContent>
        </Tabs>
      );
      
      const tabs = screen.getByRole('tablist').closest('[data-orientation]');
      expect(tabs).toHaveClass('custom-tabs');
    });

    it('supports different orientations', () => {
      render(
        <Tabs orientation="vertical" defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Content</TabsContent>
        </Tabs>
      );
      
      const tabs = screen.getByRole('tablist').closest('[data-orientation]');
      expect(tabs).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  describe('TabsList', () => {
    it('renders tab list container', () => {
      render(<TabsExample />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toContainElement(screen.getByRole('tab', { name: 'Account' }));
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="account">
          <TabsList className="custom-tablist">
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Content</TabsContent>
        </Tabs>
      );
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('custom-tablist');
    });
  });

  describe('TabsTrigger', () => {
    it('switches tabs when clicked', async () => {
      const user = userEvent.setup();
      render(<TabsExample />);
      
      expect(screen.getByText('Account settings content')).toBeInTheDocument();
      
      await user.click(screen.getByRole('tab', { name: 'Password' }));
      
      expect(screen.getByText('Password settings content')).toBeInTheDocument();
      expect(screen.queryByText('Account settings content')).not.toBeInTheDocument();
    });

    it('calls onValueChange when tab is switched', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();
      render(<TabsExample onValueChange={onValueChange} />);
      
      await user.click(screen.getByRole('tab', { name: 'Password' }));
      
      expect(onValueChange).toHaveBeenCalledWith('password');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TabsExample />);
      
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      
      accountTab.focus();
      expect(accountTab).toHaveFocus();
      
      await user.keyboard('{ArrowRight}');
      expect(passwordTab).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Password settings content')).toBeInTheDocument();
    });

    it('wraps keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TabsExample />);
      
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      const settingsTab = screen.getByRole('tab', { name: 'Settings' });
      
      settingsTab.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(accountTab).toHaveFocus();
    });

    it('supports Home and End keys', async () => {
      const user = userEvent.setup();
      render(<TabsExample />);
      
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      const settingsTab = screen.getByRole('tab', { name: 'Settings' });
      
      accountTab.focus();
      await user.keyboard('{End}');
      expect(settingsTab).toHaveFocus();
      
      await user.keyboard('{Home}');
      expect(accountTab).toHaveFocus();
    });

    it('can be disabled', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password" disabled>Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account content</TabsContent>
          <TabsContent value="password">Password content</TabsContent>
        </Tabs>
      );
      
      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      expect(passwordTab).toBeDisabled();
      
      await user.click(passwordTab);
      expect(screen.getByText('Account content')).toBeInTheDocument();
      expect(screen.queryByText('Password content')).not.toBeInTheDocument();
    });

    it('skips disabled tabs in keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password" disabled>Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account content</TabsContent>
          <TabsContent value="password">Password content</TabsContent>
          <TabsContent value="settings">Settings content</TabsContent>
        </Tabs>
      );
      
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      const settingsTab = screen.getByRole('tab', { name: 'Settings' });
      
      accountTab.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(settingsTab).toHaveFocus();
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account" className="custom-trigger">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Content</TabsContent>
        </Tabs>
      );
      
      const trigger = screen.getByRole('tab', { name: 'Account' });
      expect(trigger).toHaveClass('custom-trigger');
    });
  });

  describe('TabsContent', () => {
    it('shows content for active tab', () => {
      render(<TabsExample defaultValue="password" />);
      
      expect(screen.getByText('Password settings content')).toBeInTheDocument();
      expect(screen.queryByText('Account settings content')).not.toBeInTheDocument();
    });

    it('has correct accessibility attributes', () => {
      render(<TabsExample />);
      
      const panel = screen.getByRole('tabpanel');
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      
      expect(panel).toHaveAttribute('aria-labelledby', accountTab.id);
      expect(panel).toHaveAttribute('tabindex', '0');
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="custom-content">
            Content
          </TabsContent>
        </Tabs>
      );
      
      const content = screen.getByRole('tabpanel');
      expect(content).toHaveClass('custom-content');
    });

    it('supports focus management', async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <input placeholder="Account input" />
          </TabsContent>
          <TabsContent value="password">
            <input placeholder="Password input" />
          </TabsContent>
        </Tabs>
      );
      
      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      await user.click(passwordTab);
      
      const passwordInput = screen.getByPlaceholderText('Password input');
      passwordInput.focus();
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Controlled mode', () => {
    it('works in controlled mode', async () => {
      const ControlledTabs = () => {
        const [value, setValue] = React.useState('account');
        
        return (
          <div>
            <button onClick={() => setValue('password')}>
              Switch to Password
            </button>
            <Tabs value={value} onValueChange={setValue}>
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
              <TabsContent value="account">Account content</TabsContent>
              <TabsContent value="password">Password content</TabsContent>
            </Tabs>
          </div>
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledTabs />);
      
      expect(screen.getByText('Account content')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Switch to Password' }));
      
      expect(screen.getByText('Password content')).toBeInTheDocument();
      expect(screen.queryByText('Account content')).not.toBeInTheDocument();
    });

    it('respects controlled value prop', () => {
      const { rerender } = render(
        <Tabs value="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account content</TabsContent>
          <TabsContent value="password">Password content</TabsContent>
        </Tabs>
      );
      
      expect(screen.getByText('Account content')).toBeInTheDocument();
      
      rerender(
        <Tabs value="password">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account content</TabsContent>
          <TabsContent value="password">Password content</TabsContent>
        </Tabs>
      );
      
      expect(screen.getByText('Password content')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles tabs with no content', () => {
      render(
        <Tabs defaultValue="empty">
          <TabsList>
            <TabsTrigger value="empty">Empty Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="empty"></TabsContent>
        </Tabs>
      );
      
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('handles dynamic tab addition', async () => {
      const DynamicTabs = () => {
        const [tabs, setTabs] = React.useState(['tab1']);
        
        return (
          <div>
            <button onClick={() => setTabs(prev => [...prev, `tab${prev.length + 1}`])}>
              Add Tab
            </button>
            <Tabs defaultValue="tab1">
              <TabsList>
                {tabs.map(tab => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map(tab => (
                <TabsContent key={tab} value={tab}>
                  Content for {tab}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        );
      };
      
      const user = userEvent.setup();
      render(<DynamicTabs />);
      
      expect(screen.getByRole('tab', { name: 'TAB1' })).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Add Tab' }));
      
      expect(screen.getByRole('tab', { name: 'TAB2' })).toBeInTheDocument();
    });

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup();
      render(<TabsExample />);
      
      const accountTab = screen.getByRole('tab', { name: 'Account' });
      const passwordTab = screen.getByRole('tab', { name: 'Password' });
      const settingsTab = screen.getByRole('tab', { name: 'Settings' });
      
      // Rapidly switch between tabs
      await user.click(passwordTab);
      await user.click(settingsTab);
      await user.click(accountTab);
      
      expect(screen.getByText('Account settings content')).toBeInTheDocument();
    });
  });
});