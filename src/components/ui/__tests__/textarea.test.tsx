/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea', () => {
  describe('basic functionality', () => {
    it('renders textarea element', () => {
      render(<Textarea placeholder="Enter text..." />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('accepts text input', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Enter text..." />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello, World!');
      
      expect(textarea).toHaveValue('Hello, World!');
    });

    it('displays placeholder text', () => {
      render(<Textarea placeholder="Enter your message..." />);
      
      expect(screen.getByPlaceholderText('Enter your message...')).toBeInTheDocument();
    });

    it('handles controlled input', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      const ControlledTextarea = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <Textarea 
            value={value} 
            onChange={(e) => {
              setValue(e.target.value);
              handleChange(e.target.value);
            }} 
          />
        );
      };
      
      render(<ControlledTextarea />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');
      
      expect(handleChange).toHaveBeenCalledWith('test');
    });

    it('handles uncontrolled input with defaultValue', () => {
      render(<Textarea defaultValue="Initial text" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Initial text');
    });
  });

  describe('styling and variants', () => {
    it('applies custom className', () => {
      render(<Textarea className="custom-textarea" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('custom-textarea');
    });

    it('applies default styling classes', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('flex', 'min-h-[80px]', 'w-full', 'rounded-md', 'border');
    });

    it('merges custom classes with default classes', () => {
      render(<Textarea className="bg-red-500" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('flex', 'min-h-[80px]', 'bg-red-500');
    });
  });

  describe('accessibility', () => {
    it('has correct role', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Textarea aria-label="Message content" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAccessibleName('Message content');
    });

    it('supports aria-describedby', () => {
      render(
        <div>
          <Textarea aria-describedby="textarea-help" />
          <div id="textarea-help">Enter your message here</div>
        </div>
      );
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'textarea-help');
      expect(textarea).toHaveAccessibleDescription('Enter your message here');
    });

    it('supports aria-required', () => {
      render(<Textarea required aria-required="true" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-required', 'true');
      expect(textarea).toBeRequired();
    });

    it('supports aria-invalid for error states', () => {
      render(<Textarea aria-invalid="true" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('works with labels', () => {
      render(
        <div>
          <label htmlFor="message">Message</label>
          <Textarea id="message" />
        </div>
      );
      
      const textarea = screen.getByLabelText('Message');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('form integration', () => {
    it('works in form submission', async () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        return formData.get('message');
      });
      
      const user = userEvent.setup();
      
      render(
        <form onSubmit={handleSubmit}>
          <Textarea name="message" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('supports required validation', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <Textarea required />
          <button type="submit">Submit</button>
        </form>
      );
      
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      
      expect(textarea).toBeRequired();
      
      // Try to submit without filling required field
      await user.click(submitButton);
      expect(textarea).toBeInvalid();
    });

    it('supports maxLength validation', async () => {
      const user = userEvent.setup();
      
      render(<Textarea maxLength={10} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is a very long text');
      
      expect(textarea.value.length).toBeLessThanOrEqual(10);
    });

    it('supports minLength validation', () => {
      render(<Textarea minLength={5} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('minlength', '5');
    });
  });

  describe('keyboard interaction', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <input type="text" />
          <Textarea />
          <button>Next</button>
        </div>
      );
      
      const input = screen.getByRole('textbox', { name: '' });
      const textarea = screen.getByRole('textbox');
      const button = screen.getByRole('button', { name: 'Next' });
      
      input.focus();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(textarea).toHaveFocus();
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('supports Enter key for new lines', async () => {
      const user = userEvent.setup();
      
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Line 1{Enter}Line 2');
      
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('supports text selection shortcuts', async () => {
      const user = userEvent.setup();
      
      render(<Textarea defaultValue="Hello World" />);
      
      const textarea = screen.getByRole('textbox');
      textarea.focus();
      
      // Select all text
      await user.keyboard('{Control>}a{/Control}');
      
      // Type to replace selection
      await user.type(textarea, 'New text');
      
      expect(textarea).toHaveValue('New text');
    });
  });

  describe('disabled state', () => {
    it('renders as disabled', () => {
      render(<Textarea disabled />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      
      render(<Textarea disabled defaultValue="Original" />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New text');
      
      expect(textarea).toHaveValue('Original');
    });

    it('applies disabled styling', () => {
      render(<Textarea disabled />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('is not focusable when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <input type="text" />
          <Textarea disabled />
          <button>Next</button>
        </div>
      );
      
      const input = screen.getByRole('textbox', { name: '' });
      const button = screen.getByRole('button', { name: 'Next' });
      
      input.focus();
      await user.tab();
      
      // Should skip disabled textarea
      expect(button).toHaveFocus();
    });
  });

  describe('readonly state', () => {
    it('renders as readonly', () => {
      render(<Textarea readOnly />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('does not accept input when readonly', async () => {
      const user = userEvent.setup();
      
      render(<Textarea readOnly defaultValue="Original" />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New text');
      
      expect(textarea).toHaveValue('Original');
    });

    it('is focusable when readonly', async () => {
      const user = userEvent.setup();
      
      render(<Textarea readOnly />);
      
      const textarea = screen.getByRole('textbox');
      await user.tab();
      
      expect(textarea).toHaveFocus();
    });
  });

  describe('resizing', () => {
    it('applies resize classes by default', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-none');
    });

    it('supports custom resize behavior', () => {
      render(<Textarea className="resize-y" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('resize-y');
    });
  });

  describe('sizing', () => {
    it('has default minimum height', () => {
      render(<Textarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('min-h-[80px]');
    });

    it('supports custom height', () => {
      render(<Textarea className="h-32" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('h-32');
    });

    it('supports rows attribute', () => {
      render(<Textarea rows={10} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('supports cols attribute', () => {
      render(<Textarea cols={50} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('cols', '50');
    });
  });

  describe('error states', () => {
    it('supports error styling', () => {
      render(<Textarea className="border-red-500" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });

    it('works with error messages', () => {
      render(
        <div>
          <Textarea aria-describedby="error" aria-invalid="true" />
          <div id="error" role="alert">This field is required</div>
        </div>
      );
      
      const textarea = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');
      
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAccessibleDescription('This field is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('focus management', () => {
    it('supports focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Textarea onFocus={handleFocus} onBlur={handleBlur} />);
      
      const textarea = screen.getByRole('textbox');
      
      await user.click(textarea);
      expect(handleFocus).toHaveBeenCalled();
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    it('supports autofocus', () => {
      render(<Textarea autoFocus />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      
      render(<Textarea ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current).toBe(screen.getByRole('textbox'));
    });

    it('supports imperative methods via ref', async () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      const user = userEvent.setup();
      
      render(<Textarea ref={ref} />);
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello World');
      
      // Use ref to programmatically select text
      if (ref.current) {
        ref.current.select();
        expect(ref.current.selectionStart).toBe(0);
        expect(ref.current.selectionEnd).toBe(11);
      }
    });
  });
});