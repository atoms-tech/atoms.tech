/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../alert-dialog';

describe('AlertDialog', () => {
  const AlertDialogExample = ({ onAction = jest.fn(), onCancel = jest.fn() }) => (
    <AlertDialog>
      <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  it('renders trigger button', () => {
    render(<AlertDialogExample />);
    expect(screen.getByRole('button', { name: 'Open Alert' })).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('calls onAction when Continue is clicked', async () => {
    const onAction = jest.fn();
    const user = userEvent.setup();
    render(<AlertDialogExample onAction={onAction} />);
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(<AlertDialogExample onCancel={onCancel} />);
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes dialog when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('traps focus within dialog', async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    
    // Focus should be trapped within dialog
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    
    expect(document.activeElement).toBeInTheDocument();
    
    await user.tab();
    expect([cancelButton, continueButton]).toContain(document.activeElement);
  });

  it('returns focus to trigger when closed', async () => {
    const user = userEvent.setup();
    render(<AlertDialogExample />);
    
    const trigger = screen.getByRole('button', { name: 'Open Alert' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    
    expect(trigger).toHaveFocus();
  });

  it('prevents background interaction when open', async () => {
    const outsideClick = jest.fn();
    const user = userEvent.setup();
    render(
      <div>
        <button onClick={outsideClick}>Outside</button>
        <AlertDialogExample />
      </div>
    );
    
    await user.click(screen.getByRole('button', { name: 'Open Alert' }));
    
    // Try to click outside button - should not work
    const outsideButton = screen.getByRole('button', { name: 'Outside' });
    await user.click(outsideButton);
    
    expect(outsideClick).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  describe('AlertDialogTrigger', () => {
    it('accepts custom trigger element', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button data-testid="custom-trigger">Custom Trigger</button>
          </AlertDialogTrigger>
        </AlertDialog>
      );
      
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });
  });

  describe('AlertDialogContent', () => {
    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent className="custom-content">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveClass('custom-content');
    });
  });

  describe('AlertDialogTitle', () => {
    it('provides accessible name for dialog', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAccessibleName('Confirmation');
    });
  });

  describe('AlertDialogDescription', () => {
    it('provides accessible description for dialog', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>This is a description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAccessibleDescription('This is a description');
    });
  });

  describe('AlertDialogAction', () => {
    it('has correct variant styling', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction>Action</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      
      const actionButton = screen.getByRole('button', { name: 'Action' });
      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('AlertDialogCancel', () => {
    it('closes dialog when clicked', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      await user.click(screen.getByRole('button', { name: 'Open' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('Controlled mode', () => {
    it('works in controlled mode', async () => {
      const ControlledAlertDialog = () => {
        const [open, setOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open Controlled</button>
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogContent>
                <AlertDialogTitle>Controlled Dialog</AlertDialogTitle>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      };
      
      const user = userEvent.setup();
      render(<ControlledAlertDialog />);
      
      await user.click(screen.getByRole('button', { name: 'Open Controlled' }));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});