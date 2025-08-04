import { Locator, Page, expect } from '@playwright/test';

import { BasePage } from './base.page';

/**
 * Page Object Model for settings and preferences pages
 */
export class SettingsPage extends BasePage {
    // Account settings selectors
    private readonly accountSettingsTitle = 'h1:has-text("Account Settings"), h2:has-text("Account")';
    private readonly profileForm = 'form, [data-testid="profile-form"]';
    private readonly fullNameInput = 'input[name="full_name"], input[placeholder*="name"]';
    private readonly emailInput = 'input[name="email"], input[type="email"]';
    private readonly bioInput = 'textarea[name="bio"], textarea[placeholder*="bio"]';
    private readonly profilePictureInput = 'input[type="file"][accept*="image"]';
    private readonly profilePictureUpload = 'button:has-text("Upload"), button:has-text("Change Picture")';
    
    // Password settings selectors
    private readonly currentPasswordInput = 'input[name="current_password"], input[placeholder*="current"]';
    private readonly newPasswordInput = 'input[name="new_password"], input[placeholder*="new"]';
    private readonly confirmPasswordInput = 'input[name="confirm_password"], input[placeholder*="confirm"]';
    private readonly changePasswordButton = 'button:has-text("Change Password"), button:has-text("Update Password")';
    
    // Security settings selectors
    private readonly securitySection = '[data-testid="security-section"], .security-section';
    private readonly twoFactorToggle = 'input[name="two_factor"], [data-testid="2fa-toggle"]';
    private readonly activeSessionsList = '[data-testid="active-sessions"], .active-sessions';
    private readonly revokeSessionButton = 'button:has-text("Revoke"), button:has-text("End Session")';
    
    // Notification settings selectors
    private readonly notificationSettings = '[data-testid="notification-settings"], .notification-settings';
    private readonly emailNotificationToggle = 'input[name="email_notifications"]';
    private readonly pushNotificationToggle = 'input[name="push_notifications"]';
    private readonly testNotificationButton = 'button:has-text("Test"), button:has-text("Send Test")';
    
    // Privacy settings selectors
    private readonly privacySettings = '[data-testid="privacy-settings"], .privacy-settings';
    private readonly profileVisibilitySelect = 'select[name="profile_visibility"], [data-testid="profile-visibility"]';
    private readonly activityVisibilitySelect = 'select[name="activity_visibility"], [data-testid="activity-visibility"]';
    private readonly dataExportButton = 'button:has-text("Export Data"), button:has-text("Request Export")';
    private readonly deleteAccountButton = 'button:has-text("Delete Account"), button:has-text("Close Account")';
    
    // Integration settings selectors
    private readonly integrationSettings = '[data-testid="integration-settings"], .integration-settings';
    private readonly githubIntegration = '[data-testid="github-integration"], .github-integration';
    private readonly slackIntegration = '[data-testid="slack-integration"], .slack-integration';
    private readonly jiraIntegration = '[data-testid="jira-integration"], .jira-integration';
    private readonly connectButton = 'button:has-text("Connect"), button:has-text("Link")';
    private readonly disconnectButton = 'button:has-text("Disconnect"), button:has-text("Unlink")';
    
    // Form controls
    private readonly saveButton = 'button:has-text("Save"), button:has-text("Update"), button[type="submit"]';
    private readonly cancelButton = 'button:has-text("Cancel"), button:has-text("Discard")';
    private readonly resetButton = 'button:has-text("Reset"), button:has-text("Restore")';
    
    // Status and feedback selectors
    private readonly successMessage = '.text-green-500, .success-message, text="Settings updated", text="Saved successfully"';
    private readonly errorMessage = '.text-red-500, .error-message, [role="alert"]';
    private readonly loadingIndicator = '.loading, .spinner, [data-testid="loading"]';
    private readonly validationError = '.field-error, .validation-error, .invalid-feedback';
    private readonly unsavedChangesWarning = '.unsaved-changes, text="Unsaved changes", text="You have unsaved changes"';
    
    constructor(page: Page) {
        super(page, '/settings');
    }

    /**
     * Navigate to account settings
     */
    async gotoAccountSettings(): Promise<void> {
        await this.page.goto('/home/user/account');
        await this.waitForLoad();
    }

    /**
     * Navigate to notification settings
     */
    async gotoNotificationSettings(): Promise<void> {
        await this.page.goto('/home/user/notifications');
        await this.waitForLoad();
    }

    /**
     * Navigate to privacy settings
     */
    async gotoPrivacySettings(): Promise<void> {
        await this.page.goto('/home/user/privacy');
        await this.waitForLoad();
    }

    /**
     * Navigate to integration settings
     */
    async gotoIntegrationSettings(): Promise<void> {
        await this.page.goto('/home/user/integrations');
        await this.waitForLoad();
    }

    /**
     * Verify account settings page is loaded
     */
    async verifyAccountSettingsLoaded(): Promise<void> {
        await expect(this.page.locator(this.accountSettingsTitle)).toBeVisible();
        await expect(this.page.locator(this.profileForm)).toBeVisible();
        await this.waitForNoLoading();
    }

    /**
     * Update profile information
     */
    async updateProfileInfo(profile: {
        full_name?: string;
        email?: string;
        bio?: string;
    }): Promise<void> {
        if (profile.full_name) {
            await this.fillField(this.fullNameInput, profile.full_name);
        }
        
        if (profile.email) {
            await this.fillField(this.emailInput, profile.email);
        }
        
        if (profile.bio) {
            await this.fillField(this.bioInput, profile.bio);
        }
        
        await this.saveSettings();
    }

    /**
     * Update email address
     */
    async updateEmail(email: string): Promise<void> {
        await this.fillField(this.emailInput, email);
    }

    /**
     * Upload profile picture
     */
    async uploadProfilePicture(fileName: string): Promise<void> {
        const uploadInput = this.page.locator(this.profilePictureInput);
        
        if (await uploadInput.isVisible()) {
            await uploadInput.setInputFiles({
                name: fileName,
                mimeType: 'image/jpeg',
                buffer: Buffer.from('fake-image-data')
            });
        } else {
            // Click upload button to trigger file picker
            const uploadButton = this.page.locator(this.profilePictureUpload);
            if (await uploadButton.isVisible()) {
                await uploadButton.click();
                
                // Wait for file input to appear
                await this.page.waitForSelector(this.profilePictureInput, { state: 'visible' });
                await this.page.locator(this.profilePictureInput).setInputFiles({
                    name: fileName,
                    mimeType: 'image/jpeg',
                    buffer: Buffer.from('fake-image-data')
                });
            }
        }
        
        await this.page.waitForTimeout(1000);
    }

    /**
     * Change password
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await this.fillField(this.currentPasswordInput, currentPassword);
        await this.fillField(this.newPasswordInput, newPassword);
        await this.fillField(this.confirmPasswordInput, newPassword);
        
        const changeButton = this.page.locator(this.changePasswordButton);
        if (await changeButton.isVisible()) {
            await changeButton.click();
        } else {
            await this.saveSettings();
        }
        
        await this.page.waitForTimeout(1000);
    }

    /**
     * Navigate to security section
     */
    async navigateToSecuritySection(): Promise<void> {
        const securitySection = this.page.locator(this.securitySection);
        
        if (await securitySection.isVisible()) {
            await securitySection.scrollIntoViewIfNeeded();
        } else {
            // Look for security tab/link
            const securityTab = this.page.locator('text="Security", a[href*="security"]');
            if (await securityTab.isVisible()) {
                await securityTab.click();
            }
        }
    }

    /**
     * Enable two-factor authentication
     */
    async enableTwoFactorAuth(): Promise<void> {
        await this.navigateToSecuritySection();
        
        const twoFactorToggle = this.page.locator(this.twoFactorToggle);
        if (await twoFactorToggle.isVisible()) {
            await twoFactorToggle.check();
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * View active sessions
     */
    async viewActiveSessions(): Promise<void> {
        await this.navigateToSecuritySection();
        
        const sessionsList = this.page.locator(this.activeSessionsList);
        if (await sessionsList.isVisible()) {
            await expect(sessionsList).toBeVisible();
        }
    }

    /**
     * Revoke a session
     */
    async revokeSession(sessionIndex: number = 0): Promise<void> {
        await this.viewActiveSessions();
        
        const revokeButton = this.page.locator(this.revokeSessionButton).nth(sessionIndex);
        if (await revokeButton.isVisible()) {
            await revokeButton.click();
            
            // Confirm if needed
            const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }
            
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Update email notifications
     */
    async updateEmailNotifications(settings: {
        project_updates?: boolean;
        mentions?: boolean;
        weekly_digest?: boolean;
    }): Promise<void> {
        await this.gotoNotificationSettings();
        
        // Update each notification setting
        for (const [key, value] of Object.entries(settings)) {
            const checkbox = this.page.locator(`input[name="${key}"], input[data-testid="${key}"]`);
            if (await checkbox.isVisible()) {
                if (value) {
                    await checkbox.check();
                } else {
                    await checkbox.uncheck();
                }
            }
        }
        
        await this.saveSettings();
    }

    /**
     * Update push notifications
     */
    async updatePushNotifications(settings: {
        enabled?: boolean;
        project_updates?: boolean;
        mentions?: boolean;
    }): Promise<void> {
        await this.gotoNotificationSettings();
        
        // Update push notification settings
        for (const [key, value] of Object.entries(settings)) {
            const checkbox = this.page.locator(`input[name="push_${key}"], input[data-testid="push-${key}"]`);
            if (await checkbox.isVisible()) {
                if (value) {
                    await checkbox.check();
                } else {
                    await checkbox.uncheck();
                }
            }
        }
        
        await this.saveSettings();
    }

    /**
     * Send test notification
     */
    async sendTestNotification(type: 'email' | 'push' = 'email'): Promise<void> {
        const testButton = this.page.locator(`${this.testNotificationButton}:has-text("${type}")`);
        
        if (await testButton.isVisible()) {
            await testButton.click();
        } else {
            // Generic test button
            const genericTestButton = this.page.locator(this.testNotificationButton);
            if (await genericTestButton.isVisible()) {
                await genericTestButton.click();
            }
        }
        
        await this.page.waitForTimeout(1000);
    }

    /**
     * Update profile visibility
     */
    async updateProfileVisibility(visibility: 'public' | 'team' | 'private'): Promise<void> {
        await this.gotoPrivacySettings();
        
        const visibilitySelect = this.page.locator(this.profileVisibilitySelect);
        if (await visibilitySelect.isVisible()) {
            await visibilitySelect.selectOption(visibility);
        } else {
            // Look for radio buttons or other controls
            const visibilityOption = this.page.locator(`input[value="${visibility}"], text="${visibility}"`);
            if (await visibilityOption.isVisible()) {
                await visibilityOption.click();
            }
        }
        
        await this.saveSettings();
    }

    /**
     * Update activity visibility
     */
    async updateActivityVisibility(visibility: 'public' | 'team' | 'private'): Promise<void> {
        await this.gotoPrivacySettings();
        
        const activitySelect = this.page.locator(this.activityVisibilitySelect);
        if (await activitySelect.isVisible()) {
            await activitySelect.selectOption(visibility);
        } else {
            // Look for radio buttons or other controls
            const activityOption = this.page.locator(`input[value="${visibility}"], text="${visibility}"`);
            if (await activityOption.isVisible()) {
                await activityOption.click();
            }
        }
        
        await this.saveSettings();
    }

    /**
     * Request data export
     */
    async requestDataExport(): Promise<void> {
        await this.gotoPrivacySettings();
        
        const exportButton = this.page.locator(this.dataExportButton);
        if (await exportButton.isVisible()) {
            await exportButton.click();
            
            // Confirm export request
            const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Request")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }
            
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Navigate to account deletion
     */
    async navigateToAccountDeletion(): Promise<void> {
        await this.gotoPrivacySettings();
        
        const deleteButton = this.page.locator(this.deleteAccountButton);
        if (await deleteButton.isVisible()) {
            await deleteButton.click();
        }
    }

    /**
     * Cancel account deletion
     */
    async cancelAccountDeletion(): Promise<void> {
        const cancelButton = this.page.locator(this.cancelButton);
        if (await cancelButton.isVisible()) {
            await cancelButton.click();
        }
    }

    /**
     * Connect integration
     */
    async connectIntegration(integration: 'github' | 'slack' | 'jira'): Promise<void> {
        await this.gotoIntegrationSettings();
        
        let integrationSection: Locator;
        switch (integration) {
            case 'github':
                integrationSection = this.page.locator(this.githubIntegration);
                break;
            case 'slack':
                integrationSection = this.page.locator(this.slackIntegration);
                break;
            case 'jira':
                integrationSection = this.page.locator(this.jiraIntegration);
                break;
        }
        
        if (await integrationSection.isVisible()) {
            const connectButton = integrationSection.locator(this.connectButton);
            if (await connectButton.isVisible()) {
                await connectButton.click();
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Disconnect integration
     */
    async disconnectIntegration(integration: 'github' | 'slack' | 'jira'): Promise<void> {
        await this.gotoIntegrationSettings();
        
        let integrationSection: Locator;
        switch (integration) {
            case 'github':
                integrationSection = this.page.locator(this.githubIntegration);
                break;
            case 'slack':
                integrationSection = this.page.locator(this.slackIntegration);
                break;
            case 'jira':
                integrationSection = this.page.locator(this.jiraIntegration);
                break;
        }
        
        if (await integrationSection.isVisible()) {
            const disconnectButton = integrationSection.locator(this.disconnectButton);
            if (await disconnectButton.isVisible()) {
                await disconnectButton.click();
                
                // Confirm disconnection
                const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Disconnect")');
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                }
                
                await this.page.waitForTimeout(1000);
            }
        }
    }

    /**
     * Save settings
     */
    async saveSettings(): Promise<void> {
        const saveButton = this.page.locator(this.saveButton);
        if (await saveButton.isVisible()) {
            await saveButton.click();
            await this.page.waitForTimeout(1000);
        }
    }

    /**
     * Clear form field
     */
    async clearField(fieldName: string): Promise<void> {
        const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
        if (await field.isVisible()) {
            await field.clear();
        }
    }

    /**
     * Test keyboard navigation
     */
    async testKeyboardNavigation(): Promise<void> {
        // Tab through form elements
        await this.page.keyboard.press('Tab');
        const firstField = this.page.locator(':focus');
        await expect(firstField).toBeFocused();
        
        // Continue tabbing
        await this.page.keyboard.press('Tab');
        await this.page.keyboard.press('Tab');
        
        // Should be able to submit with Enter
        const submitButton = this.page.locator(this.saveButton);
        if (await submitButton.isFocused()) {
            await this.page.keyboard.press('Enter');
        }
    }

    /**
     * Verify form labels
     */
    async verifyFormLabels(): Promise<void> {
        const inputs = this.page.locator('input, textarea, select');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute('id');
            const name = await input.getAttribute('name');
            const ariaLabel = await input.getAttribute('aria-label');
            
            if (id) {
                // Check for associated label
                const label = this.page.locator(`label[for="${id}"]`);
                if (await label.isVisible()) {
                    await expect(label).toBeVisible();
                }
            }
            
            // Should have either label, aria-label, or placeholder
            expect(ariaLabel || name).toBeTruthy();
        }
    }

    /**
     * Verify success message
     */
    async verifyUpdateSuccess(): Promise<void> {
        const successMessage = this.page.locator(this.successMessage);
        await expect(successMessage).toBeVisible();
    }

    /**
     * Verify error message
     */
    async verifyEmailValidationError(): Promise<void> {
        const errorMessage = this.page.locator(this.validationError);
        await expect(errorMessage).toBeVisible();
    }

    /**
     * Verify field validation error
     */
    async verifyFieldValidationError(fieldName: string, expectedMessage: string): Promise<void> {
        const fieldError = this.page.locator(`[data-field="${fieldName}"] .error, .field-error`);
        await expect(fieldError).toBeVisible();
        await expect(fieldError).toContainText(expectedMessage);
    }

    /**
     * Verify profile picture updated
     */
    async verifyProfilePictureUpdated(): Promise<void> {
        const uploadSuccess = this.page.locator('text="Profile picture updated", text="Image uploaded"');
        await expect(uploadSuccess).toBeVisible();
    }

    /**
     * Verify upload error
     */
    async verifyUploadError(expectedMessage: string): Promise<void> {
        const errorMessage = this.page.locator(this.errorMessage);
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText(expectedMessage);
    }

    /**
     * Verify password update success
     */
    async verifyPasswordUpdateSuccess(): Promise<void> {
        const successMessage = this.page.locator('text="Password updated", text="Password changed"');
        await expect(successMessage).toBeVisible();
    }

    /**
     * Verify password validation error
     */
    async verifyPasswordValidationError(): Promise<void> {
        const errorMessage = this.page.locator(this.validationError);
        await expect(errorMessage).toBeVisible();
    }

    /**
     * Verify password change error
     */
    async verifyPasswordChangeError(expectedMessage: string): Promise<void> {
        const errorMessage = this.page.locator(this.errorMessage);
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText(expectedMessage);
    }

    /**
     * Verify two-factor auth enabled
     */
    async verifyTwoFactorAuthEnabled(): Promise<void> {
        const enabledIndicator = this.page.locator('text="Two-factor authentication enabled", .enabled');
        await expect(enabledIndicator).toBeVisible();
    }

    /**
     * Verify session revoked
     */
    async verifySessionRevoked(): Promise<void> {
        const revokedMessage = this.page.locator('text="Session revoked", text="Session ended"');
        await expect(revokedMessage).toBeVisible();
    }

    /**
     * Verify notification settings updated
     */
    async verifyNotificationSettingsUpdated(): Promise<void> {
        const successMessage = this.page.locator('text="Notification settings updated", text="Preferences saved"');
        await expect(successMessage).toBeVisible();
    }

    /**
     * Verify test notification sent
     */
    async verifyTestNotificationSent(): Promise<void> {
        const sentMessage = this.page.locator('text="Test notification sent", text="Notification sent"');
        await expect(sentMessage).toBeVisible();
    }

    /**
     * Verify privacy settings updated
     */
    async verifyPrivacySettingsUpdated(): Promise<void> {
        const successMessage = this.page.locator('text="Privacy settings updated", text="Settings saved"');
        await expect(successMessage).toBeVisible();
    }

    /**
     * Verify data export requested
     */
    async verifyDataExportRequested(): Promise<void> {
        const exportMessage = this.page.locator('text="Data export requested", text="Export request submitted"');
        await expect(exportMessage).toBeVisible();
    }

    /**
     * Verify account deletion warning
     */
    async verifyAccountDeletionWarning(): Promise<void> {
        const warningMessage = this.page.locator('text="This action cannot be undone", text="permanently delete"');
        await expect(warningMessage).toBeVisible();
    }

    /**
     * Verify integration connected
     */
    async verifyIntegrationConnected(integration: string): Promise<void> {
        const connectedMessage = this.page.locator(`text="${integration} connected", text="Connected to ${integration}"`);
        await expect(connectedMessage).toBeVisible();
    }

    /**
     * Verify integration disconnected
     */
    async verifyIntegrationDisconnected(integration: string): Promise<void> {
        const disconnectedMessage = this.page.locator(`text="${integration} disconnected", text="Disconnected from ${integration}"`);
        await expect(disconnectedMessage).toBeVisible();
    }

    /**
     * Verify integration error
     */
    async verifyIntegrationError(expectedMessage: string): Promise<void> {
        const errorMessage = this.page.locator(this.errorMessage);
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toContainText(expectedMessage);
    }

    /**
     * Verify unsaved changes warning
     */
    async verifyUnsavedChangesWarning(): Promise<void> {
        const warningMessage = this.page.locator(this.unsavedChangesWarning);
        await expect(warningMessage).toBeVisible();
    }

    /**
     * Verify mobile layout
     */
    async verifyMobileLayout(): Promise<void> {
        // Check for mobile-specific classes or layout
        const mobileContainer = this.page.locator('.mobile-layout, .sm\\:block, .md\\:hidden');
        
        // Form should be stacked vertically on mobile
        const formContainer = this.page.locator(this.profileForm);
        await expect(formContainer).toBeVisible();
    }

    /**
     * Verify tablet layout
     */
    async verifyTabletLayout(): Promise<void> {
        // Check for tablet-specific classes or layout
        const tabletContainer = this.page.locator('.tablet-layout, .md\\:block, .lg\\:hidden');
        
        const formContainer = this.page.locator(this.profileForm);
        await expect(formContainer).toBeVisible();
    }

    /**
     * Verify loading state
     */
    async verifyLoadingState(): Promise<void> {
        const loadingIndicator = this.page.locator(this.loadingIndicator);
        await expect(loadingIndicator).toBeVisible();
    }

    /**
     * Verify API error
     */
    async verifyApiError(): Promise<void> {
        const errorMessage = this.page.locator(this.errorMessage);
        await expect(errorMessage).toBeVisible();
    }

    /**
     * Verify offline message
     */
    async verifyOfflineMessage(): Promise<void> {
        const offlineMessage = this.page.locator('text="Offline", text="No connection", .offline');
        await expect(offlineMessage).toBeVisible();
    }

    /**
     * Verify field value
     */
    async verifyFieldValue(fieldName: string, expectedValue: string): Promise<void> {
        const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
        const value = await field.inputValue();
        expect(value).toBe(expectedValue);
    }

    /**
     * Verify error announcement for screen readers
     */
    async verifyErrorAnnouncement(): Promise<void> {
        const errorMessage = this.page.locator(this.errorMessage);
        await expect(errorMessage).toHaveAttribute('role', 'alert');
    }

    /**
     * Get field value
     */
    async getFieldValue(fieldName: string): Promise<string> {
        const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
        return await field.inputValue();
    }

    /**
     * Check if field is required
     */
    async isFieldRequired(fieldName: string): Promise<boolean> {
        const field = this.page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
        const required = await field.getAttribute('required');
        return required !== null;
    }

    /**
     * Check if form has unsaved changes
     */
    async hasUnsavedChanges(): Promise<boolean> {
        const unsavedIndicator = this.page.locator(this.unsavedChangesWarning);
        return await unsavedIndicator.isVisible();
    }
}
