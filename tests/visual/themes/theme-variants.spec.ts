import { test, expect } from '@playwright/test';
import {
    takeVisualScreenshot,
    testComponentThemes,
    THEME_VARIANTS,
    VisualTestOptions,
} from '../utils/visual-helpers';

/**
 * Visual Tests for Theme Variants
 * 
 * Tests all components and pages in light and dark themes
 */

const defaultOptions: VisualTestOptions = {
    waitForAnimations: true,
    maskDynamicContent: true,
    fullPage: true,
    threshold: 0.3,
    maxDiffPixels: 200,
};

test.describe('Theme Variants Visual Tests', () => {
    
    test.describe('Page Themes', () => {
        test('should render home page correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300); // Wait for theme transition
                
                await takeVisualScreenshot(page, `home-page-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render dashboard correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/dashboard');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                await takeVisualScreenshot(page, `dashboard-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render project page correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/project/1');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                await takeVisualScreenshot(page, `project-page-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render document page correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/document/1');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                await takeVisualScreenshot(page, `document-page-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render settings page correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/settings');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                await takeVisualScreenshot(page, `settings-page-theme-${theme.name}`, defaultOptions);
            }
        });
    });

    test.describe('Component Themes', () => {
        test('should render navigation components correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                // Test main navigation
                await page.locator('[data-testid="main-navigation"]').scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `navigation-theme-${theme.name}`, defaultOptions);
                
                // Test sidebar navigation
                await page.goto('/dashboard');
                await page.waitForLoadState('networkidle');
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                await page.locator('[data-testid="sidebar-navigation"]').scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `sidebar-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render form components correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/create-project');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                // Test form in default state
                await takeVisualScreenshot(page, `form-theme-${theme.name}`, defaultOptions);
                
                // Test form with validation errors
                await page.click('[data-testid="form-submit"]');
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `form-validation-theme-${theme.name}`, defaultOptions);
                
                // Test form with focus states
                await page.focus('[data-testid="form-input-name"]');
                await takeVisualScreenshot(page, `form-focus-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render table components correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/project/1/tests');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                // Test basic table
                await takeVisualScreenshot(page, `table-theme-${theme.name}`, defaultOptions);
                
                // Test table with selection
                await page.click('[data-testid="table-row-1"] [data-testid="row-select"]');
                await takeVisualScreenshot(page, `table-selection-theme-${theme.name}`, defaultOptions);
                
                // Test table with sorting
                await page.click('[data-testid="table-header-name"]');
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `table-sorting-theme-${theme.name}`, defaultOptions);
            }
        });
        
        test('should render modal components correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                // Test basic modal
                await page.click('[data-testid="modal-trigger-basic"]');
                await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                await takeVisualScreenshot(page, `modal-basic-theme-${theme.name}`, defaultOptions);
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
                
                // Test confirmation modal
                await page.click('[data-testid="modal-trigger-confirmation"]');
                await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                await takeVisualScreenshot(page, `modal-confirmation-theme-${theme.name}`, defaultOptions);
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
                
                // Test form modal
                await page.click('[data-testid="modal-trigger-form"]');
                await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                await takeVisualScreenshot(page, `modal-form-theme-${theme.name}`, defaultOptions);
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            }
        });
        
        test('should render dropdown components correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                // Test dropdown closed
                await page.locator('[data-testid="dropdown-trigger"]').scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `dropdown-closed-theme-${theme.name}`, defaultOptions);
                
                // Test dropdown open
                await page.click('[data-testid="dropdown-trigger"]');
                await page.waitForSelector('[role="menu"]', { state: 'visible' });
                await takeVisualScreenshot(page, `dropdown-open-theme-${theme.name}`, defaultOptions);
                
                // Test dropdown with hover
                await page.hover('[data-testid="dropdown-item-1"]');
                await takeVisualScreenshot(page, `dropdown-hover-theme-${theme.name}`, defaultOptions);
                
                // Close dropdown
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="menu"]', { state: 'hidden' });
            }
        });
        
        test('should render tooltip components correctly in all themes', async ({ page }) => {
            for (const theme of THEME_VARIANTS) {
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await theme.setup(page);
                await page.waitForTimeout(300);
                
                // Test tooltip positions
                const positions = ['top', 'right', 'bottom', 'left'];
                
                for (const position of positions) {
                    await page.hover(`[data-testid="tooltip-trigger-${position}"]`);
                    await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
                    await takeVisualScreenshot(page, `tooltip-${position}-theme-${theme.name}`, defaultOptions);
                    
                    // Move mouse away to hide tooltip
                    await page.mouse.move(0, 0);
                    await page.waitForSelector('[role="tooltip"]', { state: 'hidden' });
                }
            }
        });
    });

    test.describe('State-based Theme Tests', () => {
        test('should render hover states correctly in all themes', async ({ page }) => {
            const components = [
                { path: '/', testId: 'button-primary', name: 'button' },
                { path: '/', testId: 'card-interactive', name: 'card' },
                { path: '/', testId: 'link-primary', name: 'link' },
                { path: '/dashboard', testId: 'sidebar-item-1', name: 'sidebar-item' },
                { path: '/project/1/tests', testId: 'table-row-1', name: 'table-row' },
            ];
            
            for (const component of components) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(component.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    // Test hover state
                    await page.hover(`[data-testid="${component.testId}"]`);
                    await takeVisualScreenshot(page, `${component.name}-hover-theme-${theme.name}`, defaultOptions);
                }
            }
        });
        
        test('should render focus states correctly in all themes', async ({ page }) => {
            const components = [
                { path: '/', testId: 'button-primary', name: 'button' },
                { path: '/create-project', testId: 'form-input-name', name: 'input' },
                { path: '/create-project', testId: 'form-textarea-description', name: 'textarea' },
                { path: '/create-project', testId: 'form-select-type', name: 'select' },
                { path: '/create-project', testId: 'form-checkbox-terms', name: 'checkbox' },
            ];
            
            for (const component of components) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(component.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    // Test focus state
                    await page.focus(`[data-testid="${component.testId}"]`);
                    await takeVisualScreenshot(page, `${component.name}-focus-theme-${theme.name}`, defaultOptions);
                }
            }
        });
        
        test('should render disabled states correctly in all themes', async ({ page }) => {
            const components = [
                { path: '/', testId: 'button-disabled', name: 'button' },
                { path: '/create-project', testId: 'form-input-disabled', name: 'input' },
                { path: '/create-project', testId: 'form-textarea-disabled', name: 'textarea' },
                { path: '/create-project', testId: 'form-select-disabled', name: 'select' },
                { path: '/create-project', testId: 'form-checkbox-disabled', name: 'checkbox' },
            ];
            
            for (const component of components) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(component.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    await page.locator(`[data-testid="${component.testId}"]`).scrollIntoViewIfNeeded();
                    await takeVisualScreenshot(page, `${component.name}-disabled-theme-${theme.name}`, defaultOptions);
                }
            }
        });
        
        test('should render active states correctly in all themes', async ({ page }) => {
            const components = [
                { path: '/', testId: 'button-active', name: 'button' },
                { path: '/dashboard', testId: 'tab-active', name: 'tab' },
                { path: '/dashboard', testId: 'sidebar-item-active', name: 'sidebar-item' },
                { path: '/project/1/tests', testId: 'table-row-active', name: 'table-row' },
            ];
            
            for (const component of components) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(component.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    await page.locator(`[data-testid="${component.testId}"]`).scrollIntoViewIfNeeded();
                    await takeVisualScreenshot(page, `${component.name}-active-theme-${theme.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Loading States in Themes', () => {
        test('should render loading states correctly in all themes', async ({ page }) => {
            const components = [
                { path: '/', testId: 'button-loading', name: 'button' },
                { path: '/dashboard', testId: 'card-loading', name: 'card' },
                { path: '/project/1/tests', testId: 'table-loading', name: 'table' },
                { path: '/create-project', testId: 'form-loading', name: 'form' },
            ];
            
            for (const component of components) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(component.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    await page.locator(`[data-testid="${component.testId}"]`).scrollIntoViewIfNeeded();
                    await takeVisualScreenshot(page, `${component.name}-loading-theme-${theme.name}`, defaultOptions);
                }
            }
        });
        
        test('should render skeleton states correctly in all themes', async ({ page }) => {
            const skeletons = [
                { path: '/dashboard', testId: 'skeleton-card', name: 'card' },
                { path: '/project/1/tests', testId: 'skeleton-table', name: 'table' },
                { path: '/projects', testId: 'skeleton-list', name: 'list' },
                { path: '/gallery', testId: 'skeleton-grid', name: 'grid' },
            ];
            
            for (const skeleton of skeletons) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(skeleton.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    await page.locator(`[data-testid="${skeleton.testId}"]`).scrollIntoViewIfNeeded();
                    await takeVisualScreenshot(page, `skeleton-${skeleton.name}-theme-${theme.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Error States in Themes', () => {
        test('should render error states correctly in all themes', async ({ page }) => {
            const components = [
                { path: '/create-project', testId: 'form-error', name: 'form' },
                { path: '/dashboard', testId: 'card-error', name: 'card' },
                { path: '/project/1/tests', testId: 'table-error', name: 'table' },
                { path: '/404', testId: 'page-error', name: 'page' },
            ];
            
            for (const component of components) {
                for (const theme of THEME_VARIANTS) {
                    await page.goto(component.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    await page.locator(`[data-testid="${component.testId}"]`).scrollIntoViewIfNeeded();
                    await takeVisualScreenshot(page, `${component.name}-error-theme-${theme.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Theme Transitions', () => {
        test('should handle theme transitions smoothly', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            
            // Start with light theme
            await THEME_VARIANTS[0].setup(page);
            await page.waitForTimeout(300);
            await takeVisualScreenshot(page, 'theme-transition-light', defaultOptions);
            
            // Switch to dark theme
            await page.click('[data-testid="theme-toggle"]');
            await page.waitForTimeout(150); // Mid-transition
            await takeVisualScreenshot(page, 'theme-transition-mid', defaultOptions);
            
            await page.waitForTimeout(150); // Complete transition
            await takeVisualScreenshot(page, 'theme-transition-dark', defaultOptions);
            
            // Switch back to light theme
            await page.click('[data-testid="theme-toggle"]');
            await page.waitForTimeout(300);
            await takeVisualScreenshot(page, 'theme-transition-back-light', defaultOptions);
        });
    });

    test.describe('Theme Consistency', () => {
        test('should maintain theme consistency across pages', async ({ page }) => {
            const pages = [
                { path: '/', name: 'home' },
                { path: '/dashboard', name: 'dashboard' },
                { path: '/project/1', name: 'project' },
                { path: '/document/1', name: 'document' },
                { path: '/settings', name: 'settings' },
            ];
            
            for (const theme of THEME_VARIANTS) {
                for (const pagePath of pages) {
                    await page.goto(pagePath.path);
                    await page.waitForLoadState('networkidle');
                    
                    await theme.setup(page);
                    await page.waitForTimeout(300);
                    
                    await takeVisualScreenshot(page, `${pagePath.name}-consistency-theme-${theme.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('High Contrast Mode', () => {
        test('should render correctly in high contrast mode', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            
            // Enable high contrast mode
            await page.evaluate(() => {
                document.documentElement.classList.add('high-contrast');
            });
            
            await page.waitForTimeout(300);
            await takeVisualScreenshot(page, 'high-contrast-mode', defaultOptions);
            
            // Test with different components
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
            await takeVisualScreenshot(page, 'high-contrast-dashboard', defaultOptions);
        });
    });

    test.describe('System Theme Detection', () => {
        test('should respect system theme preference', async ({ page }) => {
            // Test system dark mode
            await page.emulateMedia({ colorScheme: 'dark' });
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            
            await page.evaluate(() => {
                localStorage.setItem('theme', 'system');
            });
            
            await page.reload();
            await page.waitForLoadState('networkidle');
            await takeVisualScreenshot(page, 'system-theme-dark', defaultOptions);
            
            // Test system light mode
            await page.emulateMedia({ colorScheme: 'light' });
            await page.reload();
            await page.waitForLoadState('networkidle');
            await takeVisualScreenshot(page, 'system-theme-light', defaultOptions);
        });
    });
});