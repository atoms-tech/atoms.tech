import { Locator, Page, expect } from '@playwright/test';

import { BasePage } from './base.page';

/**
 * Enhanced Page Object Model for Project-related functionality
 * Comprehensive coverage of all project operations and workflows
 */
export class ProjectPage extends BasePage {
    // Selectors for project dashboard
    private readonly projectTitle = '[data-testid="project-title"], h1, h2';
    private readonly projectDescription = '[data-testid="project-description"], .project-description';
    private readonly projectSettings = '[data-testid="project-settings"], button:has-text("Settings")';
    private readonly projectMembers = '[data-testid="project-members"], .project-members';
    
    // Navigation selectors
    private readonly overviewTab = '[data-testid="overview-tab"], a:has-text("Overview")';
    private readonly documentsTab = '[data-testid="documents-tab"], a:has-text("Documents")';
    private readonly requirementsTab = '[data-testid="requirements-tab"], a:has-text("Requirements")';
    private readonly canvasTab = '[data-testid="canvas-tab"], a:has-text("Canvas")';
    private readonly testbedTab = '[data-testid="testbed-tab"], a:has-text("Testbed")';
    
    // Analytics and metrics selectors
    private readonly completionMetric = '[data-testid="completion-metric"], .completion-percentage';
    private readonly documentCount = '[data-testid="document-count"], .documents-count';
    private readonly requirementCount = '[data-testid="requirement-count"], .requirements-count';
    private readonly collaboratorCount = '[data-testid="collaborator-count"], .collaborators-count';
    
    // Action buttons
    private readonly createDocumentBtn = '[data-testid="create-document"], button:has-text("New Document")';
    private readonly createRequirementBtn = '[data-testid="create-requirement"], button:has-text("New Requirement")';
    private readonly inviteCollaboratorBtn = '[data-testid="invite-collaborator"], button:has-text("Invite")';
    private readonly shareProjectBtn = '[data-testid="share-project"], button:has-text("Share")';
    
    // Search and filter selectors
    private readonly searchInput = '[data-testid="project-search"], input[type="search"]';
    private readonly filterToggle = '[data-testid="filter-toggle"], button:has-text("Filters")';
    private readonly sortDropdown = '[data-testid="sort-dropdown"], select[name="sort"]';
    
    // Team management selectors
    private readonly teamSection = '[data-testid="team-section"], .team-section';
    private readonly teamMembers = '[data-testid="team-members"], .team-members';
    private readonly inviteButton = 'button:has-text("Invite"), button:has-text("Add Member")';
    
    // Import/Export selectors
    private readonly importButton = 'button:has-text("Import"), button[title*="Import"]';
    private readonly exportButton = 'button:has-text("Export"), button[title*="Export"]';
    private readonly fileInput = 'input[type="file"]';
    
    // Search and filter selectors
    private readonly searchInput = 'input[placeholder*="Search"], input[type="search"]';
    private readonly filterButton = 'button:has-text("Filter"), button[title*="Filter"]';
    private readonly sortButton = 'button:has-text("Sort"), button[title*="Sort"]';
    
    // Context menu selectors
    private readonly contextMenu = '[data-testid="context-menu"], .context-menu';
    private readonly moveOption = 'text="Move", text="Move to folder"';
    private readonly duplicateOption = 'text="Duplicate", text="Copy"';
    private readonly deleteOption = 'text="Delete", text="Remove"';
    
    // Modal selectors
    private readonly modal = '[role="dialog"], .modal';
    private readonly modalTitle = '[data-testid="modal-title"], .modal-title';
    private readonly confirmButton = 'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")';
    private readonly cancelButton = 'button:has-text("Cancel"), button:has-text("No")';
    
    constructor(page: Page) {
        super(page, '/projects');
    }

    /**
     * Navigate to a specific project
     */
    async gotoProject(orgId: string, projectId: string): Promise<void> {
        await this.page.goto(`/org/${orgId}/projects/${projectId}`);
        await this.waitForLoad();
    }

    /**
     * Verify project page is loaded
     */
    async verifyProjectPageLoaded(): Promise<void> {
        await expect(this.page.locator(this.projectTitle)).toBeVisible();
        await expect(this.page.locator(this.documentsSection)).toBeVisible();
        await this.waitForNoLoading();
    }

    /**
     * Get project title
     */
    async getProjectTitle(): Promise<string> {
        const title = this.page.locator(this.projectTitle);
        return await title.textContent() || '';
    }

    /**
     * Create a new document
     */
    async createDocument(title: string, description?: string): Promise<void> {
        const createBtn = this.page.locator(this.createDocumentButton);
        
        if (await createBtn.isVisible()) {
            await createBtn.click();
            
            // Fill document details
            await this.page.fill('input[placeholder*="title"], input[placeholder*="Title"]', title);
            
            if (description) {
                const descInput = this.page.locator('textarea[placeholder*="description"], input[placeholder*="description"]');
                if (await descInput.isVisible()) {
                    await descInput.fill(description);
                }
            }
            
            // Create document
            const createButton = this.page.locator('button:has-text("Create"), button:has-text("Save")');
            if (await createButton.isVisible()) {
                await createButton.click();
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Create a new folder
     */
    async createFolder(name: string): Promise<void> {
        const createBtn = this.page.locator(this.createFolderButton);
        
        if (await createBtn.isVisible()) {
            await createBtn.click();
            
            // Fill folder name
            await this.page.fill(this.folderName, name);
            
            // Create folder
            const saveButton = this.page.locator('button:has-text("Create"), button:has-text("Save")');
            await saveButton.click();
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Open document context menu
     */
    async openDocumentContextMenu(documentTitle: string): Promise<void> {
        const document = this.page.locator(`${this.documentItem}:has-text("${documentTitle}")`);
        
        if (await document.isVisible()) {
            await document.click({ button: 'right' });
            
            // Wait for context menu to appear
            const contextMenu = this.page.locator(this.contextMenu);
            if (await contextMenu.isVisible()) {
                await expect(contextMenu).toBeVisible();
            }
        }
    }

    /**
     * Move document to folder
     */
    async moveDocumentToFolder(documentTitle: string, folderName: string): Promise<void> {
        await this.openDocumentContextMenu(documentTitle);
        
        // Click move option
        const moveOption = this.page.locator(this.moveOption);
        if (await moveOption.isVisible()) {
            await moveOption.click();
            
            // Select destination folder
            const folderOption = this.page.locator(`text="${folderName}"`);
            if (await folderOption.isVisible()) {
                await folderOption.click();
                
                // Confirm move
                const confirmButton = this.page.locator('button:has-text("Move"), button:has-text("Confirm")');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                    await this.page.waitForTimeout(1000);
                }
            }
        }
    }

    /**
     * Duplicate document
     */
    async duplicateDocument(documentTitle: string, newName: string): Promise<void> {
        await this.openDocumentContextMenu(documentTitle);
        
        // Click duplicate option
        const duplicateOption = this.page.locator(this.duplicateOption);
        if (await duplicateOption.isVisible()) {
            await duplicateOption.click();
            
            // Fill new name
            const nameInput = this.page.locator('input[placeholder*="name"], input[placeholder*="title"]');
            if (await nameInput.isVisible()) {
                await nameInput.fill(newName);
                
                // Confirm duplicate
                const confirmButton = this.page.locator('button:has-text("Duplicate"), button:has-text("Create")');
                await confirmButton.click();
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(documentTitle: string): Promise<void> {
        await this.openDocumentContextMenu(documentTitle);
        
        // Click delete option
        const deleteOption = this.page.locator(this.deleteOption);
        if (await deleteOption.isVisible()) {
            await deleteOption.click();
            
            // Confirm deletion
            const confirmButton = this.page.locator(this.confirmButton);
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Search for documents
     */
    async searchDocuments(query: string): Promise<void> {
        const searchInput = this.page.locator(this.searchInput);
        
        if (await searchInput.isVisible()) {
            await searchInput.fill(query);
            await this.page.keyboard.press('Enter');
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Filter documents
     */
    async filterDocuments(filterType: string): Promise<void> {
        const filterBtn = this.page.locator(this.filterButton);
        
        if (await filterBtn.isVisible()) {
            await filterBtn.click();
            
            // Select filter option
            const filterOption = this.page.locator(`text="${filterType}"`);
            if (await filterOption.isVisible()) {
                await filterOption.click();
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Sort documents
     */
    async sortDocuments(sortType: 'name' | 'date' | 'size' = 'name'): Promise<void> {
        const sortBtn = this.page.locator(this.sortButton);
        
        if (await sortBtn.isVisible()) {
            await sortBtn.click();
            
            // Select sort option
            const sortOption = this.page.locator(`text="${sortType}", text="Sort by ${sortType}"`);
            if (await sortOption.isVisible()) {
                await sortOption.click();
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Import documents
     */
    async importDocuments(fileName: string, fileContent: string): Promise<void> {
        const importBtn = this.page.locator(this.importButton);
        
        if (await importBtn.isVisible()) {
            await importBtn.click();
            
            // Upload file
            const fileInput = this.page.locator(this.fileInput);
            if (await fileInput.isVisible()) {
                await fileInput.setInputFiles({
                    name: fileName,
                    mimeType: 'text/plain',
                    buffer: Buffer.from(fileContent)
                });
                
                // Confirm import
                const confirmButton = this.page.locator('button:has-text("Import"), button:has-text("Upload")');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                    await this.page.waitForTimeout(2000);
                }
            }
        }
    }

    /**
     * Export project
     */
    async exportProject(format: 'zip' | 'pdf' = 'zip'): Promise<void> {
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
     * Invite team member
     */
    async inviteTeamMember(email: string, role: 'viewer' | 'editor' | 'admin' = 'editor'): Promise<void> {
        const inviteBtn = this.page.locator(this.inviteButton);
        
        if (await inviteBtn.isVisible()) {
            await inviteBtn.click();
            
            // Fill email
            const emailInput = this.page.locator('input[placeholder*="email"], input[type="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill(email);
                
                // Select role
                const roleSelect = this.page.locator('select, [role="combobox"]');
                if (await roleSelect.isVisible()) {
                    await roleSelect.click();
                    await this.page.locator(`text="${role}", text="${role.charAt(0).toUpperCase() + role.slice(1)}"`).click();
                }
                
                // Send invitation
                const sendButton = this.page.locator('button:has-text("Invite"), button:has-text("Send")');
                if (await sendButton.isVisible()) {
                    await sendButton.click();
                    await this.page.waitForTimeout(1000);
                }
            }
        }
    }

    /**
     * Open folder
     */
    async openFolder(folderName: string): Promise<void> {
        const folder = this.page.locator(`${this.folderItem}:has-text("${folderName}")`);
        
        if (await folder.isVisible()) {
            await folder.dblclick();
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Navigate to document
     */
    async navigateToDocument(documentTitle: string): Promise<void> {
        const document = this.page.locator(`${this.documentItem}:has-text("${documentTitle}")`);
        
        if (await document.isVisible()) {
            await document.click();
            await this.page.waitForLoadState('networkidle');
        }
    }

    /**
     * Verify document exists
     */
    async verifyDocumentExists(documentTitle: string): Promise<void> {
        const document = this.page.locator(`${this.documentItem}:has-text("${documentTitle}")`);
        await expect(document).toBeVisible();
    }

    /**
     * Verify folder exists
     */
    async verifyFolderExists(folderName: string): Promise<void> {
        const folder = this.page.locator(`${this.folderItem}:has-text("${folderName}")`);
        await expect(folder).toBeVisible();
    }

    /**
     * Verify document does not exist
     */
    async verifyDocumentNotExists(documentTitle: string): Promise<void> {
        const document = this.page.locator(`${this.documentItem}:has-text("${documentTitle}")`);
        await expect(document).not.toBeVisible();
    }

    /**
     * Verify import success
     */
    async verifyImportSuccess(): Promise<void> {
        const importSuccess = this.page.locator('text="Import complete", text="Imported successfully"');
        await expect(importSuccess).toBeVisible();
    }

    /**
     * Verify export success
     */
    async verifyExportSuccess(): Promise<void> {
        const exportSuccess = this.page.locator('text="Export complete", text="Downloaded"');
        
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
     * Get document count
     */
    async getDocumentCount(): Promise<number> {
        const documents = this.page.locator(this.documentItem);
        return await documents.count();
    }

    /**
     * Get folder count
     */
    async getFolderCount(): Promise<number> {
        const folders = this.page.locator(this.folderItem);
        return await folders.count();
    }

    /**
     * Get team member count
     */
    async getTeamMemberCount(): Promise<number> {
        const members = this.page.locator(`${this.teamMembers} .member-item, ${this.teamMembers} [data-testid="member-item"]`);
        return await members.count();
    }

    /**
     * Verify search results
     */
    async verifySearchResults(query: string): Promise<void> {
        const searchResults = this.page.locator(`${this.documentItem}:has-text("${query}")`);
        
        if (await searchResults.first().isVisible()) {
            await expect(searchResults.first()).toBeVisible();
        }
    }

    /**
     * Verify no documents message
     */
    async verifyNoDocuments(): Promise<void> {
        const noDocumentsMessage = this.page.locator('text="No documents", text="No documents found"');
        await expect(noDocumentsMessage).toBeVisible();
    }

    /**
     * Verify empty folder message
     */
    async verifyEmptyFolder(): Promise<void> {
        const emptyFolderMessage = this.page.locator('text="Empty folder", text="This folder is empty"');
        await expect(emptyFolderMessage).toBeVisible();
    }

    /**
     * Check if document is in folder
     */
    async isDocumentInFolder(documentTitle: string, folderName: string): Promise<boolean> {
        await this.openFolder(folderName);
        
        const document = this.page.locator(`${this.documentItem}:has-text("${documentTitle}")`);
        return await document.isVisible();
    }

    /**
     * Get all document titles
     */
    async getAllDocumentTitles(): Promise<string[]> {
        const documents = this.page.locator(this.documentItem);
        const count = await documents.count();
        const titles: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const title = await documents.nth(i).textContent();
            if (title) {
                titles.push(title.trim());
            }
        }
        
        return titles;
    }

    /**
     * Get all folder names
     */
    async getAllFolderNames(): Promise<string[]> {
        const folders = this.page.locator(this.folderItem);
        const count = await folders.count();
        const names: string[] = [];
        
        for (let i = 0; i < count; i++) {
            const name = await folders.nth(i).textContent();
            if (name) {
                names.push(name.trim());
            }
        }
        
        return names;
    }
}
