import { test, expect } from '@playwright/test';
import {
    takeVisualScreenshot,
    testComponentStates,
    testModalComponent,
    VisualTestOptions,
} from '../utils/visual-helpers';

/**
 * Visual Tests for Interactive States
 * 
 * Tests component interactions including:
 * - Hover states
 * - Focus states
 * - Active states
 * - Loading states
 * - Error states
 * - Drag and drop
 * - Keyboard navigation
 */

const defaultOptions: VisualTestOptions = {
    waitForAnimations: true,
    maskDynamicContent: true,
    fullPage: false,
    threshold: 0.3,
    maxDiffPixels: 100,
};

test.describe('Interactive States Visual Tests', () => {
    
    test.describe('Button Interactions', () => {
        test('should render button interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/button');
            await page.waitForLoadState('networkidle');
            
            const buttonSelector = '[data-testid="button-primary"]';
            
            // Default state
            await takeVisualScreenshot(page, 'button-interaction-default', defaultOptions);
            
            // Hover state
            await page.hover(buttonSelector);
            await takeVisualScreenshot(page, 'button-interaction-hover', defaultOptions);
            
            // Focus state
            await page.focus(buttonSelector);
            await takeVisualScreenshot(page, 'button-interaction-focus', defaultOptions);
            
            // Active state (mouse down)
            await page.dispatchEvent(buttonSelector, 'mousedown');
            await takeVisualScreenshot(page, 'button-interaction-active', defaultOptions);
            
            // Release mouse
            await page.dispatchEvent(buttonSelector, 'mouseup');
            
            // Disabled state
            await page.locator('[data-testid="button-disabled"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'button-interaction-disabled', defaultOptions);
            
            // Loading state
            await page.locator('[data-testid="button-loading"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'button-interaction-loading', defaultOptions);
        });
        
        test('should handle button ripple effects', async ({ page }) => {
            await page.goto('/visual-test-showcase/button');
            await page.waitForLoadState('networkidle');
            
            const buttonSelector = '[data-testid="button-ripple"]';
            
            // Click to trigger ripple
            await page.click(buttonSelector);
            await page.waitForTimeout(100); // Mid-ripple
            await takeVisualScreenshot(page, 'button-ripple-mid', defaultOptions);
            
            await page.waitForTimeout(200); // End ripple
            await takeVisualScreenshot(page, 'button-ripple-end', defaultOptions);
        });
    });

    test.describe('Input Interactions', () => {
        test('should render input interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/input');
            await page.waitForLoadState('networkidle');
            
            const inputSelector = '[data-testid="input-text"]';
            
            // Default state
            await takeVisualScreenshot(page, 'input-interaction-default', defaultOptions);
            
            // Focus state
            await page.focus(inputSelector);
            await takeVisualScreenshot(page, 'input-interaction-focus', defaultOptions);
            
            // Typing state
            await page.type(inputSelector, 'Hello World');
            await takeVisualScreenshot(page, 'input-interaction-typing', defaultOptions);
            
            // Select all text
            await page.keyboard.press('Control+a');
            await takeVisualScreenshot(page, 'input-interaction-selected', defaultOptions);
            
            // Error state
            await page.locator('[data-testid="input-error"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'input-interaction-error', defaultOptions);
            
            // Disabled state
            await page.locator('[data-testid="input-disabled"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'input-interaction-disabled', defaultOptions);
        });
        
        test('should handle input validation states', async ({ page }) => {
            await page.goto('/visual-test-showcase/input');
            await page.waitForLoadState('networkidle');
            
            const inputSelector = '[data-testid="input-validation"]';
            
            // Invalid input
            await page.fill(inputSelector, 'invalid@');
            await page.locator(inputSelector).blur();
            await takeVisualScreenshot(page, 'input-validation-invalid', defaultOptions);
            
            // Valid input
            await page.fill(inputSelector, 'valid@example.com');
            await page.locator(inputSelector).blur();
            await takeVisualScreenshot(page, 'input-validation-valid', defaultOptions);
            
            // Required field empty
            await page.fill(inputSelector, '');
            await page.locator(inputSelector).blur();
            await takeVisualScreenshot(page, 'input-validation-required', defaultOptions);
        });
    });

    test.describe('Select Interactions', () => {
        test('should render select interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/select');
            await page.waitForLoadState('networkidle');
            
            const selectSelector = '[data-testid="select-basic"]';
            
            // Closed state
            await takeVisualScreenshot(page, 'select-interaction-closed', defaultOptions);
            
            // Focus state
            await page.focus(selectSelector);
            await takeVisualScreenshot(page, 'select-interaction-focus', defaultOptions);
            
            // Open state
            await page.click(selectSelector);
            await page.waitForSelector('[role="listbox"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'select-interaction-open', { ...defaultOptions, fullPage: true });
            
            // Option hover
            await page.hover('[data-testid="select-option-1"]');
            await takeVisualScreenshot(page, 'select-interaction-option-hover', { ...defaultOptions, fullPage: true });
            
            // Option selection
            await page.click('[data-testid="select-option-1"]');
            await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'select-interaction-selected', defaultOptions);
        });
        
        test('should handle select keyboard navigation', async ({ page }) => {
            await page.goto('/visual-test-showcase/select');
            await page.waitForLoadState('networkidle');
            
            const selectSelector = '[data-testid="select-basic"]';
            
            // Focus and open with keyboard
            await page.focus(selectSelector);
            await page.keyboard.press('Space');
            await page.waitForSelector('[role="listbox"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'select-keyboard-open', { ...defaultOptions, fullPage: true });
            
            // Navigate with arrow keys
            await page.keyboard.press('ArrowDown');
            await takeVisualScreenshot(page, 'select-keyboard-navigate', { ...defaultOptions, fullPage: true });
            
            // Select with Enter
            await page.keyboard.press('Enter');
            await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'select-keyboard-selected', defaultOptions);
        });
    });

    test.describe('Modal Interactions', () => {
        test('should render modal interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/modal');
            await page.waitForLoadState('networkidle');
            
            // Test modal opening
            await page.click('[data-testid="modal-trigger"]');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'modal-interaction-open', { ...defaultOptions, fullPage: true });
            
            // Test modal with focus
            await page.keyboard.press('Tab');
            await takeVisualScreenshot(page, 'modal-interaction-focus', { ...defaultOptions, fullPage: true });
            
            // Test close button hover
            await page.hover('[data-testid="modal-close"]');
            await takeVisualScreenshot(page, 'modal-interaction-close-hover', { ...defaultOptions, fullPage: true });
            
            // Test modal closing
            await page.click('[data-testid="modal-close"]');
            await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'modal-interaction-closed', { ...defaultOptions, fullPage: true });
        });
        
        test('should handle modal backdrop interactions', async ({ page }) => {
            await page.goto('/visual-test-showcase/modal');
            await page.waitForLoadState('networkidle');
            
            // Open modal
            await page.click('[data-testid="modal-trigger"]');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            
            // Click backdrop to close
            await page.click('[data-testid="modal-overlay"]');
            await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'modal-backdrop-close', { ...defaultOptions, fullPage: true });
        });
        
        test('should handle modal keyboard interactions', async ({ page }) => {
            await page.goto('/visual-test-showcase/modal');
            await page.waitForLoadState('networkidle');
            
            // Open modal with keyboard
            await page.focus('[data-testid="modal-trigger"]');
            await page.keyboard.press('Enter');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'modal-keyboard-open', { ...defaultOptions, fullPage: true });
            
            // Navigate with Tab
            await page.keyboard.press('Tab');
            await takeVisualScreenshot(page, 'modal-keyboard-navigate', { ...defaultOptions, fullPage: true });
            
            // Close with Escape
            await page.keyboard.press('Escape');
            await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'modal-keyboard-close', { ...defaultOptions, fullPage: true });
        });
    });

    test.describe('Dropdown Interactions', () => {
        test('should render dropdown interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/dropdown');
            await page.waitForLoadState('networkidle');
            
            const dropdownSelector = '[data-testid="dropdown-trigger"]';
            
            // Closed state
            await takeVisualScreenshot(page, 'dropdown-interaction-closed', defaultOptions);
            
            // Hover state
            await page.hover(dropdownSelector);
            await takeVisualScreenshot(page, 'dropdown-interaction-hover', defaultOptions);
            
            // Open state
            await page.click(dropdownSelector);
            await page.waitForSelector('[role="menu"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'dropdown-interaction-open', { ...defaultOptions, fullPage: true });
            
            // Item hover
            await page.hover('[data-testid="dropdown-item-1"]');
            await takeVisualScreenshot(page, 'dropdown-interaction-item-hover', { ...defaultOptions, fullPage: true });
            
            // Item selection
            await page.click('[data-testid="dropdown-item-1"]');
            await page.waitForSelector('[role="menu"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'dropdown-interaction-selected', defaultOptions);
        });
        
        test('should handle dropdown keyboard navigation', async ({ page }) => {
            await page.goto('/visual-test-showcase/dropdown');
            await page.waitForLoadState('networkidle');
            
            const dropdownSelector = '[data-testid="dropdown-trigger"]';
            
            // Focus and open with keyboard
            await page.focus(dropdownSelector);
            await page.keyboard.press('Space');
            await page.waitForSelector('[role="menu"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'dropdown-keyboard-open', { ...defaultOptions, fullPage: true });
            
            // Navigate with arrow keys
            await page.keyboard.press('ArrowDown');
            await takeVisualScreenshot(page, 'dropdown-keyboard-navigate', { ...defaultOptions, fullPage: true });
            
            // Select with Enter
            await page.keyboard.press('Enter');
            await page.waitForSelector('[role="menu"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'dropdown-keyboard-selected', defaultOptions);
        });
    });

    test.describe('Tooltip Interactions', () => {
        test('should render tooltip interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/tooltip');
            await page.waitForLoadState('networkidle');
            
            const tooltipSelector = '[data-testid="tooltip-trigger"]';
            
            // Hidden state
            await takeVisualScreenshot(page, 'tooltip-interaction-hidden', defaultOptions);
            
            // Hover to show
            await page.hover(tooltipSelector);
            await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
            await takeVisualScreenshot(page, 'tooltip-interaction-show', defaultOptions);
            
            // Focus to show
            await page.focus(tooltipSelector);
            await takeVisualScreenshot(page, 'tooltip-interaction-focus', defaultOptions);
            
            // Hide on mouse leave
            await page.mouse.move(0, 0);
            await page.waitForSelector('[role="tooltip"]', { state: 'hidden' });
            await takeVisualScreenshot(page, 'tooltip-interaction-hide', defaultOptions);
        });
        
        test('should handle tooltip positioning', async ({ page }) => {
            await page.goto('/visual-test-showcase/tooltip');
            await page.waitForLoadState('networkidle');
            
            const positions = ['top', 'right', 'bottom', 'left'];
            
            for (const position of positions) {
                await page.hover(`[data-testid="tooltip-trigger-${position}"]`);
                await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
                await takeVisualScreenshot(page, `tooltip-position-${position}`, defaultOptions);
                
                // Move mouse away
                await page.mouse.move(0, 0);
                await page.waitForSelector('[role="tooltip"]', { state: 'hidden' });
            }
        });
    });

    test.describe('Drag and Drop Interactions', () => {
        test('should render drag and drop interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/drag-drop');
            await page.waitForLoadState('networkidle');
            
            const dragSelector = '[data-testid="draggable-item"]';
            const dropSelector = '[data-testid="drop-zone"]';
            
            // Initial state
            await takeVisualScreenshot(page, 'drag-drop-initial', defaultOptions);
            
            // Drag start
            await page.hover(dragSelector);
            await page.mouse.down();
            await takeVisualScreenshot(page, 'drag-drop-start', defaultOptions);
            
            // Drag over drop zone
            await page.hover(dropSelector);
            await takeVisualScreenshot(page, 'drag-drop-over', defaultOptions);
            
            // Drop
            await page.mouse.up();
            await takeVisualScreenshot(page, 'drag-drop-complete', defaultOptions);
        });
        
        test('should handle drag and drop visual feedback', async ({ page }) => {
            await page.goto('/visual-test-showcase/drag-drop');
            await page.waitForLoadState('networkidle');
            
            const dragSelector = '[data-testid="draggable-item"]';
            const dropSelector = '[data-testid="drop-zone"]';
            
            // Test drag preview
            await page.hover(dragSelector);
            await page.mouse.down();
            await page.mouse.move(100, 100);
            await takeVisualScreenshot(page, 'drag-drop-preview', defaultOptions);
            
            // Test invalid drop zone
            await page.hover('[data-testid="invalid-drop-zone"]');
            await takeVisualScreenshot(page, 'drag-drop-invalid', defaultOptions);
            
            // Test valid drop zone
            await page.hover(dropSelector);
            await takeVisualScreenshot(page, 'drag-drop-valid', defaultOptions);
            
            await page.mouse.up();
        });
    });

    test.describe('Form Interactions', () => {
        test('should render form interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/form');
            await page.waitForLoadState('networkidle');
            
            // Initial form state
            await takeVisualScreenshot(page, 'form-interaction-initial', defaultOptions);
            
            // Focus on first input
            await page.focus('[data-testid="form-input-name"]');
            await takeVisualScreenshot(page, 'form-interaction-focus', defaultOptions);
            
            // Type in input
            await page.type('[data-testid="form-input-name"]', 'John Doe');
            await takeVisualScreenshot(page, 'form-interaction-typing', defaultOptions);
            
            // Tab to next field
            await page.keyboard.press('Tab');
            await takeVisualScreenshot(page, 'form-interaction-tab', defaultOptions);
            
            // Form validation
            await page.click('[data-testid="form-submit"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'form-interaction-validation', defaultOptions);
            
            // Form submission
            await page.fill('[data-testid="form-input-email"]', 'john@example.com');
            await page.click('[data-testid="form-submit"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'form-interaction-submitting', defaultOptions);
        });
        
        test('should handle form field interactions', async ({ page }) => {
            await page.goto('/visual-test-showcase/form');
            await page.waitForLoadState('networkidle');
            
            // Checkbox interactions
            await page.click('[data-testid="form-checkbox"]');
            await takeVisualScreenshot(page, 'form-checkbox-checked', defaultOptions);
            
            // Radio button interactions
            await page.click('[data-testid="form-radio-1"]');
            await takeVisualScreenshot(page, 'form-radio-selected', defaultOptions);
            
            // Switch interactions
            await page.click('[data-testid="form-switch"]');
            await takeVisualScreenshot(page, 'form-switch-on', defaultOptions);
            
            // Textarea interactions
            await page.focus('[data-testid="form-textarea"]');
            await page.type('[data-testid="form-textarea"]', 'This is a long text that demonstrates textarea behavior.');
            await takeVisualScreenshot(page, 'form-textarea-filled', defaultOptions);
        });
    });

    test.describe('Table Interactions', () => {
        test('should render table interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/table');
            await page.waitForLoadState('networkidle');
            
            // Initial table state
            await takeVisualScreenshot(page, 'table-interaction-initial', defaultOptions);
            
            // Row hover
            await page.hover('[data-testid="table-row-1"]');
            await takeVisualScreenshot(page, 'table-interaction-row-hover', defaultOptions);
            
            // Row selection
            await page.click('[data-testid="table-row-1"] [data-testid="row-select"]');
            await takeVisualScreenshot(page, 'table-interaction-row-select', defaultOptions);
            
            // Column sorting
            await page.click('[data-testid="table-header-name"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'table-interaction-sort', defaultOptions);
            
            // Column resize
            await page.hover('[data-testid="table-header-name"] [data-testid="resize-handle"]');
            await takeVisualScreenshot(page, 'table-interaction-resize', defaultOptions);
            
            // Row actions
            await page.click('[data-testid="table-row-1"] [data-testid="row-actions"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'table-interaction-actions', defaultOptions);
        });
        
        test('should handle table keyboard navigation', async ({ page }) => {
            await page.goto('/visual-test-showcase/table');
            await page.waitForLoadState('networkidle');
            
            // Focus first cell
            await page.focus('[data-testid="table-cell-1-1"]');
            await takeVisualScreenshot(page, 'table-keyboard-focus', defaultOptions);
            
            // Navigate with arrow keys
            await page.keyboard.press('ArrowDown');
            await takeVisualScreenshot(page, 'table-keyboard-navigate', defaultOptions);
            
            // Select with Space
            await page.keyboard.press('Space');
            await takeVisualScreenshot(page, 'table-keyboard-select', defaultOptions);
        });
    });

    test.describe('Tab Interactions', () => {
        test('should render tab interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/tabs');
            await page.waitForLoadState('networkidle');
            
            // Initial tab state
            await takeVisualScreenshot(page, 'tab-interaction-initial', defaultOptions);
            
            // Tab hover
            await page.hover('[data-testid="tab-2"]');
            await takeVisualScreenshot(page, 'tab-interaction-hover', defaultOptions);
            
            // Tab selection
            await page.click('[data-testid="tab-2"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'tab-interaction-selected', defaultOptions);
            
            // Tab focus
            await page.focus('[data-testid="tab-3"]');
            await takeVisualScreenshot(page, 'tab-interaction-focus', defaultOptions);
            
            // Tab keyboard navigation
            await page.keyboard.press('ArrowRight');
            await takeVisualScreenshot(page, 'tab-interaction-keyboard', defaultOptions);
        });
    });

    test.describe('Loading Interactions', () => {
        test('should render loading interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/loading');
            await page.waitForLoadState('networkidle');
            
            // Button loading
            await page.click('[data-testid="trigger-loading"]');
            await page.waitForTimeout(100);
            await takeVisualScreenshot(page, 'loading-button', defaultOptions);
            
            // Card loading
            await page.locator('[data-testid="card-loading"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'loading-card', defaultOptions);
            
            // Table loading
            await page.locator('[data-testid="table-loading"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'loading-table', defaultOptions);
            
            // Spinner animations
            await page.locator('[data-testid="spinner-loading"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'loading-spinner', defaultOptions);
        });
    });

    test.describe('Error Interactions', () => {
        test('should render error interactions correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/error');
            await page.waitForLoadState('networkidle');
            
            // Form error
            await page.locator('[data-testid="form-error"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'error-form', defaultOptions);
            
            // Card error
            await page.locator('[data-testid="card-error"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'error-card', defaultOptions);
            
            // Page error
            await page.locator('[data-testid="page-error"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'error-page', defaultOptions);
            
            // Error recovery
            await page.click('[data-testid="retry-button"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'error-recovery', defaultOptions);
        });
    });
});