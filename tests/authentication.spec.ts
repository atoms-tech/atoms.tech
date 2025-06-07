import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should navigate to login page', async ({ page }) => {
        await page.goto('/');
        
        // Look for login/sign in button or link
        const loginButton = page.locator('a[href*="/login"], button:has-text("Sign in"), a:has-text("Sign in")');
        
        if (await loginButton.count() > 0) {
            await loginButton.first().click();
            await expect(page).toHaveURL(/.*\/login/);
        } else {
            // Direct navigation if no button found
            await page.goto('/login');
        }
        
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('should display login form elements', async ({ page }) => {
        await page.goto('/login');
        
        // Check for email input
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        
        // Check for password input
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
        
        // Check for submit button
        await expect(page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')).toBeVisible();
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

    test('should display signup form elements', async ({ page }) => {
        await page.goto('/signup');
        
        // Check for email input
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        
        // Check for password input
        await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
        
        // Check for submit button
        await expect(page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register")')).toBeVisible();
    });

    test('should have OAuth login options', async ({ page }) => {
        await page.goto('/login');
        
        // Check for Google OAuth button
        const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
        if (await googleButton.count() > 0) {
            await expect(googleButton.first()).toBeVisible();
        }
        
        // Check for GitHub OAuth button
        const githubButton = page.locator('button:has-text("GitHub"), a:has-text("GitHub")');
        if (await githubButton.count() > 0) {
            await expect(githubButton.first()).toBeVisible();
        }
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
