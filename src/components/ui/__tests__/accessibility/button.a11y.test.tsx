/**
 * Button Component Accessibility Tests
 * 
 * Comprehensive WCAG 2.1 AA accessibility testing for the Button component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../button';
import { a11yTest } from '@/test-utils/accessibility-test-utils';

describe('Button Accessibility Tests', () => {
  describe('Basic Accessibility', () => {
    it('should pass basic accessibility audit', async () => {
      await a11yTest.basic(
        <Button>Click me</Button>
      );
    });

    it('should have correct button role', () => {
      render(<Button>Submit</Button>);
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible name from text content', () => {
      render(<Button>Save Changes</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Save Changes');
    });

    it('should have accessible name from aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Close dialog');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<Button>Focus me</Button>);
      
      await user.tab();
      const button = screen.getByRole('button');
      expect(button).toHaveFocus();
    });

    it('should be activatable with Enter key', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be activatable with Space key', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Press Space</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have visible focus indicator', async () => {
      const user = userEvent.setup();
      render(<Button>Focus me</Button>);
      
      await user.tab();
      const button = screen.getByRole('button');
      expect(button).toHaveFocusIndicator();
    });
  });

  describe('Disabled State', () => {
    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('tabindex', '-1');
    });

    it('should have correct ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveCorrectAriaAttributes({
        'aria-disabled': 'true'
      });
    });

    it('should not respond to keyboard activation when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await user.type(button, '{Enter} ');
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should maintain accessibility during loading', async () => {
      await a11yTest.basic(
        <Button disabled aria-label="Loading, please wait">
          Loading...
        </Button>
      );
    });

    it('should have appropriate ARIA attributes for loading', () => {
      render(
        <Button disabled aria-label="Saving changes, please wait">
          <span className="sr-only">Saving...</span>
          Saving
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Saving changes, please wait');
    });
  });

  describe('Icon Buttons', () => {
    it('should have accessible name for icon-only buttons', () => {
      render(
        <Button aria-label="Delete item" size="icon">
          🗑️
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Delete item');
    });

    it('should pass accessibility audit for icon buttons', async () => {
      await a11yTest.basic(
        <Button aria-label="Search" size="icon">
          🔍
        </Button>
      );
    });
  });

  describe('Button Variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

    it.each(variants)('should be accessible for %s variant', async (variant) => {
      await a11yTest.basic(
        <Button variant={variant}>
          {variant} Button
        </Button>
      );
    });

    it('should maintain sufficient color contrast for all variants', async () => {
      for (const variant of variants) {
        await a11yTest.colorContrast(
          <Button variant={variant}>
            {variant} Button
          </Button>
        );
      }
    });
  });

  describe('Touch Accessibility', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    it.each(sizes)('should have appropriate touch target size for %s size', (size) => {
      render(<Button size={size}>Touch me</Button>);
      a11yTest.touch(<Button size={size}>Touch me</Button>);
    });
  });

  describe('High Contrast Mode', () => {
    it('should be visible in high contrast mode', () => {
      a11yTest.highContrast(<Button>High Contrast</Button>);
    });

    it('should maintain button appearance in forced colors', () => {
      render(<Button>Forced Colors</Button>);
      
      // Simulate forced-colors mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(forced-colors: active)',
          media: query,
        })),
      });

      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // In forced colors mode, buttons should use system colors
      expect(styles.getPropertyValue('border')).toBeTruthy();
    });
  });

  describe('Reduced Motion', () => {
    it('should respect reduced motion preferences', () => {
      a11yTest.reducedMotion(<Button>No Animation</Button>);
    });
  });

  describe('Text Scaling', () => {
    it('should remain functional at 200% text scale', () => {
      a11yTest.textScaling(<Button>Scalable Text</Button>);
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide appropriate information to screen readers', () => {
      render(
        <Button 
          aria-describedby="button-help"
          aria-pressed="false"
        >
          Toggle Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'button-help');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('should work with screen reader testing', () => {
      a11yTest.screenReader(
        <div>
          <Button>Primary Action</Button>
          <p id="button-help">This button performs the primary action</p>
        </div>
      );
    });
  });

  describe('Form Integration', () => {
    it('should work correctly in forms', async () => {
      await a11yTest.basic(
        <form>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" />
          <Button type="submit">Submit Form</Button>
          <Button type="button">Cancel</Button>
        </form>
      );
    });

    it('should have correct form attributes', () => {
      render(
        <form>
          <Button type="submit">Submit</Button>
          <Button type="reset">Reset</Button>
          <Button type="button">Cancel</Button>
        </form>
      );

      expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
      expect(screen.getByRole('button', { name: 'Reset' })).toHaveAttribute('type', 'reset');
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button');
    });
  });

  describe('Comprehensive Accessibility Suite', () => {
    it('should pass complete accessibility test suite', async () => {
      await a11yTest.suite(
        <Button onClick={() => console.log('clicked')}>
          Complete Test
        </Button>,
        {
          focusableElements: ['button'],
          minimumContrastRatio: 4.5
        }
      );
    });
  });
});