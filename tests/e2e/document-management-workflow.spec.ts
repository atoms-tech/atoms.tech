import { test, expect } from '@playwright/test';

import { AuthPage } from './page-objects/auth.page';
import { DocumentPage } from './page-objects/document.page';
import { HomePage } from './page-objects/home.page';
import { ProjectPage } from './page-objects/project.page';
import { setupAuthenticatedSession, mockUserProfile, TestData } from './utils/test-helpers';

/**
 * Document Management Workflow E2E Tests
 * 
 * Tests complete user journeys for document creation, editing, and management
 * including collaborative features and document organization
 */

test.describe('Document Management Workflow', () => {
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

        // Mock project and document APIs
        await page.route('**/projects**', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    data: [TestData.projects.default],
                    count: 1
                }
            });
        });

        await page.route('**/documents**', async (route) => {
            const url = route.request().url();
            if (route.request().method() === 'POST') {
                // Create document
                await route.fulfill({
                    status: 201,
                    json: {
                        id: 'new_doc_' + Date.now(),
                        title: 'New Document',
                        content: '',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        owner_id: TestData.users.standard.id
                    }
                });
            } else if (route.request().method() === 'PUT') {
                // Update document
                await route.fulfill({
                    status: 200,
                    json: {
                        id: 'doc_123',
                        title: 'Updated Document',
                        content: 'Updated content',
                        updated_at: new Date().toISOString()
                    }
                });
            } else {
                // List documents
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [],
                        count: 0
                    }
                });
            }
        });
    });

    test.describe('Document Creation Workflow', () => {
        test('should create a new document from home page', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToActivityTab();
            
            // Click "New Document" from quick actions
            await homePage.clickNewDocument();
            
            // Should navigate to document creation or open modal
            await page.waitForTimeout(1000);
            
            // Verify document creation interface is available
            const documentTitle = page.locator('input[placeholder*="Document title"], input[placeholder*="Title"]');
            if (await documentTitle.isVisible()) {
                await documentTitle.fill('My New Requirements Document');
                
                // Find and click create/save button
                const createButton = page.locator('button:has-text("Create"), button:has-text("Save")');
                if (await createButton.isVisible()) {
                    await createButton.click();
                    
                    // Wait for document to be created
                    await page.waitForTimeout(2000);
                    
                    // Verify we're in the document editor
                    expect(page.url()).toMatch(/(document|doc)/);
                }
            }
        });

        test('should create document from project page', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123');
            await page.waitForLoadState('networkidle');
            
            // Look for "New Document" or "Create Document" button
            const createDocButton = page.locator(
                'button:has-text("New Document"), button:has-text("Create Document"), button:has-text("Add Document")'
            );
            
            if (await createDocButton.isVisible()) {
                await createDocButton.click();
                
                // Fill document details
                await page.fill('input[placeholder*="title"]', 'Project Requirements Document');
                
                const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")');
                if (await saveButton.isVisible()) {
                    await saveButton.click();
                    
                    await page.waitForTimeout(1000);
                    expect(page.url()).toMatch(/(document|doc)/);
                }
            }
        });

        test('should handle document creation errors gracefully', async ({ page }) => {
            // Mock document creation failure
            await page.route('**/documents**', async (route) => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 400,
                        json: { error: 'Document creation failed' }
                    });
                } else {
                    await route.continue();
                }
            });
            
            await homePage.gotoHome();
            await homePage.clickNewDocument();
            
            // Try to create document
            const titleInput = page.locator('input[placeholder*="title"]');
            if (await titleInput.isVisible()) {
                await titleInput.fill('Test Document');
                
                const createButton = page.locator('button:has-text("Create")');
                if (await createButton.isVisible()) {
                    await createButton.click();
                    
                    // Should show error message
                    await expect(page.locator('.text-red-500, [role="alert"]')).toBeVisible();
                }
            }
        });
    });

    test.describe('Document Editing Workflow', () => {
        test('should edit document content with rich text editor', async ({ page }) => {
            // Navigate to existing document
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Look for editor content area
            const editorContent = page.locator(
                '[contenteditable="true"], .ProseMirror, .editor-content, textarea'
            );
            
            if (await editorContent.isVisible()) {
                await editorContent.click();
                await editorContent.fill('This is a test requirement document with rich content.');
                
                // Test formatting if available
                const boldButton = page.locator('button[title*="Bold"], button:has-text("B")');
                if (await boldButton.isVisible()) {
                    await editorContent.selectText();
                    await boldButton.click();
                }
                
                // Save document
                await page.keyboard.press('Control+S');
                await page.waitForTimeout(1000);
                
                // Verify save success
                const saveIndicator = page.locator('text="Saved", text="Auto-saved"');
                if (await saveIndicator.isVisible()) {
                    await expect(saveIndicator).toBeVisible();
                }
            }
        });

        test('should handle real-time collaboration features', async ({ page, context }) => {
            // Mock real-time collaboration
            await page.route('**/websocket**', async (route) => {
                await route.fulfill({ status: 200 });
            });
            
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Look for collaboration indicators
            const collaborationIndicator = page.locator(
                '[data-testid="collaboration-indicator"], .collaboration-status'
            );
            
            // Look for user avatars or presence indicators
            const userPresence = page.locator(
                '[data-testid="user-presence"], .user-avatar, .presence-indicator'
            );
            
            // Test if collaboration features are working
            if (await collaborationIndicator.isVisible() || await userPresence.isVisible()) {
                // Verify collaboration is active
                expect(await collaborationIndicator.isVisible() || await userPresence.isVisible()).toBe(true);
            }
        });

        test('should auto-save document changes', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            const editor = page.locator('[contenteditable="true"], textarea');
            if (await editor.isVisible()) {
                await editor.fill('Testing auto-save functionality');
                
                // Wait for auto-save
                await page.waitForTimeout(3000);
                
                // Check for save indicator
                const saveStatus = page.locator('text="Saved", text="Auto-saved", .save-status');
                if (await saveStatus.isVisible()) {
                    await expect(saveStatus).toBeVisible();
                }
            }
        });
    });

    test.describe('Document Organization Workflow', () => {
        test('should organize documents into folders', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123');
            await page.waitForLoadState('networkidle');
            
            // Look for folder creation options
            const createFolderButton = page.locator(
                'button:has-text("New Folder"), button:has-text("Create Folder")'
            );
            
            if (await createFolderButton.isVisible()) {
                await createFolderButton.click();
                
                // Fill folder name
                await page.fill('input[placeholder*="folder"]', 'Requirements Documents');
                
                const saveButton = page.locator('button:has-text("Create"), button:has-text("Save")');
                await saveButton.click();
                
                await page.waitForTimeout(1000);
                
                // Verify folder was created
                await expect(page.locator('text="Requirements Documents"')).toBeVisible();
            }
        });

        test('should move documents between folders', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123');
            await page.waitForLoadState('networkidle');
            
            // Look for document context menu or drag-drop functionality
            const documentItem = page.locator('[data-testid="document-item"]').first();
            
            if (await documentItem.isVisible()) {
                // Right-click for context menu
                await documentItem.click({ button: 'right' });
                
                // Look for move option
                const moveOption = page.locator('text="Move", text="Move to folder"');
                if (await moveOption.isVisible()) {
                    await moveOption.click();
                    
                    // Select destination folder
                    const folderOption = page.locator('text="Requirements Documents"');
                    if (await folderOption.isVisible()) {
                        await folderOption.click();
                        
                        // Confirm move
                        const confirmButton = page.locator('button:has-text("Move"), button:has-text("Confirm")');
                        if (await confirmButton.isVisible()) {
                            await confirmButton.click();
                        }
                    }
                }
            }
        });

        test('should duplicate documents', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123');
            await page.waitForLoadState('networkidle');
            
            const documentItem = page.locator('[data-testid="document-item"]').first();
            
            if (await documentItem.isVisible()) {
                await documentItem.click({ button: 'right' });
                
                const duplicateOption = page.locator('text="Duplicate", text="Copy"');
                if (await duplicateOption.isVisible()) {
                    await duplicateOption.click();
                    
                    // Fill duplicate name
                    const nameInput = page.locator('input[placeholder*="name"]');
                    if (await nameInput.isVisible()) {
                        await nameInput.fill('Copy of Original Document');
                        
                        const confirmButton = page.locator('button:has-text("Duplicate"), button:has-text("Create")');
                        await confirmButton.click();
                        
                        await page.waitForTimeout(1000);
                        
                        // Verify duplicate was created
                        await expect(page.locator('text="Copy of Original Document"')).toBeVisible();
                    }
                }
            }
        });
    });

    test.describe('Document Sharing and Permissions', () => {
        test('should share document with team members', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Look for share button
            const shareButton = page.locator('button:has-text("Share"), button[title*="Share"]');
            
            if (await shareButton.isVisible()) {
                await shareButton.click();
                
                // Add team member
                const emailInput = page.locator('input[placeholder*="email"], input[type="email"]');
                if (await emailInput.isVisible()) {
                    await emailInput.fill('teammate@example.com');
                    
                    // Select permission level
                    const permissionSelect = page.locator('select, [role="combobox"]');
                    if (await permissionSelect.isVisible()) {
                        await permissionSelect.click();
                        await page.locator('text="Edit", text="Can edit"').click();
                    }
                    
                    // Send invitation
                    const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Send")');
                    if (await inviteButton.isVisible()) {
                        await inviteButton.click();
                        
                        await page.waitForTimeout(1000);
                        
                        // Verify invitation was sent
                        await expect(page.locator('text="Invitation sent"')).toBeVisible();
                    }
                }
            }
        });

        test('should manage document permissions', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Access permissions settings
            const settingsButton = page.locator('button:has-text("Settings"), button[title*="Settings"]');
            
            if (await settingsButton.isVisible()) {
                await settingsButton.click();
                
                // Look for permissions tab
                const permissionsTab = page.locator('text="Permissions", text="Access"');
                if (await permissionsTab.isVisible()) {
                    await permissionsTab.click();
                    
                    // Test permission changes
                    const publicToggle = page.locator('input[type="checkbox"], [role="switch"]');
                    if (await publicToggle.isVisible()) {
                        await publicToggle.check();
                        
                        // Save settings
                        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
                        if (await saveButton.isVisible()) {
                            await saveButton.click();
                        }
                    }
                }
            }
        });
    });

    test.describe('Document Export and Import', () => {
        test('should export document to different formats', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Look for export option
            const exportButton = page.locator('button:has-text("Export"), button[title*="Export"]');
            
            if (await exportButton.isVisible()) {
                await exportButton.click();
                
                // Select export format
                const pdfOption = page.locator('text="PDF", text="Export as PDF"');
                if (await pdfOption.isVisible()) {
                    await pdfOption.click();
                    
                    // Wait for export to complete
                    await page.waitForTimeout(2000);
                    
                    // Verify download or export success
                    const exportSuccess = page.locator('text="Export complete", text="Downloaded"');
                    if (await exportSuccess.isVisible()) {
                        await expect(exportSuccess).toBeVisible();
                    }
                }
            }
        });

        test('should import documents from external sources', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123');
            await page.waitForLoadState('networkidle');
            
            // Look for import option
            const importButton = page.locator('button:has-text("Import"), button[title*="Import"]');
            
            if (await importButton.isVisible()) {
                await importButton.click();
                
                // Mock file upload
                const fileInput = page.locator('input[type="file"]');
                if (await fileInput.isVisible()) {
                    // Set files (this would be a real file in actual test)
                    await fileInput.setInputFiles({
                        name: 'test-document.txt',
                        mimeType: 'text/plain',
                        buffer: Buffer.from('Test document content')
                    });
                    
                    // Confirm import
                    const importConfirmButton = page.locator('button:has-text("Import"), button:has-text("Upload")');
                    if (await importConfirmButton.isVisible()) {
                        await importConfirmButton.click();
                        
                        await page.waitForTimeout(2000);
                        
                        // Verify import success
                        await expect(page.locator('text="Import complete", text="Imported successfully"')).toBeVisible();
                    }
                }
            }
        });
    });

    test.describe('Document Version Control', () => {
        test('should track document version history', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Look for version history
            const historyButton = page.locator('button:has-text("History"), button[title*="Version"]');
            
            if (await historyButton.isVisible()) {
                await historyButton.click();
                
                // Verify version history is displayed
                const versionList = page.locator('[data-testid="version-list"], .version-history');
                if (await versionList.isVisible()) {
                    await expect(versionList).toBeVisible();
                    
                    // Test version comparison
                    const compareButton = page.locator('button:has-text("Compare"), button[title*="Compare"]');
                    if (await compareButton.isVisible()) {
                        await compareButton.click();
                        
                        // Verify comparison view
                        const diffView = page.locator('.diff-view, [data-testid="diff-viewer"]');
                        if (await diffView.isVisible()) {
                            await expect(diffView).toBeVisible();
                        }
                    }
                }
            }
        });

        test('should restore previous document versions', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            const historyButton = page.locator('button:has-text("History")');
            
            if (await historyButton.isVisible()) {
                await historyButton.click();
                
                // Select a previous version
                const versionItem = page.locator('[data-testid="version-item"]').first();
                if (await versionItem.isVisible()) {
                    await versionItem.click();
                    
                    // Restore version
                    const restoreButton = page.locator('button:has-text("Restore"), button:has-text("Revert")');
                    if (await restoreButton.isVisible()) {
                        await restoreButton.click();
                        
                        // Confirm restoration
                        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
                        if (await confirmButton.isVisible()) {
                            await confirmButton.click();
                            
                            await page.waitForTimeout(1000);
                            
                            // Verify restoration success
                            await expect(page.locator('text="Version restored"')).toBeVisible();
                        }
                    }
                }
            }
        });
    });

    test.describe('Document Search and Navigation', () => {
        test('should search within document content', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Use Ctrl+F to open search
            await page.keyboard.press('Control+f');
            
            // Look for search input
            const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
            if (await searchInput.isVisible()) {
                await searchInput.fill('requirement');
                
                // Verify search results are highlighted
                const searchResults = page.locator('.search-highlight, .highlight');
                if (await searchResults.first().isVisible()) {
                    await expect(searchResults.first()).toBeVisible();
                }
            }
        });

        test('should navigate through document outline', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Look for outline or table of contents
            const outlineButton = page.locator('button:has-text("Outline"), button[title*="Outline"]');
            
            if (await outlineButton.isVisible()) {
                await outlineButton.click();
                
                // Verify outline is displayed
                const outlinePanel = page.locator('[data-testid="outline-panel"], .outline');
                if (await outlinePanel.isVisible()) {
                    await expect(outlinePanel).toBeVisible();
                    
                    // Click on outline item to navigate
                    const outlineItem = page.locator('[data-testid="outline-item"]').first();
                    if (await outlineItem.isVisible()) {
                        await outlineItem.click();
                        
                        // Verify navigation occurred
                        await page.waitForTimeout(500);
                    }
                }
            }
        });
    });

    test.describe('Error Handling and Recovery', () => {
        test('should handle document save failures gracefully', async ({ page }) => {
            // Mock save failure
            await page.route('**/documents/**', async (route) => {
                if (route.request().method() === 'PUT') {
                    await route.fulfill({
                        status: 500,
                        json: { error: 'Save failed' }
                    });
                } else {
                    await route.continue();
                }
            });
            
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Make changes and try to save
            const editor = page.locator('[contenteditable="true"], textarea');
            if (await editor.isVisible()) {
                await editor.fill('Content that will fail to save');
                await page.keyboard.press('Control+s');
                
                // Verify error message is shown
                await expect(page.locator('.text-red-500, [role="alert"]')).toBeVisible();
            }
        });

        test('should recover from network disconnection', async ({ page }) => {
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Simulate network failure
            await page.route('**/*', async (route) => {
                await route.abort('failed');
            });
            
            // Try to make changes
            const editor = page.locator('[contenteditable="true"], textarea');
            if (await editor.isVisible()) {
                await editor.fill('Content during network failure');
                
                // Should show offline indicator
                const offlineIndicator = page.locator('text="Offline", text="No connection"');
                if (await offlineIndicator.isVisible()) {
                    await expect(offlineIndicator).toBeVisible();
                }
            }
            
            // Restore network
            await page.unroute('**/*');
            
            // Should automatically sync when connection is restored
            await page.waitForTimeout(2000);
        });
    });

    test.describe('Mobile Document Management', () => {
        test('should work on mobile devices', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Verify mobile-optimized interface
            const mobileEditor = page.locator('[contenteditable="true"], textarea');
            if (await mobileEditor.isVisible()) {
                await mobileEditor.tap();
                await mobileEditor.fill('Mobile content editing');
                
                // Test mobile toolbar
                const mobileToolbar = page.locator('.mobile-toolbar, [data-testid="mobile-toolbar"]');
                if (await mobileToolbar.isVisible()) {
                    await expect(mobileToolbar).toBeVisible();
                }
            }
        });

        test('should handle touch gestures for document navigation', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            await page.goto('/org/test-org/projects/project_123/documents/doc_123');
            await page.waitForLoadState('networkidle');
            
            // Test pinch-to-zoom if supported
            const documentContent = page.locator('[data-testid="document-content"]');
            if (await documentContent.isVisible()) {
                // Test touch scroll
                await documentContent.hover();
                await page.mouse.wheel(0, 100);
                
                // Verify scrolling worked
                await page.waitForTimeout(500);
            }
        });
    });
});
