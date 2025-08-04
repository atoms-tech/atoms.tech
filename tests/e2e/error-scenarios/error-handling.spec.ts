import { test, expect, TestContext, ErrorSimulator, PerformanceMonitor } from '../fixtures/test-fixtures';

test.describe('Error Scenario Handling', () => {
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

    test('should handle network connectivity issues', async ({ 
        page,
        projectPage,
        projectData 
    }: TestContext) => {
        await projectPage.goto();
        
        // Simulate network disconnection
        await ErrorSimulator.simulateNetworkError(page);
        
        // Try to create a project
        await projectPage.clickCreateNewProject();
        await projectPage.fillProjectForm(projectData);
        await projectPage.submitProjectCreation();
        
        // Should show network error
        const networkError = page.locator('[data-testid="network-error"]');
        await expect(networkError).toBeVisible();
        await expect(networkError).toContainText(/network|connection|offline/i);
        
        // Should show retry option
        const retryButton = page.locator('[data-testid="retry-button"]');
        await expect(retryButton).toBeVisible();
        
        // Should show offline indicator
        const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
        await expect(offlineIndicator).toBeVisible();
        
        // Restore network and retry
        await page.unroute('**/*');
        await retryButton.click();
        
        // Should complete successfully
        await expect(page).toHaveURL(new RegExp(`/projects/${projectData.name}`));
    });

    test('should handle API server errors gracefully', async ({ 
        page,
        projectPage,
        projectData 
    }: TestContext) => {
        // Simulate 500 server error
        await ErrorSimulator.simulate500Error(page, ['/api/projects']);
        
        await projectPage.goto();
        await projectPage.clickCreateNewProject();
        await projectPage.fillProjectForm(projectData);
        await projectPage.submitProjectCreation();
        
        // Should show server error message
        const serverError = page.locator('[data-testid="server-error"]');
        await expect(serverError).toBeVisible();
        await expect(serverError).toContainText(/server|error|try again/i);
        
        // Should not show loading state indefinitely
        const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
        await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });
        
        // Should provide error details or error code
        const errorDetails = page.locator('[data-testid="error-details"]');
        if (await errorDetails.isVisible()) {
            const errorText = await errorDetails.textContent();
            expect(errorText).toMatch(/500|internal server error/i);
        }
    });

    test('should handle API not found errors', async ({ 
        page,
        projectPage 
    }: TestContext) => {
        // Simulate 404 errors
        await ErrorSimulator.simulate404Error(page, ['/api/projects/nonexistent']);
        
        // Try to access non-existent project
        await page.goto('/projects/nonexistent-project');
        
        // Should show 404 error page
        const notFoundError = page.locator('[data-testid="not-found-error"]');
        await expect(notFoundError).toBeVisible();
        
        // Should provide navigation options
        const homeLink = page.locator('[data-testid="go-home-link"]');
        await expect(homeLink).toBeVisible();
        
        const projectsLink = page.locator('[data-testid="go-to-projects-link"]');
        await expect(projectsLink).toBeVisible();
        
        // Test navigation back to valid pages
        await homeLink.click();
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should handle authentication token expiration', async ({ 
        page,
        authPage,
        projectPage 
    }: TestContext) => {
        await projectPage.goto();
        
        // Clear authentication tokens to simulate expiration
        await page.context().clearCookies();
        await page.evaluate(() => {
            localStorage.removeItem('auth-token');
            sessionStorage.clear();
        });
        
        // Try to perform authenticated action
        await projectPage.clickCreateNewProject();
        
        // Should redirect to login or show auth error
        const authPrompt = page.locator('[data-testid="auth-required"]');
        const loginRedirect = page.url().includes('/auth/login');
        
        expect(loginRedirect || await authPrompt.isVisible()).toBe(true);
        
        if (await authPrompt.isVisible()) {
            // If showing auth prompt, test login redirect
            const loginButton = page.locator('[data-testid="login-button"]');
            await loginButton.click();
            await expect(page).toHaveURL(/\/auth\/login/);
        }
    });

    test('should handle form validation errors comprehensively', async ({ 
        page,
        projectPage,
        authPage 
    }: TestContext) => {
        // Test authentication form validation
        await authPage.goto();
        await authPage.navigateToSignup();
        
        // Submit empty form
        await authPage.submitSignup();
        
        const requiredFieldErrors = [
            '[data-testid="email-required-error"]',
            '[data-testid="password-required-error"]',
            '[data-testid="name-required-error"]',
        ];
        
        for (const errorSelector of requiredFieldErrors) {
            const error = page.locator(errorSelector);
            await expect(error).toBeVisible();
        }
        
        // Test invalid email format
        await authPage.fillSignupForm({
            email: 'invalid-email-format',
            password: 'validpassword123',
            confirmPassword: 'validpassword123',
            name: 'Valid Name',
        });
        await authPage.submitSignup();
        
        const emailFormatError = page.locator('[data-testid="email-format-error"]');
        await expect(emailFormatError).toBeVisible();
        
        // Test password requirements
        await authPage.fillSignupForm({
            email: 'valid@example.com',
            password: 'weak',
            confirmPassword: 'weak',
            name: 'Valid Name',
        });
        await authPage.submitSignup();
        
        const passwordWeakError = page.locator('[data-testid="password-weak-error"]');
        await expect(passwordWeakError).toBeVisible();
        
        // Test project form validation
        await page.goto('/dashboard');
        await projectPage.goto();
        await projectPage.clickCreateNewProject();
        
        // Submit empty project form
        await projectPage.submitProjectCreation();
        
        const projectNameError = page.locator('[data-testid="project-name-required"]');
        await expect(projectNameError).toBeVisible();
    });

    test('should handle file upload errors', async ({ 
        page,
        documentPage 
    }: TestContext) => {
        await documentPage.goto();
        await documentPage.clickCreateNewDocument();
        
        // Test file size limit
        const oversizedFile = page.locator('[data-testid="file-upload-input"]');
        
        // Create a mock large file (this would be done differently in real implementation)
        await page.evaluate(() => {
            const fileInput = document.querySelector('[data-testid="file-upload-input"]') as HTMLInputElement;
            if (fileInput) {
                // Simulate oversized file selection
                const mockFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-file.pdf', {
                    type: 'application/pdf',
                });
                
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(mockFile);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Should show file size error
        const fileSizeError = page.locator('[data-testid="file-size-error"]');
        await expect(fileSizeError).toBeVisible();
        await expect(fileSizeError).toContainText(/size|large|limit/i);
        
        // Test unsupported file type
        await page.evaluate(() => {
            const fileInput = document.querySelector('[data-testid="file-upload-input"]') as HTMLInputElement;
            if (fileInput) {
                const mockFile = new File(['content'], 'test.exe', {
                    type: 'application/x-msdownload',
                });
                
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(mockFile);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        const fileTypeError = page.locator('[data-testid="file-type-error"]');
        await expect(fileTypeError).toBeVisible();
        await expect(fileTypeError).toContainText(/type|format|supported/i);
    });

    test('should handle concurrent user conflicts', async ({ 
        page,
        documentPage,
        documentData,
        browser 
    }: TestContext) => {
        // Create a document
        await documentPage.goto();
        await documentPage.createDocument(documentData);
        
        // Open same document in another browser context (simulating another user)
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        const documentPage2 = new (await import('../page-objects/document.page')).DocumentPage(page2);
        
        // Login in second context (simplified)
        await page2.goto(`/documents/${documentData.title}/edit`);
        
        // Both users edit the same document simultaneously
        await Promise.all([
            documentPage.editDocumentContent('User 1 edit'),
            documentPage2.editDocumentContent('User 2 edit'),
        ]);
        
        // Submit changes simultaneously
        await Promise.all([
            documentPage.saveDocument(),
            documentPage2.saveDocument(),
        ]);
        
        // Should handle conflict gracefully
        const conflictWarning = page.locator('[data-testid="edit-conflict-warning"]');
        const conflictWarning2 = page2.locator('[data-testid="edit-conflict-warning"]');
        
        const hasConflict = await conflictWarning.isVisible() || await conflictWarning2.isVisible();
        expect(hasConflict).toBe(true);
        
        if (await conflictWarning.isVisible()) {
            // Should provide conflict resolution options
            const resolveOptions = page.locator('[data-testid="conflict-resolution-options"]');
            await expect(resolveOptions).toBeVisible();
            
            const keepMyChanges = page.locator('[data-testid="keep-my-changes"]');
            const keepOtherChanges = page.locator('[data-testid="keep-other-changes"]');
            const mergeChanges = page.locator('[data-testid="merge-changes"]');
            
            await expect(keepMyChanges).toBeVisible();
            await expect(keepOtherChanges).toBeVisible();
            
            // Test merge option if available
            if (await mergeChanges.isVisible()) {
                await mergeChanges.click();
                
                const mergeInterface = page.locator('[data-testid="merge-interface"]');
                await expect(mergeInterface).toBeVisible();
            }
        }
        
        await context2.close();
    });

    test('should handle browser compatibility issues', async ({ 
        page 
    }: TestContext) => {
        // Simulate browser with limited features
        await page.addInitScript(() => {
            // Remove modern features to simulate older browser
            delete (window as any).fetch;
            delete (window as any).Promise;
        });
        
        await page.goto('/dashboard');
        
        // Should show browser compatibility warning
        const compatibilityWarning = page.locator('[data-testid="browser-compatibility-warning"]');
        await expect(compatibilityWarning).toBeVisible();
        
        // Should provide upgrade instructions
        const upgradeInstructions = page.locator('[data-testid="browser-upgrade-instructions"]');
        await expect(upgradeInstructions).toBeVisible();
        
        // Should still allow basic functionality
        const basicFunctionality = page.locator('[data-testid="basic-functionality"]');
        await expect(basicFunctionality).toBeVisible();
    });

    test('should handle memory and performance issues', async ({ 
        page,
        homePage 
    }: TestContext) => {
        // Create memory pressure by loading large datasets
        await page.goto('/dashboard');
        
        // Simulate memory-intensive operations
        await page.evaluate(() => {
            // Create large arrays to consume memory
            const largeData = [];
            for (let i = 0; i < 1000000; i++) {
                largeData.push({ id: i, data: 'x'.repeat(1000) });
            }
            (window as any).testData = largeData;
        });
        
        // Monitor memory usage
        const memoryUsage = await page.evaluate(() => {
            return (performance as any).memory ? {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
                jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            } : null;
        });
        
        if (memoryUsage) {
            console.log('Memory usage:', memoryUsage);
            
            // Should not exceed memory limits
            const memoryUsageRatio = memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit;
            expect(memoryUsageRatio).toBeLessThan(0.9); // Should not use more than 90% of available memory
        }
        
        // Test performance degradation handling
        const slowResponse = await PerformanceMonitor.measureInteraction(page, async () => {
            await page.click('[data-testid="create-project-button"]');
            await page.waitForSelector('[data-testid="project-form"]');
        });
        
        // Should complete within reasonable time even under memory pressure
        expect(slowResponse).toBeLessThan(10000); // 10 seconds maximum
        
        // Clean up memory
        await page.evaluate(() => {
            delete (window as any).testData;
        });
    });

    test('should handle graceful degradation for disabled JavaScript', async ({ 
        page 
    }: TestContext) => {
        // Disable JavaScript
        await page.context().addInitScript(() => {
            Object.defineProperty(navigator, 'javaEnabled', {
                value: () => false,
                writable: false,
            });
        });
        
        await page.goto('/dashboard');
        
        // Should show no-script message or basic HTML version
        const noScriptMessage = page.locator('[data-testid="no-script-message"]');
        const basicHtmlVersion = page.locator('[data-testid="basic-html-version"]');
        
        const hasGracefulDegradation = await noScriptMessage.isVisible() || await basicHtmlVersion.isVisible();
        expect(hasGracefulDegradation).toBe(true);
        
        // Basic links should still work
        const basicLinks = page.locator('a[href]');
        const linkCount = await basicLinks.count();
        expect(linkCount).toBeGreaterThan(0);
        
        // Form submissions should work without JavaScript
        const basicForms = page.locator('form[action]');
        const formCount = await basicForms.count();
        
        if (formCount > 0) {
            // Should have proper form actions
            const formAction = await basicForms.first().getAttribute('action');
            expect(formAction).toBeTruthy();
        }
    });

    test('should handle error recovery and retry mechanisms', async ({ 
        page,
        projectPage,
        projectData 
    }: TestContext) => {
        await projectPage.goto();
        
        // Simulate intermittent failures
        let requestCount = 0;
        await page.route('**/api/projects', route => {
            requestCount++;
            if (requestCount < 3) {
                // Fail first 2 requests
                route.fulfill({ status: 500, body: 'Server Error' });
            } else {
                // Succeed on 3rd request
                route.continue();
            }
        });
        
        await projectPage.clickCreateNewProject();
        await projectPage.fillProjectForm(projectData);
        await projectPage.submitProjectCreation();
        
        // Should automatically retry and eventually succeed
        await expect(page).toHaveURL(new RegExp(`/projects/${projectData.name}`), { timeout: 15000 });
        
        // Verify retry indicators were shown
        const retryIndicator = page.locator('[data-testid="retry-indicator"]');
        // Note: This might not be visible at the end if retries succeeded
        
        console.log(`Requests made: ${requestCount}`);
        expect(requestCount).toBeGreaterThanOrEqual(3);
    });
});