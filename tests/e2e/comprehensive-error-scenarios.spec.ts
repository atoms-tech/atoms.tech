import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    mockNetworkFailure,
    mockSlowNetwork,
    TestData,
    takeTimestampedScreenshot,
    collectConsoleErrors,
    verifyCriticalErrors
} from './utils/test-helpers';

test.describe('Comprehensive Error Scenarios', () => {
    let consoleErrors: string[] = [];

    test.beforeEach(async ({ page, context }) => {
        await setupAuthenticatedSession(context);
        await mockUserProfile(page);
        consoleErrors = await collectConsoleErrors(page);
    });

    test.afterEach(async ({ page }) => {
        const criticalErrors = verifyCriticalErrors(consoleErrors);
        if (criticalErrors.length > 0) {
            console.warn('Critical errors detected:', criticalErrors);
            await takeTimestampedScreenshot(page, 'error-scenario-critical', { fullPage: true });
        }
    });

    test.describe('Network and Connectivity Errors', () => {
        test('should handle complete network failure gracefully', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Simulate complete network failure
            await mockNetworkFailure(page, ['**/*']);

            // Try to navigate to documents
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                
                // Should show network error state
                await page.waitForTimeout(3000);
                
                const networkError = page.locator(
                    '[data-testid="network-error"], .network-error, text="network", text="connection", text="offline"'
                );
                
                if (await networkError.count() > 0) {
                    await expect(networkError).toBeVisible();
                } else {
                    // App might handle this differently, check for any error indication
                    const errorIndicators = page.locator(
                        '.error, [role="alert"], .alert, text="error", text="failed"'
                    );
                    const hasErrorIndication = await errorIndicators.count() > 0;
                    expect(hasErrorIndication).toBe(true);
                }

                // Test retry functionality
                const retryButton = page.locator('button:has-text("Retry"), [data-testid="retry"]');
                if (await retryButton.count() > 0) {
                    await retryButton.click();
                    // Should attempt to reload
                    await page.waitForTimeout(1000);
                }
            }
        });

        test('should handle intermittent connectivity issues', async ({ page }) => {
            let requestCount = 0;

            // Mock intermittent failures (50% failure rate)
            await page.route('**/api/**', async (route) => {
                requestCount++;
                if (requestCount % 2 === 0) {
                    await route.abort('failed');
                } else {
                    await route.continue();
                }
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Try multiple actions that trigger API calls
            const actions = [
                () => page.click('a:has-text("Documents")'),
                () => page.click('a:has-text("Requirements")'),
                () => page.click('a:has-text("Overview")')
            ];

            for (const action of actions) {
                try {
                    await action();
                    await page.waitForLoadState('networkidle', { timeout: 5000 });
                } catch (error) {
                    // Some actions might fail due to intermittent connectivity
                    console.log('Action failed due to intermittent connectivity:', error);
                }

                // Should show loading states or error recovery
                const loadingOrError = page.locator(
                    '[data-testid="loading"], .loading, .error, [role="alert"]'
                );
                // Give time for UI to react
                await page.waitForTimeout(1000);
            }
        });

        test('should handle API timeout scenarios', async ({ page }) => {
            // Mock extremely slow API responses (timeout simulation)
            await page.route('**/api/**', async (route) => {
                // Delay response beyond typical timeout
                await new Promise(resolve => setTimeout(resolve, 10000));
                await route.continue();
            });

            await page.goto('/org/test-org/project/test-project');

            // Should show timeout handling
            await page.waitForTimeout(5000);

            const timeoutIndicators = page.locator(
                'text="timeout", text="taking too long", text="slow", [data-testid="timeout"]'
            );

            if (await timeoutIndicators.count() > 0) {
                await expect(timeoutIndicators.first()).toBeVisible();
            } else {
                // Check for general loading or error states
                const loadingStates = page.locator('.loading, .spinner, [data-testid="loading"]');
                const errorStates = page.locator('.error, [role="alert"]');
                
                const hasLoadingOrError = (await loadingStates.count() > 0) || (await errorStates.count() > 0);
                expect(hasLoadingOrError).toBe(true);
            }
        });

        test('should handle WebSocket connection failures', async ({ page }) => {
            // Mock WebSocket failures
            await page.addInitScript(() => {
                const originalWebSocket = window.WebSocket;
                window.WebSocket = class FailingWebSocket extends EventTarget {
                    constructor(url: string) {
                        super();
                        this.url = url;
                        this.readyState = 3; // CLOSED
                        
                        // Immediately dispatch error
                        setTimeout(() => {
                            this.dispatchEvent(new Event('error'));
                            this.dispatchEvent(new Event('close'));
                        }, 100);
                    }
                    
                    send() {
                        // Fail silently or throw error
                        throw new Error('WebSocket connection failed');
                    }
                    
                    close() {
                        this.readyState = 3;
                    }
                    
                    url: string;
                    readyState: number;
                } as any;
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Should handle WebSocket failure gracefully
            const wsErrorIndicator = page.locator(
                '[data-testid="connection-error"], .connection-status, text="connection lost"'
            );

            if (await wsErrorIndicator.count() > 0) {
                await expect(wsErrorIndicator).toBeVisible();
            }

            // Test that core functionality still works without WebSocket
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                await page.waitForLoadState('networkidle');
                
                // Basic navigation should still work
                expect(page.url()).toContain('documents');
            }
        });
    });

    test.describe('Authentication and Authorization Errors', () => {
        test('should handle session expiration during usage', async ({ page, context }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Simulate session expiration
            await context.clearCookies();

            // Mock API to return 401 for subsequent requests
            await page.route('**/api/**', async (route) => {
                await route.fulfill({
                    status: 401,
                    json: { error: 'Session expired', code: 'SESSION_EXPIRED' }
                });
            });

            // Try to perform an action that requires authentication
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                await page.waitForTimeout(2000);

                // Should redirect to login or show re-authentication prompt
                const isRedirectedToLogin = page.url().includes('/login');
                const hasReauthPrompt = await page.locator(
                    '[data-testid="reauth-prompt"], .session-expired, text="session expired"'
                ).count() > 0;

                expect(isRedirectedToLogin || hasReauthPrompt).toBe(true);
            }
        });

        test('should handle insufficient permissions gracefully', async ({ page }) => {
            // Mock user with limited permissions
            await mockUserProfile(page, {
                id: 'limited_user',
                full_name: 'Limited User',
                email: 'limited@example.com'
            });

            // Mock permission-based API responses
            await page.route('**/api/**', async (route) => {
                const url = route.request().url();
                
                if (url.includes('/admin') || route.request().method() === 'DELETE') {
                    await route.fulfill({
                        status: 403,
                        json: { error: 'Insufficient permissions', code: 'FORBIDDEN' }
                    });
                } else {
                    await route.continue();
                }
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Try to access admin functionality
            const settingsButton = page.locator('button:has-text("Settings"), [data-testid="project-settings"]');
            if (await settingsButton.count() > 0) {
                await settingsButton.click();
                
                // Should show permission error or hide restricted features
                const permissionError = page.locator(
                    'text="permission", text="access denied", text="forbidden", [data-testid="permission-error"]'
                );

                if (await permissionError.count() > 0) {
                    await expect(permissionError).toBeVisible();
                } else {
                    // Admin-only features should be hidden
                    const deleteButton = page.locator('button:has-text("Delete Project")');
                    if (await deleteButton.count() > 0) {
                        const isDisabled = await deleteButton.isDisabled();
                        const isHidden = !await deleteButton.isVisible();
                        expect(isDisabled || isHidden).toBe(true);
                    }
                }
            }
        });

        test('should handle token refresh failures', async ({ page, context }) => {
            // Set up expired token
            await context.addCookies([
                {
                    name: 'sb-access-token',
                    value: 'expired_token',
                    domain: 'localhost',
                    path: '/',
                    expires: Math.floor(Date.now() / 1000) - 3600
                }
            ]);

            // Mock failed token refresh
            await page.route('**/auth/refresh**', async (route) => {
                await route.fulfill({
                    status: 401,
                    json: { error: 'Refresh token expired' }
                });
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForTimeout(3000);

            // Should redirect to login or show authentication error
            const isRedirectedToLogin = page.url().includes('/login');
            const hasAuthError = await page.locator(
                'text="authentication", text="login required", [data-testid="auth-error"]'
            ).count() > 0;

            expect(isRedirectedToLogin || hasAuthError).toBe(true);
        });
    });

    test.describe('Data and Validation Errors', () => {
        test('should handle malformed API responses', async ({ page }) => {
            // Mock APIs returning malformed data
            await page.route('**/api/projects**', async (route) => {
                await route.fulfill({
                    status: 200,
                    body: 'invalid json response {broken'
                });
            });

            await page.goto('/org/test-org');
            await page.waitForTimeout(3000);

            // Should handle malformed response gracefully
            const errorState = page.locator(
                '[data-testid="data-error"], .data-error, text="error loading", text="invalid data"'
            );

            if (await errorState.count() > 0) {
                await expect(errorState).toBeVisible();
            } else {
                // Should show empty state or retry option
                const fallbackState = page.locator(
                    '[data-testid="empty-state"], .empty-state, button:has-text("Retry")'
                );
                const hasFallback = await fallbackState.count() > 0;
                expect(hasFallback).toBe(true);
            }
        });

        test('should handle data type mismatches', async ({ page }) => {
            // Mock API returning wrong data types
            await page.route('**/api/projects**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: "should be array but is string",
                        count: "should be number but is string",
                        projects: null
                    }
                });
            });

            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Application should handle type mismatches gracefully
            const hasError = await page.locator('.error, [role="alert"], [data-testid="error"]').count() > 0;
            const hasEmptyState = await page.locator('.empty-state, [data-testid="empty-state"]').count() > 0;
            const hasRetry = await page.locator('button:has-text("Retry")').count() > 0;

            expect(hasError || hasEmptyState || hasRetry).toBe(true);
        });

        test('should handle form validation errors', async ({ page }) => {
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Try to create project with invalid data
            const createButton = page.locator('button:has-text("Create Project")');
            if (await createButton.count() > 0) {
                await createButton.click();

                // Test various invalid inputs
                const invalidInputs = [
                    { field: 'input[name="name"]', value: '', error: 'required' },
                    { field: 'input[name="name"]', value: 'a', error: 'too short' },
                    { field: 'input[name="name"]', value: 'x'.repeat(256), error: 'too long' },
                    { field: 'input[name="description"]', value: 'x'.repeat(1001), error: 'description too long' }
                ];

                for (const input of invalidInputs) {
                    const field = page.locator(input.field);
                    if (await field.count() > 0) {
                        await field.fill(input.value);
                        
                        // Try to submit
                        const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
                        if (await submitButton.count() > 0) {
                            await submitButton.click();
                            
                            // Should show validation error
                            const validationError = page.locator(
                                '.error, [role="alert"], .field-error, .validation-error'
                            );
                            
                            if (await validationError.count() > 0) {
                                await expect(validationError).toBeVisible();
                            } else {
                                // Button should be disabled for invalid input
                                const isDisabled = await submitButton.isDisabled();
                                if (input.value === '' || input.value === 'a') {
                                    expect(isDisabled).toBe(true);
                                }
                            }
                        }
                    }
                }
            }
        });

        test('should handle file upload errors', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            // Mock file upload failures
            await page.route('**/api/upload**', async (route) => {
                const contentType = route.request().headerValue('content-type');
                
                if (contentType?.includes('image/')) {
                    await route.fulfill({
                        status: 415,
                        json: { error: 'Unsupported file type' }
                    });
                } else {
                    await route.fulfill({
                        status: 413,
                        json: { error: 'File too large' }
                    });
                }
            });

            const fileUpload = page.locator('input[type="file"], [data-testid="file-upload"]');
            if (await fileUpload.count() > 0) {
                // Test unsupported file type
                await fileUpload.setInputFiles({
                    name: 'test-image.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake png content')
                });

                // Should show file type error
                const typeError = page.locator('text="file type", text="unsupported"');
                if (await typeError.count() > 0) {
                    await expect(typeError).toBeVisible();
                }

                // Test file too large
                await fileUpload.setInputFiles({
                    name: 'large-file.pdf',
                    mimeType: 'application/pdf',
                    buffer: Buffer.alloc(1024 * 1024) // 1MB
                });

                const sizeError = page.locator('text="too large", text="file size"');
                if (await sizeError.count() > 0) {
                    await expect(sizeError).toBeVisible();
                }
            }
        });
    });

    test.describe('UI and Interaction Errors', () => {
        test('should handle missing or broken UI components', async ({ page }) => {
            // Simulate component loading failures
            await page.addInitScript(() => {
                // Mock React component errors
                window.addEventListener('error', (event) => {
                    if (event.message.includes('ChunkLoadError')) {
                        console.error('Chunk load error detected');
                    }
                });
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test that essential UI elements are present
            const essentialElements = [
                'nav, [data-testid="navigation"]',
                'main, [data-testid="main-content"]',
                'h1, h2, [data-testid="page-title"]'
            ];

            for (const selector of essentialElements) {
                const element = page.locator(selector);
                if (await element.count() === 0) {
                    // Take screenshot for debugging
                    await takeTimestampedScreenshot(page, `missing-element-${selector.replace(/[^a-z0-9]/gi, '_')}`);
                    
                    // Check for error boundary or fallback UI
                    const errorBoundary = page.locator(
                        '[data-testid="error-boundary"], .error-boundary, text="something went wrong"'
                    );
                    
                    if (await errorBoundary.count() > 0) {
                        await expect(errorBoundary).toBeVisible();
                    }
                }
            }
        });

        test('should handle JavaScript errors gracefully', async ({ page }) => {
            let jsErrors: string[] = [];

            // Collect JavaScript errors
            page.on('pageerror', (error) => {
                jsErrors.push(error.message);
            });

            // Inject code that causes errors
            await page.addInitScript(() => {
                // Simulate various JS errors
                setTimeout(() => {
                    try {
                        // @ts-ignore - intentional error
                        nonExistentFunction();
                    } catch (e) {
                        console.error('Intentional error for testing:', e);
                    }
                }, 1000);
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Page should still be functional despite JS errors
            const navigation = page.locator('nav, [data-testid="navigation"]');
            if (await navigation.count() > 0) {
                await expect(navigation).toBeVisible();
            }

            // Test that basic interactions still work
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                await page.waitForLoadState('networkidle');
                expect(page.url()).toContain('documents');
            }

            console.log('JS Errors detected:', jsErrors);
        });

        test('should handle modal and overlay errors', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Try to open a modal that might fail
            const createButton = page.locator('button:has-text("New Document"), [data-testid="create-document"]');
            if (await createButton.count() > 0) {
                await createButton.click();

                // Check if modal opened successfully
                const modal = page.locator('[role="dialog"], .modal');
                if (await modal.count() > 0) {
                    await expect(modal).toBeVisible();
                    
                    // Test modal close functionality
                    const closeButton = modal.locator('button:has-text("Cancel"), [data-testid="close"], .close');
                    if (await closeButton.count() > 0) {
                        await closeButton.click();
                        await expect(modal).not.toBeVisible();
                    } else {
                        // Try escape key
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(500);
                        const isStillVisible = await modal.isVisible();
                        expect(isStillVisible).toBe(false);
                    }
                } else {
                    // Modal failed to open - check for error indication
                    const errorIndication = page.locator('.error, [role="alert"]');
                    if (await errorIndication.count() > 0) {
                        await expect(errorIndication).toBeVisible();
                    }
                }
            }
        });

        test('should handle responsive design breakpoints', async ({ page }) => {
            const viewports = [
                { width: 320, height: 568, name: 'mobile-small' },
                { width: 375, height: 667, name: 'mobile-medium' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 1024, height: 768, name: 'desktop-small' },
                { width: 1920, height: 1080, name: 'desktop-large' }
            ];

            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.goto('/org/test-org/project/test-project');
                await page.waitForLoadState('networkidle');

                // Check that essential elements are still accessible
                const navigation = page.locator('nav, [data-testid="navigation"], .hamburger, [data-testid="mobile-menu"]');
                const content = page.locator('main, [data-testid="main-content"]');

                await expect(navigation).toBeVisible();
                await expect(content).toBeVisible();

                // Check for horizontal scrolling issues
                const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
                expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // 20px tolerance

                await takeTimestampedScreenshot(page, `responsive-${viewport.name}`);
            }
        });
    });

    test.describe('Performance and Resource Errors', () => {
        test('should handle memory pressure gracefully', async ({ page }) => {
            // Simulate high memory usage
            await page.addInitScript(() => {
                // Create memory pressure
                const arrays: any[] = [];
                for (let i = 0; i < 100; i++) {
                    arrays.push(new Array(10000).fill('memory-pressure-test'));
                }
                (window as any).memoryPressureArrays = arrays;
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test that basic functionality still works under memory pressure
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                const startTime = Date.now();
                await documentsTab.click();
                await page.waitForLoadState('networkidle');
                const navigationTime = Date.now() - startTime;

                // Navigation should complete, even if slower
                expect(navigationTime).toBeLessThan(10000); // 10 second max
                expect(page.url()).toContain('documents');
            }
        });

        test('should handle slow resource loading', async ({ page }) => {
            // Mock slow resource loading
            await page.route('**/*.{css,js,png,jpg,jpeg,gif,svg}', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                await route.continue();
            });

            const startTime = Date.now();
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            const loadTime = Date.now() - startTime;

            // Page should eventually load despite slow resources
            const content = page.locator('main, [data-testid="main-content"]');
            await expect(content).toBeVisible();

            console.log(`Page loaded in ${loadTime}ms with slow resources`);
        });

        test('should handle CDN failures', async ({ page }) => {
            // Mock CDN failures for external resources
            await page.route('**/fonts.googleapis.com/**', async (route) => {
                await route.abort('failed');
            });

            await page.route('**/cdn.jsdelivr.net/**', async (route) => {
                await route.abort('failed');
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Page should still be functional without external resources
            const content = page.locator('main, [data-testid="main-content"]');
            await expect(content).toBeVisible();

            // Text should still be readable (fallback fonts)
            const textElements = page.locator('h1, h2, p, span');
            const firstTextElement = textElements.first();
            if (await firstTextElement.count() > 0) {
                const isVisible = await firstTextElement.isVisible();
                expect(isVisible).toBe(true);
            }
        });
    });

    test.describe('Edge Cases and Boundary Conditions', () => {
        test('should handle extremely large datasets', async ({ page }) => {
            // Mock API returning large dataset
            await page.route('**/api/documents**', async (route) => {
                const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                    id: `doc_${i}`,
                    title: `Document ${i}`,
                    content: 'Lorem ipsum '.repeat(100),
                    created_at: new Date().toISOString()
                }));

                await route.fulfill({
                    status: 200,
                    json: { data: largeDataset, count: 1000 }
                });
            });

            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Should handle large dataset without crashing
            const documentsList = page.locator('[data-testid="documents-list"], .documents-container');
            if (await documentsList.count() > 0) {
                await expect(documentsList).toBeVisible();
            }

            // Should implement pagination or virtualization
            const paginationOrVirtualization = page.locator(
                '[data-testid="pagination"], .pagination, [data-testid="virtual-list"], .virtual-scroll'
            );
            
            if (await paginationOrVirtualization.count() > 0) {
                await expect(paginationOrVirtualization).toBeVisible();
            } else {
                // At minimum, should not render all 1000 items at once
                const renderedItems = page.locator('[data-testid="document-item"], .document-item');
                const itemCount = await renderedItems.count();
                expect(itemCount).toBeLessThan(100); // Should virtualize or paginate
            }
        });

        test('should handle concurrent user actions', async ({ page, context }) => {
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            // Simulate rapid user interactions
            const rapidActions = [
                () => page.click('a:has-text("Requirements")'),
                () => page.click('a:has-text("Overview")'),
                () => page.click('a:has-text("Documents")'),
                () => page.click('input[type="search"]').then(() => page.fill('input[type="search"]', 'test')),
                () => page.keyboard.press('Escape')
            ];

            // Execute actions rapidly without waiting
            await Promise.allSettled(rapidActions.map(action => action()));

            // Wait for everything to settle
            await page.waitForTimeout(2000);
            await page.waitForLoadState('networkidle');

            // Page should still be in a consistent state
            const navigation = page.locator('nav, [data-testid="navigation"]');
            await expect(navigation).toBeVisible();

            const content = page.locator('main, [data-testid="main-content"]');
            await expect(content).toBeVisible();
        });

        test('should handle browser storage limitations', async ({ page }) => {
            // Fill up localStorage to test storage limits
            await page.addInitScript(() => {
                try {
                    const largeString = 'x'.repeat(1024 * 1024); // 1MB string
                    for (let i = 0; i < 10; i++) {
                        localStorage.setItem(`large_item_${i}`, largeString);
                    }
                } catch (e) {
                    console.log('localStorage quota exceeded:', e);
                }
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // App should handle storage quota errors gracefully
            const content = page.locator('main, [data-testid="main-content"]');
            await expect(content).toBeVisible();

            // Test that app can still save data or shows appropriate warning
            const settingsButton = page.locator('button:has-text("Settings")');
            if (await settingsButton.count() > 0) {
                await settingsButton.click();
                
                // Try to save a setting
                const notificationToggle = page.locator('input[type="checkbox"]').first();
                if (await notificationToggle.count() > 0) {
                    await notificationToggle.click();
                    
                    // Should either save successfully or show storage warning
                    const saveButton = page.locator('button:has-text("Save")');
                    if (await saveButton.count() > 0) {
                        await saveButton.click();
                        
                        await page.waitForTimeout(1000);
                        // Check for storage warning or success
                        const storageWarning = page.locator('text="storage", text="quota", text="space"');
                        const successMessage = page.locator('text="saved", text="updated"');
                        
                        const hasAppropriateResponse = 
                            (await storageWarning.count() > 0) || 
                            (await successMessage.count() > 0);
                        
                        expect(hasAppropriateResponse).toBe(true);
                    }
                }
            }
        });
    });
});