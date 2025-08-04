import { test, expect } from '@playwright/test';
import {
    takeVisualScreenshot,
    testComponentStates,
    testComponentThemes,
    testComponentResponsive,
    COMPONENT_STATES,
    VisualTestOptions,
} from '../utils/visual-helpers';

/**
 * Visual Tests for UI Components
 * 
 * Tests all UI components in different states, themes, and responsive breakpoints
 */

const defaultOptions: VisualTestOptions = {
    waitForAnimations: true,
    maskDynamicContent: true,
    fullPage: false,
    threshold: 0.3,
    maxDiffPixels: 100,
};

test.describe('UI Components Visual Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to a component showcase page (you'll need to create this)
        await page.goto('/visual-test-showcase');
        await page.waitForLoadState('networkidle');
    });

    test.describe('Button Component', () => {
        test('should render button variants correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/button');
            
            // Test default button
            await takeVisualScreenshot(page, 'button-default', defaultOptions);
            
            // Test button variants
            const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
            for (const variant of variants) {
                await page.locator(`[data-testid="button-${variant}"]`).first().scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `button-variant-${variant}`, defaultOptions);
            }
            
            // Test button sizes
            const sizes = ['sm', 'default', 'lg', 'icon'];
            for (const size of sizes) {
                await page.locator(`[data-testid="button-size-${size}"]`).first().scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `button-size-${size}`, defaultOptions);
            }
        });
        
        test('should handle button states correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/button');
            
            const buttonStates = [
                { state: 'default', selector: '[data-testid="button-default"]' },
                { state: 'hover', selector: '[data-testid="button-default"]' },
                { state: 'focus', selector: '[data-testid="button-default"]' },
                { state: 'disabled', selector: '[data-testid="button-disabled"]' },
                { state: 'loading', selector: '[data-testid="button-loading"]' },
            ];
            
            for (const state of buttonStates) {
                if (state.state === 'hover') {
                    await page.hover(state.selector);
                } else if (state.state === 'focus') {
                    await page.focus(state.selector);
                }
                
                await takeVisualScreenshot(page, `button-state-${state.state}`, defaultOptions);
            }
        });
        
        test('should render correctly in different themes', async ({ page }) => {
            await testComponentThemes(page, 'button', async () => {
                await page.goto('/visual-test-showcase/button');
                await page.waitForLoadState('networkidle');
            }, defaultOptions);
        });
        
        test('should be responsive', async ({ page }) => {
            await testComponentResponsive(page, 'button', async () => {
                await page.goto('/visual-test-showcase/button');
                await page.waitForLoadState('networkidle');
            }, defaultOptions);
        });
    });

    test.describe('Card Component', () => {
        test('should render card variants correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/card');
            
            // Test basic card
            await takeVisualScreenshot(page, 'card-basic', defaultOptions);
            
            // Test card with header
            await page.locator('[data-testid="card-with-header"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'card-with-header', defaultOptions);
            
            // Test card with footer
            await page.locator('[data-testid="card-with-footer"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'card-with-footer', defaultOptions);
            
            // Test card with all sections
            await page.locator('[data-testid="card-complete"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'card-complete', defaultOptions);
        });
        
        test('should handle card states correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/card');
            
            const cardStates = [
                { state: 'default', selector: '[data-testid="card-interactive"]' },
                { state: 'hover', selector: '[data-testid="card-interactive"]' },
                { state: 'focus', selector: '[data-testid="card-interactive"]' },
            ];
            
            for (const state of cardStates) {
                if (state.state === 'hover') {
                    await page.hover(state.selector);
                } else if (state.state === 'focus') {
                    await page.focus(state.selector);
                }
                
                await takeVisualScreenshot(page, `card-state-${state.state}`, defaultOptions);
            }
        });
    });

    test.describe('Input Component', () => {
        test('should render input variants correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/input');
            
            // Test basic input
            await takeVisualScreenshot(page, 'input-basic', defaultOptions);
            
            // Test input with placeholder
            await page.locator('[data-testid="input-placeholder"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'input-placeholder', defaultOptions);
            
            // Test input with value
            await page.locator('[data-testid="input-with-value"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'input-with-value', defaultOptions);
            
            // Test input with label
            await page.locator('[data-testid="input-with-label"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'input-with-label', defaultOptions);
        });
        
        test('should handle input states correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/input');
            
            const inputStates = [
                { state: 'default', selector: '[data-testid="input-default"]' },
                { state: 'focus', selector: '[data-testid="input-default"]' },
                { state: 'disabled', selector: '[data-testid="input-disabled"]' },
                { state: 'error', selector: '[data-testid="input-error"]' },
            ];
            
            for (const state of inputStates) {
                if (state.state === 'focus') {
                    await page.focus(state.selector);
                }
                
                await takeVisualScreenshot(page, `input-state-${state.state}`, defaultOptions);
            }
        });
    });

    test.describe('Dialog Component', () => {
        test('should render dialog correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/dialog');
            
            // Test dialog closed state
            await takeVisualScreenshot(page, 'dialog-closed', defaultOptions);
            
            // Open dialog
            await page.click('[data-testid="dialog-trigger"]');
            await page.waitForSelector('[role="dialog"]', { state: 'visible' });
            
            // Test dialog open state
            await takeVisualScreenshot(page, 'dialog-open', { ...defaultOptions, fullPage: true });
            
            // Test dialog with focus
            await page.keyboard.press('Tab');
            await takeVisualScreenshot(page, 'dialog-focused', { ...defaultOptions, fullPage: true });
            
            // Close dialog
            await page.keyboard.press('Escape');
            await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
        });
        
        test('should handle dialog variants', async ({ page }) => {
            await page.goto('/visual-test-showcase/dialog');
            
            const dialogTypes = ['basic', 'with-header', 'with-footer', 'confirmation'];
            
            for (const type of dialogTypes) {
                await page.click(`[data-testid="dialog-trigger-${type}"]`);
                await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                await takeVisualScreenshot(page, `dialog-${type}`, { ...defaultOptions, fullPage: true });
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            }
        });
    });

    test.describe('Select Component', () => {
        test('should render select correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/select');
            
            // Test select closed state
            await takeVisualScreenshot(page, 'select-closed', defaultOptions);
            
            // Open select
            await page.click('[data-testid="select-trigger"]');
            await page.waitForSelector('[role="listbox"]', { state: 'visible' });
            
            // Test select open state
            await takeVisualScreenshot(page, 'select-open', { ...defaultOptions, fullPage: true });
            
            // Test select with option focused
            await page.keyboard.press('ArrowDown');
            await takeVisualScreenshot(page, 'select-option-focused', { ...defaultOptions, fullPage: true });
            
            // Close select
            await page.keyboard.press('Escape');
            await page.waitForSelector('[role="listbox"]', { state: 'hidden' });
        });
        
        test('should handle select states', async ({ page }) => {
            await page.goto('/visual-test-showcase/select');
            
            const selectStates = [
                { state: 'default', selector: '[data-testid="select-default"]' },
                { state: 'disabled', selector: '[data-testid="select-disabled"]' },
                { state: 'error', selector: '[data-testid="select-error"]' },
                { state: 'with-value', selector: '[data-testid="select-with-value"]' },
            ];
            
            for (const state of selectStates) {
                await page.locator(state.selector).scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `select-state-${state.state}`, defaultOptions);
            }
        });
    });

    test.describe('Badge Component', () => {
        test('should render badge variants correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/badge');
            
            const badgeVariants = ['default', 'secondary', 'destructive', 'outline'];
            
            for (const variant of badgeVariants) {
                await page.locator(`[data-testid="badge-${variant}"]`).scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `badge-${variant}`, defaultOptions);
            }
        });
        
        test('should render badge sizes correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/badge');
            
            const badgeSizes = ['sm', 'default', 'lg'];
            
            for (const size of badgeSizes) {
                await page.locator(`[data-testid="badge-size-${size}"]`).scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `badge-size-${size}`, defaultOptions);
            }
        });
    });

    test.describe('Tooltip Component', () => {
        test('should render tooltip correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/tooltip');
            
            // Test tooltip closed state
            await takeVisualScreenshot(page, 'tooltip-closed', defaultOptions);
            
            // Hover to show tooltip
            await page.hover('[data-testid="tooltip-trigger"]');
            await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
            
            // Test tooltip open state
            await takeVisualScreenshot(page, 'tooltip-open', defaultOptions);
            
            // Test tooltip positions
            const positions = ['top', 'right', 'bottom', 'left'];
            
            for (const position of positions) {
                await page.hover(`[data-testid="tooltip-trigger-${position}"]`);
                await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
                await takeVisualScreenshot(page, `tooltip-position-${position}`, defaultOptions);
            }
        });
    });

    test.describe('Avatar Component', () => {
        test('should render avatar variants correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/avatar');
            
            // Test avatar with image
            await takeVisualScreenshot(page, 'avatar-with-image', defaultOptions);
            
            // Test avatar with initials
            await page.locator('[data-testid="avatar-initials"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'avatar-initials', defaultOptions);
            
            // Test avatar fallback
            await page.locator('[data-testid="avatar-fallback"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'avatar-fallback', defaultOptions);
        });
        
        test('should render avatar sizes correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/avatar');
            
            const avatarSizes = ['sm', 'default', 'lg', 'xl'];
            
            for (const size of avatarSizes) {
                await page.locator(`[data-testid="avatar-size-${size}"]`).scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `avatar-size-${size}`, defaultOptions);
            }
        });
    });

    test.describe('Skeleton Component', () => {
        test('should render skeleton variants correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/skeleton');
            
            // Test basic skeleton
            await takeVisualScreenshot(page, 'skeleton-basic', defaultOptions);
            
            // Test skeleton variants
            const skeletonVariants = ['text', 'circle', 'rectangle', 'card'];
            
            for (const variant of skeletonVariants) {
                await page.locator(`[data-testid="skeleton-${variant}"]`).scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `skeleton-${variant}`, defaultOptions);
            }
        });
    });

    test.describe('Separator Component', () => {
        test('should render separator correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/separator');
            
            // Test horizontal separator
            await takeVisualScreenshot(page, 'separator-horizontal', defaultOptions);
            
            // Test vertical separator
            await page.locator('[data-testid="separator-vertical"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'separator-vertical', defaultOptions);
        });
    });

    test.describe('Label Component', () => {
        test('should render label correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/label');
            
            // Test basic label
            await takeVisualScreenshot(page, 'label-basic', defaultOptions);
            
            // Test label with input
            await page.locator('[data-testid="label-with-input"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'label-with-input', defaultOptions);
            
            // Test required label
            await page.locator('[data-testid="label-required"]').scrollIntoViewIfNeeded();
            await takeVisualScreenshot(page, 'label-required', defaultOptions);
        });
    });
});