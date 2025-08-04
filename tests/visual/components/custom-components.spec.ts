import { test, expect } from '@playwright/test';
import {
    takeVisualScreenshot,
    testComponentThemes,
    testComponentResponsive,
    testModalComponent,
    testLoadingStates,
    testEmptyStates,
    testErrorStates,
    VisualTestOptions,
} from '../utils/visual-helpers';

/**
 * Visual Tests for Custom Components
 * 
 * Tests custom application components including:
 * - Theme toggle
 * - Recent activity tab
 * - Settings tab
 * - Block canvas components
 * - Test matrix components
 * - Modal components
 */

const defaultOptions: VisualTestOptions = {
    waitForAnimations: true,
    maskDynamicContent: true,
    fullPage: false,
    threshold: 0.3,
    maxDiffPixels: 100,
};

test.describe('Custom Components Visual Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/visual-test-showcase/custom');
        await page.waitForLoadState('networkidle');
    });

    test.describe('Theme Toggle Component', () => {
        test('should render theme toggle correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/theme-toggle');
            
            // Test light theme state
            await takeVisualScreenshot(page, 'theme-toggle-light', defaultOptions);
            
            // Click to switch to dark theme
            await page.click('[data-testid="theme-toggle"]');
            await page.waitForTimeout(200); // Wait for theme transition
            
            // Test dark theme state
            await takeVisualScreenshot(page, 'theme-toggle-dark', defaultOptions);
            
            // Test hover state
            await page.hover('[data-testid="theme-toggle"]');
            await takeVisualScreenshot(page, 'theme-toggle-hover', defaultOptions);
            
            // Test focus state
            await page.focus('[data-testid="theme-toggle"]');
            await takeVisualScreenshot(page, 'theme-toggle-focus', defaultOptions);
        });
        
        test('should handle theme toggle animation', async ({ page }) => {
            await page.goto('/visual-test-showcase/theme-toggle');
            
            // Enable animations for this test
            await page.addStyleTag({
                content: `
                    * {
                        animation-duration: 0.3s !important;
                        transition-duration: 0.3s !important;
                    }
                `,
            });
            
            // Test animation frames
            await page.click('[data-testid="theme-toggle"]');
            await page.waitForTimeout(100);
            await takeVisualScreenshot(page, 'theme-toggle-animation-mid', defaultOptions);
            
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'theme-toggle-animation-end', defaultOptions);
        });
    });

    test.describe('Recent Activity Tab Component', () => {
        test('should render recent activity tab correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/recent-activity');
            
            // Test with no activities (empty state)
            await takeVisualScreenshot(page, 'recent-activity-empty', defaultOptions);
            
            // Test with mock activities
            await page.evaluate(() => {
                // Mock some activities
                window.postMessage({ type: 'SET_MOCK_ACTIVITIES', activities: [
                    { id: 1, type: 'document', title: 'Created new document', timestamp: '2024-01-01T10:00:00Z' },
                    { id: 2, type: 'project', title: 'Updated project settings', timestamp: '2024-01-01T09:00:00Z' },
                    { id: 3, type: 'team', title: 'Invited team member', timestamp: '2024-01-01T08:00:00Z' },
                ]}, '*');
            });
            
            await page.waitForTimeout(500);
            await takeVisualScreenshot(page, 'recent-activity-with-data', defaultOptions);
            
            // Test loading state
            await page.evaluate(() => {
                window.postMessage({ type: 'SET_LOADING_STATE', loading: true }, '*');
            });
            
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'recent-activity-loading', defaultOptions);
        });
        
        test('should handle different greeting times', async ({ page }) => {
            await page.goto('/visual-test-showcase/recent-activity');
            
            // Test morning greeting
            await page.evaluate(() => {
                const now = new Date();
                now.setHours(9, 0, 0, 0);
                Date.now = () => now.getTime();
            });
            await page.reload();
            await takeVisualScreenshot(page, 'recent-activity-morning', defaultOptions);
            
            // Test afternoon greeting
            await page.evaluate(() => {
                const now = new Date();
                now.setHours(15, 0, 0, 0);
                Date.now = () => now.getTime();
            });
            await page.reload();
            await takeVisualScreenshot(page, 'recent-activity-afternoon', defaultOptions);
            
            // Test evening greeting
            await page.evaluate(() => {
                const now = new Date();
                now.setHours(20, 0, 0, 0);
                Date.now = () => now.getTime();
            });
            await page.reload();
            await takeVisualScreenshot(page, 'recent-activity-evening', defaultOptions);
        });
    });

    test.describe('Settings Tab Component', () => {
        test('should render settings tab correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/settings');
            
            // Test default settings view
            await takeVisualScreenshot(page, 'settings-tab-default', defaultOptions);
            
            // Test different settings sections
            const sections = ['profile', 'notifications', 'security', 'preferences'];
            
            for (const section of sections) {
                await page.click(`[data-testid="settings-section-${section}"]`);
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `settings-tab-${section}`, defaultOptions);
            }
        });
        
        test('should handle settings form states', async ({ page }) => {
            await page.goto('/visual-test-showcase/settings');
            
            // Test form with validation errors
            await page.click('[data-testid="settings-form-submit"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'settings-form-errors', defaultOptions);
            
            // Test form with valid data
            await page.fill('[data-testid="settings-input-name"]', 'John Doe');
            await page.fill('[data-testid="settings-input-email"]', 'john@example.com');
            await takeVisualScreenshot(page, 'settings-form-valid', defaultOptions);
            
            // Test form saving state
            await page.click('[data-testid="settings-form-submit"]');
            await page.waitForTimeout(100);
            await takeVisualScreenshot(page, 'settings-form-saving', defaultOptions);
        });
    });

    test.describe('Block Canvas Components', () => {
        test('should render block canvas correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/block-canvas');
            
            // Test empty canvas
            await takeVisualScreenshot(page, 'block-canvas-empty', defaultOptions);
            
            // Test canvas with blocks
            await page.evaluate(() => {
                window.postMessage({ type: 'ADD_MOCK_BLOCKS' }, '*');
            });
            
            await page.waitForTimeout(500);
            await takeVisualScreenshot(page, 'block-canvas-with-blocks', defaultOptions);
            
            // Test block selection
            await page.click('[data-testid="block-1"]');
            await takeVisualScreenshot(page, 'block-canvas-selection', defaultOptions);
            
            // Test block editing
            await page.dblclick('[data-testid="block-1"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'block-canvas-editing', defaultOptions);
        });
        
        test('should handle different block types', async ({ page }) => {
            await page.goto('/visual-test-showcase/block-canvas');
            
            const blockTypes = ['text', 'table', 'image', 'code', 'chart'];
            
            for (const blockType of blockTypes) {
                await page.evaluate((type) => {
                    window.postMessage({ type: 'ADD_BLOCK', blockType: type }, '*');
                }, blockType);
                
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `block-canvas-${blockType}`, defaultOptions);
            }
        });
        
        test('should handle block interactions', async ({ page }) => {
            await page.goto('/visual-test-showcase/block-canvas');
            
            // Add a block
            await page.evaluate(() => {
                window.postMessage({ type: 'ADD_BLOCK', blockType: 'text' }, '*');
            });
            
            await page.waitForTimeout(200);
            
            // Test hover state
            await page.hover('[data-testid="block-1"]');
            await takeVisualScreenshot(page, 'block-canvas-hover', defaultOptions);
            
            // Test drag state
            await page.dragAndDrop('[data-testid="block-1"]', '[data-testid="drop-zone"]');
            await takeVisualScreenshot(page, 'block-canvas-drag', defaultOptions);
        });
    });

    test.describe('Test Matrix Components', () => {
        test('should render test matrix correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/test-matrix');
            
            // Test empty matrix
            await takeVisualScreenshot(page, 'test-matrix-empty', defaultOptions);
            
            // Test matrix with data
            await page.evaluate(() => {
                window.postMessage({ type: 'SET_MOCK_TEST_DATA' }, '*');
            });
            
            await page.waitForTimeout(500);
            await takeVisualScreenshot(page, 'test-matrix-with-data', defaultOptions);
            
            // Test matrix with filters
            await page.click('[data-testid="test-matrix-filter"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'test-matrix-filtered', defaultOptions);
            
            // Test matrix with sort
            await page.click('[data-testid="test-matrix-sort"]');
            await page.waitForTimeout(200);
            await takeVisualScreenshot(page, 'test-matrix-sorted', defaultOptions);
        });
        
        test('should handle test status indicators', async ({ page }) => {
            await page.goto('/visual-test-showcase/test-matrix');
            
            const testStatuses = ['passed', 'failed', 'pending', 'skipped', 'running'];
            
            for (const status of testStatuses) {
                await page.evaluate((statusType) => {
                    window.postMessage({ type: 'SET_TEST_STATUS', status: statusType }, '*');
                }, status);
                
                await page.waitForTimeout(200);
                await takeVisualScreenshot(page, `test-matrix-status-${status}`, defaultOptions);
            }
        });
        
        test('should handle matrix interactions', async ({ page }) => {
            await page.goto('/visual-test-showcase/test-matrix');
            
            // Test cell selection
            await page.click('[data-testid="matrix-cell-1-1"]');
            await takeVisualScreenshot(page, 'test-matrix-cell-selection', defaultOptions);
            
            // Test row selection
            await page.click('[data-testid="matrix-row-1"]');
            await takeVisualScreenshot(page, 'test-matrix-row-selection', defaultOptions);
            
            // Test column selection
            await page.click('[data-testid="matrix-column-1"]');
            await takeVisualScreenshot(page, 'test-matrix-column-selection', defaultOptions);
        });
    });

    test.describe('Modal Components', () => {
        test('should render modals correctly', async ({ page }) => {
            await page.goto('/visual-test-showcase/modals');
            
            // Test basic modal
            await testModalComponent(page, 'basic-modal', '[data-testid="modal-trigger-basic"]', defaultOptions);
            
            // Test confirmation modal
            await testModalComponent(page, 'confirmation-modal', '[data-testid="modal-trigger-confirmation"]', defaultOptions);
            
            // Test form modal
            await testModalComponent(page, 'form-modal', '[data-testid="modal-trigger-form"]', defaultOptions);
            
            // Test fullscreen modal
            await testModalComponent(page, 'fullscreen-modal', '[data-testid="modal-trigger-fullscreen"]', {
                ...defaultOptions,
                fullPage: true,
            });
        });
        
        test('should handle modal sizes', async ({ page }) => {
            await page.goto('/visual-test-showcase/modals');
            
            const modalSizes = ['sm', 'md', 'lg', 'xl', 'full'];
            
            for (const size of modalSizes) {
                await page.click(`[data-testid="modal-trigger-${size}"]`);
                await page.waitForSelector('[role="dialog"]', { state: 'visible' });
                await takeVisualScreenshot(page, `modal-size-${size}`, {
                    ...defaultOptions,
                    fullPage: true,
                });
                await page.keyboard.press('Escape');
                await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
            }
        });
    });

    test.describe('Loading States', () => {
        test('should render loading states correctly', async ({ page }) => {
            const components = [
                'recent-activity',
                'settings',
                'block-canvas',
                'test-matrix',
            ];
            
            for (const component of components) {
                await page.goto(`/visual-test-showcase/${component}`);
                await testLoadingStates(page, component, defaultOptions);
            }
        });
    });

    test.describe('Empty States', () => {
        test('should render empty states correctly', async ({ page }) => {
            const components = [
                'recent-activity',
                'block-canvas',
                'test-matrix',
            ];
            
            for (const component of components) {
                await page.goto(`/visual-test-showcase/${component}`);
                await testEmptyStates(page, component, defaultOptions);
            }
        });
    });

    test.describe('Error States', () => {
        test('should render error states correctly', async ({ page }) => {
            const components = [
                'recent-activity',
                'settings',
                'block-canvas',
                'test-matrix',
            ];
            
            for (const component of components) {
                await page.goto(`/visual-test-showcase/${component}`);
                await testErrorStates(page, component, defaultOptions);
            }
        });
    });

    test.describe('Theme Compatibility', () => {
        test('should render components correctly in all themes', async ({ page }) => {
            const components = [
                'theme-toggle',
                'recent-activity',
                'settings',
                'block-canvas',
                'test-matrix',
            ];
            
            for (const component of components) {
                await testComponentThemes(page, component, async () => {
                    await page.goto(`/visual-test-showcase/${component}`);
                    await page.waitForLoadState('networkidle');
                }, defaultOptions);
            }
        });
    });

    test.describe('Responsive Design', () => {
        test('should render components correctly across breakpoints', async ({ page }) => {
            const components = [
                'theme-toggle',
                'recent-activity',
                'settings',
                'block-canvas',
                'test-matrix',
            ];
            
            for (const component of components) {
                await testComponentResponsive(page, component, async () => {
                    await page.goto(`/visual-test-showcase/${component}`);
                    await page.waitForLoadState('networkidle');
                }, defaultOptions);
            }
        });
    });
});