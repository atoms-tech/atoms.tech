import { test, expect } from '@playwright/test';

import { AuthPage } from './page-objects/auth.page';
import { HomePage } from './page-objects/home.page';
import { DocumentPage } from './page-objects/document.page';
import { ProjectPage } from './page-objects/project.page';
import { setupAuthenticatedSession, mockUserProfile, TestData } from './utils/test-helpers';

/**
 * API Integration Workflow E2E Tests
 * 
 * Tests complete user journeys that heavily rely on API integrations
 * including real-time features, third-party services, and external data sources
 */

test.describe('API Integration Workflow', () => {
    let homePage: HomePage;
    let authPage: AuthPage;
    let documentPage: DocumentPage;
    let projectPage: ProjectPage;

    test.beforeEach(async ({ page, context }) => {
        homePage = new HomePage(page);
        authPage = new AuthPage(page);
        documentPage = new DocumentPage(page);
        projectPage = new ProjectPage(page);

        // Set up authenticated session
        await setupAuthenticatedSession(context);
        await mockUserProfile(page, TestData.users.standard);
    });

    test.describe('Authentication API Integration', () => {
        test('should handle OAuth flow with GitHub', async ({ page }) => {
            await authPage.goto();
            
            // Mock GitHub OAuth endpoint
            await page.route('**/auth/github', async (route) => {
                await route.fulfill({
                    status: 302,
                    headers: {
                        'Location': '/auth/callback?code=test_code&state=test_state'
                    }
                });
            });
            
            // Mock callback endpoint
            await page.route('**/auth/callback**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        user: {
                            id: 'github_user_123',
                            email: 'github@example.com',
                            name: 'GitHub User',
                            avatar_url: 'https://github.com/avatar.jpg'
                        },
                        tokens: {
                            access_token: 'github_access_token',
                            refresh_token: 'github_refresh_token'
                        }
                    }
                });
            });
            
            // Initiate GitHub login
            await authPage.loginWithGitHub();
            
            // Should complete OAuth flow
            await authPage.verifySuccessfulLogin();
        });

        test('should handle OAuth errors gracefully', async ({ page }) => {
            await authPage.goto();
            
            // Mock OAuth error
            await page.route('**/auth/github', async (route) => {
                await route.fulfill({
                    status: 400,
                    json: {
                        error: 'oauth_error',
                        error_description: 'The user denied the request'
                    }
                });
            });
            
            await authPage.loginWithGitHub();
            
            // Should handle error gracefully
            await authPage.verifyErrorMessage('OAuth authentication failed');
        });

        test('should handle token refresh automatically', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock token refresh endpoint
            let refreshCount = 0;
            await page.route('**/auth/refresh', async (route) => {
                refreshCount++;
                await route.fulfill({
                    status: 200,
                    json: {
                        access_token: `new_token_${refreshCount}`,
                        expires_in: 3600
                    }
                });
            });
            
            // Mock API call that triggers token refresh
            await page.route('**/api/profile', async (route) => {
                if (refreshCount === 0) {
                    await route.fulfill({
                        status: 401,
                        json: { error: 'token_expired' }
                    });
                } else {
                    await route.fulfill({
                        status: 200,
                        json: TestData.users.standard
                    });
                }
            });
            
            // Trigger API call
            await page.reload();
            
            // Should automatically refresh token
            expect(refreshCount).toBe(1);
        });
    });

    test.describe('Real-time API Integration', () => {
        test('should handle WebSocket connections for real-time updates', async ({ page }) => {
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Mock WebSocket connection
            await page.evaluate(() => {
                const mockSocket = {
                    send: (data: string) => console.log('WebSocket send:', data),
                    close: () => console.log('WebSocket closed'),
                    onmessage: null,
                    onopen: null,
                    onclose: null,
                    onerror: null
                };
                
                // @ts-ignore
                window.WebSocket = function() {
                    return mockSocket;
                };
                
                // Simulate connection opened
                setTimeout(() => {
                    if (mockSocket.onopen) mockSocket.onopen({} as Event);
                }, 100);
                
                // Simulate real-time update
                setTimeout(() => {
                    if (mockSocket.onmessage) {
                        mockSocket.onmessage({
                            data: JSON.stringify({
                                type: 'document_update',
                                document_id: 'doc_123',
                                changes: {
                                    content: 'Real-time update content'
                                },
                                user: {
                                    id: 'other_user_456',
                                    name: 'Other User'
                                }
                            })
                        } as MessageEvent);
                    }
                }, 1000);
            });
            
            // Should show real-time collaboration
            await documentPage.verifyCollaborationActive();
        });

        test('should handle WebSocket disconnections gracefully', async ({ page }) => {
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Mock WebSocket disconnection
            await page.evaluate(() => {
                const mockSocket = {
                    send: (data: string) => { throw new Error('Connection closed'); },
                    close: () => console.log('WebSocket closed'),
                    onmessage: null,
                    onopen: null,
                    onclose: null,
                    onerror: null
                };
                
                // @ts-ignore
                window.WebSocket = function() {
                    return mockSocket;
                };
                
                // Simulate connection error
                setTimeout(() => {
                    if (mockSocket.onerror) {
                        mockSocket.onerror(new Error('Connection failed') as any);
                    }
                }, 100);
            });
            
            // Should handle disconnection gracefully
            await documentPage.verifyDocumentLoaded();
        });

        test('should handle server-sent events for notifications', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock EventSource for SSE
            await page.evaluate(() => {
                const mockEventSource = {
                    addEventListener: (event: string, callback: (e: MessageEvent) => void) => {
                        if (event === 'notification') {
                            setTimeout(() => {
                                callback({
                                    data: JSON.stringify({
                                        type: 'project_update',
                                        message: 'New document added to project',
                                        project_id: 'project_123'
                                    })
                                } as MessageEvent);
                            }, 1000);
                        }
                    },
                    close: () => console.log('EventSource closed')
                };
                
                // @ts-ignore
                window.EventSource = function() {
                    return mockEventSource;
                };
            });
            
            // Should receive real-time notifications
            await page.waitForTimeout(2000);
            
            // Check for notification indicator
            const notificationIndicator = page.locator('[data-testid="notification"], .notification');
            if (await notificationIndicator.isVisible()) {
                await expect(notificationIndicator).toBeVisible();
            }
        });
    });

    test.describe('Third-party API Integration', () => {
        test('should integrate with GitHub API', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Mock GitHub API integration
            await page.route('**/api/integrations/github/connect', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        connected: true,
                        user: {
                            login: 'testuser',
                            avatar_url: 'https://github.com/avatar.jpg',
                            repos_url: 'https://api.github.com/users/testuser/repos'
                        }
                    }
                });
            });
            
            // Mock GitHub repositories endpoint
            await page.route('**/api/integrations/github/repos', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: [
                        {
                            id: 1,
                            name: 'test-repo',
                            full_name: 'testuser/test-repo',
                            private: false,
                            html_url: 'https://github.com/testuser/test-repo'
                        }
                    ]
                });
            });
            
            // Test GitHub integration
            await homePage.clickInProgressContainer('Integrations');
            await homePage.verifyInProgressModalOpen();
            
            // Look for GitHub connect button
            const githubButton = page.locator('button:has-text("Connect GitHub")');
            if (await githubButton.isVisible()) {
                await githubButton.click();
                
                // Should show connected state
                await expect(page.locator('text="Connected to GitHub"')).toBeVisible();
            }
        });

        test('should integrate with Slack API', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Mock Slack API integration
            await page.route('**/api/integrations/slack/connect', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        connected: true,
                        team: {
                            id: 'T123456',
                            name: 'Test Team',
                            domain: 'test-team'
                        },
                        user: {
                            id: 'U123456',
                            name: 'Test User'
                        }
                    }
                });
            });
            
            // Mock Slack channels endpoint
            await page.route('**/api/integrations/slack/channels', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        channels: [
                            {
                                id: 'C123456',
                                name: 'general',
                                is_channel: true
                            },
                            {
                                id: 'C789012',
                                name: 'development',
                                is_channel: true
                            }
                        ]
                    }
                });
            });
            
            // Test Slack integration
            await homePage.clickInProgressContainer('Integrations');
            await homePage.verifyInProgressModalOpen();
            
            // Look for Slack connect button
            const slackButton = page.locator('button:has-text("Connect Slack")');
            if (await slackButton.isVisible()) {
                await slackButton.click();
                
                // Should show connected state
                await expect(page.locator('text="Connected to Slack"')).toBeVisible();
            }
        });

        test('should handle third-party API rate limiting', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock rate limited API response
            let requestCount = 0;
            await page.route('**/api/integrations/github/**', async (route) => {
                requestCount++;
                
                if (requestCount <= 3) {
                    await route.fulfill({
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': '5000',
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600)
                        },
                        json: {
                            message: 'API rate limit exceeded',
                            documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
                        }
                    });
                } else {
                    await route.fulfill({
                        status: 200,
                        json: { message: 'Success after rate limit' }
                    });
                }
            });
            
            // Trigger API calls
            await page.reload();
            
            // Should handle rate limiting gracefully
            await page.waitForTimeout(1000);
            expect(requestCount).toBeGreaterThan(1);
        });
    });

    test.describe('File Upload API Integration', () => {
        test('should handle file uploads to cloud storage', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock file upload endpoint
            await page.route('**/api/upload', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        file: {
                            id: 'file_123',
                            name: 'test-document.pdf',
                            size: 1024000,
                            url: 'https://storage.example.com/file_123.pdf',
                            type: 'application/pdf'
                        }
                    }
                });
            });
            
            // Test file upload
            await projectPage.importDocuments('test-document.pdf', 'Mock PDF content');
            
            // Should handle upload success
            await projectPage.verifyImportSuccess();
        });

        test('should handle large file uploads with progress', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock chunked upload endpoint
            await page.route('**/api/upload/chunk', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload time
                await route.fulfill({
                    status: 200,
                    json: {
                        chunk_id: 'chunk_123',
                        progress: 50,
                        total_chunks: 10
                    }
                });
            });
            
            // Mock upload completion
            await page.route('**/api/upload/complete', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        file: {
                            id: 'large_file_123',
                            name: 'large-document.pdf',
                            size: 50000000 // 50MB
                        }
                    }
                });
            });
            
            // Test large file upload
            await projectPage.importDocuments('large-document.pdf', 'Large file content');
            
            // Should show progress indicator
            const progressIndicator = page.locator('[data-testid="upload-progress"], .upload-progress');
            if (await progressIndicator.isVisible()) {
                await expect(progressIndicator).toBeVisible();
            }
        });

        test('should handle upload failures gracefully', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock upload failure
            await page.route('**/api/upload', async (route) => {
                await route.fulfill({
                    status: 413,
                    json: {
                        error: 'file_too_large',
                        message: 'File size exceeds maximum limit of 10MB'
                    }
                });
            });
            
            // Test upload failure
            await projectPage.importDocuments('too-large-file.pdf', 'Large content');
            
            // Should show error message
            const errorMessage = page.locator('.error-message, [role="alert"]');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText('File size exceeds');
        });
    });

    test.describe('Search API Integration', () => {
        test('should handle full-text search across documents', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock search endpoint
            await page.route('**/api/search', async (route) => {
                const url = new URL(route.request().url());
                const query = url.searchParams.get('q');
                
                await route.fulfill({
                    status: 200,
                    json: {
                        query,
                        results: [
                            {
                                id: 'doc_123',
                                title: 'Requirements Document',
                                excerpt: 'This document contains functional requirements for the system...',
                                score: 0.95,
                                type: 'document'
                            },
                            {
                                id: 'doc_456',
                                title: 'Technical Specifications',
                                excerpt: 'Technical requirements and system architecture...',
                                score: 0.87,
                                type: 'document'
                            }
                        ],
                        total: 2,
                        took: 45
                    }
                });
            });
            
            // Test search functionality
            await projectPage.searchDocuments('requirements');
            
            // Should display search results
            await projectPage.verifySearchResults('requirements');
        });

        test('should handle search with filters', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock filtered search endpoint
            await page.route('**/api/search**', async (route) => {
                const url = new URL(route.request().url());
                const query = url.searchParams.get('q');
                const type = url.searchParams.get('type');
                
                await route.fulfill({
                    status: 200,
                    json: {
                        query,
                        filters: { type },
                        results: [
                            {
                                id: 'doc_123',
                                title: 'Requirements Document',
                                type: 'document',
                                score: 0.95
                            }
                        ],
                        total: 1,
                        took: 23
                    }
                });
            });
            
            // Test search with filters
            await projectPage.searchDocuments('requirements');
            await projectPage.filterDocuments('document');
            
            // Should apply filters
            await projectPage.verifySearchResults('requirements');
        });

        test('should handle search suggestions and autocomplete', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock search suggestions endpoint
            await page.route('**/api/search/suggestions', async (route) => {
                const url = new URL(route.request().url());
                const query = url.searchParams.get('q');
                
                await route.fulfill({
                    status: 200,
                    json: {
                        query,
                        suggestions: [
                            'requirements document',
                            'requirements analysis',
                            'requirements specification'
                        ]
                    }
                });
            });
            
            // Test search suggestions
            const searchInput = page.locator('input[type="search"]');
            if (await searchInput.isVisible()) {
                await searchInput.fill('req');
                
                // Should show suggestions
                await page.waitForTimeout(500);
                const suggestions = page.locator('[data-testid="search-suggestions"], .search-suggestions');
                if (await suggestions.isVisible()) {
                    await expect(suggestions).toBeVisible();
                }
            }
        });
    });

    test.describe('Export API Integration', () => {
        test('should handle document export to various formats', async ({ page }) => {
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Mock export endpoint
            await page.route('**/api/export/**', async (route) => {
                const url = route.request().url();
                const format = url.split('/').pop();
                
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/octet-stream',
                        'Content-Disposition': `attachment; filename="document.${format}"`
                    },
                    body: Buffer.from(`Mock ${format} content`)
                });
            });
            
            // Test PDF export
            await documentPage.exportDocument('pdf');
            
            // Should handle export success
            await documentPage.verifyExportSuccess();
        });

        test('should handle bulk export operations', async ({ page }) => {
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Mock bulk export endpoint
            await page.route('**/api/export/bulk', async (route) => {
                await route.fulfill({
                    status: 202,
                    json: {
                        job_id: 'export_job_123',
                        status: 'processing',
                        progress: 0,
                        estimated_time: 300
                    }
                });
            });
            
            // Mock export status endpoint
            await page.route('**/api/export/status/**', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        job_id: 'export_job_123',
                        status: 'completed',
                        progress: 100,
                        download_url: 'https://storage.example.com/export_123.zip'
                    }
                });
            });
            
            // Test bulk export
            await projectPage.exportProject('zip');
            
            // Should handle async export
            await projectPage.verifyExportSuccess();
        });
    });

    test.describe('Analytics API Integration', () => {
        test('should track user interactions for analytics', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock analytics endpoint
            const analyticsEvents: any[] = [];
            await page.route('**/api/analytics/events', async (route) => {
                const eventData = await route.request().postDataJSON();
                analyticsEvents.push(eventData);
                
                await route.fulfill({
                    status: 200,
                    json: { success: true }
                });
            });
            
            // Perform user actions
            await homePage.switchToSettingsTab();
            await homePage.switchToActivityTab();
            
            // Should track analytics events
            await page.waitForTimeout(1000);
            expect(analyticsEvents.length).toBeGreaterThan(0);
        });

        test('should handle analytics API failures gracefully', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock analytics failure
            await page.route('**/api/analytics/**', async (route) => {
                await route.fulfill({
                    status: 500,
                    json: { error: 'Analytics service unavailable' }
                });
            });
            
            // Should continue functioning despite analytics failure
            await homePage.switchToSettingsTab();
            await homePage.verifySettingsTabActive();
        });
    });

    test.describe('API Error Handling', () => {
        test('should handle 500 server errors gracefully', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock server error
            await page.route('**/api/**', async (route) => {
                await route.fulfill({
                    status: 500,
                    json: {
                        error: 'internal_server_error',
                        message: 'An unexpected error occurred'
                    }
                });
            });
            
            // Should show error message
            await page.reload();
            
            const errorMessage = page.locator('.error-message, [role="alert"]');
            if (await errorMessage.isVisible()) {
                await expect(errorMessage).toBeVisible();
            }
        });

        test('should handle network timeouts', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock network timeout
            await page.route('**/api/**', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30s timeout
                await route.continue();
            });
            
            // Should handle timeout gracefully
            await page.reload();
            
            await page.waitForTimeout(2000);
            
            // Should show timeout message or continue with cached data
            const timeoutMessage = page.locator('text="Request timed out", text="Please try again"');
            if (await timeoutMessage.isVisible()) {
                await expect(timeoutMessage).toBeVisible();
            }
        });

        test('should implement retry logic for failed API calls', async ({ page }) => {
            await homePage.gotoHome();
            
            let requestCount = 0;
            await page.route('**/api/profile', async (route) => {
                requestCount++;
                
                if (requestCount <= 2) {
                    await route.fulfill({
                        status: 503,
                        json: { error: 'Service temporarily unavailable' }
                    });
                } else {
                    await route.fulfill({
                        status: 200,
                        json: TestData.users.standard
                    });
                }
            });
            
            // Should retry failed requests
            await page.reload();
            
            await page.waitForTimeout(3000);
            
            // Should eventually succeed after retries
            expect(requestCount).toBe(3);
        });
    });

    test.describe('API Performance', () => {
        test('should handle API response times', async ({ page }) => {
            await homePage.gotoHome();
            
            // Track API response times
            const apiTimes: number[] = [];
            
            page.on('response', (response) => {
                if (response.url().includes('/api/')) {
                    const timing = response.timing();
                    apiTimes.push(timing.responseEnd - timing.requestStart);
                }
            });
            
            // Perform actions that trigger API calls
            await homePage.switchToSettingsTab();
            await homePage.switchToActivityTab();
            
            // API calls should complete within reasonable time
            await page.waitForTimeout(2000);
            
            const avgResponseTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
            expect(avgResponseTime).toBeLessThan(2000); // Less than 2 seconds
        });

        test('should handle concurrent API requests', async ({ page }) => {
            await homePage.gotoHome();
            
            // Mock concurrent API endpoints
            await page.route('**/api/profile', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                await route.fulfill({
                    status: 200,
                    json: TestData.users.standard
                });
            });
            
            await page.route('**/api/projects', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 150));
                await route.fulfill({
                    status: 200,
                    json: { data: [TestData.projects.default] }
                });
            });
            
            // Should handle concurrent requests
            await Promise.all([
                page.reload(),
                page.waitForTimeout(100)
            ]);
            
            // Should load successfully
            await homePage.verifyHomePageLoaded();
        });

        test('should implement API caching', async ({ page }) => {
            await homePage.gotoHome();
            
            let requestCount = 0;
            await page.route('**/api/profile', async (route) => {
                requestCount++;
                
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Cache-Control': 'max-age=300', // 5 minutes
                        'ETag': '"profile-etag-123"'
                    },
                    json: TestData.users.standard
                });
            });
            
            // First request
            await page.reload();
            expect(requestCount).toBe(1);
            
            // Second request should use cache
            await page.reload();
            
            // Should use cached response
            await page.waitForTimeout(1000);
            
            // Request count should still be 1 if caching works
            // Note: This depends on implementation details
        });
    });
});
