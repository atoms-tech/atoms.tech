import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    TestData, 
    BrowserHelpers 
} from '../utils/test-helpers';

/**
 * Comprehensive Visual Regression Testing
 * Tests visual consistency across different browsers, themes, and screen sizes
 */
test.describe('Visual Regression Testing', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up authenticated state for consistent testing
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        await mockUserProfile(page, TestData.users.standard);
    });

    test.describe('Authentication Pages Visual Tests', () => {
        test('Login page visual consistency', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            // Wait for any animations to complete
            await page.waitForTimeout(1000);
            
            // Take full page screenshot
            await expect(page).toHaveScreenshot('login-page-desktop.png', {
                fullPage: true,
                threshold: 0.2,
            });
            
            // Test mobile view
            await page.setViewportSize({ width: 375, height: 667 });
            await expect(page).toHaveScreenshot('login-page-mobile.png', {
                fullPage: true,
                threshold: 0.2,
            });
        });

        test('Signup page visual consistency', async ({ page }) => {
            await page.goto('/signup');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('signup-page-desktop.png', {
                fullPage: true,
                threshold: 0.2,
            });
            
            // Test tablet view
            await page.setViewportSize({ width: 768, height: 1024 });
            await expect(page).toHaveScreenshot('signup-page-tablet.png', {
                fullPage: true,
                threshold: 0.2,
            });
        });

        test('OAuth buttons visual consistency', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            // Focus on OAuth section only
            const oauthSection = page.locator('[data-testid="oauth-section"]');
            await expect(oauthSection).toHaveScreenshot('oauth-buttons.png', {
                threshold: 0.1,
            });
            
            // Test hover states
            await page.hover('[data-testid="github-login"]');
            await expect(oauthSection).toHaveScreenshot('oauth-buttons-github-hover.png', {
                threshold: 0.1,
            });
            
            await page.hover('[data-testid="google-login"]');
            await expect(oauthSection).toHaveScreenshot('oauth-buttons-google-hover.png', {
                threshold: 0.1,
            });
        });
    });

    test.describe('Dashboard Visual Tests', () => {
        test('Home dashboard visual consistency', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            // Full dashboard screenshot
            await expect(page).toHaveScreenshot('home-dashboard.png', {
                fullPage: true,
                threshold: 0.3, // Higher threshold for dynamic content
            });
            
            // Test different sections individually for more granular testing
            const sidebar = page.locator('[data-testid="sidebar"]');
            await expect(sidebar).toHaveScreenshot('dashboard-sidebar.png', {
                threshold: 0.1,
            });
            
            const mainContent = page.locator('[data-testid="main-content"]');
            await expect(mainContent).toHaveScreenshot('dashboard-main-content.png', {
                threshold: 0.3,
            });
        });

        test('Organization dashboard visual consistency', async ({ page }) => {
            await page.goto('/org/test-org');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('org-dashboard.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test organization header
            const orgHeader = page.locator('[data-testid="org-header"]');
            await expect(orgHeader).toHaveScreenshot('org-header.png', {
                threshold: 0.1,
            });
        });

        test('Project dashboard visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('project-dashboard.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test project navigation
            const projectNav = page.locator('[data-testid="project-navigation"]');
            await expect(projectNav).toHaveScreenshot('project-navigation.png', {
                threshold: 0.1,
            });
        });
    });

    test.describe('Core Features Visual Tests', () => {
        test('Requirements page visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('requirements-page.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test requirements list
            const requirementsList = page.locator('[data-testid="requirements-list"]');
            await expect(requirementsList).toHaveScreenshot('requirements-list.png', {
                threshold: 0.2,
            });
            
            // Test requirement creation modal
            await page.click('[data-testid="add-requirement"]');
            const modal = page.locator('[data-testid="requirement-modal"]');
            await expect(modal).toHaveScreenshot('requirement-creation-modal.png', {
                threshold: 0.1,
            });
        });

        test('Documents page visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('documents-page.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test document grid/list view
            const documentsGrid = page.locator('[data-testid="documents-grid"]');
            await expect(documentsGrid).toHaveScreenshot('documents-grid.png', {
                threshold: 0.2,
            });
        });

        test('Canvas page visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/canvas');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('canvas-page.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test canvas tools
            const canvasTools = page.locator('[data-testid="canvas-tools"]');
            await expect(canvasTools).toHaveScreenshot('canvas-tools.png', {
                threshold: 0.1,
            });
        });

        test('Testbed page visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/testbed');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('testbed-page.png', {
                fullPage: true,
                threshold: 0.3,
            });
        });
    });

    test.describe('Theme Visual Tests', () => {
        test('Dark theme visual consistency', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Switch to dark theme
            await page.click('[data-testid="theme-toggle"]');
            await page.waitForTimeout(500); // Wait for theme transition
            
            await expect(page).toHaveScreenshot('home-dark-theme.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test dark theme on different pages
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            await expect(page).toHaveScreenshot('requirements-dark-theme.png', {
                fullPage: true,
                threshold: 0.3,
            });
        });

        test('Theme toggle visual states', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Test light theme toggle
            const themeToggle = page.locator('[data-testid="theme-toggle"]');
            await expect(themeToggle).toHaveScreenshot('theme-toggle-light.png', {
                threshold: 0.1,
            });
            
            // Switch to dark theme
            await themeToggle.click();
            await page.waitForTimeout(500);
            
            await expect(themeToggle).toHaveScreenshot('theme-toggle-dark.png', {
                threshold: 0.1,
            });
        });
    });

    test.describe('Responsive Visual Tests', () => {
        test('Mobile responsive visual consistency', async ({ page }) => {
            await BrowserHelpers.setMobileViewport(page);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('home-mobile.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Test mobile navigation
            const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
            if (await mobileMenuButton.isVisible()) {
                await mobileMenuButton.click();
                await expect(page).toHaveScreenshot('mobile-menu-open.png', {
                    fullPage: true,
                    threshold: 0.2,
                });
            }
        });

        test('Tablet responsive visual consistency', async ({ page }) => {
            await BrowserHelpers.setTabletViewport(page);
            
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            await expect(page).toHaveScreenshot('project-tablet.png', {
                fullPage: true,
                threshold: 0.3,
            });
        });

        test('Breakpoint visual consistency', async ({ page }) => {
            const breakpoints = [
                { width: 320, height: 568, name: 'mobile-small' },
                { width: 375, height: 667, name: 'mobile-medium' },
                { width: 414, height: 896, name: 'mobile-large' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 1024, height: 768, name: 'desktop-small' },
                { width: 1440, height: 900, name: 'desktop-medium' },
                { width: 1920, height: 1080, name: 'desktop-large' },
            ];
            
            for (const breakpoint of breakpoints) {
                await page.setViewportSize({ 
                    width: breakpoint.width, 
                    height: breakpoint.height 
                });
                
                await page.goto('/home');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                
                await expect(page).toHaveScreenshot(`home-${breakpoint.name}.png`, {
                    fullPage: true,
                    threshold: 0.3,
                });
            }
        });
    });

    test.describe('Interactive States Visual Tests', () => {
        test('Button states visual consistency', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            const loginButton = page.locator('[data-testid="login-submit"]');
            
            // Default state
            await expect(loginButton).toHaveScreenshot('button-default.png', {
                threshold: 0.1,
            });
            
            // Hover state
            await loginButton.hover();
            await expect(loginButton).toHaveScreenshot('button-hover.png', {
                threshold: 0.1,
            });
            
            // Focus state
            await loginButton.focus();
            await expect(loginButton).toHaveScreenshot('button-focus.png', {
                threshold: 0.1,
            });
            
            // Disabled state
            await page.addStyleTag({
                content: '[data-testid="login-submit"] { opacity: 0.5; pointer-events: none; }'
            });
            await expect(loginButton).toHaveScreenshot('button-disabled.png', {
                threshold: 0.1,
            });
        });

        test('Form validation states visual consistency', async ({ page }) => {
            await page.goto('/signup');
            await page.waitForLoadState('networkidle');
            
            // Fill form with invalid data to trigger validation
            await page.fill('[data-testid="email-input"]', 'invalid-email');
            await page.fill('[data-testid="password-input"]', '123');
            await page.fill('[data-testid="confirm-password-input"]', '456');
            await page.click('[data-testid="signup-submit"]');
            
            // Wait for validation messages
            await page.waitForTimeout(500);
            
            const signupForm = page.locator('[data-testid="signup-form"]');
            await expect(signupForm).toHaveScreenshot('form-validation-errors.png', {
                threshold: 0.2,
            });
        });

        test('Loading states visual consistency', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            // Fill valid credentials
            await page.fill('[data-testid="email-input"]', TestData.users.standard.email);
            await page.fill('[data-testid="password-input"]', 'password123');
            
            // Click submit and immediately capture loading state
            const submitPromise = page.click('[data-testid="login-submit"]');
            
            // Capture loading state
            await page.waitForTimeout(100);
            const loginButton = page.locator('[data-testid="login-submit"]');
            await expect(loginButton).toHaveScreenshot('button-loading.png', {
                threshold: 0.2,
            });
            
            await submitPromise;
        });
    });

    test.describe('Component Visual Tests', () => {
        test('Modal visual consistency', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Open a modal
            await page.click('[data-testid="open-settings-modal"]');
            const modal = page.locator('[data-testid="settings-modal"]');
            await modal.waitFor();
            
            await expect(page).toHaveScreenshot('settings-modal.png', {
                fullPage: true,
                threshold: 0.2,
            });
            
            // Test modal on mobile
            await BrowserHelpers.setMobileViewport(page);
            await expect(page).toHaveScreenshot('settings-modal-mobile.png', {
                fullPage: true,
                threshold: 0.2,
            });
        });

        test('Dropdown menu visual consistency', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Open user menu dropdown
            await page.click('[data-testid="user-menu-trigger"]');
            const dropdown = page.locator('[data-testid="user-menu-dropdown"]');
            await dropdown.waitFor();
            
            await expect(dropdown).toHaveScreenshot('user-menu-dropdown.png', {
                threshold: 0.1,
            });
        });

        test('Data table visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
            
            const dataTable = page.locator('[data-testid="requirements-table"]');
            await expect(dataTable).toHaveScreenshot('requirements-table.png', {
                threshold: 0.3,
            });
            
            // Test table sorting
            await page.click('[data-testid="sort-by-priority"]');
            await page.waitForTimeout(500);
            await expect(dataTable).toHaveScreenshot('requirements-table-sorted.png', {
                threshold: 0.3,
            });
        });

        test('Navigation breadcrumb visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/requirements/req-1');
            await page.waitForLoadState('networkidle');
            
            const breadcrumb = page.locator('[data-testid="breadcrumb"]');
            await expect(breadcrumb).toHaveScreenshot('breadcrumb.png', {
                threshold: 0.1,
            });
        });
    });

    test.describe('Animation Visual Tests', () => {
        test('Page transition animations', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Capture initial state
            await expect(page).toHaveScreenshot('page-transition-start.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Navigate to another page
            await page.click('[data-testid="nav-projects"]');
            
            // Capture mid-transition (if any)
            await page.waitForTimeout(200);
            await expect(page).toHaveScreenshot('page-transition-middle.png', {
                fullPage: true,
                threshold: 0.4,
            });
            
            // Capture final state
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await expect(page).toHaveScreenshot('page-transition-end.png', {
                fullPage: true,
                threshold: 0.3,
            });
        });

        test('Hover animations visual consistency', async ({ page }) => {
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            const projectCard = page.locator('[data-testid="project-card"]').first();
            
            // Before hover
            await expect(projectCard).toHaveScreenshot('project-card-normal.png', {
                threshold: 0.1,
            });
            
            // During hover
            await projectCard.hover();
            await page.waitForTimeout(300); // Wait for hover animation
            await expect(projectCard).toHaveScreenshot('project-card-hover.png', {
                threshold: 0.2,
            });
        });
    });

    test.describe('Print Style Visual Tests', () => {
        test('Print layout visual consistency', async ({ page }) => {
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            
            // Emulate print media
            await page.emulateMedia({ media: 'print' });
            
            await expect(page).toHaveScreenshot('requirements-print-layout.png', {
                fullPage: true,
                threshold: 0.3,
            });
            
            // Reset media
            await page.emulateMedia({ media: 'screen' });
        });
    });

    test.describe('Error State Visual Tests', () => {
        test('404 page visual consistency', async ({ page }) => {
            await page.goto('/non-existent-page');
            await page.waitForLoadState('networkidle');
            
            await expect(page).toHaveScreenshot('404-page.png', {
                fullPage: true,
                threshold: 0.2,
            });
        });

        test('Network error visual consistency', async ({ page, context }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            // Simulate network error
            await context.setOffline(true);
            
            await page.fill('[data-testid="email-input"]', TestData.users.standard.email);
            await page.fill('[data-testid="password-input"]', 'password123');
            await page.click('[data-testid="login-submit"]');
            
            // Wait for error state
            await page.waitForTimeout(2000);
            
            await expect(page).toHaveScreenshot('network-error-state.png', {
                fullPage: true,
                threshold: 0.3,
            });
        });
    });
});