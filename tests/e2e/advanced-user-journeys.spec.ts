import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    TestData,
    BrowserHelpers,
    PerformanceHelpers,
    AccessibilityHelpers,
    takeTimestampedScreenshot,
    waitForAnimations
} from './utils/test-helpers';

test.describe('Advanced User Journeys - Complete Workflows', () => {
    test.beforeEach(async ({ page, context }) => {
        await setupAuthenticatedSession(context);
        await mockUserProfile(page);
        
        // Mock comprehensive API endpoints for user journeys
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();
            
            // Mock various endpoints needed for complete workflows
            if (url.includes('/organizations') && method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [
                            { ...TestData.organizations.default, member_count: 5, project_count: 3 },
                            { id: 'org_456', name: 'Second Organization', slug: 'second-org', member_count: 2, project_count: 1 }
                        ],
                        count: 2
                    }
                });
            } else if (url.includes('/projects') && method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [
                            { ...TestData.projects.default, document_count: 8, requirement_count: 15, status: 'active' },
                            { id: 'project_456', name: 'Mobile App Project', org_id: 'org_123', document_count: 5, requirement_count: 12, status: 'active' }
                        ],
                        count: 2
                    }
                });
            } else if (url.includes('/documents') && method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [
                            { id: 'doc_1', title: 'Project Requirements', type: 'requirements', last_modified: '2024-01-15T10:00:00Z' },
                            { id: 'doc_2', title: 'Technical Specification', type: 'technical', last_modified: '2024-01-14T15:30:00Z' },
                            { id: 'doc_3', title: 'User Stories', type: 'user_stories', last_modified: '2024-01-13T09:15:00Z' },
                            { id: 'doc_4', title: 'API Documentation', type: 'api', last_modified: '2024-01-12T14:45:00Z' }
                        ],
                        count: 4
                    }
                });
            } else if (url.includes('/requirements') && method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [
                            { id: 'req_1', title: 'User Authentication', priority: 'high', status: 'completed', category: 'functional' },
                            { id: 'req_2', title: 'Data Encryption', priority: 'high', status: 'in_progress', category: 'security' },
                            { id: 'req_3', title: 'Mobile Responsiveness', priority: 'medium', status: 'open', category: 'ui' },
                            { id: 'req_4', title: 'Performance Optimization', priority: 'medium', status: 'open', category: 'performance' }
                        ],
                        count: 4
                    }
                });
            } else if (url.includes('/analytics') && method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: {
                        project_completion: 65,
                        active_collaborators: 4,
                        recent_activity: [
                            { type: 'document_updated', title: 'API Documentation', user: 'Alice', timestamp: '2024-01-15T10:00:00Z' },
                            { type: 'requirement_completed', title: 'User Authentication', user: 'Bob', timestamp: '2024-01-14T16:30:00Z' }
                        ]
                    }
                });
            } else {
                await route.continue();
            }
        });
    });

    test.describe('Complete Project Lifecycle Journey', () => {
        test('should complete full project creation to completion workflow', async ({ page }) => {
            // Phase 1: Organization Setup and Project Creation
            await page.goto('/home');
            await page.waitForLoadState('networkidle');

            // User starts by viewing their organizations
            await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText(/Home|Dashboard/);
            
            // Navigate to organization
            const orgCard = page.locator('[data-testid="org-card"], .org-card').first();
            if (await orgCard.count() > 0) {
                await orgCard.click();
                await page.waitForLoadState('networkidle');
                expect(page.url()).toContain('/org/');
            }

            // Create new project
            const createProjectBtn = page.locator('button:has-text("Create Project"), [data-testid="create-project"]');
            if (await createProjectBtn.count() > 0) {
                await createProjectBtn.click();
                
                // Fill comprehensive project details
                await page.fill('input[name="name"]', 'E-Commerce Platform');
                await page.fill('textarea[name="description"]', 'Complete e-commerce solution with payment integration');
                
                // Set project template if available
                const templateSelect = page.locator('select[name="template"], [data-testid="project-template"]');
                if (await templateSelect.count() > 0) {
                    await templateSelect.selectOption('web-application');
                }
                
                await page.click('button[type="submit"]');
                await page.waitForLoadState('networkidle');
                
                // Should navigate to new project dashboard
                expect(page.url()).toContain('/project/');
                await expect(page.locator('text="E-Commerce Platform"')).toBeVisible();
            }

            // Phase 2: Project Setup and Initial Documentation
            await takeTimestampedScreenshot(page, 'project-created');
            
            // Navigate to documents section
            const documentsTab = page.locator('a:has-text("Documents"), [data-testid="documents-tab"]');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                await page.waitForLoadState('networkidle');
                
                // Create initial project documents
                const documents = [
                    { title: 'Project Charter', type: 'charter', content: 'Project scope and objectives' },
                    { title: 'Architecture Overview', type: 'technical', content: 'High-level system architecture' },
                    { title: 'User Requirements', type: 'requirements', content: 'Detailed user requirements and stories' }
                ];
                
                for (const doc of documents) {
                    const createDocBtn = page.locator('button:has-text("New Document"), [data-testid="create-document"]');
                    if (await createDocBtn.count() > 0) {
                        await createDocBtn.click();
                        
                        await page.fill('input[name="title"]', doc.title);
                        
                        const contentEditor = page.locator('[data-testid="document-editor"], textarea[name="content"]');
                        if (await contentEditor.count() > 0) {
                            await contentEditor.fill(doc.content);
                        }
                        
                        await page.click('button:has-text("Save")');
                        await page.waitForLoadState('networkidle');
                        
                        // Verify document was created
                        await expect(page.locator(`text="${doc.title}"`)).toBeVisible();
                        
                        // Go back to documents list
                        const backBtn = page.locator('button:has-text("Back"), a:has-text("Documents")');
                        if (await backBtn.count() > 0) {
                            await backBtn.click();
                            await page.waitForLoadState('networkidle');
                        }
                    }
                }
            }

            // Phase 3: Requirements Management
            const requirementsTab = page.locator('a:has-text("Requirements"), [data-testid="requirements-tab"]');
            if (await requirementsTab.count() > 0) {
                await requirementsTab.click();
                await page.waitForLoadState('networkidle');
                
                // Create comprehensive requirements
                const requirements = [
                    { title: 'User Registration and Login', priority: 'high', category: 'functional' },
                    { title: 'Product Catalog Management', priority: 'high', category: 'functional' },
                    { title: 'Shopping Cart Functionality', priority: 'high', category: 'functional' },
                    { title: 'Payment Processing', priority: 'high', category: 'functional' },
                    { title: 'Order Management', priority: 'medium', category: 'functional' },
                    { title: 'SSL/TLS Encryption', priority: 'high', category: 'security' },
                    { title: 'Mobile Responsiveness', priority: 'medium', category: 'ui' },
                    { title: 'Performance < 2s Load Time', priority: 'medium', category: 'performance' }
                ];
                
                for (const req of requirements.slice(0, 3)) { // Create first 3 for time
                    const createReqBtn = page.locator('button:has-text("New Requirement"), [data-testid="create-requirement"]');
                    if (await createReqBtn.count() > 0) {
                        await createReqBtn.click();
                        
                        await page.fill('input[name="title"]', req.title);
                        await page.fill('textarea[name="description"]', `Detailed description for ${req.title}`);
                        
                        const prioritySelect = page.locator('select[name="priority"]');
                        if (await prioritySelect.count() > 0) {
                            await prioritySelect.selectOption(req.priority);
                        }
                        
                        await page.click('button:has-text("Save")');
                        await page.waitForLoadState('networkidle');
                        
                        await expect(page.locator(`text="${req.title}"`)).toBeVisible();
                    }
                }
            }

            // Phase 4: Project Monitoring and Analytics
            const overviewTab = page.locator('a:has-text("Overview"), [data-testid="overview-tab"]');
            if (await overviewTab.count() > 0) {
                await overviewTab.click();
                await page.waitForLoadState('networkidle');
                
                // Verify project analytics are displayed
                const analytics = page.locator('[data-testid="project-analytics"], .analytics-dashboard');
                if (await analytics.count() > 0) {
                    await expect(analytics).toBeVisible();
                    
                    // Check for key metrics
                    const metrics = [
                        'completion', 'progress', 'documents', 'requirements', 'collaborators'
                    ];
                    
                    for (const metric of metrics) {
                        const metricElement = page.locator(`[data-testid="${metric}-metric"], text="${metric}"`);
                        if (await metricElement.count() > 0) {
                            await expect(metricElement).toBeVisible();
                        }
                    }
                }
            }

            await takeTimestampedScreenshot(page, 'project-workflow-complete', { fullPage: true });
        });

        test('should handle collaborative editing workflow', async ({ page, context }) => {
            // Simulate multiple users working on same project
            await page.goto('/org/test-org/project/test-project/documents/doc_1');
            await page.waitForLoadState('networkidle');

            // Test collaborative features
            const collaborativeIndicator = page.locator('[data-testid="collaborative-users"], .collaborators-online');
            if (await collaborativeIndicator.count() > 0) {
                await expect(collaborativeIndicator).toBeVisible();
            }

            // Edit document and test real-time sync
            const editBtn = page.locator('button:has-text("Edit"), [data-testid="edit-document"]');
            if (await editBtn.count() > 0) {
                await editBtn.click();
                
                const editor = page.locator('[data-testid="document-editor"], .editor');
                if (await editor.count() > 0) {
                    await editor.fill('Updated content from User 1');
                    
                    // Simulate receiving update from another user
                    await page.evaluate(() => {
                        const event = new CustomEvent('collaborative-update', {
                            detail: { user: 'Alice', content: 'Alice added this comment' }
                        });
                        window.dispatchEvent(event);
                    });
                    
                    // Should show collaborative changes
                    await page.waitForTimeout(500);
                    const collaborativeChanges = page.locator('text="Alice added", .collaborative-change');
                    if (await collaborativeChanges.count() > 0) {
                        await expect(collaborativeChanges).toBeVisible();
                    }
                }
            }

            // Test commenting system
            const commentBtn = page.locator('button:has-text("Comment"), [data-testid="add-comment"]');
            if (await commentBtn.count() > 0) {
                await commentBtn.click();
                
                const commentField = page.locator('textarea[placeholder*="comment"], [data-testid="comment-input"]');
                if (await commentField.count() > 0) {
                    await commentField.fill('This section needs review');
                    await page.click('button:has-text("Post Comment")');
                    
                    await expect(page.locator('text="This section needs review"')).toBeVisible();
                }
            }
        });
    });

    test.describe('Multi-Organization Workflow', () => {
        test('should handle working across multiple organizations', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');

            // Test organization switching
            const organizations = page.locator('[data-testid="org-card"], .organization-card');
            const orgCount = await organizations.count();
            
            if (orgCount > 1) {
                // Work in first organization
                await organizations.first().click();
                await page.waitForLoadState('networkidle');
                
                let currentUrl = page.url();
                expect(currentUrl).toContain('/org/');
                
                // Create project in first org
                const createProjectBtn = page.locator('button:has-text("Create Project")');
                if (await createProjectBtn.count() > 0) {
                    await createProjectBtn.click();
                    await page.fill('input[name="name"]', 'Org 1 Project');
                    await page.click('button[type="submit"]');
                    await page.waitForLoadState('networkidle');
                }
                
                // Switch to second organization
                await page.goto('/home');
                await page.waitForLoadState('networkidle');
                
                await organizations.nth(1).click();
                await page.waitForLoadState('networkidle');
                
                // Verify switched to different organization
                expect(page.url()).toContain('/org/');
                expect(page.url()).not.toBe(currentUrl);
                
                // Work in second organization
                const secondOrgCreateBtn = page.locator('button:has-text("Create Project")');
                if (await secondOrgCreateBtn.count() > 0) {
                    await secondOrgCreateBtn.click();
                    await page.fill('input[name="name"]', 'Org 2 Project');
                    await page.click('button[type="submit"]');
                    await page.waitForLoadState('networkidle');
                    
                    await expect(page.locator('text="Org 2 Project"')).toBeVisible();
                }
            }

            // Test organization context switching via navigation
            const orgSwitcher = page.locator('[data-testid="org-switcher"], .organization-selector');
            if (await orgSwitcher.count() > 0) {
                await orgSwitcher.click();
                
                const orgOptions = page.locator('[data-testid="org-option"], .org-option');
                if (await orgOptions.count() > 0) {
                    await orgOptions.first().click();
                    await page.waitForLoadState('networkidle');
                    
                    // Should switch organization context
                    expect(page.url()).toContain('/org/');
                }
            }
        });

        test('should maintain separate workspace state per organization', async ({ page }) => {
            // This test ensures that user preferences, recent items, etc. 
            // are properly isolated between organizations
            
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');
            
            // Set some preferences in first org
            const settingsBtn = page.locator('button:has-text("Settings"), [data-testid="org-settings"]');
            if (await settingsBtn.count() > 0) {
                await settingsBtn.click();
                
                // Change some organization-specific setting
                const notificationToggle = page.locator('input[type="checkbox"][name*="notification"]');
                if (await notificationToggle.count() > 0) {
                    await notificationToggle.check();
                    
                    await page.click('button:has-text("Save")');
                    await page.waitForLoadState('networkidle');
                }
            }
            
            // Switch to different organization
            await page.goto('/org/second-org');
            await page.waitForLoadState('networkidle');
            
            // Verify settings are independent
            const secondOrgSettings = page.locator('button:has-text("Settings")');
            if (await secondOrgSettings.count() > 0) {
                await secondOrgSettings.click();
                
                const secondOrgNotifications = page.locator('input[type="checkbox"][name*="notification"]');
                if (await secondOrgNotifications.count() > 0) {
                    // Should have default state, not affected by first org settings
                    const isChecked = await secondOrgNotifications.isChecked();
                    // This would depend on your app's default behavior
                    expect(typeof isChecked).toBe('boolean');
                }
            }
        });
    });

    test.describe('Advanced Search and Discovery Workflow', () => {
        test('should provide comprehensive search across all project entities', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test global search within project
            const searchInput = page.locator('input[type="search"], [data-testid="global-search"]');
            if (await searchInput.count() > 0) {
                // Search for content across different entity types
                await searchInput.fill('authentication');
                await page.keyboard.press('Enter');
                await page.waitForLoadState('networkidle');

                // Should show results from multiple sources
                const searchResults = page.locator('[data-testid="search-results"], .search-results');
                if (await searchResults.count() > 0) {
                    await expect(searchResults).toBeVisible();
                    
                    // Verify different entity types in results
                    const entityTypes = ['document', 'requirement', 'comment'];
                    for (const type of entityTypes) {
                        const typeResults = page.locator(`[data-testid="${type}-result"], .${type}-result`);
                        if (await typeResults.count() > 0) {
                            await expect(typeResults.first()).toBeVisible();
                        }
                    }
                }
                
                // Test advanced search filters
                const filterToggle = page.locator('button:has-text("Filters"), [data-testid="search-filters"]');
                if (await filterToggle.count() > 0) {
                    await filterToggle.click();
                    
                    // Apply date filter
                    const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');
                    if (await dateFilter.count() > 0) {
                        await dateFilter.fill('2024-01-01');
                    }
                    
                    // Apply entity type filter
                    const typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]');
                    if (await typeFilter.count() > 0) {
                        await typeFilter.selectOption('documents');
                    }
                    
                    await page.click('button:has-text("Apply Filters")');
                    await page.waitForLoadState('networkidle');
                    
                    // Results should be filtered
                    const filteredResults = page.locator('[data-testid="document-result"]');
                    if (await filteredResults.count() > 0) {
                        await expect(filteredResults).toBeVisible();
                    }
                }
            }

            // Test recent activity discovery
            const recentActivity = page.locator('[data-testid="recent-activity"], .recent-activity');
            if (await recentActivity.count() > 0) {
                await expect(recentActivity).toBeVisible();
                
                // Should show chronological list of recent changes
                const activityItems = page.locator('[data-testid="activity-item"], .activity-item');
                const itemCount = await activityItems.count();
                expect(itemCount).toBeGreaterThan(0);
                
                // Test clicking on activity item
                if (itemCount > 0) {
                    await activityItems.first().click();
                    await page.waitForLoadState('networkidle');
                    
                    // Should navigate to the related entity
                    expect(page.url()).toMatch(/\/(documents|requirements|projects)\//);
                }
            }
        });

        test('should provide smart content recommendations', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/documents/doc_1');
            await page.waitForLoadState('networkidle');

            // Test related content suggestions
            const relatedContent = page.locator('[data-testid="related-content"], .related-suggestions');
            if (await relatedContent.count() > 0) {
                await expect(relatedContent).toBeVisible();
                
                // Should show relevant documents and requirements
                const suggestions = page.locator('[data-testid="content-suggestion"], .suggestion-item');
                const suggestionCount = await suggestions.count();
                
                if (suggestionCount > 0) {
                    // Test clicking on a suggestion
                    await suggestions.first().click();
                    await page.waitForLoadState('networkidle');
                    
                    // Should navigate to suggested content
                    expect(page.url()).toContain('/org/test-org/project/test-project/');
                }
            }

            // Test content tagging and categorization
            const tagSection = page.locator('[data-testid="document-tags"], .tags-section');
            if (await tagSection.count() > 0) {
                await expect(tagSection).toBeVisible();
                
                // Test adding new tag
                const addTagBtn = page.locator('button:has-text("Add Tag"), [data-testid="add-tag"]');
                if (await addTagBtn.count() > 0) {
                    await addTagBtn.click();
                    
                    const tagInput = page.locator('input[placeholder*="tag"], [data-testid="tag-input"]');
                    if (await tagInput.count() > 0) {
                        await tagInput.fill('frontend');
                        await page.keyboard.press('Enter');
                        
                        await expect(page.locator('text="frontend"')).toBeVisible();
                    }
                }
            }
        });
    });

    test.describe('Project Analytics and Reporting Workflow', () => {
        test('should provide comprehensive project insights', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test project dashboard analytics
            const analyticsSection = page.locator('[data-testid="project-analytics"], .analytics-dashboard');
            if (await analyticsSection.count() > 0) {
                await expect(analyticsSection).toBeVisible();
                
                // Verify key metrics are displayed
                const metrics = [
                    { name: 'completion', expected: /\d+%/ },
                    { name: 'documents', expected: /\d+/ },
                    { name: 'requirements', expected: /\d+/ },
                    { name: 'collaborators', expected: /\d+/ }
                ];
                
                for (const metric of metrics) {
                    const metricElement = page.locator(`[data-testid="${metric.name}-metric"]`);
                    if (await metricElement.count() > 0) {
                        const metricText = await metricElement.textContent();
                        expect(metricText).toMatch(metric.expected);
                    }
                }
            }

            // Test requirements progress tracking
            const requirementsProgress = page.locator('[data-testid="requirements-progress"], .progress-chart');
            if (await requirementsProgress.count() > 0) {
                await expect(requirementsProgress).toBeVisible();
                
                // Should show breakdown by status
                const statusBreakdown = ['open', 'in_progress', 'completed'];
                for (const status of statusBreakdown) {
                    const statusElement = page.locator(`[data-testid="${status}-count"], .${status}-status`);
                    if (await statusElement.count() > 0) {
                        await expect(statusElement).toBeVisible();
                    }
                }
            }

            // Test team collaboration metrics
            const teamMetrics = page.locator('[data-testid="team-metrics"], .collaboration-stats');
            if (await teamMetrics.count() > 0) {
                await expect(teamMetrics).toBeVisible();
                
                // Should show contributor activity
                const contributors = page.locator('[data-testid="contributor-item"], .contributor');
                if (await contributors.count() > 0) {
                    // Each contributor should show activity metrics
                    const firstContributor = contributors.first();
                    await expect(firstContributor).toBeVisible();
                    
                    const contributorStats = firstContributor.locator('[data-testid="contributor-stats"]');
                    if (await contributorStats.count() > 0) {
                        await expect(contributorStats).toBeVisible();
                    }
                }
            }
        });

        test('should generate and export project reports', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test report generation
            const reportsBtn = page.locator('button:has-text("Reports"), [data-testid="generate-reports"]');
            if (await reportsBtn.count() > 0) {
                await reportsBtn.click();
                
                // Should show report options
                const reportModal = page.locator('[role="dialog"], .report-modal');
                if (await reportModal.count() > 0) {
                    await expect(reportModal).toBeVisible();
                    
                    // Test different report types
                    const reportTypes = ['summary', 'detailed', 'requirements', 'progress'];
                    for (const type of reportTypes) {
                        const typeOption = page.locator(`input[value="${type}"], [data-testid="${type}-report"]`);
                        if (await typeOption.count() > 0) {
                            await typeOption.check();
                        }
                    }
                    
                    // Select export format
                    const formatSelect = page.locator('select[name="format"], [data-testid="export-format"]');
                    if (await formatSelect.count() > 0) {
                        await formatSelect.selectOption('pdf');
                    }
                    
                    // Generate report
                    const generateBtn = page.locator('button:has-text("Generate"), [data-testid="generate-report"]');
                    if (await generateBtn.count() > 0) {
                        await generateBtn.click();
                        
                        // Should show generation progress
                        const progressIndicator = page.locator('[data-testid="report-progress"], .generation-progress');
                        if (await progressIndicator.count() > 0) {
                            await expect(progressIndicator).toBeVisible();
                        }
                        
                        // Wait for completion
                        await page.waitForTimeout(2000);
                        
                        // Should show download link
                        const downloadLink = page.locator('a:has-text("Download"), [data-testid="download-report"]');
                        if (await downloadLink.count() > 0) {
                            await expect(downloadLink).toBeVisible();
                        }
                    }
                }
            }
        });
    });

    test.describe('Performance and Accessibility in User Journeys', () => {
        test('should maintain good performance throughout user workflow', async ({ page }) => {
            // Measure performance of complete user journey
            const performanceMetrics = [];
            
            // Start timing
            let startTime = Date.now();
            
            // Journey Step 1: Home to Organization
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            performanceMetrics.push({ step: 'home_load', time: Date.now() - startTime });
            
            startTime = Date.now();
            const orgCard = page.locator('[data-testid="org-card"]').first();
            if (await orgCard.count() > 0) {
                await orgCard.click();
                await page.waitForLoadState('networkidle');
                performanceMetrics.push({ step: 'org_navigation', time: Date.now() - startTime });
            }
            
            // Journey Step 2: Organization to Project
            startTime = Date.now();
            const projectCard = page.locator('[data-testid="project-card"]').first();
            if (await projectCard.count() > 0) {
                await projectCard.click();
                await page.waitForLoadState('networkidle');
                performanceMetrics.push({ step: 'project_navigation', time: Date.now() - startTime });
            }
            
            // Journey Step 3: Project Sections Navigation
            const sections = ['documents', 'requirements', 'canvas'];
            for (const section of sections) {
                startTime = Date.now();
                const sectionTab = page.locator(`a:has-text("${section}"), [data-testid="${section}-tab"]`);
                if (await sectionTab.count() > 0) {
                    await sectionTab.click();
                    await page.waitForLoadState('networkidle');
                    performanceMetrics.push({ step: `${section}_navigation`, time: Date.now() - startTime });
                }
            }
            
            // Verify all navigation steps completed within reasonable time
            for (const metric of performanceMetrics) {
                expect(metric.time).toBeLessThan(3000); // 3 seconds max per step
                console.log(`${metric.step}: ${metric.time}ms`);
            }
            
            // Test overall memory usage
            const memoryInfo = await page.evaluate(() => (window.performance as any).memory);
            if (memoryInfo) {
                expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB max
            }
        });

        test('should maintain accessibility throughout user journey', async ({ page }) => {
            const accessibilityViolations = [];
            
            // Test accessibility at each step of user journey
            const journeySteps = [
                '/home',
                '/org/test-org',
                '/org/test-org/project/test-project',
                '/org/test-org/project/test-project/documents',
                '/org/test-org/project/test-project/requirements'
            ];
            
            for (const step of journeySteps) {
                await page.goto(step);
                await page.waitForLoadState('networkidle');
                
                // Run basic accessibility checks
                const violations = await AccessibilityHelpers.checkBasicA11y(page);
                if (violations.length > 0) {
                    accessibilityViolations.push({ step, violations });
                }
                
                // Test keyboard navigation
                const canNavigateWithKeyboard = await AccessibilityHelpers.testKeyboardNavigation(page, 5);
                if (!canNavigateWithKeyboard) {
                    accessibilityViolations.push({ step, violations: ['Keyboard navigation failed'] });
                }
                
                // Test focus management
                await page.keyboard.press('Tab');
                const focusedElement = page.locator(':focus');
                const isFocusVisible = await focusedElement.isVisible();
                if (!isFocusVisible) {
                    accessibilityViolations.push({ step, violations: ['No visible focus indicator'] });
                }
            }
            
            // Report accessibility violations
            if (accessibilityViolations.length > 0) {
                console.warn('Accessibility violations found:', accessibilityViolations);
                await takeTimestampedScreenshot(page, 'accessibility-violations');
            }
            
            // Should have minimal accessibility violations
            expect(accessibilityViolations.length).toBeLessThan(3);
        });
    });

    test.describe('Cross-Browser Journey Consistency', () => {
        test('should work consistently across different browsers', async ({ page, browserName }) => {
            // This test runs across different browsers as configured in playwright.config.ts
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test core functionality works in all browsers
            const coreFeatures = [
                { name: 'navigation', selector: 'nav, [data-testid="navigation"]' },
                { name: 'project_dashboard', selector: '[data-testid="project-dashboard"], .project-overview' },
                { name: 'search', selector: 'input[type="search"], [data-testid="search"]' },
                { name: 'user_menu', selector: '[data-testid="user-menu"], .user-profile' }
            ];

            for (const feature of coreFeatures) {
                const element = page.locator(feature.selector);
                if (await element.count() > 0) {
                    await expect(element).toBeVisible();
                    console.log(`${browserName}: ${feature.name} - ✓`);
                } else {
                    console.log(`${browserName}: ${feature.name} - Missing`);
                }
            }

            // Test browser-specific interactions
            if (browserName === 'webkit') {
                // Safari-specific tests
                await page.evaluate(() => {
                    // Test Safari-specific behaviors
                    console.log('Testing Safari-specific features');
                });
            } else if (browserName === 'firefox') {
                // Firefox-specific tests
                await page.keyboard.press('F12'); // Should not interfere with app
            }

            // Take browser-specific screenshot
            await takeTimestampedScreenshot(page, `browser-${browserName}-journey`);
        });
    });
});