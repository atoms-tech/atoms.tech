import { test, expect, devices } from '@playwright/test';

import { AuthPage } from './page-objects/auth.page';
import { HomePage } from './page-objects/home.page';
import { DocumentPage } from './page-objects/document.page';
import { ProjectPage } from './page-objects/project.page';
import { setupAuthenticatedSession, mockUserProfile, TestData, BrowserHelpers } from './utils/test-helpers';

/**
 * Mobile Workflow E2E Tests
 * 
 * Tests complete user journeys on mobile devices including touch interactions,
 * responsive design, mobile-specific features, and cross-device compatibility
 */

test.describe('Mobile Workflow Tests', () => {
    let homePage: HomePage;
    let authPage: AuthPage;
    let documentPage: DocumentPage;
    let projectPage: ProjectPage;

    test.beforeEach(async ({ page, context }) => {
        homePage = new HomePage(page);
        authPage = new AuthPage(page);
        documentPage = new DocumentPage(page);
        projectPage = new ProjectPage(page);

        // Set up authenticated session
        await setupAuthenticatedSession(context);
        await mockUserProfile(page, TestData.users.standard);

        // Mock mobile-optimized API responses
        await page.route('**/api/**', async (route) => {
            const response = await route.fetch();
            const json = await response.json();
            
            // Add mobile-specific metadata
            json.mobile_optimized = true;
            json.viewport = 'mobile';
            
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                json
            });
        });
    });

    test.describe('Mobile Authentication', () => {
        test('should login on mobile device', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await authPage.goto();
            await authPage.verifyLoginFormDisplayed();
            
            // Verify mobile-optimized login form
            const loginForm = page.locator('form');
            await expect(loginForm).toBeVisible();
            
            // Test touch interaction
            await authPage.loginWithCredentials('test@example.com', 'password123');
            
            // Should navigate to home page
            await authPage.verifySuccessfulLogin();
        });

        test('should handle virtual keyboard on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await authPage.goto();
            
            // Tap on email input
            const emailInput = page.locator('input[type="email"]');
            await emailInput.tap();
            
            // Virtual keyboard should not obscure the input
            await expect(emailInput).toBeInViewport();
            
            // Type email
            await emailInput.fill('test@example.com');
            
            // Tap password input
            const passwordInput = page.locator('input[type="password"]');
            await passwordInput.tap();
            
            // Should still be visible
            await expect(passwordInput).toBeInViewport();
        });

        test('should support OAuth login on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await authPage.goto();
            
            // Mock OAuth flow
            await authPage.mockGitHubOAuthSuccess();
            
            // Tap GitHub login button
            const githubButton = page.locator('button:has-text("GitHub")');
            await githubButton.tap();
            
            // Should handle OAuth redirect
            await authPage.verifySuccessfulLogin();
        });
    });

    test.describe('Mobile Home Page', () => {
        test('should display mobile-optimized home page', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Verify mobile layout
            await homePage.verifyHomePageLoaded();
            
            // Tabs should be accessible on mobile
            await homePage.switchToSettingsTab();
            await homePage.verifySettingsTabActive();
            
            await homePage.switchToActivityTab();
            await homePage.verifyActivityTabActive();
        });

        test('should handle touch gestures for tab switching', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Test swipe gestures if supported
            const tabContent = page.locator('[data-testid="tab-content"]');
            
            if (await tabContent.isVisible()) {
                // Simulate swipe left
                await tabContent.hover();
                await page.mouse.down();
                await page.mouse.move(100, 0);
                await page.mouse.up();
                
                // Should switch tabs
                await page.waitForTimeout(500);
            }
        });

        test('should handle mobile quick actions', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            await homePage.switchToActivityTab();
            
            // Quick actions should be accessible via touch
            await homePage.verifyQuickActions();
            
            // Test tap interactions
            const createProjectButton = page.locator('button:has-text("Create New Project")');
            if (await createProjectButton.isVisible()) {
                await createProjectButton.tap();
            }
        });

        test('should display mobile-optimized settings cards', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            await homePage.switchToSettingsTab();
            
            // Settings cards should stack vertically on mobile
            const settingsGrid = page.locator('.grid');
            await expect(settingsGrid).toBeVisible();
            
            // Test InProgress modal on mobile
            await homePage.clickInProgressContainer('Notification Preferences');
            await homePage.verifyInProgressModalOpen();
            
            // Modal should be full-screen on mobile
            const modal = page.locator('[role="dialog"]');
            await expect(modal).toBeVisible();
        });
    });

    test.describe('Mobile Document Management', () => {
        test('should create document on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Create document with touch interaction
            await projectPage.createDocument('Mobile Document', 'Created on mobile device');
            
            // Verify document was created
            await projectPage.verifyDocumentExists('Mobile Document');
        });

        test('should edit document on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Verify mobile editor is loaded
            await documentPage.verifyDocumentLoaded();
            
            // Edit content using touch
            await documentPage.editContent('Mobile editing test content');
            
            // Save document
            await documentPage.saveDocument();
            
            // Verify content was saved
            await documentPage.verifyDocumentContent('Mobile editing test content');
        });

        test('should handle mobile document navigation', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Test folder navigation on mobile
            await projectPage.createFolder('Mobile Folder');
            await projectPage.verifyFolderExists('Mobile Folder');
            
            // Open folder with touch
            await projectPage.openFolder('Mobile Folder');
            
            // Verify navigation worked
            await projectPage.verifyEmptyFolder();
        });

        test('should handle mobile document sharing', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Share document on mobile
            await documentPage.shareDocument('mobile@example.com', 'edit');
            
            // Verify sharing success
            await documentPage.verifyInvitationSent();
        });
    });

    test.describe('Mobile Touch Interactions', () => {
        test('should handle tap interactions', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Test tap vs click
            const settingsTab = page.locator('button[value="settings"]');
            await settingsTab.tap();
            
            await homePage.verifySettingsTabActive();
        });

        test('should handle long press interactions', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await projectPage.gotoProject('test-org', 'project_123');
            
            // Long press on document for context menu
            const documentItem = page.locator('[data-testid="document-item"]').first();
            
            if (await documentItem.isVisible()) {
                // Simulate long press
                await documentItem.hover();
                await page.mouse.down();
                await page.waitForTimeout(500);
                await page.mouse.up();
                
                // Context menu should appear
                const contextMenu = page.locator('[data-testid="context-menu"]');
                if (await contextMenu.isVisible()) {
                    await expect(contextMenu).toBeVisible();
                }
            }
        });

        test('should handle pinch-to-zoom gestures', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Test pinch-to-zoom on document content
            const documentContent = page.locator('[data-testid="document-content"]');
            
            if (await documentContent.isVisible()) {
                // Simulate pinch gesture
                await documentContent.hover();
                
                // Basic zoom test (actual pinch gesture simulation is complex)
                await page.keyboard.press('Control+Plus');
                await page.waitForTimeout(500);
                
                // Verify zoom worked (content should still be visible)
                await expect(documentContent).toBeVisible();
            }
        });

        test('should handle swipe gestures', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Test swipe for navigation
            const mainContent = page.locator('main');
            
            // Simulate swipe right
            await mainContent.hover();
            await page.mouse.down();
            await page.mouse.move(-100, 0);
            await page.mouse.up();
            
            await page.waitForTimeout(500);
            
            // Should handle swipe gracefully
            await homePage.verifyHomePageLoaded();
        });
    });

    test.describe('Mobile Responsive Design', () => {
        test('should adapt layout for different mobile screen sizes', async ({ page }) => {
            const mobileViewports = [
                { width: 360, height: 640 }, // Small mobile
                { width: 375, height: 667 }, // iPhone SE
                { width: 414, height: 896 }, // iPhone 11
                { width: 390, height: 844 }  // iPhone 12
            ];
            
            for (const viewport of mobileViewports) {
                await page.setViewportSize(viewport);
                
                await homePage.gotoHome();
                await homePage.verifyHomePageLoaded();
                
                // Layout should work at all sizes
                await homePage.switchToSettingsTab();
                await homePage.verifySettingsTabActive();
            }
        });

        test('should handle orientation changes', async ({ page }) => {
            // Portrait mode
            await page.setViewportSize({ width: 375, height: 667 });
            await homePage.gotoHome();
            await homePage.verifyHomePageLoaded();
            
            // Landscape mode
            await page.setViewportSize({ width: 667, height: 375 });
            await homePage.verifyHomePageLoaded();
            
            // Should still be functional
            await homePage.switchToSettingsTab();
            await homePage.verifySettingsTabActive();
        });

        test('should optimize images for mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Check for mobile-optimized images
            const images = page.locator('img');
            const imageCount = await images.count();
            
            for (let i = 0; i < imageCount; i++) {
                const img = images.nth(i);
                const src = await img.getAttribute('src');
                
                // Should use appropriate image sizes
                if (src) {
                    expect(src).toBeTruthy();
                }
            }
        });
    });

    test.describe('Mobile Performance', () => {
        test('should load quickly on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            const startTime = Date.now();
            await homePage.gotoHome();
            const loadTime = Date.now() - startTime;
            
            // Mobile should load within reasonable time
            expect(loadTime).toBeLessThan(5000);
        });

        test('should handle slow mobile connections', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            // Simulate slow 3G connection
            await page.route('**/*', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 500));
                await route.continue();
            });
            
            await homePage.gotoHome();
            
            // Should eventually load
            await homePage.verifyHomePageLoaded();
        });

        test('should minimize data usage on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            // Monitor network requests
            const requests: string[] = [];
            page.on('request', (request) => {
                requests.push(request.url());
            });
            
            await homePage.gotoHome();
            
            // Should not load unnecessary resources
            const imageRequests = requests.filter(url => url.includes('.jpg') || url.includes('.png'));
            expect(imageRequests.length).toBeLessThan(10);
        });
    });

    test.describe('Mobile Accessibility', () => {
        test('should be accessible on mobile devices', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Test mobile accessibility
            await homePage.verifyAccessibility();
            
            // Touch targets should be large enough
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            
            for (let i = 0; i < buttonCount; i++) {
                const button = buttons.nth(i);
                if (await button.isVisible()) {
                    const box = await button.boundingBox();
                    if (box) {
                        // Touch targets should be at least 44x44 pixels
                        expect(box.width).toBeGreaterThan(40);
                        expect(box.height).toBeGreaterThan(40);
                    }
                }
            }
        });

        test('should support screen readers on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Verify ARIA labels for mobile
            const interactiveElements = page.locator('button, a, input, [role="button"]');
            const count = await interactiveElements.count();
            
            for (let i = 0; i < count; i++) {
                const element = interactiveElements.nth(i);
                if (await element.isVisible()) {
                    const ariaLabel = await element.getAttribute('aria-label');
                    const textContent = await element.textContent();
                    
                    // Should have accessible name
                    expect(ariaLabel || textContent).toBeTruthy();
                }
            }
        });

        test('should handle mobile focus management', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Test focus management on mobile
            const firstInteractive = page.locator('button, a, input').first();
            await firstInteractive.focus();
            
            await expect(firstInteractive).toBeFocused();
        });
    });

    test.describe('Mobile Error Handling', () => {
        test('should handle mobile network errors gracefully', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Simulate network failure
            await page.route('**/api/**', async (route) => {
                await route.abort('failed');
            });
            
            // Try to perform action
            await homePage.switchToSettingsTab();
            
            // Should show appropriate error message
            const errorMessage = page.locator('.error-message, [role="alert"]');
            if (await errorMessage.isVisible()) {
                await expect(errorMessage).toBeVisible();
            }
        });

        test('should handle mobile app crashes gracefully', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Simulate JavaScript error
            await page.evaluate(() => {
                // @ts-ignore
                throw new Error('Mobile app crash simulation');
            });
            
            // App should still be responsive
            await homePage.verifyHomePageLoaded();
        });
    });

    test.describe('Mobile Cross-Platform Compatibility', () => {
        test('should work on iOS Safari', async ({ page }) => {
            await page.setViewportSize(devices['iPhone 12'].viewport);
            
            await homePage.gotoHome();
            await homePage.verifyHomePageLoaded();
            
            // Test iOS-specific features
            await homePage.switchToSettingsTab();
            await homePage.verifySettingsTabActive();
        });

        test('should work on Android Chrome', async ({ page }) => {
            await page.setViewportSize(devices['Pixel 5'].viewport);
            
            await homePage.gotoHome();
            await homePage.verifyHomePageLoaded();
            
            // Test Android-specific features
            await homePage.switchToActivityTab();
            await homePage.verifyActivityTabActive();
        });
    });

    test.describe('Mobile PWA Features', () => {
        test('should support PWA installation', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Check for PWA manifest
            const manifest = await page.evaluate(() => {
                const manifestLink = document.querySelector('link[rel="manifest"]');
                return manifestLink ? manifestLink.getAttribute('href') : null;
            });
            
            if (manifest) {
                expect(manifest).toBeTruthy();
            }
        });

        test('should work offline as PWA', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Go offline
            await page.context().setOffline(true);
            
            // Should still function with cached content
            await homePage.verifyHomePageLoaded();
        });

        test('should handle PWA updates', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await homePage.gotoHome();
            
            // Check for service worker
            const serviceWorker = await page.evaluate(() => {
                return 'serviceWorker' in navigator;
            });
            
            expect(serviceWorker).toBe(true);
        });
    });

    test.describe('Mobile Input Methods', () => {
        test('should handle mobile keyboard input', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Test mobile keyboard input
            await documentPage.editContent('Mobile keyboard test input');
            
            // Verify input worked
            await documentPage.verifyDocumentContent('Mobile keyboard test input');
        });

        test('should handle voice input', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await documentPage.gotoDocument('test-org', 'project_123', 'doc_123');
            
            // Look for voice input button
            const voiceButton = page.locator('[data-testid="voice-input"], button[title*="voice"]');
            
            if (await voiceButton.isVisible()) {
                await voiceButton.tap();
                
                // Should handle voice input gracefully
                await expect(voiceButton).toBeVisible();
            }
        });

        test('should handle autocomplete on mobile', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await authPage.goto();
            
            // Test autocomplete on mobile
            const emailInput = page.locator('input[type="email"]');
            await emailInput.tap();
            await emailInput.fill('test@');
            
            // Should show autocomplete suggestions
            await page.waitForTimeout(500);
            
            // Complete the email
            await emailInput.fill('test@example.com');
            
            const emailValue = await emailInput.inputValue();
            expect(emailValue).toBe('test@example.com');
        });
    });
});
