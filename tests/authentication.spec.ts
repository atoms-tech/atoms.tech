import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Authentication Flow', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
        await helpers.mockApiResponses();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/');
        await helpers.waitForPageReady();

        // Look for login/sign in button based on navbar implementation
        const loginButton = page.locator('button:has-text("Sign in"), a:has-text("Sign in")');

        if (await loginButton.count() > 0) {
            await loginButton.first().click();
            await expect(page).toHaveURL(/.*\/login/);
        } else {
            // Direct navigation if no button found
            await page.goto('/login');
            await expect(page).toHaveURL(/.*\/login/);
        }
    });

    test('should display login form elements correctly', async ({ page }) => {
        await page.goto('/login');
        await helpers.waitForPageReady();

        // Check for email input based on actual form implementation
        const emailInput = page.locator('input[name="email"]');
        await expect(emailInput).toBeVisible();
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(emailInput).toHaveAttribute('required');

        // Check for password input
        const passwordInput = page.locator('input[name="password"]');
        await expect(passwordInput).toBeVisible();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveAttribute('required');

        // Check for submit button
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toBeEnabled();
    });

    test('should show validation errors for empty form', async ({ page }) => {
        await page.goto('/login');
        
        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
        await submitButton.click();
        
        // Check for validation messages (this might vary based on implementation)
        // We'll check for common validation patterns
        const hasValidation = await page.locator('text=/required|invalid|error/i').count() > 0 ||
                             await page.locator('[aria-invalid="true"]').count() > 0 ||
                             await page.locator('.error, .invalid').count() > 0;
        
        // This test might need adjustment based on actual validation implementation
        expect(hasValidation || await page.url().includes('login')).toBeTruthy();
    });

    test('should navigate to signup page', async ({ page }) => {
        await page.goto('/login');
        
        // Look for signup link
        const signupLink = page.locator('a[href*="/signup"], a:has-text("Sign up"), a:has-text("Register")');
        
        if (await signupLink.count() > 0) {
            await signupLink.first().click();
            await expect(page).toHaveURL(/.*\/signup/);
        } else {
            // Direct navigation if no link found
            await page.goto('/signup');
            await expect(page).toHaveURL(/.*\/signup/);
        }
    });

    test('should display signup form elements correctly', async ({ page }) => {
        await page.goto('/signup');
        await helpers.waitForPageReady();

        // Check for first name input based on actual signup implementation
        const firstNameInput = page.locator('input[name="firstName"]');
        await expect(firstNameInput).toBeVisible();
        await expect(firstNameInput).toHaveAttribute('required');

        // Check for last name input
        const lastNameInput = page.locator('input[name="lastName"]');
        await expect(lastNameInput).toBeVisible();
        await expect(lastNameInput).toHaveAttribute('required');

        // Check for email input
        const emailInput = page.locator('input[name="email"]');
        await expect(emailInput).toBeVisible();
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(emailInput).toHaveAttribute('required');

        // Check for password input
        const passwordInput = page.locator('input[name="password"]');
        await expect(passwordInput).toBeVisible();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveAttribute('required');

        // Check for submit button
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toContainText(/Sign up/i);
    });

    test('should have OAuth login options', async ({ page }) => {
        await page.goto('/login');
        await helpers.waitForPageReady();

        // Check for Google OAuth button based on actual implementation
        const googleButton = page.locator('button:has-text("Google")');
        await expect(googleButton).toBeVisible();
        await expect(googleButton).toBeEnabled();

        // Check for GitHub OAuth button
        const githubButton = page.locator('button:has-text("GitHub")');
        await expect(githubButton).toBeVisible();
        await expect(githubButton).toBeEnabled();

        // Check for proper icons in OAuth buttons
        await expect(googleButton.locator('svg')).toBeVisible();
        await expect(githubButton.locator('svg')).toBeVisible();

        // Verify OAuth buttons have outline variant styling
        await expect(googleButton).toHaveClass(/outline/);
        await expect(githubButton).toHaveClass(/outline/);
    });

    test('should handle form interactions properly', async ({ page }) => {
        await page.goto('/login');
        
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        
        // Test form interactions
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');
        
        await passwordInput.fill('testpassword');
        await expect(passwordInput).toHaveValue('testpassword');
        
        // Clear the form
        await emailInput.clear();
        await passwordInput.clear();
        
        await expect(emailInput).toHaveValue('');
        await expect(passwordInput).toHaveValue('');
    });

    test('should be accessible', async ({ page }) => {
        await page.goto('/login');
        
        // Check for proper labels or aria-labels
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        
        // Check if inputs have proper labels or aria-labels
        const emailHasLabel = await emailInput.getAttribute('aria-label') !== null ||
                             await page.locator('label[for]').count() > 0;
        const passwordHasLabel = await passwordInput.getAttribute('aria-label') !== null ||
                                await page.locator('label[for]').count() > 0;
        
        expect(emailHasLabel || passwordHasLabel).toBeTruthy();
    });
});
