import { test, expect, TestContext, PerformanceMonitor, ErrorSimulator } from '../fixtures/test-fixtures';

test.describe('Complete Authentication Journey', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing authentication state
        await page.context().clearCookies();
        await page.context().clearPermissions();
    });

    test('should complete full signup and verification flow', async ({ 
        authPage, 
        homePage, 
        userData,
        page 
    }: TestContext) => {
        // Performance monitoring
        const performanceStart = Date.now();

        // Navigate to signup
        await authPage.goto();
        await authPage.navigateToSignup();

        // Fill signup form
        await authPage.fillSignupForm({
            email: userData.email,
            password: userData.password,
            confirmPassword: userData.password,
            name: userData.name,
        });

        // Submit signup
        await authPage.submitSignup();

        // Verify email verification prompt
        await expect(page.locator('[data-testid="email-verification-prompt"]')).toBeVisible();

        // Simulate email verification (in a real test, you'd check email)
        // For now, we'll mock the verification
        await page.goto('/auth/verify?token=mock-verification-token');

        // Should redirect to onboarding or dashboard
        await page.waitForURL(/\/(dashboard|onboarding)/);

        // Measure performance
        const performanceEnd = Date.now();
        const signupTime = performanceEnd - performanceStart;
        
        console.log(`Signup flow completed in ${signupTime}ms`);
        expect(signupTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle login with email and password', async ({ 
        authPage, 
        homePage, 
        userData,
        page 
    }: TestContext) => {
        // Assume user already exists (you might need to create one first)
        await authPage.goto();
        
        // Fill login form
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });

        // Submit login
        await authPage.submitLogin();

        // Wait for successful login
        await homePage.waitForLoad();
        
        // Verify we're on the dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        
        // Verify user is logged in
        const userMenu = page.locator('[data-testid="user-menu"]');
        await expect(userMenu).toBeVisible();
    });

    test('should handle GitHub OAuth flow', async ({ 
        authPage, 
        page,
        context 
    }: TestContext) => {
        await authPage.goto();
        
        // Click GitHub login button
        const githubLoginButton = page.locator('[data-testid="github-login"]');
        await expect(githubLoginButton).toBeVisible();
        
        // Handle OAuth popup/redirect
        const [popup] = await Promise.all([
            context.waitForEvent('page'),
            githubLoginButton.click(),
        ]);

        // In a real test, you'd handle the GitHub OAuth flow
        // For now, we'll simulate a successful OAuth return
        await page.goto('/auth/callback?provider=github&code=mock-auth-code');
        
        // Should redirect to dashboard
        await page.waitForURL(/\/dashboard/);
        
        // Verify successful login
        const userMenu = page.locator('[data-testid="user-menu"]');
        await expect(userMenu).toBeVisible();
    });

    test('should handle logout flow properly', async ({ 
        authPage, 
        homePage, 
        navigationPage,
        userData,
        page 
    }: TestContext) => {
        // Login first
        await authPage.goto();
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        await authPage.submitLogin();
        await homePage.waitForLoad();

        // Navigate to user menu and logout
        await navigationPage.openUserMenu();
        await navigationPage.clickLogout();

        // Verify redirect to login page
        await page.waitForURL(/\/auth\/login/);
        
        // Verify logout was successful
        const loginForm = page.locator('[data-testid="login-form"]');
        await expect(loginForm).toBeVisible();
        
        // Verify no user data persists
        const userMenu = page.locator('[data-testid="user-menu"]');
        await expect(userMenu).not.toBeVisible();
    });

    test('should handle session expiration gracefully', async ({ 
        authPage, 
        homePage, 
        userData,
        page 
    }: TestContext) => {
        // Login first
        await authPage.goto();
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        await authPage.submitLogin();
        await homePage.waitForLoad();

        // Simulate session expiration by clearing auth cookies
        await page.context().clearCookies();
        
        // Try to access a protected route
        await page.goto('/dashboard/projects');
        
        // Should redirect to login
        await page.waitForURL(/\/auth\/login/);
        
        // Should show session expired message
        const sessionMessage = page.locator('[data-testid="session-expired-message"]');
        await expect(sessionMessage).toBeVisible();
    });

    test('should validate form inputs properly', async ({ 
        authPage,
        page 
    }: TestContext) => {
        await authPage.goto();
        
        // Test invalid email
        await authPage.fillSignupForm({
            email: 'invalid-email',
            password: 'password123',
            confirmPassword: 'password123',
            name: 'Test User',
        });
        
        await authPage.submitSignup();
        
        // Should show email validation error
        const emailError = page.locator('[data-testid="email-error"]');
        await expect(emailError).toBeVisible();
        await expect(emailError).toContainText('valid email');

        // Test password mismatch
        await authPage.fillSignupForm({
            email: 'test@example.com',
            password: 'password123',
            confirmPassword: 'different-password',
            name: 'Test User',
        });
        
        await authPage.submitSignup();
        
        // Should show password mismatch error
        const passwordError = page.locator('[data-testid="password-mismatch-error"]');
        await expect(passwordError).toBeVisible();
    });

    test('should handle network errors during authentication', async ({ 
        authPage, 
        userData,
        page 
    }: TestContext) => {
        await authPage.goto();
        
        // Simulate network error
        await ErrorSimulator.simulateNetworkError(page);
        
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        
        await authPage.submitLogin();
        
        // Should show network error message
        const errorMessage = page.locator('[data-testid="network-error"]');
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText('network');
        
        // Should show retry button
        const retryButton = page.locator('[data-testid="retry-login"]');
        await expect(retryButton).toBeVisible();
    });

    test('should remember user preferences after login', async ({ 
        authPage, 
        homePage, 
        settingsPage,
        userData,
        page 
    }: TestContext) => {
        // Login
        await authPage.goto();
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        await authPage.submitLogin();
        await homePage.waitForLoad();

        // Set some preferences
        await settingsPage.goto();
        await settingsPage.setTheme('dark');
        await settingsPage.setLanguage('en');
        
        // Logout and login again
        await authPage.logout();
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        await authPage.submitLogin();
        
        // Verify preferences are maintained
        await settingsPage.goto();
        const theme = await settingsPage.getCurrentTheme();
        const language = await settingsPage.getCurrentLanguage();
        
        expect(theme).toBe('dark');
        expect(language).toBe('en');
    });

    test('should handle concurrent login attempts', async ({ 
        userData,
        browser 
    }: TestContext) => {
        // Create multiple contexts to simulate different browser sessions
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();
        
        const authPage1 = new (await import('../page-objects/auth.page')).AuthPage(page1);
        const authPage2 = new (await import('../page-objects/auth.page')).AuthPage(page2);
        
        // Attempt login from both contexts simultaneously
        await Promise.all([
            authPage1.goto(),
            authPage2.goto(),
        ]);
        
        await Promise.all([
            authPage1.fillLoginForm({ email: userData.email, password: userData.password }),
            authPage2.fillLoginForm({ email: userData.email, password: userData.password }),
        ]);
        
        await Promise.all([
            authPage1.submitLogin(),
            authPage2.submitLogin(),
        ]);
        
        // Both should succeed (or one should handle concurrent session appropriately)
        await Promise.all([
            page1.waitForURL(/\/dashboard/),
            page2.waitForURL(/\/dashboard/),
        ]);
        
        // Verify both sessions are valid
        const userMenu1 = page1.locator('[data-testid="user-menu"]');
        const userMenu2 = page2.locator('[data-testid="user-menu"]');
        
        await expect(userMenu1).toBeVisible();
        await expect(userMenu2).toBeVisible();
        
        await context1.close();
        await context2.close();
    });

    test('should measure authentication performance', async ({ 
        authPage, 
        userData,
        page 
    }: TestContext) => {
        const performanceMetrics = await PerformanceMonitor.measurePageLoad(page);
        
        await authPage.goto();
        
        const loginTime = await PerformanceMonitor.measureInteraction(page, async () => {
            await authPage.fillLoginForm({
                email: userData.email,
                password: userData.password,
            });
            await authPage.submitLogin();
            await page.waitForURL(/\/dashboard/);
        });
        
        // Performance assertions
        expect(performanceMetrics.totalLoadTime).toBeLessThan(3000);
        expect(loginTime).toBeLessThan(5000);
        
        console.log('Authentication Performance:', {
            pageLoad: performanceMetrics.totalLoadTime,
            loginFlow: loginTime,
        });
    });
});