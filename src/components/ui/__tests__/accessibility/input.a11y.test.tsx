/**
 * Input Component Accessibility Tests
 * 
 * Comprehensive WCAG 2.1 AA accessibility testing for form inputs
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../input';
import { Label } from '../../label';
import { a11yTest } from '@/test-utils/accessibility-test-utils';

describe('Input Accessibility Tests', () => {
  describe('Basic Accessibility', () => {
    it('should pass basic accessibility audit with label', async () => {
      await a11yTest.basic(
        <div>
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" name="email" />
        </div>
      );
    });

    it('should have correct textbox role', () => {
      render(
        <div>
          <Label htmlFor="username">Username</Label>
          <Input type="text" id="username" name="username" />
        </div>
      );
      
      const input = screen.getByRole('textbox', { name: 'Username' });
      expect(input).toBeInTheDocument();
    });

    it('should be associated with label via htmlFor/id', () => {
      render(
        <div>
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" name="password" />
        </div>
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'password');
    });

    it('should have accessible name from aria-label', () => {
      render(<Input type="text" aria-label="Search query" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAccessibleName('Search query');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Label htmlFor="focus-test">Focus Test</Label>
          <Input type="text" id="focus-test" />
        </div>
      );
      
      await user.tab();
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });

    it('should accept text input via keyboard', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Label htmlFor="text-input">Text Input</Label>
          <Input type="text" id="text-input" />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('should have visible focus indicator', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Label htmlFor="focus-indicator">Focus Indicator</Label>
          <Input type="text" id="focus-indicator" />
        </div>
      );
      
      await user.tab();
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocusIndicator();
    });
  });

  describe('Form Validation', () => {
    it('should handle required field validation', async () => {
      await a11yTest.basic(
        <div>
          <Label htmlFor="required-field">Required Field *</Label>
          <Input 
            type="text" 
            id="required-field" 
            required 
            aria-required="true"
          />
        </div>
      );
    });

    it('should associate error messages with aria-describedby', async () => {
      await a11yTest.basic(
        <div>
          <Label htmlFor="email-error">Email</Label>
          <Input 
            type="email" 
            id="email-error" 
            aria-describedby="email-error-message"
            aria-invalid="true"
          />
          <div id="email-error-message" role="alert">
            Please enter a valid email address
          </div>
        </div>
      );
    });

    it('should have correct ARIA attributes for invalid state', () => {
      render(
        <div>
          <Label htmlFor="invalid-input">Invalid Input</Label>
          <Input 
            type="text" 
            id="invalid-input" 
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <div id="error-message" role="alert">
            This field is required
          </div>
        </div>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveCorrectAriaAttributes({
        'aria-invalid': 'true',
        'aria-describedby': 'error-message'
      });
    });
  });

  describe('Input Types', () => {
    const inputTypes = [
      { type: 'text', role: 'textbox' },
      { type: 'email', role: 'textbox' },
      { type: 'password', role: 'textbox' },
      { type: 'tel', role: 'textbox' },
      { type: 'url', role: 'textbox' },
      { type: 'search', role: 'searchbox' },
      { type: 'number', role: 'spinbutton' }
    ];

    it.each(inputTypes)('should be accessible for $type input', async ({ type, role }) => {
      await a11yTest.basic(
        <div>
          <Label htmlFor={`${type}-input`}>{type} Input</Label>
          <Input type={type as any} id={`${type}-input`} />
        </div>
      );

      const input = screen.getByRole(role as any);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should not be focusable when disabled', () => {
      render(
        <div>
          <Label htmlFor="disabled-input">Disabled Input</Label>
          <Input type="text" id="disabled-input" disabled />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('tabindex', '-1');
    });

    it('should have correct ARIA attributes when disabled', () => {
      render(
        <div>
          <Label htmlFor="disabled-aria">Disabled ARIA</Label>
          <Input type="text" id="disabled-aria" disabled />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveCorrectAriaAttributes({
        'aria-disabled': 'true'
      });
    });
  });

  describe('Placeholder Text', () => {
    it('should not rely solely on placeholder for labeling', async () => {
      // This should fail accessibility audit if no proper label
      await expect(
        a11yTest.basic(<Input type="text" placeholder="Enter your name" />)
      ).rejects.toThrow();
    });

    it('should work with proper label and placeholder', async () => {
      await a11yTest.basic(
        <div>
          <Label htmlFor="name-with-placeholder">Full Name</Label>
          <Input 
            type="text" 
            id="name-with-placeholder" 
            placeholder="e.g. John Doe"
          />
        </div>
      );
    });
  });

  describe('Touch Accessibility', () => {
    it('should have appropriate touch target size', () => {
      render(
        <div>
          <Label htmlFor="touch-input">Touch Input</Label>
          <Input type="text" id="touch-input" />
        </div>
      );
      
      a11yTest.touch(
        <div>
          <Label htmlFor="touch-input">Touch Input</Label>
          <Input type="text" id="touch-input" />
        </div>
      );
    });
  });

  describe('High Contrast Mode', () => {
    it('should be visible in high contrast mode', () => {
      a11yTest.highContrast(
        <div>
          <Label htmlFor="contrast-input">High Contrast</Label>
          <Input type="text" id="contrast-input" />
        </div>
      );
    });
  });

  describe('Text Scaling', () => {
    it('should remain functional at 200% text scale', () => {
      a11yTest.textScaling(
        <div>
          <Label htmlFor="scale-input">Scalable Input</Label>
          <Input type="text" id="scale-input" />
        </div>
      );
    });
  });

  describe('Autocomplete', () => {
    it('should support autocomplete attributes', async () => {
      await a11yTest.basic(
        <div>
          <Label htmlFor="autocomplete-email">Email Address</Label>
          <Input 
            type="email" 
            id="autocomplete-email" 
            autoComplete="email"
            name="email"
          />
        </div>
      );
    });

    it('should have correct autocomplete values', () => {
      render(
        <form>
          <Label htmlFor="first-name">First Name</Label>
          <Input 
            type="text" 
            id="first-name" 
            autoComplete="given-name"
            name="firstName"
          />
          
          <Label htmlFor="last-name">Last Name</Label>
          <Input 
            type="text" 
            id="last-name" 
            autoComplete="family-name"
            name="lastName"
          />
          
          <Label htmlFor="email">Email</Label>
          <Input 
            type="email" 
            id="email" 
            autoComplete="email"
            name="email"
          />
        </form>
      );

      expect(screen.getByLabelText('First Name')).toHaveAttribute('autocomplete', 'given-name');
      expect(screen.getByLabelText('Last Name')).toHaveAttribute('autocomplete', 'family-name');
      expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
    });
  });

  describe('Input Groups and Collections', () => {
    it('should work in fieldsets with legends', async () => {
      await a11yTest.basic(
        <fieldset>
          <legend>Personal Information</legend>
          
          <div>
            <Label htmlFor="first">First Name</Label>
            <Input type="text" id="first" name="firstName" />
          </div>
          
          <div>
            <Label htmlFor="last">Last Name</Label>
            <Input type="text" id="last" name="lastName" />
          </div>
        </fieldset>
      );
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide appropriate information to screen readers', () => {
      a11yTest.screenReader(
        <div>
          <Label htmlFor="sr-input">Screen Reader Input</Label>
          <Input 
            type="text" 
            id="sr-input" 
            aria-describedby="input-help"
          />
          <div id="input-help">
            Enter your full name as it appears on your ID
          </div>
        </div>
      );
    });
  });

  describe('Form Testing Integration', () => {
    it('should pass comprehensive form accessibility testing', () => {
      a11yTest.forms(
        <form>
          <div>
            <Label htmlFor="form-email">Email Address</Label>
            <Input 
              type="email" 
              id="form-email" 
              name="email" 
              required
              aria-required="true"
            />
          </div>
          
          <div>
            <Label htmlFor="form-password">Password</Label>
            <Input 
              type="password" 
              id="form-password" 
              name="password" 
              required
              aria-required="true"
              aria-describedby="password-help"
            />
            <div id="password-help">
              Must be at least 8 characters long
            </div>
          </div>
        </form>
      );
    });
  });

  describe('Comprehensive Accessibility Suite', () => {
    it('should pass complete accessibility test suite', async () => {
      await a11yTest.suite(
        <div>
          <Label htmlFor="complete-test">Complete Test Input</Label>
          <Input 
            type="text" 
            id="complete-test" 
            name="completeTest"
            aria-describedby="help-text"
          />
          <div id="help-text">
            This input is fully accessible
          </div>
        </div>,
        {
          focusableElements: ['textbox'],
          minimumContrastRatio: 4.5,
          skipTouch: false
        }
      );
    });
  });
});