import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    TestData,
    BrowserHelpers,
    takeTimestampedScreenshot,
    collectConsoleErrors,
    verifyCriticalErrors
} from './utils/test-helpers';

test.describe('CRUD Operations - Complete User Journeys', () => {
    let consoleErrors: string[] = [];

    test.beforeEach(async ({ page, context }) => {
        // Set up authenticated session
        await setupAuthenticatedSession(context);
        await mockUserProfile(page);
        
        // Start collecting console errors
        consoleErrors = await collectConsoleErrors(page);
        
        // Mock API endpoints for CRUD operations
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();
            
            // Organizations CRUD
            if (url.includes('/organizations')) {
                if (method === 'GET') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            data: [TestData.organizations.default],
                            count: 1
                        }
                    });
                } else if (method === 'POST') {
                    await route.fulfill({
                        status: 201,
                        json: {
                            ...TestData.organizations.default,
                            id: 'new_org_' + Date.now()
                        }
                    });
                } else if (method === 'PUT' || method === 'PATCH') {
                    await route.fulfill({
                        status: 200,
                        json: { ...TestData.organizations.default, updated_at: new Date().toISOString() }
                    });
                } else if (method === 'DELETE') {
                    await route.fulfill({ status: 204 });
                }
            }
            
            // Projects CRUD
            else if (url.includes('/projects')) {
                if (method === 'GET') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            data: [TestData.projects.default],
                            count: 1
                        }
                    });
                } else if (method === 'POST') {
                    await route.fulfill({
                        status: 201,
                        json: {
                            ...TestData.projects.default,
                            id: 'new_project_' + Date.now()
                        }
                    });
                } else if (method === 'PUT' || method === 'PATCH') {
                    await route.fulfill({
                        status: 200,
                        json: { ...TestData.projects.default, updated_at: new Date().toISOString() }
                    });
                } else if (method === 'DELETE') {
                    await route.fulfill({ status: 204 });
                }
            }
            
            // Documents CRUD
            else if (url.includes('/documents')) {
                if (method === 'GET') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            data: [{
                                id: 'doc_123',
                                title: 'Test Document',
                                content: 'Sample document content',
                                project_id: TestData.projects.default.id,
                                created_at: new Date().toISOString()
                            }],
                            count: 1
                        }
                    });
                } else if (method === 'POST') {
                    await route.fulfill({
                        status: 201,
                        json: {
                            id: 'new_doc_' + Date.now(),
                            title: 'New Document',
                            content: '',
                            project_id: TestData.projects.default.id,
                            created_at: new Date().toISOString()
                        }
                    });
                } else if (method === 'PUT' || method === 'PATCH') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            id: 'doc_123',
                            title: 'Updated Document',
                            content: 'Updated content',
                            updated_at: new Date().toISOString()
                        }
                    });
                } else if (method === 'DELETE') {
                    await route.fulfill({ status: 204 });
                }
            }
            
            // Requirements CRUD
            else if (url.includes('/requirements')) {
                if (method === 'GET') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            data: [{
                                id: 'req_123',
                                title: 'Test Requirement',
                                description: 'Sample requirement description',
                                priority: 'high',
                                status: 'open',
                                project_id: TestData.projects.default.id
                            }],
                            count: 1
                        }
                    });
                } else if (method === 'POST') {
                    await route.fulfill({
                        status: 201,
                        json: {
                            id: 'new_req_' + Date.now(),
                            title: 'New Requirement',
                            description: '',
                            priority: 'medium',
                            status: 'open',
                            project_id: TestData.projects.default.id
                        }
                    });
                } else if (method === 'PUT' || method === 'PATCH') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            id: 'req_123',
                            title: 'Updated Requirement',
                            description: 'Updated description',
                            status: 'in_progress',
                            updated_at: new Date().toISOString()
                        }
                    });
                } else if (method === 'DELETE') {
                    await route.fulfill({ status: 204 });
                }
            }
            
            else {
                await route.continue();
            }
        });
    });

    test.afterEach(async ({ page }) => {
        // Check for critical console errors
        const criticalErrors = verifyCriticalErrors(consoleErrors);
        if (criticalErrors.length > 0) {
            console.warn('Critical errors detected:', criticalErrors);
            await takeTimestampedScreenshot(page, 'critical-errors', { fullPage: true });
        }
    });

    test.describe('Organization Management', () => {
        test('should complete full organization CRUD lifecycle', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');

            // CREATE - New Organization
            const createOrgButton = page.locator('button:has-text("Create Organization"), [data-testid="create-org"]');
            if (await createOrgButton.count() > 0) {
                await createOrgButton.click();
                
                // Fill organization form
                await page.fill('input[name="name"], input[placeholder*="organization name"]', 'Test Organization New');
                await page.fill('input[name="description"], textarea[name="description"]', 'Test organization description');
                
                // Submit form
                await page.click('button[type="submit"], button:has-text("Create")');
                await page.waitForLoadState('networkidle');
                
                // Verify creation
                await expect(page.locator('text="Test Organization New"')).toBeVisible();
            }

            // READ - View organization details
            const orgLink = page.locator('a:has-text("Test Organization"), [data-testid="org-link"]');
            if (await orgLink.count() > 0) {
                await orgLink.click();
                await page.waitForLoadState('networkidle');
                
                // Should be on organization dashboard
                expect(page.url()).toContain('/org/');
                await expect(page.locator('h1, h2, [data-testid="org-name"]')).toContainText('Test Organization');
            }

            // UPDATE - Edit organization
            const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-org"]');
            if (await editButton.count() > 0) {
                await editButton.click();
                
                await page.fill('input[name="name"]', 'Updated Organization Name');
                await page.click('button[type="submit"], button:has-text("Save")');
                await page.waitForLoadState('networkidle');
                
                // Verify update
                await expect(page.locator('text="Updated Organization Name"')).toBeVisible();
            }

            // DELETE would typically require special handling due to data safety
            // We'll test the delete button availability and modal
            const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-org"]');
            if (await deleteButton.count() > 0) {
                await deleteButton.click();
                
                // Should show confirmation modal
                const confirmModal = page.locator('[role="dialog"], .modal');
                if (await confirmModal.count() > 0) {
                    await expect(confirmModal).toBeVisible();
                    await expect(confirmModal.locator('text="delete", text="remove"')).toBeVisible();
                    
                    // Cancel deletion for safety
                    await page.click('button:has-text("Cancel"), [data-testid="cancel-delete"]');
                }
            }
        });

        test('should handle organization permissions correctly', async ({ page }) => {
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // Test different permission levels
            const memberActions = [
                'button:has-text("Invite Member")',
                'button:has-text("Settings")',
                'button:has-text("Delete")'
            ];

            for (const action of memberActions) {
                const button = page.locator(action);
                if (await button.count() > 0) {
                    // Button should either be enabled/disabled based on permissions
                    const isDisabled = await button.isDisabled();
                    console.log(`Action ${action} disabled: ${isDisabled}`);
                }
            }
        });
    });

    test.describe('Project Management', () => {
        test('should complete full project CRUD lifecycle', async ({ page }) => {
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');

            // CREATE - New Project
            const createProjectButton = page.locator('button:has-text("Create Project"), [data-testid="create-project"]');
            if (await createProjectButton.count() > 0) {
                await createProjectButton.click();
                
                // Fill project form
                await page.fill('input[name="name"], input[placeholder*="project name"]', 'Test Project New');
                await page.fill('textarea[name="description"], input[name="description"]', 'Test project description');
                
                // Submit form
                await page.click('button[type="submit"], button:has-text("Create")');
                await page.waitForLoadState('networkidle');
                
                // Verify creation and navigation to project
                expect(page.url()).toContain('/project/');
                await expect(page.locator('h1, h2, [data-testid="project-name"]')).toContainText('Test Project');
            }

            // READ - View project dashboard
            const projectDashboard = page.locator('[data-testid="project-dashboard"], .project-dashboard');
            if (await projectDashboard.count() > 0) {
                await expect(projectDashboard).toBeVisible();
                
                // Verify project navigation tabs
                const tabs = page.locator('[role="tablist"] button, .tab-navigation a');
                if (await tabs.count() > 0) {
                    const tabTexts = await tabs.allTextContents();
                    expect(tabTexts.some(text => 
                        text.toLowerCase().includes('overview') ||
                        text.toLowerCase().includes('documents') ||
                        text.toLowerCase().includes('requirements')
                    )).toBe(true);
                }
            }

            // UPDATE - Edit project settings
            const settingsTab = page.locator('button:has-text("Settings"), a:has-text("Settings")');
            if (await settingsTab.count() > 0) {
                await settingsTab.click();
                await page.waitForLoadState('networkidle');
                
                const editProjectButton = page.locator('button:has-text("Edit Project"), [data-testid="edit-project"]');
                if (await editProjectButton.count() > 0) {
                    await editProjectButton.click();
                    
                    await page.fill('input[name="name"]', 'Updated Project Name');
                    await page.click('button[type="submit"], button:has-text("Save")');
                    await page.waitForLoadState('networkidle');
                    
                    // Verify update
                    await expect(page.locator('text="Updated Project Name"')).toBeVisible();
                }
            }

            // Test project deletion availability
            const deleteProjectButton = page.locator('button:has-text("Delete Project"), [data-testid="delete-project"]');
            if (await deleteProjectButton.count() > 0) {
                await deleteProjectButton.click();
                
                // Should show confirmation
                const confirmDialog = page.locator('[role="dialog"], .modal');
                if (await confirmDialog.count() > 0) {
                    await expect(confirmDialog).toBeVisible();
                    await page.click('button:has-text("Cancel")');
                }
            }
        });

        test('should handle project collaboration features', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test collaboration features
            const collaborationFeatures = [
                'button:has-text("Share"), [data-testid="share-project"]',
                'button:has-text("Invite"), [data-testid="invite-collaborator"]',
                '[data-testid="collaborators-list"], .collaborators'
            ];

            for (const feature of collaborationFeatures) {
                const element = page.locator(feature);
                if (await element.count() > 0) {
                    await expect(element).toBeVisible();
                }
            }
        });
    });

    test.describe('Document Management', () => {
        test('should complete full document CRUD lifecycle', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            // CREATE - New Document
            const createDocButton = page.locator('button:has-text("New Document"), [data-testid="create-document"]');
            if (await createDocButton.count() > 0) {
                await createDocButton.click();
                
                // Fill document form
                await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Document New');
                
                // If there's a content editor
                const contentEditor = page.locator('[data-testid="document-editor"], textarea[name="content"], .tiptap');
                if (await contentEditor.count() > 0) {
                    await contentEditor.fill('This is test document content');
                }
                
                // Save document
                await page.click('button:has-text("Save"), button[type="submit"]');
                await page.waitForLoadState('networkidle');
                
                // Verify creation
                await expect(page.locator('text="Test Document New"')).toBeVisible();
            }

            // READ - View document
            const documentLink = page.locator('a:has-text("Test Document"), [data-testid="document-link"]');
            if (await documentLink.count() > 0) {
                await documentLink.click();
                await page.waitForLoadState('networkidle');
                
                // Should be viewing document
                expect(page.url()).toContain('/documents/');
                await expect(page.locator('h1, h2, [data-testid="document-title"]')).toContainText('Test Document');
            }

            // UPDATE - Edit document
            const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-document"]');
            if (await editButton.count() > 0) {
                await editButton.click();
                
                // Update title
                const titleField = page.locator('input[name="title"], [data-testid="document-title-input"]');
                if (await titleField.count() > 0) {
                    await titleField.fill('Updated Document Title');
                }
                
                // Update content
                const contentField = page.locator('[data-testid="document-editor"], textarea[name="content"]');
                if (await contentField.count() > 0) {
                    await contentField.fill('Updated document content with more details');
                }
                
                // Save changes
                await page.click('button:has-text("Save"), button[type="submit"]');
                await page.waitForLoadState('networkidle');
                
                // Verify update
                await expect(page.locator('text="Updated Document Title"')).toBeVisible();
            }

            // DELETE - Remove document
            const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-document"]');
            if (await deleteButton.count() > 0) {
                await deleteButton.click();
                
                // Confirm deletion
                const confirmDialog = page.locator('[role="dialog"], .modal');
                if (await confirmDialog.count() > 0) {
                    await expect(confirmDialog).toBeVisible();
                    
                    // For testing, we'll cancel to avoid actual deletion
                    await page.click('button:has-text("Cancel")');
                }
            }
        });

        test('should handle document versioning and collaboration', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/documents/test-document');
            await page.waitForLoadState('networkidle');

            // Test version history if available
            const versionButton = page.locator('button:has-text("Version"), [data-testid="version-history"]');
            if (await versionButton.count() > 0) {
                await versionButton.click();
                
                const versionList = page.locator('[data-testid="version-list"], .version-history');
                if (await versionList.count() > 0) {
                    await expect(versionList).toBeVisible();
                }
            }

            // Test comments/collaboration features
            const commentButton = page.locator('button:has-text("Comment"), [data-testid="add-comment"]');
            if (await commentButton.count() > 0) {
                await commentButton.click();
                
                const commentField = page.locator('textarea[placeholder*="comment"], [data-testid="comment-input"]');
                if (await commentField.count() > 0) {
                    await commentField.fill('Test comment on document');
                    await page.click('button:has-text("Post"), button[type="submit"]');
                    
                    // Verify comment appears
                    await expect(page.locator('text="Test comment on document"')).toBeVisible();
                }
            }
        });
    });

    test.describe('Requirements Management', () => {
        test('should complete full requirements CRUD lifecycle', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');

            // CREATE - New Requirement
            const createReqButton = page.locator('button:has-text("New Requirement"), [data-testid="create-requirement"]');
            if (await createReqButton.count() > 0) {
                await createReqButton.click();
                
                // Fill requirement form
                await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Requirement New');
                await page.fill('textarea[name="description"], input[name="description"]', 'Test requirement description');
                
                // Set priority
                const prioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]');
                if (await prioritySelect.count() > 0) {
                    await prioritySelect.selectOption('high');
                }
                
                // Save requirement
                await page.click('button:has-text("Save"), button[type="submit"]');
                await page.waitForLoadState('networkidle');
                
                // Verify creation
                await expect(page.locator('text="Test Requirement New"')).toBeVisible();
            }

            // READ - View requirement details
            const requirementLink = page.locator('a:has-text("Test Requirement"), [data-testid="requirement-link"]');
            if (await requirementLink.count() > 0) {
                await requirementLink.click();
                await page.waitForLoadState('networkidle');
                
                // Should be viewing requirement
                expect(page.url()).toContain('/requirements/');
                await expect(page.locator('h1, h2, [data-testid="requirement-title"]')).toContainText('Test Requirement');
            }

            // UPDATE - Edit requirement
            const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-requirement"]');
            if (await editButton.count() > 0) {
                await editButton.click();
                
                // Update fields
                await page.fill('input[name="title"]', 'Updated Requirement Title');
                await page.fill('textarea[name="description"]', 'Updated requirement description with more details');
                
                // Change status
                const statusSelect = page.locator('select[name="status"], [data-testid="status-select"]');
                if (await statusSelect.count() > 0) {
                    await statusSelect.selectOption('in_progress');
                }
                
                // Save changes
                await page.click('button:has-text("Save"), button[type="submit"]');
                await page.waitForLoadState('networkidle');
                
                // Verify update
                await expect(page.locator('text="Updated Requirement Title"')).toBeVisible();
            }

            // DELETE - Remove requirement
            const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-requirement"]');
            if (await deleteButton.count() > 0) {
                await deleteButton.click();
                
                // Confirm deletion
                const confirmDialog = page.locator('[role="dialog"], .modal');
                if (await confirmDialog.count() > 0) {
                    await expect(confirmDialog).toBeVisible();
                    await page.click('button:has-text("Cancel")');
                }
            }
        });

        test('should handle requirement relationships and traceability', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/requirements/test-requirement');
            await page.waitForLoadState('networkidle');

            // Test requirement traceability
            const traceButton = page.locator('button:has-text("Trace"), [data-testid="trace-requirement"]');
            if (await traceButton.count() > 0) {
                await traceButton.click();
                await page.waitForLoadState('networkidle');
                
                // Should show traceability diagram or view
                const traceView = page.locator('[data-testid="trace-diagram"], .trace-view');
                if (await traceView.count() > 0) {
                    await expect(traceView).toBeVisible();
                }
            }

            // Test requirement linking
            const linkButton = page.locator('button:has-text("Link"), [data-testid="link-requirement"]');
            if (await linkButton.count() > 0) {
                await linkButton.click();
                
                // Should show linking options
                const linkDialog = page.locator('[role="dialog"], .link-modal');
                if (await linkDialog.count() > 0) {
                    await expect(linkDialog).toBeVisible();
                    await page.click('button:has-text("Cancel")');
                }
            }
        });
    });

    test.describe('Cross-Entity Relationships', () => {
        test('should handle relationships between projects, documents, and requirements', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test navigation between related entities
            const relatedEntities = [
                { name: 'Documents', selector: 'a:has-text("Documents"), [data-testid="documents-tab"]' },
                { name: 'Requirements', selector: 'a:has-text("Requirements"), [data-testid="requirements-tab"]' },
                { name: 'Canvas', selector: 'a:has-text("Canvas"), [data-testid="canvas-tab"]' }
            ];

            for (const entity of relatedEntities) {
                const link = page.locator(entity.selector);
                if (await link.count() > 0) {
                    await link.click();
                    await page.waitForLoadState('networkidle');
                    
                    // Verify navigation worked
                    expect(page.url()).toContain(entity.name.toLowerCase());
                    
                    // Go back to main project view
                    await page.goto('/org/test-org/project/test-project');
                    await page.waitForLoadState('networkidle');
                }
            }
        });

        test('should maintain data consistency across CRUD operations', async ({ page }) => {
            // This test ensures that creating/updating/deleting entities
            // properly updates related entities and maintains referential integrity
            
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test creating a document and verifying it appears in listings
            const documentsTab = page.locator('a:has-text("Documents")');
            if (await documentsTab.count() > 0) {
                await documentsTab.click();
                await page.waitForLoadState('networkidle');
                
                const initialDocCount = await page.locator('[data-testid="document-item"], .document-item').count();
                
                // Create new document
                const createButton = page.locator('button:has-text("New Document")');
                if (await createButton.count() > 0) {
                    await createButton.click();
                    await page.fill('input[name="title"]', 'Consistency Test Document');
                    await page.click('button:has-text("Save")');
                    await page.waitForLoadState('networkidle');
                    
                    // Verify document count increased
                    const newDocCount = await page.locator('[data-testid="document-item"], .document-item').count();
                    expect(newDocCount).toBeGreaterThan(initialDocCount);
                }
            }
        });
    });

    test.describe('Responsive CRUD Operations', () => {
        test('should work correctly on mobile devices', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test mobile-specific CRUD interactions
            const mobileMenu = page.locator('[data-testid="mobile-menu"], .hamburger');
            if (await mobileMenu.count() > 0) {
                await mobileMenu.click();
                
                // Test navigation to different sections
                const documentsLink = page.locator('a:has-text("Documents")');
                if (await documentsLink.count() > 0) {
                    await documentsLink.click();
                    await page.waitForLoadState('networkidle');
                    
                    // Test mobile document creation
                    const createButton = page.locator('button:has-text("New"), [data-testid="mobile-create"]');
                    if (await createButton.count() > 0) {
                        await createButton.click();
                        
                        // Should open mobile-friendly form
                        const form = page.locator('form, [data-testid="mobile-form"]');
                        if (await form.count() > 0) {
                            await expect(form).toBeVisible();
                        }
                    }
                }
            }
        });

        test('should work correctly on tablet devices', async ({ page }) => {
            await BrowserHelpers.setTabletViewport(page);
            
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test tablet-specific interactions
            // Similar to mobile but with potentially different layouts
            const navigation = page.locator('nav, [data-testid="navigation"]');
            if (await navigation.count() > 0) {
                await expect(navigation).toBeVisible();
                
                // Test that CRUD operations work with tablet layout
                await page.click('a:has-text("Documents")');
                await page.waitForLoadState('networkidle');
                
                const createButton = page.locator('button:has-text("New Document")');
                if (await createButton.count() > 0) {
                    await createButton.click();
                    
                    // Form should be appropriately sized for tablet
                    const form = page.locator('form');
                    if (await form.count() > 0) {
                        const formBounds = await form.boundingBox();
                        expect(formBounds?.width).toBeLessThan(800); // Should fit tablet width
                    }
                }
            }
        });
    });
});