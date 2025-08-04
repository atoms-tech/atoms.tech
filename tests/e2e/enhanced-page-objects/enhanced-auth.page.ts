import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../page-objects/base.page';

/**
 * Enhanced Authentication Page Object
 * Comprehensive authentication testing with advanced scenarios
 */
export class EnhancedAuthPage extends BasePage {
    // Locators
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly fullNameInput: Locator;
    readonly loginButton: Locator;
    readonly signupButton: Locator;
    readonly githubButton: Locator;
    readonly googleButton: Locator;
    readonly forgotPasswordLink: Locator;
    readonly signupLink: Locator;
    readonly loginLink: Locator;
    readonly errorMessage: Locator;
    readonly successMessage: Locator;
    readonly loadingSpinner: Locator;
    readonly passwordStrengthIndicator: Locator;
    readonly showPasswordToggle: Locator;
    readonly rememberMeCheckbox: Locator;
    readonly termsCheckbox: Locator;

    constructor(page: Page) {
        super(page, '/login');
        
        // Input fields
        this.emailInput = page.locator('[data-testid="email-input"]');
        this.passwordInput = page.locator('[data-testid="password-input"]');
        this.confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
        this.fullNameInput = page.locator('[data-testid="full-name-input"]');
        
        // Buttons
        this.loginButton = page.locator('[data-testid="login-submit"]');
        this.signupButton = page.locator('[data-testid="signup-submit"]');
        this.githubButton = page.locator('[data-testid="github-login"]');
        this.googleButton = page.locator('[data-testid="google-login"]');
        
        // Links
        this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
        this.signupLink = page.locator('[data-testid="signup-link"]');
        this.loginLink = page.locator('[data-testid="login-link"]');
        
        // Messages and indicators
        this.errorMessage = page.locator('[data-testid="error-message"], [role="alert"]');
        this.successMessage = page.locator('[data-testid="success-message"]');
        this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
        this.passwordStrengthIndicator = page.locator('[data-testid="password-strength"]');
        
        // Additional controls
        this.showPasswordToggle = page.locator('[data-testid="show-password-toggle"]');
        this.rememberMeCheckbox = page.locator('[data-testid="remember-me"]');
        this.termsCheckbox = page.locator('[data-testid="terms-checkbox"]');
    }

    // Navigation methods
    async navigateToSignup(): Promise<void> {
        if (await this.signupLink.isVisible()) {
            await this.signupLink.click();
        } else {
            await this.page.goto('/signup');
        }
        await this.page.waitForURL(/.*\/signup.*/, { timeout: 10000 });
    }

    async navigateToLogin(): Promise<void> {
        if (await this.loginLink.isVisible()) {
            await this.loginLink.click();
        } else {
            await this.page.goto('/login');
        }
        await this.page.waitForURL(/.*\/login.*/, { timeout: 10000 });
    }

    async navigateToForgotPassword(): Promise<void> {
        await this.forgotPasswordLink.click();
        await this.page.waitForURL(/.*\/forgot-password.*/, { timeout: 10000 });
    }

    // Form filling methods
    async fillLoginForm(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<void> {
        await this.fillField(this.emailInput, credentials.email);
        await this.fillField(this.passwordInput, credentials.password);
        
        if (credentials.rememberMe && await this.rememberMeCheckbox.isVisible()) {
            await this.rememberMeCheckbox.check();
        }
    }

    async fillSignupForm(userData: { 
        email: string; 
        password: string; 
        confirmPassword: string; 
        name?: string;
        acceptTerms?: boolean;
    }): Promise<void> {
        await this.fillField(this.emailInput, userData.email);
        await this.fillField(this.passwordInput, userData.password);
        await this.fillField(this.confirmPasswordInput, userData.confirmPassword);
        
        if (userData.name && await this.fullNameInput.isVisible()) {
            await this.fillField(this.fullNameInput, userData.name);
        }
        
        if (userData.acceptTerms && await this.termsCheckbox.isVisible()) {
            await this.termsCheckbox.check();
        }
    }

    async fillField(locator: Locator, value: string): Promise<void> {
        await locator.waitFor({ state: 'visible' });
        await locator.fill(value);
        
        // Verify the value was filled correctly
        const filledValue = await locator.inputValue();
        expect(filledValue).toBe(value);
    }

    // Submission methods
    async submitLogin(): Promise<void> {
        await this.loginButton.click();
        await this.waitForNoLoading();
    }

    async submitSignup(): Promise<void> {
        await this.signupButton.click();
        await this.waitForNoLoading();
    }

    // OAuth methods
    async loginWithGitHub(): Promise<void> {
        await this.githubButton.click();
        // Note: In real tests, you'd handle the OAuth popup/redirect
    }

    async loginWithGoogle(): Promise<void> {
        await this.googleButton.click();
        // Note: In real tests, you'd handle the OAuth popup/redirect
    }

    // Logout method
    async logout(): Promise<void> {
        const userMenu = this.page.locator('[data-testid="user-menu"]');
        if (await userMenu.isVisible()) {
            await userMenu.click();
            await this.page.click('[data-testid="logout"]');
            await this.page.waitForURL(/.*\/login.*/, { timeout: 10000 });
        }
    }

    // Validation and verification methods
    async verifyLoginFormDisplayed(): Promise<void> {
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    async verifySignupFormDisplayed(): Promise<void> {
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.confirmPasswordInput).toBeVisible();
        await expect(this.signupButton).toBeVisible();
    }

    async verifyEmailValidation(): Promise<void> {
        await this.fillField(this.emailInput, 'invalid-email');
        await this.submitLogin();
        await expect(this.errorMessage).toBeVisible();
        
        const errorText = await this.errorMessage.textContent();
        expect(errorText?.toLowerCase()).toContain('email');
    }

    async verifyPasswordValidation(): Promise<void> {
        await this.fillField(this.passwordInput, '123');
        await this.submitLogin();
        await expect(this.errorMessage).toBeVisible();
        
        const errorText = await this.errorMessage.textContent();
        expect(errorText?.toLowerCase()).toContain('password');
    }

    async verifyPasswordStrength(password: string, expectedStrength: 'weak' | 'medium' | 'strong'): Promise<void> {
        await this.fillField(this.passwordInput, password);
        
        if (await this.passwordStrengthIndicator.isVisible()) {
            const strengthText = await this.passwordStrengthIndicator.textContent();
            expect(strengthText?.toLowerCase()).toContain(expectedStrength);
        }
    }

    async verifyPasswordMismatch(): Promise<void> {
        await this.fillField(this.passwordInput, 'password123');
        await this.fillField(this.confirmPasswordInput, 'differentpassword');
        await this.submitSignup();
        
        await expect(this.errorMessage).toBeVisible();
        const errorText = await this.errorMessage.textContent();
        expect(errorText?.toLowerCase()).toContain('match');
    }

    async verifyErrorMessage(expectedMessage?: string): Promise<void> {
        await expect(this.errorMessage).toBeVisible();
        
        if (expectedMessage) {
            const errorText = await this.errorMessage.textContent();
            expect(errorText).toContain(expectedMessage);
        }
    }

    async verifySuccessMessage(expectedMessage?: string): Promise<void> {
        await expect(this.successMessage).toBeVisible();
        
        if (expectedMessage) {
            const successText = await this.successMessage.textContent();
            expect(successText).toContain(expectedMessage);
        }
    }

    async verifyLoginButtonDisabled(): Promise<void> {
        await expect(this.loginButton).toBeDisabled();
    }

    async verifyLoginButtonEnabled(): Promise<void> {
        await expect(this.loginButton).toBeEnabled();
    }

    // Advanced interaction methods
    async togglePasswordVisibility(): Promise<void> {
        if (await this.showPasswordToggle.isVisible()) {
            await this.showPasswordToggle.click();
        }
    }

    async verifyPasswordVisible(): Promise<boolean> {
        const type = await this.passwordInput.getAttribute('type');
        return type === 'text';
    }

    async testKeyboardNavigation(): Promise<void> {
        // Test tab navigation through form
        await this.page.keyboard.press('Tab');
        await expect(this.emailInput).toBeFocused();
        
        await this.page.keyboard.press('Tab');
        await expect(this.passwordInput).toBeFocused();
        
        await this.page.keyboard.press('Tab');
        if (await this.rememberMeCheckbox.isVisible()) {
            await expect(this.rememberMeCheckbox).toBeFocused();
            await this.page.keyboard.press('Tab');
        }
        
        await expect(this.loginButton).toBeFocused();
    }

    async testFormSubmissionWithEnter(): Promise<void> {
        await this.fillField(this.emailInput, 'test@example.com');
        await this.fillField(this.passwordInput, 'password123');
        await this.page.keyboard.press('Enter');
        await this.waitForNoLoading();
    }

    // Error handling methods
    async enterInvalidCredentials(): Promise<void> {
        await this.fillField(this.emailInput, 'invalid@example.com');
        await this.fillField(this.passwordInput, 'wrongpassword');
        await this.submitLogin();
    }

    async handleGitHubOAuthIssue(): Promise<void> {
        // Handle the known GitHub OAuth issue requiring two attempts
        await this.githubButton.click();
        
        // Wait for potential error
        await this.page.waitForTimeout(2000);
        
        // If still on login page, try again
        if (this.page.url().includes('/login')) {
            await this.githubButton.click();
        }
    }

    async testNetworkErrorRecovery(): Promise<void> {
        // Attempt action that might fail due to network
        await this.submitLogin();
        
        // Wait for potential error state
        await this.page.waitForTimeout(2000);
        
        // If retry button is available, use it
        const retryButton = this.page.locator('[data-testid="retry-action"]');
        if (await retryButton.isVisible()) {
            await retryButton.click();
        }
    }

    // Accessibility testing methods
    async verifyFormAccessibility(): Promise<void> {
        // Check that form inputs have proper labels
        const inputs = [this.emailInput, this.passwordInput];
        
        for (const input of inputs) {
            const inputId = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            
            if (inputId) {
                const label = this.page.locator(`label[for="${inputId}"]`);
                const hasLabel = await label.count() > 0;
                expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
            } else {
                expect(ariaLabel || ariaLabelledBy).toBeTruthy();
            }
        }
    }

    async verifyErrorAnnouncement(): Promise<void> {
        // Verify error messages are announced to screen readers
        await this.enterInvalidCredentials();
        
        const errorElement = this.errorMessage;
        const role = await errorElement.getAttribute('role');
        const ariaLive = await errorElement.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
    }

    // Performance testing methods
    async measureFormInteractionTime(): Promise<number> {
        const startTime = Date.now();
        
        await this.fillField(this.emailInput, 'test@example.com');
        await this.fillField(this.passwordInput, 'password123');
        await this.submitLogin();
        
        return Date.now() - startTime;
    }

    async measurePageLoadTime(): Promise<number> {
        const startTime = Date.now();
        await this.goto();
        await this.waitForLoad();
        return Date.now() - startTime;
    }

    // Mobile-specific methods
    async verifyMobileLayout(): Promise<void> {
        // Verify form is properly sized for mobile
        const formBounds = await this.page.locator('[data-testid="auth-form"]').boundingBox();
        const viewport = this.page.viewportSize();
        
        if (formBounds && viewport) {
            expect(formBounds.width).toBeLessThanOrEqual(viewport.width - 40); // Account for padding
        }
    }

    async testMobileKeyboard(): Promise<void> {
        // Test that keyboard doesn't obscure form on mobile
        await this.emailInput.focus();
        
        // Verify login button is still in viewport
        const loginButtonBounds = await this.loginButton.boundingBox();
        const viewport = this.page.viewportSize();
        
        if (loginButtonBounds && viewport) {
            expect(loginButtonBounds.bottom).toBeLessThanOrEqual(viewport.height);
        }
    }

    // Security testing methods
    async verifyPasswordMasking(): Promise<void> {
        await this.fillField(this.passwordInput, 'secretpassword');
        const inputType = await this.passwordInput.getAttribute('type');
        expect(inputType).toBe('password');
    }

    async verifyNoPasswordInUrl(): Promise<void> {
        await this.fillField(this.passwordInput, 'secretpassword');
        await this.submitLogin();
        
        const currentUrl = this.page.url();
        expect(currentUrl).not.toContain('secretpassword');
    }

    async verifyFormAutoComplete(): Promise<void> {
        // Check autocomplete attributes
        const emailAutocomplete = await this.emailInput.getAttribute('autocomplete');
        const passwordAutocomplete = await this.passwordInput.getAttribute('autocomplete');
        
        expect(emailAutocomplete).toContain('email');
        expect(passwordAutocomplete).toContain('password');
    }

    // Multi-session testing methods
    async testConcurrentLogin(otherPage: Page): Promise<void> {
        // Test login from multiple browser contexts simultaneously
        const loginPromise1 = this.submitLogin();
        
        const otherAuthPage = new EnhancedAuthPage(otherPage);
        await otherAuthPage.goto();
        await otherAuthPage.fillLoginForm({
            email: 'test@example.com',
            password: 'password123'
        });
        const loginPromise2 = otherAuthPage.submitLogin();
        
        await Promise.all([loginPromise1, loginPromise2]);
    }

    // Utility methods
    private async waitForNoLoading(): Promise<void> {
        // Wait for any loading indicators to disappear
        try {
            await this.loadingSpinner.waitFor({ state: 'detached', timeout: 5000 });
        } catch {
            // Ignore timeout - loading indicator might not be present
        }
        
        await super.waitForNoLoading();
    }
}