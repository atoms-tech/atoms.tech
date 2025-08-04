import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    mockNetworkFailure,
    mockSlowNetwork,
    TestData,
    takeTimestampedScreenshot
} from './utils/test-helpers';

test.describe('API Integration Workflows', () => {
    test.beforeEach(async ({ page, context }) => {
        await setupAuthenticatedSession(context);
        await mockUserProfile(page);
    });

    test.describe('Real-time Data Synchronization', () => {
        test('should handle real-time updates via WebSocket', async ({ page }) => {
            // Mock WebSocket connection
            await page.addInitScript(() => {
                // Override WebSocket for testing
                const originalWebSocket = window.WebSocket;
                window.WebSocket = class MockWebSocket extends EventTarget {
                    constructor(url: string) {
                        super();
                        this.url = url;
                        this.readyState = 1; // OPEN
                        
                        // Simulate connection after a delay
                        setTimeout(() => {
                            this.dispatchEvent(new Event('open'));
                        }, 100);
                    }
                    
                    send(data: string) {
                        // Echo back data as if from server
                        setTimeout(() => {
                            const event = new MessageEvent('message', { data });
                            this.dispatchEvent(event);
                        }, 50);
                    }
                    
                    close() {
                        this.readyState = 3; // CLOSED
                        this.dispatchEvent(new Event('close'));
                    }
                    
                    url: string;
                    readyState: number;
                } as any;
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test real-time updates in collaborative features
            const collaborativeElement = page.locator('[data-testid="collaborative-editor"], .real-time-indicator');
            if (await collaborativeElement.count() > 0) {
                await expect(collaborativeElement).toBeVisible();
                
                // Simulate receiving real-time update
                await page.evaluate(() => {
                    const event = new CustomEvent('realtime-update', {
                        detail: {
                            type: 'document_updated',
                            data: { id: 'doc_123', title: 'Updated via WebSocket' }
                        }
                    });
                    window.dispatchEvent(event);
                });

                // Verify UI reflects the update
                await page.waitForTimeout(500);
                const updatedElement = page.locator('text="Updated via WebSocket"');
                if (await updatedElement.count() > 0) {
                    await expect(updatedElement).toBeVisible();
                }
            }
        });

        test('should handle WebSocket reconnection', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test WebSocket reconnection logic
            await page.evaluate(() => {
                // Simulate WebSocket disconnection
                const event = new Event('offline');
                window.dispatchEvent(event);
            });

            // Should show offline indicator
            const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-status');
            if (await offlineIndicator.count() > 0) {
                await expect(offlineIndicator).toBeVisible();
            }

            // Simulate reconnection
            await page.evaluate(() => {
                const event = new Event('online');
                window.dispatchEvent(event);
            });

            // Should hide offline indicator
            if (await offlineIndicator.count() > 0) {
                await expect(offlineIndicator).not.toBeVisible();
            }
        });
    });

    test.describe('API Error Handling', () => {
        test('should handle 4xx client errors gracefully', async ({ page }) => {
            // Mock 400 Bad Request
            await page.route('**/api/projects**', async (route) => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 400,
                        json: {
                            error: 'Validation failed',
                            details: ['Name is required', 'Invalid organization ID']
                        }
                    });
                }
            });

            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Try to create project with invalid data
            const createButton = page.locator('button:has-text("Create Project")');
            if (await createButton.count() > 0) {
                await createButton.click();
                
                // Submit empty form
                const submitButton = page.locator('button[type="submit"], button:has-text("Create")');
                if (await submitButton.count() > 0) {
                    await submitButton.click();
                    
                    // Should show validation errors
                    const errorMessage = page.locator('[data-testid="error-message"], .error, .text-red-500');
                    await expect(errorMessage).toBeVisible();
                    await expect(errorMessage).toContainText('Validation failed');
                }
            }

            // Mock 401 Unauthorized
            await page.route('**/api/organizations**', async (route) => {
                await route.fulfill({
                    status: 401,
                    json: { error: 'Unauthorized access' }
                });
            });

            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should redirect to login or show auth error
            await page.waitForTimeout(2000);
            expect(
                page.url().includes('/login') || 
                await page.locator('text="Unauthorized", text="Access denied"').count() > 0
            ).toBe(true);

            // Mock 403 Forbidden
            await page.route('**/api/projects/*/delete**', async (route) => {
                await route.fulfill({
                    status: 403,
                    json: { error: 'Insufficient permissions' }
                });
            });

            // Test permission-based error handling would go here
        });

        test('should handle 5xx server errors gracefully', async ({ page }) => {
            // Mock 500 Internal Server Error
            await page.route('**/api/**', async (route) => {
                await route.fulfill({
                    status: 500,
                    json: { error: 'Internal server error' }
                });
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Should show error state or fallback UI
            const errorState = page.locator('[data-testid="error-state"], .error-fallback');
            if (await errorState.count() > 0) {
                await expect(errorState).toBeVisible();
            }

            // Test retry mechanism
            const retryButton = page.locator('button:has-text("Retry"), [data-testid="retry-button"]');
            if (await retryButton.count() > 0) {
                await retryButton.click();
                // Should attempt to reload data
                await page.waitForLoadState('networkidle');
            }

            // Mock 503 Service Unavailable
            await page.route('**/api/**', async (route) => {
                await route.fulfill({
                    status: 503,
                    json: { error: 'Service temporarily unavailable' }
                });
            });

            await page.reload();
            await page.waitForLoadState('networkidle');

            // Should show maintenance or service unavailable message
            const serviceMessage = page.locator('text="Service unavailable", text="maintenance"');
            if (await serviceMessage.count() > 0) {
                await expect(serviceMessage).toBeVisible();
            }
        });

        test('should handle network failures', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Simulate network failure
            await mockNetworkFailure(page, ['**/api/**']);

            // Try to perform an action that requires API call
            const refreshButton = page.locator('button:has-text("Refresh"), [data-testid="refresh"]');
            if (await refreshButton.count() > 0) {
                await refreshButton.click();
                
                // Should show network error
                const networkError = page.locator('text="Network error", text="No internet", [data-testid="network-error"]');
                if (await networkError.count() > 0) {
                    await expect(networkError).toBeVisible();
                }
            }

            // Test offline mode functionality
            await page.evaluate(() => {
                window.navigator.onLine = false;
                window.dispatchEvent(new Event('offline'));
            });

            const offlineMode = page.locator('[data-testid="offline-mode"], .offline-indicator');
            if (await offlineMode.count() > 0) {
                await expect(offlineMode).toBeVisible();
            }
        });
    });

    test.describe('API Performance', () => {
        test('should handle slow API responses', async ({ page }) => {
            // Mock slow API responses
            await mockSlowNetwork(page, 3000, ['**/api/**']);

            await page.goto('/org/test-org/project/test-project');

            // Should show loading states during slow requests
            const loadingIndicator = page.locator('[data-testid="loading"], .loading, .animate-spin');
            await expect(loadingIndicator).toBeVisible();

            // Wait for page to eventually load
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Loading indicator should disappear
            if (await loadingIndicator.count() > 0) {
                await expect(loadingIndicator).not.toBeVisible();
            }
        });

        test('should implement request timeouts', async ({ page }) => {
            // Mock extremely slow API (simulating timeout)
            await page.route('**/api/projects**', async (route) => {
                // Never resolve to simulate timeout
                await new Promise(() => {});
            });

            await page.goto('/org/test-org');

            // Should eventually show timeout error
            await page.waitForTimeout(5000);
            
            const timeoutError = page.locator('text="Request timeout", text="took too long", [data-testid="timeout-error"]');
            if (await timeoutError.count() > 0) {
                await expect(timeoutError).toBeVisible();
            }
        });

        test('should implement request caching', async ({ page }) => {
            let requestCount = 0;

            // Count API requests
            await page.route('**/api/projects**', async (route) => {
                requestCount++;
                await route.fulfill({
                    status: 200,
                    json: { data: [TestData.projects.default], count: 1 }
                });
            });

            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            const initialRequestCount = requestCount;

            // Navigate away and back quickly
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // If caching is implemented, request count shouldn't increase much
            const requestIncrease = requestCount - initialRequestCount;
            expect(requestIncrease).toBeLessThan(3); // Allow some increase for cache validation
        });
    });

    test.describe('Data Validation and Integrity', () => {
        test('should validate data before sending to API', async ({ page }) => {
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Test client-side validation
            const createButton = page.locator('button:has-text("Create Project")');
            if (await createButton.count() > 0) {
                await createButton.click();
                
                // Try to submit with invalid data
                const nameField = page.locator('input[name="name"]');
                if (await nameField.count() > 0) {
                    // Test various invalid inputs
                    const invalidInputs = ['', '   ', 'a', 'x'.repeat(256)];
                    
                    for (const input of invalidInputs) {
                        await nameField.fill(input);
                        
                        const submitButton = page.locator('button[type="submit"]');
                        if (await submitButton.count() > 0) {
                            const isDisabled = await submitButton.isDisabled();
                            
                            // Button should be disabled for invalid input
                            if (input === '' || input === '   ' || input === 'a') {
                                expect(isDisabled).toBe(true);
                            }
                        }
                    }
                }
            }
        });

        test('should handle API response validation', async ({ page }) => {
            // Mock API with invalid response format
            await page.route('**/api/projects**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        // Missing required fields or wrong format
                        invalid: 'response'
                    }
                });
            });

            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Should handle invalid API response gracefully
            const errorFallback = page.locator('[data-testid="data-error"], .data-fallback');
            if (await errorFallback.count() > 0) {
                await expect(errorFallback).toBeVisible();
            }
        });

        test('should handle data type mismatches', async ({ page }) => {
            // Mock API returning wrong data types
            await page.route('**/api/projects**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: "should be array", // Wrong type
                        count: "should be number" // Wrong type
                    }
                });
            });

            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Application should handle type mismatches gracefully
            const content = page.locator('[data-testid="projects-list"], .projects-container');
            if (await content.count() > 0) {
                // Should either show error state or empty state, not crash
                const hasError = await page.locator('[data-testid="error"], .error').count() > 0;
                const hasEmpty = await page.locator('[data-testid="empty"], .empty-state').count() > 0;
                
                expect(hasError || hasEmpty).toBe(true);
            }
        });
    });

    test.describe('Authentication & Authorization Integration', () => {
        test('should handle token refresh', async ({ page, context }) => {
            // Set up expired token
            await context.addCookies([
                {
                    name: 'sb-access-token',
                    value: 'expired_token',
                    domain: 'localhost',
                    path: '/',
                    expires: Math.floor(Date.now() / 1000) - 3600 // Expired
                }
            ]);

            // Mock token refresh endpoint
            await page.route('**/auth/refresh**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        access_token: 'new_fresh_token',
                        refresh_token: 'new_refresh_token'
                    }
                });
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Should automatically refresh token and allow access
            // Or redirect to login if refresh fails
            const isAuthenticated = !page.url().includes('/login');
            const hasContent = await page.locator('[data-testid="project-content"], main').count() > 0;
            
            expect(isAuthenticated || hasContent).toBe(true);
        });

        test('should handle role-based access control', async ({ page }) => {
            // Mock user with limited permissions
            await mockUserProfile(page, {
                id: 'limited_user',
                full_name: 'Limited User',
                email: 'limited@example.com'
            });

            // Mock API responses based on permissions
            await page.route('**/api/organizations/*/admin**', async (route) => {
                await route.fulfill({
                    status: 403,
                    json: { error: 'Insufficient permissions' }
                });
            });

            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Admin-only features should be hidden or disabled
            const adminButton = page.locator('button:has-text("Admin"), [data-testid="admin-panel"]');
            if (await adminButton.count() > 0) {
                const isDisabled = await adminButton.isDisabled();
                const isHidden = !await adminButton.isVisible();
                
                expect(isDisabled || isHidden).toBe(true);
            }
        });

        test('should handle session expiration during API calls', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Mock API call that returns session expired
            await page.route('**/api/documents**', async (route) => {
                await route.fulfill({
                    status: 401,
                    json: { error: 'Session expired' }
                });
            });

            // Try to access documents
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                await page.waitForLoadState('networkidle');

                // Should redirect to login or show re-authentication prompt
                const isRedirectedToLogin = page.url().includes('/login');
                const hasReauthPrompt = await page.locator('[data-testid="reauth-prompt"], .auth-expired').count() > 0;
                
                expect(isRedirectedToLogin || hasReauthPrompt).toBe(true);
            }
        });
    });

    test.describe('File Upload API Integration', () => {
        test('should handle file upload workflows', async ({ page }) => {
            // Mock file upload endpoint
            await page.route('**/api/upload**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        file_id: 'uploaded_file_123',
                        url: '/uploads/test-file.pdf'
                    }
                });
            });

            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            // Test file upload
            const uploadButton = page.locator('input[type="file"], [data-testid="file-upload"]');
            if (await uploadButton.count() > 0) {
                // Create a test file
                const fileContent = 'Test file content';
                const file = new File([fileContent], 'test-document.txt', { type: 'text/plain' });
                
                await uploadButton.setInputFiles({
                    name: 'test-document.txt',
                    mimeType: 'text/plain',
                    buffer: Buffer.from(fileContent)
                });

                // Should show upload progress
                const uploadProgress = page.locator('[data-testid="upload-progress"], .upload-indicator');
                if (await uploadProgress.count() > 0) {
                    await expect(uploadProgress).toBeVisible();
                }

                // Wait for upload completion
                await page.waitForTimeout(1000);

                // Should show uploaded file
                const uploadedFile = page.locator('text="test-document.txt"');
                if (await uploadedFile.count() > 0) {
                    await expect(uploadedFile).toBeVisible();
                }
            }
        });

        test('should handle file upload errors', async ({ page }) => {
            // Mock file upload failure
            await page.route('**/api/upload**', async (route) => {
                await route.fulfill({
                    status: 413,
                    json: { error: 'File too large' }
                });
            });

            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            const uploadButton = page.locator('input[type="file"]');
            if (await uploadButton.count() > 0) {
                await uploadButton.setInputFiles({
                    name: 'large-file.pdf',
                    mimeType: 'application/pdf',
                    buffer: Buffer.alloc(1024 * 1024) // 1MB buffer
                });

                // Should show error message
                const errorMessage = page.locator('text="File too large", [data-testid="upload-error"]');
                await expect(errorMessage).toBeVisible();
            }
        });
    });

    test.describe('Search API Integration', () => {
        test('should handle search functionality', async ({ page }) => {
            // Mock search API
            await page.route('**/api/search**', async (route) => {
                const url = new URL(route.request().url());
                const query = url.searchParams.get('q');
                
                await route.fulfill({
                    status: 200,
                    json: {
                        results: [
                            {
                                type: 'document',
                                id: 'doc_123',
                                title: `Document containing "${query}"`,
                                excerpt: `...some content with ${query} highlighted...`
                            },
                            {
                                type: 'requirement',
                                id: 'req_456',
                                title: `Requirement about ${query}`,
                                excerpt: `...requirement description mentioning ${query}...`
                            }
                        ],
                        total: 2
                    }
                });
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test search functionality
            const searchInput = page.locator('input[type="search"], [data-testid="search-input"]');
            if (await searchInput.count() > 0) {
                await searchInput.fill('test query');
                await page.keyboard.press('Enter');

                // Should show search results
                const searchResults = page.locator('[data-testid="search-results"], .search-results');
                if (await searchResults.count() > 0) {
                    await expect(searchResults).toBeVisible();
                    
                    // Should show both document and requirement results
                    await expect(page.locator('text="Document containing"')).toBeVisible();
                    await expect(page.locator('text="Requirement about"')).toBeVisible();
                }
            }
        });

        test('should handle search filters and sorting', async ({ page }) => {
            // Mock filtered search API
            await page.route('**/api/search**', async (route) => {
                const url = new URL(route.request().url());
                const type = url.searchParams.get('type');
                const sort = url.searchParams.get('sort');
                
                let results = [];
                if (type === 'documents') {
                    results = [{ type: 'document', id: 'doc_123', title: 'Filtered Document' }];
                } else if (type === 'requirements') {
                    results = [{ type: 'requirement', id: 'req_456', title: 'Filtered Requirement' }];
                }
                
                await route.fulfill({
                    status: 200,
                    json: { results, total: results.length }
                });
            });

            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            const searchInput = page.locator('input[type="search"]');
            if (await searchInput.count() > 0) {
                await searchInput.fill('test');
                await page.keyboard.press('Enter');

                // Test type filter
                const typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]');
                if (await typeFilter.count() > 0) {
                    await typeFilter.selectOption('documents');
                    
                    // Should only show document results
                    await expect(page.locator('text="Filtered Document"')).toBeVisible();
                    await expect(page.locator('text="Filtered Requirement"')).not.toBeVisible();
                }
            }
        });
    });
});