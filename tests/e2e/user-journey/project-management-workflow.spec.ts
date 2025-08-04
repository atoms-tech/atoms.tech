import { test, expect, TestContext, PerformanceMonitor, ErrorSimulator } from '../fixtures/test-fixtures';

test.describe('Project Management Workflow', () => {
    test.beforeEach(async ({ authPage, homePage, userData, page }) => {
        // Login before each test
        await authPage.goto();
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        await authPage.submitLogin();
        await homePage.waitForLoad();
    });

    test('should create new project with complete setup', async ({ 
        projectPage, 
        projectData,
        userData,
        page 
    }: TestContext) => {
        await projectPage.goto();
        
        // Click create new project
        await projectPage.clickCreateNewProject();
        
        // Fill project creation form
        await projectPage.fillProjectForm({
            name: projectData.name,
            description: projectData.description,
            type: projectData.type,
            organization: userData.organization,
        });
        
        // Set project templates and settings
        await projectPage.selectProjectTemplate('agile-software-development');
        await projectPage.configureProjectSettings({
            visibility: 'private',
            collaborationLevel: 'team',
            notificationsEnabled: true,
        });
        
        // Submit project creation
        await projectPage.submitProjectCreation();
        
        // Verify project was created successfully
        await expect(page).toHaveURL(new RegExp(`/projects/${projectData.name.toLowerCase().replace(/\\s+/g, '-')}`));
        
        // Verify project details are displayed correctly
        const projectTitle = page.locator('[data-testid="project-title"]');
        await expect(projectTitle).toContainText(projectData.name);
        
        const projectDescription = page.locator('[data-testid="project-description"]');
        await expect(projectDescription).toContainText(projectData.description);
        
        // Verify project structure was created
        const projectSidebar = page.locator('[data-testid="project-sidebar"]');
        await expect(projectSidebar).toBeVisible();
        
        const projectSections = [
            'Requirements',
            'Documents',
            'Team',
            'Settings',
        ];
        
        for (const section of projectSections) {
            const sectionLink = page.locator(`[data-testid="sidebar-${section.toLowerCase()}"]`);
            await expect(sectionLink).toBeVisible();
        }
    });

    test('should handle project collaboration workflows', async ({ 
        projectPage, 
        projectData,
        browser,
        userData,
        page 
    }: TestContext) => {
        // Create a project first
        await projectPage.createProject(projectData);
        
        // Invite team members
        await projectPage.navigateToTeamSection();
        
        const collaborators = [
            { email: 'collaborator1@example.com', role: 'editor' },
            { email: 'collaborator2@example.com', role: 'viewer' },
            { email: 'collaborator3@example.com', role: 'admin' },
        ];
        
        for (const collaborator of collaborators) {
            await projectPage.inviteTeamMember(collaborator.email, collaborator.role);
        }
        
        // Verify invitations were sent
        const invitationsList = page.locator('[data-testid="pending-invitations"]');
        await expect(invitationsList).toBeVisible();
        
        for (const collaborator of collaborators) {
            const invitationItem = page.locator(`[data-testid="invitation-${collaborator.email}"]`);
            await expect(invitationItem).toBeVisible();
            await expect(invitationItem).toContainText(collaborator.role);
        }
        
        // Simulate collaborator acceptance (in a real scenario, this would be done via email)
        // For testing, we'll create a new browser context to simulate another user
        const collaboratorContext = await browser.newContext();
        const collaboratorPage = await collaboratorContext.newPage();
        
        // Navigate to invitation acceptance URL
        await collaboratorPage.goto(`/projects/${projectData.name}/accept-invitation?token=mock-token&email=${collaborators[0].email}`);
        
        // Accept invitation
        const acceptButton = collaboratorPage.locator('[data-testid="accept-invitation"]');
        await acceptButton.click();
        
        // Switch back to original user and verify team member was added
        await page.reload();
        await projectPage.navigateToTeamSection();
        
        const teamMembersList = page.locator('[data-testid="team-members-list"]');
        await expect(teamMembersList).toContainText(collaborators[0].email);
        
        await collaboratorContext.close();
    });

    test('should manage project requirements effectively', async ({ 
        projectPage, 
        projectData,
        requirementData,
        page 
    }: TestContext) => {
        await projectPage.createProject(projectData);
        
        // Navigate to requirements section
        await projectPage.navigateToRequirementsSection();
        
        // Create multiple requirements
        const requirements = [
            { ...requirementData, title: 'User Authentication Requirement' },
            { ...requirementData, title: 'Data Persistence Requirement' },
            { ...requirementData, title: 'API Integration Requirement' },
        ];
        
        for (const requirement of requirements) {
            await projectPage.createRequirement(requirement);
        }
        
        // Verify requirements are listed
        const requirementsList = page.locator('[data-testid="requirements-list"]');
        await expect(requirementsList).toBeVisible();
        
        for (const requirement of requirements) {
            const requirementItem = page.locator(`[data-testid="requirement-${requirement.title.toLowerCase().replace(/\\s+/g, '-')}"]`);
            await expect(requirementItem).toBeVisible();
        }
        
        // Test requirement relationships
        await projectPage.openRequirement(requirements[0].title);
        await projectPage.addRequirementDependency(requirements[1].title);
        
        // Verify dependency was created
        const dependencySection = page.locator('[data-testid="requirement-dependencies"]');
        await expect(dependencySection).toContainText(requirements[1].title);
        
        // Test requirement traceability
        await projectPage.linkRequirementToDocument(requirements[0].title, 'Design Document');
        
        const traceabilitySection = page.locator('[data-testid="requirement-traceability"]');
        await expect(traceabilitySection).toContainText('Design Document');
    });

    test('should handle project archiving and restoration', async ({ 
        projectPage, 
        projectData,
        page 
    }: TestContext) => {
        await projectPage.createProject(projectData);
        
        // Navigate to project settings
        await projectPage.navigateToProjectSettings();
        
        // Archive the project
        await projectPage.archiveProject();
        
        // Confirm archiving in modal
        const confirmModal = page.locator('[data-testid="confirm-archive-modal"]');
        await expect(confirmModal).toBeVisible();
        
        const confirmButton = page.locator('[data-testid="confirm-archive-button"]');
        await confirmButton.click();
        
        // Verify project is archived
        await page.waitForURL('/projects');
        
        // Check archived projects section
        await projectPage.navigateToArchivedProjects();
        
        const archivedProjectsList = page.locator('[data-testid="archived-projects-list"]');
        await expect(archivedProjectsList).toContainText(projectData.name);
        
        // Restore the project
        const restoreButton = page.locator(`[data-testid="restore-project-${projectData.name}"]`);
        await restoreButton.click();
        
        // Confirm restoration
        const restoreModal = page.locator('[data-testid="confirm-restore-modal"]');
        await expect(restoreModal).toBeVisible();
        
        const confirmRestoreButton = page.locator('[data-testid="confirm-restore-button"]');
        await confirmRestoreButton.click();
        
        // Verify project is restored to active projects
        await projectPage.navigateToActiveProjects();
        
        const activeProjectsList = page.locator('[data-testid="active-projects-list"]');
        await expect(activeProjectsList).toContainText(projectData.name);
    });

    test('should handle project permissions and security', async ({ 
        projectPage, 
        projectData,
        browser,
        page 
    }: TestContext) => {
        await projectPage.createProject(projectData);
        
        // Set project to private
        await projectPage.navigateToProjectSettings();
        await projectPage.setProjectVisibility('private');
        
        // Create unauthorized user context
        const unauthorizedContext = await browser.newContext();
        const unauthorizedPage = await unauthorizedContext.newPage();
        
        // Try to access project without permission
        await unauthorizedPage.goto(`/projects/${projectData.name}`);
        
        // Should show access denied or redirect to login
        const accessDenied = unauthorizedPage.locator('[data-testid="access-denied"]');
        const loginPrompt = unauthorizedPage.locator('[data-testid="login-prompt"]');
        
        await expect(accessDenied.or(loginPrompt)).toBeVisible();
        
        // Test role-based permissions
        await page.bringToFront();
        await projectPage.navigateToTeamSection();
        
        // Add user with viewer role
        await projectPage.inviteTeamMember('viewer@example.com', 'viewer');
        
        // Simulate viewer accessing project
        const viewerContext = await browser.newContext();
        const viewerPage = await viewerContext.newPage();
        
        // Login as viewer (simplified for test)
        await viewerPage.goto(`/projects/${projectData.name}?as=viewer`);
        
        // Viewer should be able to see but not edit
        const editButton = viewerPage.locator('[data-testid="edit-project-button"]');
        await expect(editButton).not.toBeVisible();
        
        const viewOnlyIndicator = viewerPage.locator('[data-testid="view-only-mode"]');
        await expect(viewOnlyIndicator).toBeVisible();
        
        await unauthorizedContext.close();
        await viewerContext.close();
    });

    test('should handle project data export and import', async ({ 
        projectPage, 
        projectData,
        requirementData,
        page 
    }: TestContext) => {
        await projectPage.createProject(projectData);
        
        // Add some content to export
        await projectPage.navigateToRequirementsSection();
        await projectPage.createRequirement(requirementData);
        
        await projectPage.navigateToDocumentsSection();
        await projectPage.createDocument({
            title: 'Test Document',
            content: 'This is test content for export',
        });
        
        // Export project data
        await projectPage.navigateToProjectSettings();
        await projectPage.initiateDataExport();
        
        // Wait for export to complete
        const exportProgress = page.locator('[data-testid="export-progress"]');
        await expect(exportProgress).toBeVisible();
        
        const downloadButton = page.locator('[data-testid="download-export"]');
        await expect(downloadButton).toBeVisible({ timeout: 30000 });
        
        // Test import functionality
        await projectPage.createNewProject();
        await projectPage.fillProjectForm({
            name: 'Imported Project',
            description: 'Project created from import',
            type: 'Software Development',
        });
        
        // Upload export file (simulate file upload)
        const importInput = page.locator('[data-testid="import-file-input"]');
        await importInput.setInputFiles('test-data/project-export.json');
        
        await projectPage.submitProjectCreation();
        
        // Verify imported content
        await projectPage.navigateToRequirementsSection();
        const importedRequirement = page.locator(`[data-testid="requirement-${requirementData.title}"]`);
        await expect(importedRequirement).toBeVisible();
        
        await projectPage.navigateToDocumentsSection();
        const importedDocument = page.locator('[data-testid="document-test-document"]');
        await expect(importedDocument).toBeVisible();
    });

    test('should measure project workflow performance', async ({ 
        projectPage, 
        projectData,
        page 
    }: TestContext) => {
        const performanceMetrics = await PerformanceMonitor.measurePageLoad(page);
        
        const projectCreationTime = await PerformanceMonitor.measureInteraction(page, async () => {
            await projectPage.goto();
            await projectPage.clickCreateNewProject();
            await projectPage.fillProjectForm(projectData);
            await projectPage.submitProjectCreation();
            await page.waitForURL(new RegExp(`/projects/${projectData.name}`));
        });
        
        // Test project loading performance
        const projectLoadTime = await PerformanceMonitor.measureInteraction(page, async () => {
            await page.reload();
            await projectPage.waitForLoad();
        });
        
        // Performance assertions
        expect(performanceMetrics.totalLoadTime).toBeLessThan(3000);
        expect(projectCreationTime).toBeLessThan(8000);
        expect(projectLoadTime).toBeLessThan(2000);
        
        console.log('Project Workflow Performance:', {
            pageLoad: performanceMetrics.totalLoadTime,
            projectCreation: projectCreationTime,
            projectLoad: projectLoadTime,
        });
    });

    test('should handle network interruptions gracefully', async ({ 
        projectPage, 
        projectData,
        page 
    }: TestContext) => {
        await projectPage.goto();
        
        // Start creating a project
        await projectPage.clickCreateNewProject();
        await projectPage.fillProjectForm(projectData);
        
        // Simulate network interruption during creation
        await ErrorSimulator.simulateNetworkError(page);
        
        await projectPage.submitProjectCreation();
        
        // Should show network error and allow retry
        const networkError = page.locator('[data-testid="network-error"]');
        await expect(networkError).toBeVisible();
        
        const retryButton = page.locator('[data-testid="retry-creation"]');
        await expect(retryButton).toBeVisible();
        
        // Restore network and retry
        await page.unroute('**/*');
        await retryButton.click();
        
        // Should complete successfully
        await expect(page).toHaveURL(new RegExp(`/projects/${projectData.name}`));
    });

    test('should handle concurrent project operations', async ({ 
        projectPage, 
        projectData,
        browser,
        page 
    }: TestContext) => {
        await projectPage.createProject(projectData);
        
        // Create another browser context for concurrent operations
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        const projectPage2 = new (await import('../page-objects/project.page')).ProjectPage(page2);
        
        // Login in second context
        await page2.goto('/auth/login');
        // ... login process ...
        
        // Navigate both to the same project
        await Promise.all([
            page.goto(`/projects/${projectData.name}`),
            page2.goto(`/projects/${projectData.name}`),
        ]);
        
        // Perform concurrent edits
        await Promise.all([
            projectPage.navigateToRequirementsSection(),
            projectPage2.navigateToRequirementsSection(),
        ]);
        
        // Create requirements simultaneously
        await Promise.all([
            projectPage.createRequirement({ title: 'Requirement A', description: 'Created by user 1' }),
            projectPage2.createRequirement({ title: 'Requirement B', description: 'Created by user 2' }),
        ]);
        
        // Both requirements should be visible to both users
        await page.reload();
        await page2.reload();
        
        const reqA1 = page.locator('[data-testid="requirement-requirement-a"]');
        const reqB1 = page.locator('[data-testid="requirement-requirement-b"]');
        const reqA2 = page2.locator('[data-testid="requirement-requirement-a"]');
        const reqB2 = page2.locator('[data-testid="requirement-requirement-b"]');
        
        await expect(reqA1).toBeVisible();
        await expect(reqB1).toBeVisible();
        await expect(reqA2).toBeVisible();
        await expect(reqB2).toBeVisible();
        
        await context2.close();
    });
});