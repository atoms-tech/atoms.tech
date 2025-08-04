import { test, expect } from '@playwright/test';
import {
    takeVisualScreenshot,
    testComponentResponsive,
    RESPONSIVE_BREAKPOINTS,
    VisualTestOptions,
} from '../utils/visual-helpers';

/**
 * Visual Tests for Responsive Layouts
 * 
 * Tests page layouts and components across different screen sizes
 */

const defaultOptions: VisualTestOptions = {
    waitForAnimations: true,
    maskDynamicContent: true,
    fullPage: true,
    threshold: 0.3,
    maxDiffPixels: 200,
};

test.describe('Responsive Layouts Visual Tests', () => {
    
    test.describe('Home Page Layout', () => {
        test('should render home page correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `home-page-${breakpoint.name}`, defaultOptions);
            }
        });
        
        test('should handle navigation menu responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                // Test navigation menu
                if (breakpoint.width < 768) {
                    // Mobile: Test hamburger menu
                    await page.click('[data-testid="mobile-menu-trigger"]');
                    await page.waitForSelector('[data-testid="mobile-menu"]', { state: 'visible' });
                    await takeVisualScreenshot(page, `navigation-mobile-${breakpoint.name}`, defaultOptions);
                    
                    // Close menu
                    await page.click('[data-testid="mobile-menu-close"]');
                    await page.waitForSelector('[data-testid="mobile-menu"]', { state: 'hidden' });
                } else {
                    // Desktop: Test desktop navigation
                    await takeVisualScreenshot(page, `navigation-desktop-${breakpoint.name}`, defaultOptions);
                }
            }
        });
        
        test('should handle sidebar responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/dashboard');
                await page.waitForLoadState('networkidle');
                
                if (breakpoint.width < 1024) {
                    // Tablet/Mobile: Test collapsed sidebar
                    await takeVisualScreenshot(page, `sidebar-collapsed-${breakpoint.name}`, defaultOptions);
                    
                    // Test expanded sidebar
                    await page.click('[data-testid="sidebar-toggle"]');
                    await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' });
                    await takeVisualScreenshot(page, `sidebar-expanded-${breakpoint.name}`, defaultOptions);
                } else {
                    // Desktop: Test expanded sidebar
                    await takeVisualScreenshot(page, `sidebar-desktop-${breakpoint.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Dashboard Layout', () => {
        test('should render dashboard correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/dashboard');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `dashboard-${breakpoint.name}`, defaultOptions);
            }
        });
        
        test('should handle dashboard cards responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/dashboard');
                await page.waitForLoadState('networkidle');
                
                // Test card grid layout
                await page.locator('[data-testid="dashboard-cards"]').scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `dashboard-cards-${breakpoint.name}`, defaultOptions);
                
                // Test individual card on mobile
                if (breakpoint.width < 768) {
                    await page.click('[data-testid="dashboard-card-1"]');
                    await page.waitForTimeout(300);
                    await takeVisualScreenshot(page, `dashboard-card-mobile-${breakpoint.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Project Page Layout', () => {
        test('should render project page correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/project/1');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `project-page-${breakpoint.name}`, defaultOptions);
            }
        });
        
        test('should handle project tabs responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/project/1');
                await page.waitForLoadState('networkidle');
                
                // Test tab navigation
                const tabs = ['overview', 'documents', 'tests', 'settings'];
                
                for (const tab of tabs) {
                    await page.click(`[data-testid="project-tab-${tab}"]`);
                    await page.waitForTimeout(200);
                    await takeVisualScreenshot(page, `project-tab-${tab}-${breakpoint.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Document Page Layout', () => {
        test('should render document page correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/document/1');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `document-page-${breakpoint.name}`, defaultOptions);
            }
        });
        
        test('should handle document editor responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/document/1');
                await page.waitForLoadState('networkidle');
                
                // Test editor toolbar
                await page.locator('[data-testid="editor-toolbar"]').scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `document-editor-toolbar-${breakpoint.name}`, defaultOptions);
                
                // Test editor content
                await page.locator('[data-testid="editor-content"]').scrollIntoViewIfNeeded();
                await takeVisualScreenshot(page, `document-editor-content-${breakpoint.name}`, defaultOptions);
                
                // Test side panel on desktop
                if (breakpoint.width >= 1024) {
                    await page.click('[data-testid="editor-panel-toggle"]');
                    await page.waitForTimeout(300);
                    await takeVisualScreenshot(page, `document-editor-panel-${breakpoint.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Settings Page Layout', () => {
        test('should render settings page correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/settings');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `settings-page-${breakpoint.name}`, defaultOptions);
            }
        });
        
        test('should handle settings navigation responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/settings');
                await page.waitForLoadState('networkidle');
                
                if (breakpoint.width < 768) {
                    // Mobile: Test dropdown navigation
                    await page.click('[data-testid="settings-nav-dropdown"]');
                    await page.waitForSelector('[data-testid="settings-nav-menu"]', { state: 'visible' });
                    await takeVisualScreenshot(page, `settings-nav-mobile-${breakpoint.name}`, defaultOptions);
                } else {
                    // Desktop: Test sidebar navigation
                    await takeVisualScreenshot(page, `settings-nav-desktop-${breakpoint.name}`, defaultOptions);
                }
            }
        });
    });

    test.describe('Form Layouts', () => {
        test('should render forms correctly across breakpoints', async ({ page }) => {
            const forms = [
                { path: '/create-project', name: 'create-project' },
                { path: '/create-document', name: 'create-document' },
                { path: '/invite-users', name: 'invite-users' },
                { path: '/settings/profile', name: 'profile-settings' },
            ];
            
            for (const form of forms) {
                for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                    await page.setViewportSize({
                        width: breakpoint.width,
                        height: breakpoint.height,
                    });
                    
                    await page.goto(form.path);
                    await page.waitForLoadState('networkidle');
                    
                    await takeVisualScreenshot(page, `form-${form.name}-${breakpoint.name}`, defaultOptions);
                }
            }
        });
        
        test('should handle form validation responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/create-project');
                await page.waitForLoadState('networkidle');
                
                // Trigger validation errors
                await page.click('[data-testid="form-submit"]');
                await page.waitForTimeout(200);
                
                await takeVisualScreenshot(page, `form-validation-${breakpoint.name}`, defaultOptions);
            }
        });
    });

    test.describe('Table Layouts', () => {
        test('should render tables correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/project/1/tests');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `table-layout-${breakpoint.name}`, defaultOptions);
                
                // Test table scroll on mobile
                if (breakpoint.width < 768) {
                    await page.evaluate(() => {
                        const table = document.querySelector('[data-testid="data-table"]');
                        if (table) {
                            table.scrollLeft = 200;
                        }
                    });
                    await takeVisualScreenshot(page, `table-scroll-${breakpoint.name}`, defaultOptions);
                }
            }
        });
        
        test('should handle table actions responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/project/1/tests');
                await page.waitForLoadState('networkidle');
                
                // Test row selection
                await page.click('[data-testid="table-row-1"] [data-testid="row-select"]');
                await takeVisualScreenshot(page, `table-selection-${breakpoint.name}`, defaultOptions);
                
                // Test row actions
                await page.click('[data-testid="table-row-1"] [data-testid="row-actions"]');
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `table-actions-${breakpoint.name}`, defaultOptions);
            }
        });
    });

    test.describe('Modal Layouts', () => {
        test('should render modals correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                // Test different modal sizes
                const modalSizes = ['sm', 'md', 'lg', 'xl'];
                
                for (const size of modalSizes) {
                    await page.click(`[data-testid="modal-trigger-${size}"]`);
                    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                    
                    await takeVisualScreenshot(page, `modal-${size}-${breakpoint.name}`, defaultOptions);
                    
                    await page.keyboard.press('Escape');
                    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
                }
            }
        });
        
        test('should handle fullscreen modals responsively', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/');
                await page.waitForLoadState('networkidle');
                
                await page.click('[data-testid="modal-trigger-fullscreen"]');
                await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                
                await takeVisualScreenshot(page, `modal-fullscreen-${breakpoint.name}`, defaultOptions);
                
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            }
        });
    });

    test.describe('Grid Layouts', () => {
        test('should render grid layouts correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/gallery');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `grid-layout-${breakpoint.name}`, defaultOptions);
                
                // Test grid item selection
                await page.click('[data-testid="grid-item-1"]');
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `grid-selection-${breakpoint.name}`, defaultOptions);
            }
        });
    });

    test.describe('List Layouts', () => {
        test('should render list layouts correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/projects');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `list-layout-${breakpoint.name}`, defaultOptions);
                
                // Test list item actions
                await page.hover('[data-testid="list-item-1"]');
                await takeVisualScreenshot(page, `list-hover-${breakpoint.name}`, defaultOptions);
            }
        });
    });

    test.describe('Card Layouts', () => {
        test('should render card layouts correctly across breakpoints', async ({ page }) => {
            for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
                await page.setViewportSize({
                    width: breakpoint.width,
                    height: breakpoint.height,
                });
                
                await page.goto('/dashboard');
                await page.waitForLoadState('networkidle');
                
                await takeVisualScreenshot(page, `card-layout-${breakpoint.name}`, defaultOptions);
                
                // Test card interactions
                await page.hover('[data-testid="card-1"]');
                await takeVisualScreenshot(page, `card-hover-${breakpoint.name}`, defaultOptions);
            }
        });
    });
});