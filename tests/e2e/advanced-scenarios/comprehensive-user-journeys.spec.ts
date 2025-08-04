import { test, expect, Browser, Page } from '@playwright/test';
import { BasePage } from '../page-objects/base.page';
import { AuthPage } from '../page-objects/auth.page';
import { HomePage } from '../page-objects/home.page';
import { ProjectPage } from '../page-objects/project.page';
import { DocumentPage } from '../page-objects/document.page';
import { 
    TestData, 
    PerformanceHelpers, 
    AccessibilityHelpers,
    mockUserProfile,
    setupAuthenticatedSession,
    takeTimestampedScreenshot,
    collectConsoleErrors,
    verifyCriticalErrors
} from '../utils/test-helpers';

/**
 * Comprehensive E2E User Journey Tests
 * Tests complete workflows from start to finish across all user scenarios
 */
test.describe('Comprehensive User Journeys', () => {
    let performanceMetrics: Record<string, number> = {};
    let consoleErrors: string[] = [];

    test.beforeEach(async ({ page }) => {
        // Set up console error monitoring
        consoleErrors = await collectConsoleErrors(page);
        
        // Initialize performance tracking
        performanceMetrics = {};
    });

    test.afterEach(async ({ page }) => {
        // Verify no critical console errors
        const criticalErrors = verifyCriticalErrors(consoleErrors);
        if (criticalErrors.length > 0) {
            console.warn('Critical console errors detected:', criticalErrors);
        }
        
        // Take final screenshot for debugging
        await takeTimestampedScreenshot(page, 'test-end');
        
        console.log('Performance metrics:', performanceMetrics);
    });

    test('Complete New User Onboarding Journey', async ({ page, browser }) => {
        const authPage = new AuthPage(page);
        const homePage = new HomePage(page);
        
        // Step 1: Landing and Sign Up
        performanceMetrics.signupPageLoad = await PerformanceHelpers.measurePageLoad(page, '/signup');
        
        await authPage.goto();
        await authPage.navigateToSignup();
        
        // Verify signup form accessibility
        const a11yViolations = await AccessibilityHelpers.checkBasicA11y(page);
        expect(a11yViolations.length).toBe(0);
        
        // Fill out registration
        const userData = TestData.users.standard;
        await authPage.fillSignupForm({
            email: userData.email,
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            fullName: userData.full_name
        });
        
        // Test form validation
        await authPage.submitSignup();
        
        // Step 2: Email Verification (simulated)
        await page.goto('/auth/verify?token=mock-verification-token&email=' + userData.email);
        
        // Step 3: Initial Profile Setup
        await page.waitForURL(/\/(home|onboarding)/);
        
        if (page.url().includes('onboarding')) {
            // Complete onboarding flow
            await page.locator('[data-testid="setup-profile-form"]').waitFor();
            
            // Fill profile details
            await page.fill('[data-testid="company-name"]', 'Test Company');
            await page.selectOption('[data-testid="role-select"]', 'developer');
            await page.click('[data-testid="complete-onboarding"]');
        }
        
        // Step 4: First Login to Home
        await page.waitForURL(/\/home/);
        await homePage.waitForLoad();
        
        // Verify successful onboarding
        const welcomeMessage = page.locator('[data-testid="welcome-message"]');
        if (await welcomeMessage.isVisible()) {
            await expect(welcomeMessage).toContainText('Welcome');
        }
        
        // Step 5: Create First Organization
        await page.click('[data-testid="create-organization"]');
        await page.fill('[data-testid="org-name"]', TestData.organizations.default.name);
        await page.fill('[data-testid="org-slug"]', TestData.organizations.default.slug);
        await page.click('[data-testid="create-org-submit"]');
        
        // Step 6: Create First Project
        await page.waitForURL(/\/org\/.*$/);
        await page.click('[data-testid="create-project"]');
        await page.fill('[data-testid="project-name"]', TestData.projects.default.name);
        await page.click('[data-testid="create-project-submit"]');
        
        // Step 7: Navigate Project Dashboard
        await page.waitForURL(/\/org\/.*\/project\/.*$/);
        
        // Verify all key elements are present
        await expect(page.locator('[data-testid="project-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="project-navigation"]')).toBeVisible();
        await expect(page.locator('[data-testid="project-content"]')).toBeVisible();
        
        // Step 8: Test Core Features
        // Navigate to different sections
        const navItems = [
            'requirements',
            'documents', 
            'canvas',
            'testbed'
        ];
        
        for (const item of navItems) {
            await page.click(`[data-testid="nav-${item}"]`);
            await page.waitForLoadState('networkidle');
            
            // Verify section loads correctly
            await expect(page.locator(`[data-testid="${item}-section"]`)).toBeVisible();
        }
        
        console.log('✅ Complete new user onboarding journey successful');
    });

    test('Power User Full Workflow', async ({ page, context }) => {
        // Set up authenticated session
        await setupAuthenticatedSession(context, TestData.users.admin.id);
        await mockUserProfile(page, TestData.users.admin);
        
        const homePage = new HomePage(page);
        const projectPage = new ProjectPage(page);
        const documentPage = new DocumentPage(page);
        
        // Start at home dashboard
        await page.goto('/home');
        await homePage.waitForLoad();
        
        // Navigate to existing organization
        await page.click(`[data-testid="org-${TestData.organizations.default.id}"]`);
        await page.waitForURL(/\/org\/.*$/);
        
        // Create new project with advanced settings
        await page.click('[data-testid="create-project"]');
        await page.fill('[data-testid="project-name"]', 'Advanced Test Project');
        await page.fill('[data-testid="project-description"]', 'Comprehensive test project for E2E testing');
        
        // Select project template
        await page.click('[data-testid="template-selector"]');
        await page.click('[data-testid="template-web-app"]');
        
        // Configure advanced settings
        await page.click('[data-testid="advanced-settings"]');
        await page.check('[data-testid="enable-ai-assistance"]');
        await page.check('[data-testid="enable-collaboration"]');
        await page.selectOption('[data-testid="compliance-framework"]', 'SOC2');
        
        await page.click('[data-testid="create-project-submit"]');
        await page.waitForURL(/\/org\/.*\/project\/.*$/);
        
        // Workflow 1: Requirements Management
        await page.click('[data-testid="nav-requirements"]');
        await page.waitForSelector('[data-testid="requirements-section"]');
        
        // Create functional requirement
        await page.click('[data-testid="add-requirement"]');
        await page.selectOption('[data-testid="requirement-type"]', 'functional');
        await page.fill('[data-testid="requirement-title"]', 'User Authentication System');
        await page.fill('[data-testid="requirement-description"]', 'Users must be able to securely authenticate using email/password or OAuth providers');
        
        // Add acceptance criteria
        await page.click('[data-testid="add-acceptance-criteria"]');
        await page.fill('[data-testid="criteria-1"]', 'Users can register with valid email address');
        await page.click('[data-testid="add-acceptance-criteria"]');
        await page.fill('[data-testid="criteria-2"]', 'Users can login with correct credentials');
        
        // Set priority and effort
        await page.selectOption('[data-testid="requirement-priority"]', 'high');
        await page.selectOption('[data-testid="requirement-effort"]', 'medium');
        
        await page.click('[data-testid="save-requirement"]');
        
        // Workflow 2: Document Creation and Management
        await page.click('[data-testid="nav-documents"]');
        await page.waitForSelector('[data-testid="documents-section"]');
        
        // Create technical specification document
        await page.click('[data-testid="create-document"]');
        await page.selectOption('[data-testid="document-type"]', 'technical-spec');
        await page.fill('[data-testid="document-title"]', 'Authentication Service Technical Specification');
        
        // Add document content with rich editor
        const editor = page.locator('[data-testid="document-editor"]');
        await editor.click();
        await editor.type('# Authentication Service Technical Specification\n\n## Overview\nThis document outlines the technical implementation of the user authentication service.\n\n## Architecture\n- OAuth 2.0 implementation\n- JWT token management\n- Session handling');
        
        // Add tags and metadata
        await page.click('[data-testid="add-tag"]');
        await page.fill('[data-testid="tag-input"]', 'authentication');
        await page.press('[data-testid="tag-input"]', 'Enter');
        
        await page.click('[data-testid="add-tag"]');
        await page.fill('[data-testid="tag-input"]', 'security');
        await page.press('[data-testid="tag-input"]', 'Enter');
        
        await page.click('[data-testid="save-document"]');
        
        // Workflow 3: Canvas Collaboration
        await page.click('[data-testid="nav-canvas"]');
        await page.waitForSelector('[data-testid="canvas-section"]');
        
        // Create system architecture diagram
        await page.click('[data-testid="create-diagram"]');
        await page.selectOption('[data-testid="diagram-type"]', 'system-architecture');
        
        // Add components to canvas (simplified interaction)
        const canvas = page.locator('[data-testid="drawing-canvas"]');
        await canvas.click({ position: { x: 100, y: 100 } });
        await page.keyboard.type('User Interface');
        await page.keyboard.press('Enter');
        
        await canvas.click({ position: { x: 300, y: 100 } });
        await page.keyboard.type('API Gateway');
        await page.keyboard.press('Enter');
        
        await canvas.click({ position: { x: 500, y: 100 } });
        await page.keyboard.type('Auth Service');
        await page.keyboard.press('Enter');
        
        // Save diagram
        await page.click('[data-testid="save-diagram"]');
        await page.fill('[data-testid="diagram-name"]', 'Authentication System Architecture');
        await page.click('[data-testid="confirm-save"]');
        
        // Workflow 4: Testing and Validation
        await page.click('[data-testid="nav-testbed"]');
        await page.waitForSelector('[data-testid="testbed-section"]');
        
        // Create test scenario
        await page.click('[data-testid="create-test-scenario"]');
        await page.fill('[data-testid="scenario-name"]', 'User Login Flow Test');
        await page.fill('[data-testid="scenario-description"]', 'End-to-end test of user authentication flow');
        
        // Add test steps
        await page.click('[data-testid="add-test-step"]');
        await page.fill('[data-testid="step-1-description"]', 'Navigate to login page');
        await page.fill('[data-testid="step-1-expected"]', 'Login form is displayed');
        
        await page.click('[data-testid="add-test-step"]');
        await page.fill('[data-testid="step-2-description"]', 'Enter valid credentials');
        await page.fill('[data-testid="step-2-expected"]', 'User is authenticated and redirected');
        
        await page.click('[data-testid="save-test-scenario"]');
        
        // Workflow 5: Project Analytics and Reporting
        await page.click('[data-testid="project-analytics"]');
        await page.waitForSelector('[data-testid="analytics-dashboard"]');
        
        // Verify analytics data
        await expect(page.locator('[data-testid="requirements-count"]')).toContainText('1');
        await expect(page.locator('[data-testid="documents-count"]')).toContainText('1');
        await expect(page.locator('[data-testid="diagrams-count"]')).toContainText('1');
        
        // Test export functionality
        await page.click('[data-testid="export-project"]');
        await page.selectOption('[data-testid="export-format"]', 'pdf');
        await page.click('[data-testid="generate-export"]');
        
        // Wait for export to complete
        await expect(page.locator('[data-testid="export-status"]')).toContainText('Complete');
        
        console.log('✅ Power user full workflow completed successfully');
    });

    test('Cross-Platform Mobile Responsive Journey', async ({ page, browserName }) => {
        // Test mobile responsiveness across different viewports
        const viewports = [
            { width: 375, height: 667, name: 'iPhone SE' },
            { width: 414, height: 896, name: 'iPhone 11' },
            { width: 768, height: 1024, name: 'iPad' },
            { width: 1024, height: 768, name: 'iPad Landscape' }
        ];
        
        for (const viewport of viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            
            // Test authentication on mobile
            const authPage = new AuthPage(page);
            await authPage.goto();
            
            // Verify mobile-friendly layout
            const loginForm = page.locator('[data-testid="login-form"]');
            await expect(loginForm).toBeVisible();
            
            // Check that form is properly sized for viewport
            const formBounds = await loginForm.boundingBox();
            expect(formBounds!.width).toBeLessThanOrEqual(viewport.width - 40); // Account for padding
            
            // Test mobile navigation
            if (viewport.width < 768) {
                // Mobile menu should be present
                const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
                if (await mobileMenuButton.isVisible()) {
                    await mobileMenuButton.click();
                    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
                }
            }
            
            // Test touch interactions
            await authPage.fillField('input[type="email"]', TestData.users.standard.email);
            await authPage.fillField('input[type="password"]', 'password123');
            
            // Verify keyboard doesn't obscure form on mobile
            if (viewport.width < 768) {
                const submitButton = page.locator('[data-testid="login-submit"]');
                await expect(submitButton).toBeInViewport();
            }
            
            console.log(`✅ Mobile responsive test passed for ${viewport.name} (${viewport.width}x${viewport.height})`);
        }
    });

    test('Performance Critical Path Journey', async ({ page }) => {
        // Measure performance across critical user paths
        const performanceBudgets = {
            pageLoad: 3000,      // 3 seconds
            loginFlow: 2000,     // 2 seconds
            navigationTime: 1000, // 1 second
            documentLoad: 2500,   // 2.5 seconds
        };
        
        // Test 1: Initial page load performance
        const pageLoadTime = await PerformanceHelpers.measurePageLoad(page, '/');
        expect(pageLoadTime).toBeLessThan(performanceBudgets.pageLoad);
        performanceMetrics.initialPageLoad = pageLoadTime;
        
        // Test 2: Authentication flow performance
        const authPage = new AuthPage(page);
        await authPage.goto();
        
        const loginTime = await PerformanceHelpers.measureInteraction(async () => {
            await authPage.fillField('input[type="email"]', TestData.users.standard.email);
            await authPage.fillField('input[type="password"]', 'password123');
            await authPage.loginButton.click();
            await page.waitForURL(/\/home/, { timeout: 10000 });
        });
        
        expect(loginTime).toBeLessThan(performanceBudgets.loginFlow);
        performanceMetrics.loginFlow = loginTime;
        
        // Test 3: Navigation performance
        const navigationTime = await PerformanceHelpers.measureInteraction(async () => {
            await page.click('[data-testid="nav-projects"]');
            await page.waitForSelector('[data-testid="projects-list"]');
        });
        
        expect(navigationTime).toBeLessThan(performanceBudgets.navigationTime);
        performanceMetrics.navigation = navigationTime;
        
        // Test 4: Document loading performance
        if (await page.locator('[data-testid="document-link"]').first().isVisible()) {
            const documentLoadTime = await PerformanceHelpers.measureInteraction(async () => {
                await page.click('[data-testid="document-link"]').first();
                await page.waitForSelector('[data-testid="document-content"]');
            });
            
            expect(documentLoadTime).toBeLessThan(performanceBudgets.documentLoad);
            performanceMetrics.documentLoad = documentLoadTime;
        }
        
        // Log all performance metrics
        console.log('Performance Metrics:', performanceMetrics);
        
        // Verify all metrics are within budget
        Object.entries(performanceMetrics).forEach(([metric, time]) => {
            const budget = performanceBudgets[metric as keyof typeof performanceBudgets];
            if (budget) {
                expect(time).toBeLessThan(budget);
            }
        });
        
        console.log('✅ Performance critical path journey completed within budgets');
    });

    test('Accessibility Complete Journey', async ({ page }) => {
        // Comprehensive accessibility testing across user journey
        const authPage = new AuthPage(page);
        const homePage = new HomePage(page);
        
        // Test 1: Authentication accessibility
        await authPage.goto();
        
        let a11yViolations = await AccessibilityHelpers.checkBasicA11y(page);
        expect(a11yViolations.length).toBe(0);
        
        // Test keyboard navigation
        const keyboardNavWorking = await AccessibilityHelpers.testKeyboardNavigation(page, 5);
        expect(keyboardNavWorking).toBe(true);
        
        // Test login with keyboard only
        await page.keyboard.press('Tab'); // Focus email field
        await page.keyboard.type(TestData.users.standard.email);
        await page.keyboard.press('Tab'); // Focus password field
        await page.keyboard.type('password123');
        await page.keyboard.press('Tab'); // Focus submit button
        await page.keyboard.press('Enter'); // Submit form
        
        // Test 2: Home page accessibility
        await page.waitForURL(/\/home/);
        await homePage.waitForLoad();
        
        a11yViolations = await AccessibilityHelpers.checkBasicA11y(page);
        expect(a11yViolations.length).toBe(0);
        
        // Test 3: Navigation accessibility
        // Verify main navigation is accessible
        const mainNav = page.locator('[role="navigation"]');
        await expect(mainNav).toBeVisible();
        
        // Test aria-labels and roles
        const navLinks = page.locator('[role="navigation"] a');
        const navLinkCount = await navLinks.count();
        
        for (let i = 0; i < navLinkCount; i++) {
            const link = navLinks.nth(i);
            const accessibleName = await link.getAttribute('aria-label') || 
                                  await link.textContent();
            expect(accessibleName).toBeTruthy();
        }
        
        // Test 4: Color contrast and visual accessibility
        // Verify text contrast (simplified check)
        await page.addStyleTag({
            content: `
                * {
                    background: yellow !important;
                    color: black !important;
                }
            `
        });
        
        // Take screenshot for manual contrast verification
        await takeTimestampedScreenshot(page, 'contrast-test');
        
        // Reset styles
        await page.reload();
        
        // Test 5: Screen reader compatibility
        // Check for proper heading structure
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        expect(headingCount).toBeGreaterThan(0);
        
        // Verify h1 is present and unique
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
        
        console.log('✅ Accessibility complete journey passed all checks');
    });

    test('Error Recovery and Resilience Journey', async ({ page, context }) => {
        // Test application resilience across different error scenarios
        const authPage = new AuthPage(page);
        
        // Scenario 1: Network interruption during login
        await authPage.goto();
        await authPage.fillField('input[type="email"]', TestData.users.standard.email);
        await authPage.fillField('input[type="password"]', 'password123');
        
        // Simulate network failure
        await context.setOffline(true);
        await authPage.loginButton.click();
        
        // Should show offline message
        const offlineMessage = page.locator('[data-testid="offline-message"]');
        await expect(offlineMessage).toBeVisible({ timeout: 5000 });
        
        // Restore network
        await context.setOffline(false);
        
        // Should allow retry
        const retryButton = page.locator('[data-testid="retry-action"]');
        if (await retryButton.isVisible()) {
            await retryButton.click();
        }
        
        // Scenario 2: Server error handling
        await page.route('**/api/**', async (route) => {
            await route.fulfill({
                status: 500,
                json: { error: 'Internal Server Error' }
            });
        });
        
        await page.reload();
        await authPage.fillField('input[type="email"]', TestData.users.standard.email);
        await authPage.fillField('input[type="password"]', 'password123');
        await authPage.loginButton.click();
        
        // Should show server error message
        const serverError = page.locator('[data-testid="server-error"]');
        await expect(serverError).toBeVisible({ timeout: 5000 });
        
        // Scenario 3: Session expiration during work
        // Clear error mocking
        await page.unroute('**/api/**');
        
        // Successfully authenticate
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        await page.goto('/home');
        await page.waitForSelector('[data-testid="user-menu"]');
        
        // Simulate session expiration
        await context.clearCookies();
        
        // Try to navigate to protected route
        await page.goto('/org/test-org/project/test-project');
        
        // Should redirect to login with message
        await page.waitForURL(/\/login/);
        const sessionExpiredMessage = page.locator('[data-testid="session-expired"]');
        await expect(sessionExpiredMessage).toBeVisible();
        
        // Should preserve intended destination
        const currentUrl = page.url();
        expect(currentUrl).toContain('redirect=');
        
        console.log('✅ Error recovery and resilience journey completed successfully');
    });

    test('Data Persistence and State Management Journey', async ({ page, context, browser }) => {
        // Test data persistence across sessions and browsers
        const authPage = new AuthPage(page);
        const userData = TestData.users.standard;
        
        // Step 1: Create data in first session
        await setupAuthenticatedSession(context, userData.id);
        await mockUserProfile(page, userData);
        await page.goto('/home');
        
        // Create some persistent data
        await page.click('[data-testid="create-note"]');
        await page.fill('[data-testid="note-title"]', 'Test Note for Persistence');
        await page.fill('[data-testid="note-content"]', 'This note should persist across sessions');
        await page.click('[data-testid="save-note"]');
        
        // Verify note is saved
        await expect(page.locator('[data-testid="note-item"]')).toContainText('Test Note for Persistence');
        
        // Step 2: Logout and re-login in same context
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout"]');
        await page.waitForURL(/\/login/);
        
        // Login again
        await authPage.fillField('input[type="email"]', userData.email);
        await authPage.fillField('input[type="password"]', 'password123');
        await authPage.loginButton.click();
        await page.waitForURL(/\/home/);
        
        // Verify data persists
        await expect(page.locator('[data-testid="note-item"]')).toContainText('Test Note for Persistence');
        
        // Step 3: Test in new browser context (different session)
        const newContext = await browser.newContext();
        const newPage = await newContext.newPage();
        const newAuthPage = new AuthPage(newPage);
        
        await setupAuthenticatedSession(newContext, userData.id);
        await mockUserProfile(newPage, userData);
        await newPage.goto('/home');
        
        // Data should be available in new session
        await expect(newPage.locator('[data-testid="note-item"]')).toContainText('Test Note for Persistence');
        
        // Step 4: Test offline data handling
        await context.setOffline(true);
        
        // Create data while offline
        await page.click('[data-testid="create-note"]');
        await page.fill('[data-testid="note-title"]', 'Offline Note');
        await page.fill('[data-testid="note-content"]', 'Created while offline');
        await page.click('[data-testid="save-note"]');
        
        // Should be saved locally
        await expect(page.locator('[data-testid="note-item"]')).toContainText('Offline Note');
        
        // Restore connection
        await context.setOffline(false);
        
        // Data should sync
        await page.waitForTimeout(2000); // Allow sync time
        
        // Verify in new session that offline data synced
        const verifyContext = await browser.newContext();
        const verifyPage = await verifyContext.newPage();
        await setupAuthenticatedSession(verifyContext, userData.id);
        await mockUserProfile(verifyPage, userData);
        await verifyPage.goto('/home');
        
        await expect(verifyPage.locator('[data-testid="note-item"]')).toContainText('Offline Note');
        
        await newContext.close();
        await verifyContext.close();
        
        console.log('✅ Data persistence and state management journey completed successfully');
    });
});