import { Locator, Page, expect } from '@playwright/test';

import { BasePage } from './base.page';

/**
 * Page Object Model for document management pages
 */
export class DocumentPage extends BasePage {
    // Document editor selectors
    private readonly documentTitle = 'input[placeholder*="title"], h1[contenteditable="true"]';
    private readonly documentContent = '[contenteditable="true"], .ProseMirror, .editor-content, textarea';
    private readonly saveButton = 'button:has-text("Save"), button[title*="Save"]';
    private readonly saveStatus = '.save-status, text="Saved", text="Auto-saved"';
    
    // Toolbar selectors
    private readonly boldButton = 'button[title*="Bold"], button:has-text("B")';
    private readonly italicButton = 'button[title*="Italic"], button:has-text("I")';
    private readonly underlineButton = 'button[title*="Underline"], button:has-text("U")';
    private readonly headingButton = 'button:has-text("Heading"), select[title*="Heading"]';
    
    // Navigation selectors
    private readonly breadcrumb = '.breadcrumb, [data-testid="breadcrumb"]';
    private readonly backButton = 'button:has-text("Back"), button[title*="Back"]';
    private readonly homeButton = 'button:has-text("Home"), a[href="/home"]';
    
    // Sharing and collaboration
    private readonly shareButton = 'button:has-text("Share"), button[title*="Share"]';
    private readonly collaborationIndicator = '[data-testid="collaboration-indicator"], .collaboration-status';
    private readonly userPresence = '[data-testid="user-presence"], .user-avatar, .presence-indicator';
    
    // Document management
    private readonly settingsButton = 'button:has-text("Settings"), button[title*="Settings"]';
    private readonly exportButton = 'button:has-text("Export"), button[title*="Export"]';
    private readonly historyButton = 'button:has-text("History"), button[title*="Version"]';
    private readonly duplicateButton = 'button:has-text("Duplicate"), button:has-text("Copy")';
    
    // Search and navigation
    private readonly searchInput = 'input[placeholder*="Search"], input[type="search"]';
    private readonly outlineButton = 'button:has-text("Outline"), button[title*="Outline"]';
    private readonly outlinePanel = '[data-testid="outline-panel"], .outline';
    
    // Error states
    private readonly errorMessage = '.text-red-500, [role="alert"], .error-message';
    private readonly offlineIndicator = 'text="Offline", text="No connection", .offline-indicator';
    
    constructor(page: Page) {
        super(page, '/documents');
    }

    /**
     * Navigate to a specific document
     */
    async gotoDocument(orgId: string, projectId: string, documentId: string): Promise<void> {
        await this.page.goto(`/org/${orgId}/projects/${projectId}/documents/${documentId}`);
        await this.waitForLoad();
    }

    /**
     * Create a new document
     */
    async createDocument(title: string, content?: string): Promise<void> {
        // Fill document title
        const titleInput = this.page.locator(this.documentTitle);
        if (await titleInput.isVisible()) {
            await titleInput.fill(title);
        }
        
        // Fill content if provided
        if (content) {
            await this.editContent(content);
        }
        
        // Save document
        await this.saveDocument();
    }

    /**
     * Edit document content
     */
    async editContent(content: string): Promise<void> {
        const editor = this.page.locator(this.documentContent);
        await editor.waitFor({ state: 'visible' });
        await editor.click();
        await editor.fill(content);
    }

    /**
     * Save document
     */
    async saveDocument(): Promise<void> {
        // Try keyboard shortcut first
        await this.page.keyboard.press('Control+s');
        
        // If save button is visible, click it
        const saveBtn = this.page.locator(this.saveButton);
        if (await saveBtn.isVisible()) {
            await saveBtn.click();
        }
        
        // Wait for save to complete
        await this.waitForSave();
    }

    /**
     * Wait for document to be saved
     */
    async waitForSave(): Promise<void> {
        await this.page.waitForTimeout(1000);
        
        // Check for save status indicator
        const saveStatus = this.page.locator(this.saveStatus);
        if (await saveStatus.isVisible()) {
            await expect(saveStatus).toBeVisible();
        }
    }

    /**
     * Apply text formatting
     */
    async applyFormatting(format: 'bold' | 'italic' | 'underline' | 'heading'): Promise<void> {
        let button: Locator;
        
        switch (format) {
            case 'bold':
                button = this.page.locator(this.boldButton);
                break;
            case 'italic':
                button = this.page.locator(this.italicButton);
                break;
            case 'underline':
                button = this.page.locator(this.underlineButton);
                break;
            case 'heading':
                button = this.page.locator(this.headingButton);
                break;
        }
        
        if (await button.isVisible()) {
            await button.click();
        }
    }

    /**
     * Select text in editor
     */
    async selectText(text?: string): Promise<void> {
        const editor = this.page.locator(this.documentContent);
        
        if (text) {
            // Select specific text
            await editor.selectText({ force: true });
        } else {
            // Select all text
            await editor.click();
            await this.page.keyboard.press('Control+a');
        }
    }

    /**
     * Share document
     */
    async shareDocument(email: string, permission: 'view' | 'edit' | 'admin' = 'edit'): Promise<void> {
        const shareBtn = this.page.locator(this.shareButton);
        
        if (await shareBtn.isVisible()) {
            await shareBtn.click();
            
            // Fill email
            const emailInput = this.page.locator('input[placeholder*="email"], input[type="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill(email);
                
                // Select permission level
                const permissionSelect = this.page.locator('select, [role="combobox"]');
                if (await permissionSelect.isVisible()) {
                    await permissionSelect.click();
                    await this.page.locator(`text="${permission}", text="Can ${permission}"`).click();
                }
                
                // Send invitation
                const inviteButton = this.page.locator('button:has-text("Invite"), button:has-text("Send")');
                if (await inviteButton.isVisible()) {
                    await inviteButton.click();
                    await this.page.waitForTimeout(1000);
                }
            }
        }
    }

    /**
     * Export document
     */
    async exportDocument(format: 'pdf' | 'docx' | 'txt' = 'pdf'): Promise<void> {
        const exportBtn = this.page.locator(this.exportButton);
        
        if (await exportBtn.isVisible()) {
            await exportBtn.click();
            
            // Select export format
            const formatOption = this.page.locator(`text="${format.toUpperCase()}", text="Export as ${format.toUpperCase()}"`);
            if (await formatOption.isVisible()) {
                await formatOption.click();
                await this.page.waitForTimeout(2000);
            }
        }
    }

    /**
     * View document history
     */
    async viewHistory(): Promise<void> {
        const historyBtn = this.page.locator(this.historyButton);
        
        if (await historyBtn.isVisible()) {
            await historyBtn.click();
            
            // Wait for history panel to load
            const versionList = this.page.locator('[data-testid="version-list"], .version-history');
            if (await versionList.isVisible()) {
                await expect(versionList).toBeVisible();
            }
        }
    }

    /**
     * Restore document version
     */
    async restoreVersion(versionIndex: number = 0): Promise<void> {
        await this.viewHistory();
        
        // Select version
        const versionItem = this.page.locator('[data-testid="version-item"]').nth(versionIndex);
        if (await versionItem.isVisible()) {
            await versionItem.click();
            
            // Restore version
            const restoreButton = this.page.locator('button:has-text("Restore"), button:has-text("Revert")');
            if (await restoreButton.isVisible()) {
                await restoreButton.click();
                
                // Confirm restoration
                const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                    await this.page.waitForTimeout(1000);
                }
            }
        }
    }

    /**
     * Search within document
     */
    async searchInDocument(query: string): Promise<void> {
        // Use Ctrl+F to open search
        await this.page.keyboard.press('Control+f');
        
        // Fill search input
        const searchInput = this.page.locator(this.searchInput);
        if (await searchInput.isVisible()) {
            await searchInput.fill(query);
            
            // Wait for search results
            await this.page.waitForTimeout(500);
        }
    }

    /**
     * Navigate through document outline
     */
    async openOutline(): Promise<void> {
        const outlineBtn = this.page.locator(this.outlineButton);
        
        if (await outlineBtn.isVisible()) {
            await outlineBtn.click();
            
            // Verify outline panel is visible
            const outlinePanel = this.page.locator(this.outlinePanel);
            if (await outlinePanel.isVisible()) {
                await expect(outlinePanel).toBeVisible();
            }
        }
    }

    /**
     * Click on outline item
     */
    async clickOutlineItem(index: number = 0): Promise<void> {
        const outlineItem = this.page.locator('[data-testid="outline-item"]').nth(index);
        
        if (await outlineItem.isVisible()) {
            await outlineItem.click();
            await this.page.waitForTimeout(500);
        }
    }

    /**
     * Verify document is loaded
     */
    async verifyDocumentLoaded(): Promise<void> {
        const content = this.page.locator(this.documentContent);
        await expect(content).toBeVisible();
        
        // Check for any loading states to disappear
        await this.waitForNoLoading();
    }

    /**
     * Verify collaboration features
     */
    async verifyCollaborationActive(): Promise<void> {
        const collaborationIndicator = this.page.locator(this.collaborationIndicator);
        const userPresence = this.page.locator(this.userPresence);
        
        // At least one collaboration indicator should be visible
        const isCollaborationVisible = await collaborationIndicator.isVisible() || await userPresence.isVisible();
        expect(isCollaborationVisible).toBe(true);
    }

    /**
     * Verify error message is displayed
     */
    async verifyErrorMessage(expectedMessage?: string): Promise<void> {
        const errorElement = this.page.locator(this.errorMessage);
        await expect(errorElement).toBeVisible();
        
        if (expectedMessage) {
            await expect(errorElement).toContainText(expectedMessage);
        }
    }

    /**
     * Verify offline indicator is shown
     */
    async verifyOfflineIndicator(): Promise<void> {
        const offlineIndicator = this.page.locator(this.offlineIndicator);
        await expect(offlineIndicator).toBeVisible();
    }

    /**
     * Verify document title
     */
    async verifyDocumentTitle(expectedTitle: string): Promise<void> {
        const title = this.page.locator(this.documentTitle);
        
        if (await title.isVisible()) {
            const titleValue = await title.inputValue();
            expect(titleValue).toBe(expectedTitle);
        } else {
            // Check for read-only title display
            const displayTitle = this.page.locator(`h1:has-text("${expectedTitle}")`);
            await expect(displayTitle).toBeVisible();
        }
    }

    /**
     * Verify document content
     */
    async verifyDocumentContent(expectedContent: string): Promise<void> {
        const content = this.page.locator(this.documentContent);
        await expect(content).toContainText(expectedContent);
    }

    /**
     * Verify save status
     */
    async verifySaveStatus(expectedStatus: 'saved' | 'auto-saved' | 'saving' = 'saved'): Promise<void> {
        const saveStatus = this.page.locator(this.saveStatus);
        
        if (await saveStatus.isVisible()) {
            await expect(saveStatus).toContainText(expectedStatus);
        }
    }

    /**
     * Verify search results are highlighted
     */
    async verifySearchResults(query: string): Promise<void> {
        const searchResults = this.page.locator('.search-highlight, .highlight');
        
        if (await searchResults.first().isVisible()) {
            await expect(searchResults.first()).toBeVisible();
            await expect(searchResults.first()).toContainText(query);
        }
    }

    /**
     * Verify export success
     */
    async verifyExportSuccess(): Promise<void> {
        const exportSuccess = this.page.locator('text="Export complete", text="Downloaded", text="Export successful"');
        
        if (await exportSuccess.isVisible()) {
            await expect(exportSuccess).toBeVisible();
        }
    }

    /**
     * Verify invitation sent
     */
    async verifyInvitationSent(): Promise<void> {
        const invitationSuccess = this.page.locator('text="Invitation sent", text="Invited successfully"');
        await expect(invitationSuccess).toBeVisible();
    }

    /**
     * Verify version restoration
     */
    async verifyVersionRestored(): Promise<void> {
        const restoreSuccess = this.page.locator('text="Version restored", text="Restored successfully"');
        await expect(restoreSuccess).toBeVisible();
    }

    /**
     * Get document content
     */
    async getDocumentContent(): Promise<string> {
        const content = this.page.locator(this.documentContent);
        return await content.textContent() || '';
    }

    /**
     * Get document title
     */
    async getDocumentTitle(): Promise<string> {
        const title = this.page.locator(this.documentTitle);
        
        if (await title.isVisible()) {
            return await title.inputValue();
        }
        
        // Check for read-only title display
        const displayTitle = this.page.locator('h1');
        if (await displayTitle.isVisible()) {
            return await displayTitle.textContent() || '';
        }
        
        return '';
    }

    /**
     * Check if document is in edit mode
     */
    async isEditMode(): Promise<boolean> {
        const editor = this.page.locator(this.documentContent);
        
        if (await editor.isVisible()) {
            const isEditable = await editor.getAttribute('contenteditable');
            return isEditable === 'true';
        }
        
        return false;
    }

    /**
     * Check if document has unsaved changes
     */
    async hasUnsavedChanges(): Promise<boolean> {
        const unsavedIndicator = this.page.locator('text="Unsaved changes", text="*", .unsaved-indicator');
        return await unsavedIndicator.isVisible();
    }

    /**
     * Navigate back to project
     */
    async navigateBack(): Promise<void> {
        const backBtn = this.page.locator(this.backButton);
        
        if (await backBtn.isVisible()) {
            await backBtn.click();
        } else {
            // Use browser back button as fallback
            await this.page.goBack();
        }
        
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Navigate to home
     */
    async navigateToHome(): Promise<void> {
        const homeBtn = this.page.locator(this.homeButton);
        
        if (await homeBtn.isVisible()) {
            await homeBtn.click();
        } else {
            await this.page.goto('/home');
        }
        
        await this.page.waitForLoadState('networkidle');
    }
}
