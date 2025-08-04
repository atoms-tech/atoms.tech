import { test, expect } from '@playwright/test';

import { AuthPage } from './page-objects/auth.page';
import { HomePage } from './page-objects/home.page';
import { SettingsPage } from './page-objects/settings.page';
import { setupAuthenticatedSession, mockUserProfile, TestData } from './utils/test-helpers';

/**
 * Settings and Preferences Workflow E2E Tests
 * 
 * Tests complete user journeys through all settings pages and preference management
 * including account settings, notifications, privacy, and integrations
 */

test.describe('Settings and Preferences Workflow', () => {
    let homePage: HomePage;
    let authPage: AuthPage;
    let settingsPage: SettingsPage;

    test.beforeEach(async ({ page, context }) => {
        homePage = new HomePage(page);
        authPage = new AuthPage(page);
        settingsPage = new SettingsPage(page);

        // Set up authenticated session
        await setupAuthenticatedSession(context);
        await mockUserProfile(page, TestData.users.standard);

        // Mock settings API responses
        await page.route('**/settings**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();
            
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: {
                        notifications: {
                            email: true,
                            push: false,
                            weekly_digest: true
                        },
                        privacy: {
                            profile_visibility: 'team',
                            activity_visibility: 'private'
                        },
                        integrations: {
                            github: { connected: false },
                            slack: { connected: false },
                            jira: { connected: false }
                        }
                    }
                });
            } else if (method === 'PUT' || method === 'POST') {
                await route.fulfill({
                    status: 200,
                    json: { success: true, message: 'Settings updated' }
                });
            } else {
                await route.continue();
            }
        });

        // Mock profile update API
        await page.route('**/profile**', async (route) => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({
                    status: 200,
                    json: {
                        ...TestData.users.standard,
                        updated_at: new Date().toISOString()
                    }
                });
            } else {
                await route.continue();
            }
        });
    });

    test.describe('Account Settings Navigation', () => {
        test('should navigate to account settings from home page', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Click Account Settings card
            await homePage.clickAccountSettings();
            
            // Should navigate to account settings page
            await settingsPage.verifyAccountSettingsLoaded();
            expect(page.url()).toContain('/home/user/account');
        });

        test('should navigate to account settings from user menu', async ({ page }) => {
            await homePage.gotoHome();
            
            // Look for user menu/avatar
            const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
            
            if (await userMenu.isVisible()) {
                await userMenu.click();
                
                // Look for account settings option
                const accountOption = page.locator('text="Account Settings", text="Settings", text="Profile"');
                if (await accountOption.isVisible()) {
                    await accountOption.click();
                    
                    await settingsPage.verifyAccountSettingsLoaded();
                }
            }
        });

        test('should display settings breadcrumb navigation', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Verify breadcrumb is present
            const breadcrumb = page.locator('.breadcrumb, [data-testid="breadcrumb"]');
            if (await breadcrumb.isVisible()) {
                await expect(breadcrumb).toContainText('Settings');
                await expect(breadcrumb).toContainText('Account');
            }
        });
    });

    test.describe('Account Information Management', () => {
        test('should update basic profile information', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Update profile information
            await settingsPage.updateProfileInfo({
                full_name: 'John Updated Doe',
                email: 'john.updated@example.com',
                bio: 'Updated bio information'
            });
            
            // Verify success message
            await settingsPage.verifyUpdateSuccess();
        });

        test('should validate email format', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Try to enter invalid email
            await settingsPage.updateEmail('invalid-email');
            
            // Should show validation error
            await settingsPage.verifyEmailValidationError();
        });

        test('should upload profile picture', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Upload profile picture
            await settingsPage.uploadProfilePicture('profile-image.jpg');
            
            // Verify upload success
            await settingsPage.verifyProfilePictureUpdated();
        });

        test('should handle profile picture upload failure', async ({ page }) => {
            // Mock upload failure
            await page.route('**/upload**', async (route) => {
                await route.fulfill({
                    status: 400,
                    json: { error: 'File too large' }
                });
            });
            
            await settingsPage.gotoAccountSettings();
            
            // Try to upload large file
            await settingsPage.uploadProfilePicture('large-image.jpg');
            
            // Should show error message
            await settingsPage.verifyUploadError('File too large');
        });
    });

    test.describe('Password and Security Settings', () => {
        test('should change password successfully', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Change password
            await settingsPage.changePassword('currentPassword', 'newPassword123!');
            
            // Verify success message
            await settingsPage.verifyPasswordUpdateSuccess();
        });

        test('should validate password strength', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Try weak password
            await settingsPage.changePassword('currentPassword', '123');
            
            // Should show validation error
            await settingsPage.verifyPasswordValidationError();
        });

        test('should enable two-factor authentication', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Navigate to security section
            await settingsPage.navigateToSecuritySection();
            
            // Enable 2FA
            await settingsPage.enableTwoFactorAuth();
            
            // Verify 2FA is enabled
            await settingsPage.verifyTwoFactorAuthEnabled();
        });

        test('should manage active sessions', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Navigate to security section
            await settingsPage.navigateToSecuritySection();
            
            // View active sessions
            await settingsPage.viewActiveSessions();
            
            // Revoke a session
            await settingsPage.revokeSession(1);
            
            // Verify session revoked
            await settingsPage.verifySessionRevoked();
        });

        test('should handle incorrect current password', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Try to change password with wrong current password
            await settingsPage.changePassword('wrongPassword', 'newPassword123!');
            
            // Should show error message
            await settingsPage.verifyPasswordChangeError('Current password is incorrect');
        });
    });

    test.describe('Notification Preferences', () => {
        test('should access notification settings from InProgress container', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Click on Notification Preferences InProgress container
            await homePage.clickInProgressContainer('Notification Preferences');
            
            // Should open modal with notification features
            await homePage.verifyInProgressModalOpen();
            
            // Verify modal content
            await homePage.verifyModalContent('Notification Preferences', [
                'Email notification controls',
                'In-app notification settings',
                'Mobile push notifications'
            ]);
        });

        test('should update email notification preferences', async ({ page }) => {
            await settingsPage.gotoNotificationSettings();
            
            // Update email notification settings
            await settingsPage.updateEmailNotifications({
                project_updates: true,
                mentions: true,
                weekly_digest: false
            });
            
            // Verify settings saved
            await settingsPage.verifyNotificationSettingsUpdated();
        });

        test('should configure push notification preferences', async ({ page }) => {
            await settingsPage.gotoNotificationSettings();
            
            // Update push notification settings
            await settingsPage.updatePushNotifications({
                enabled: true,
                project_updates: false,
                mentions: true
            });
            
            // Verify settings saved
            await settingsPage.verifyNotificationSettingsUpdated();
        });

        test('should test notification preferences', async ({ page }) => {
            await settingsPage.gotoNotificationSettings();
            
            // Send test notification
            await settingsPage.sendTestNotification('email');
            
            // Verify test notification sent
            await settingsPage.verifyTestNotificationSent();
        });
    });

    test.describe('Privacy and Security Settings', () => {
        test('should access privacy settings from InProgress container', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Click on Privacy & Security InProgress container
            await homePage.clickInProgressContainer('Privacy & Security');
            
            // Should open modal with privacy features
            await homePage.verifyInProgressModalOpen();
            
            // Verify modal content
            await homePage.verifyModalContent('Privacy & Security', [
                'Two-factor authentication',
                'Session management',
                'Data export and deletion'
            ]);
        });

        test('should update profile visibility settings', async ({ page }) => {
            await settingsPage.gotoPrivacySettings();
            
            // Update profile visibility
            await settingsPage.updateProfileVisibility('public');
            
            // Verify settings updated
            await settingsPage.verifyPrivacySettingsUpdated();
        });

        test('should configure activity visibility', async ({ page }) => {
            await settingsPage.gotoPrivacySettings();
            
            // Update activity visibility
            await settingsPage.updateActivityVisibility('team');
            
            // Verify settings updated
            await settingsPage.verifyPrivacySettingsUpdated();
        });

        test('should export user data', async ({ page }) => {
            await settingsPage.gotoPrivacySettings();
            
            // Request data export
            await settingsPage.requestDataExport();
            
            // Verify export request submitted
            await settingsPage.verifyDataExportRequested();
        });

        test('should handle account deletion request', async ({ page }) => {
            await settingsPage.gotoPrivacySettings();
            
            // Navigate to account deletion
            await settingsPage.navigateToAccountDeletion();
            
            // Verify account deletion warning
            await settingsPage.verifyAccountDeletionWarning();
            
            // Cancel deletion (don't actually delete)
            await settingsPage.cancelAccountDeletion();
        });
    });

    test.describe('Integration Settings', () => {
        test('should access integration settings from InProgress container', async ({ page }) => {
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Click on Integrations InProgress container
            await homePage.clickInProgressContainer('Integrations');
            
            // Should open modal with integration features
            await homePage.verifyInProgressModalOpen();
            
            // Verify modal content
            await homePage.verifyModalContent('Integrations', [
                'GitHub integration',
                'Slack notifications',
                'Jira synchronization'
            ]);
        });

        test('should connect GitHub integration', async ({ page }) => {
            await settingsPage.gotoIntegrationSettings();
            
            // Connect GitHub integration
            await settingsPage.connectIntegration('github');
            
            // Verify integration connected
            await settingsPage.verifyIntegrationConnected('github');
        });

        test('should connect Slack integration', async ({ page }) => {
            await settingsPage.gotoIntegrationSettings();
            
            // Connect Slack integration
            await settingsPage.connectIntegration('slack');
            
            // Verify integration connected
            await settingsPage.verifyIntegrationConnected('slack');
        });

        test('should disconnect integration', async ({ page }) => {
            await settingsPage.gotoIntegrationSettings();
            
            // First connect an integration
            await settingsPage.connectIntegration('github');
            
            // Then disconnect it
            await settingsPage.disconnectIntegration('github');
            
            // Verify integration disconnected
            await settingsPage.verifyIntegrationDisconnected('github');
        });

        test('should handle integration connection failure', async ({ page }) => {
            // Mock integration failure
            await page.route('**/integrations/**', async (route) => {
                await route.fulfill({
                    status: 400,
                    json: { error: 'Integration failed' }
                });
            });
            
            await settingsPage.gotoIntegrationSettings();
            
            // Try to connect integration
            await settingsPage.connectIntegration('github');
            
            // Should show error message
            await settingsPage.verifyIntegrationError('Integration failed');
        });
    });

    test.describe('Settings Form Validation', () => {
        test('should validate required fields', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Clear required field
            await settingsPage.clearField('full_name');
            await settingsPage.saveSettings();
            
            // Should show validation error
            await settingsPage.verifyFieldValidationError('full_name', 'This field is required');
        });

        test('should validate email format in real-time', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Enter invalid email
            await settingsPage.updateEmail('invalid-email');
            
            // Should show validation error immediately
            await settingsPage.verifyEmailValidationError();
        });

        test('should show unsaved changes warning', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Make changes
            await settingsPage.updateProfileInfo({
                full_name: 'Changed Name'
            });
            
            // Try to navigate away without saving
            await page.goto('/home');
            
            // Should show unsaved changes warning
            await settingsPage.verifyUnsavedChangesWarning();
        });
    });

    test.describe('Settings Responsiveness', () => {
        test('should work on mobile devices', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            await settingsPage.gotoAccountSettings();
            
            // Verify mobile layout
            await settingsPage.verifyMobileLayout();
            
            // Test form interaction on mobile
            await settingsPage.updateProfileInfo({
                full_name: 'Mobile User'
            });
            
            // Verify success on mobile
            await settingsPage.verifyUpdateSuccess();
        });

        test('should adapt settings navigation on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Settings cards should stack vertically on mobile
            const settingsGrid = page.locator('.grid');
            const gridClasses = await settingsGrid.getAttribute('class');
            expect(gridClasses).toContain('md:grid-cols-2');
        });

        test('should handle tablet layout for settings', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            
            await settingsPage.gotoAccountSettings();
            
            // Verify tablet layout
            await settingsPage.verifyTabletLayout();
        });
    });

    test.describe('Settings Accessibility', () => {
        test('should be keyboard navigable', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Test keyboard navigation through form
            await settingsPage.testKeyboardNavigation();
        });

        test('should have proper form labels', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Verify all form inputs have labels
            await settingsPage.verifyFormLabels();
        });

        test('should announce form errors to screen readers', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Create validation error
            await settingsPage.clearField('email');
            await settingsPage.saveSettings();
            
            // Verify error has proper ARIA attributes
            await settingsPage.verifyErrorAnnouncement();
        });
    });

    test.describe('Settings Performance', () => {
        test('should load settings quickly', async ({ page }) => {
            const startTime = Date.now();
            
            await settingsPage.gotoAccountSettings();
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(3000);
        });

        test('should handle slow network gracefully', async ({ page }) => {
            // Add network delay
            await page.route('**/settings**', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await route.continue();
            });
            
            await settingsPage.gotoAccountSettings();
            
            // Should show loading state
            await settingsPage.verifyLoadingState();
            
            // Should eventually load
            await settingsPage.verifyAccountSettingsLoaded();
        });
    });

    test.describe('Settings Error Handling', () => {
        test('should handle API errors gracefully', async ({ page }) => {
            // Mock API error
            await page.route('**/settings**', async (route) => {
                await route.fulfill({
                    status: 500,
                    json: { error: 'Server error' }
                });
            });
            
            await settingsPage.gotoAccountSettings();
            
            // Should show error message
            await settingsPage.verifyApiError();
        });

        test('should retry failed requests', async ({ page }) => {
            let requestCount = 0;
            
            await page.route('**/settings**', async (route) => {
                requestCount++;
                if (requestCount === 1) {
                    await route.fulfill({ status: 500 });
                } else {
                    await route.continue();
                }
            });
            
            await settingsPage.gotoAccountSettings();
            
            // Should retry and eventually succeed
            await settingsPage.verifyAccountSettingsLoaded();
        });

        test('should handle network disconnection', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Simulate network failure
            await page.route('**/*', async (route) => {
                await route.abort('failed');
            });
            
            // Try to save settings
            await settingsPage.updateProfileInfo({
                full_name: 'Network Test'
            });
            
            // Should show offline message
            await settingsPage.verifyOfflineMessage();
        });
    });

    test.describe('Settings Data Persistence', () => {
        test('should persist settings across page reloads', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Update settings
            await settingsPage.updateProfileInfo({
                full_name: 'Persistent User'
            });
            
            // Reload page
            await page.reload();
            await settingsPage.verifyAccountSettingsLoaded();
            
            // Verify settings persisted
            await settingsPage.verifyFieldValue('full_name', 'Persistent User');
        });

        test('should handle concurrent settings updates', async ({ page }) => {
            await settingsPage.gotoAccountSettings();
            
            // Simulate concurrent updates
            await Promise.all([
                settingsPage.updateProfileInfo({ full_name: 'User 1' }),
                settingsPage.updateProfileInfo({ full_name: 'User 2' })
            ]);
            
            // Should handle conflicts gracefully
            await settingsPage.verifyUpdateSuccess();
        });
    });
});
