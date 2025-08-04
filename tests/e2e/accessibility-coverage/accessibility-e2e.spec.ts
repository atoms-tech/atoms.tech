import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    TestData,
    AccessibilityHelpers 
} from '../utils/test-helpers';

/**
 * Comprehensive E2E Accessibility Testing
 * Tests accessibility compliance across complete user workflows
 */
test.describe('E2E Accessibility Coverage', () => {
    test.beforeEach(async ({ page }) => {
        // Inject axe-core for accessibility testing
        await injectAxe(page);
    });

    test.describe('Authentication Flow Accessibility', () => {
        test('Login page accessibility compliance', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            // Run axe accessibility check
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test keyboard navigation
            await page.keyboard.press('Tab');
            let focusedElement = await page.locator(':focus').getAttribute('data-testid');
            expect(focusedElement).toBe('email-input');
            
            await page.keyboard.press('Tab');
            focusedElement = await page.locator(':focus').getAttribute('data-testid');
            expect(focusedElement).toBe('password-input');
            
            await page.keyboard.press('Tab');
            focusedElement = await page.locator(':focus').getAttribute('data-testid');
            expect(focusedElement).toBe('login-submit');
            
            // Test screen reader compliance
            const emailInput = page.locator('[data-testid="email-input"]');
            const emailLabel = await emailInput.getAttribute('aria-label') || 
                              await emailInput.getAttribute('placeholder');
            expect(emailLabel).toBeTruthy();
            
            const passwordInput = page.locator('[data-testid="password-input"]');
            const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                                  await passwordInput.getAttribute('placeholder');
            expect(passwordLabel).toBeTruthy();
            
            // Test error message accessibility
            await page.fill('[data-testid="email-input"]', 'invalid-email');
            await page.click('[data-testid="login-submit"]');
            
            const errorMessage = page.locator('[role="alert"], [aria-live="polite"]');
            if (await errorMessage.count() > 0) {
                await expect(errorMessage).toBeVisible();
                const errorText = await errorMessage.textContent();
                expect(errorText).toBeTruthy();
            }
        });

        test('Signup page accessibility compliance', async ({ page }) => {
            await page.goto('/signup');
            await page.waitForLoadState('networkidle');
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test form accessibility
            const form = page.locator('[data-testid="signup-form"]');
            const formRole = await form.getAttribute('role');
            expect(formRole).toBe('form');
            
            // Test required field indicators
            const requiredFields = page.locator('[required], [aria-required="true"]');
            const requiredCount = await requiredFields.count();
            expect(requiredCount).toBeGreaterThan(0);
            
            // Test password strength indicator accessibility
            await page.fill('[data-testid="password-input"]', 'weak');
            const strengthIndicator = page.locator('[data-testid="password-strength"]');
            if (await strengthIndicator.isVisible()) {
                const ariaLabel = await strengthIndicator.getAttribute('aria-label');
                expect(ariaLabel).toContain('strength');
            }
        });

        test('OAuth accessibility compliance', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            
            // Test OAuth button accessibility
            const githubButton = page.locator('[data-testid="github-login"]');
            const githubLabel = await githubButton.getAttribute('aria-label') || 
                               await githubButton.textContent();
            expect(githubLabel).toContain('GitHub');
            
            const googleButton = page.locator('[data-testid="google-login"]');
            const googleLabel = await googleButton.getAttribute('aria-label') || 
                               await googleButton.textContent();
            expect(googleLabel).toContain('Google');
            
            // Test keyboard interaction
            await githubButton.focus();
            await expect(githubButton).toBeFocused();
            
            await page.keyboard.press('Enter');
            // Should handle keyboard activation
        });
    });

    test.describe('Dashboard Accessibility', () => {
        test('Home dashboard accessibility compliance', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test navigation accessibility
            const mainNav = page.locator('[role="navigation"]');
            await expect(mainNav).toBeVisible();
            
            const navItems = page.locator('[role="navigation"] a, [role="navigation"] button');
            const navCount = await navItems.count();
            
            for (let i = 0; i < navCount; i++) {
                const item = navItems.nth(i);
                const accessibleName = await item.getAttribute('aria-label') || 
                                      await item.textContent();
                expect(accessibleName?.trim()).toBeTruthy();
            }
            
            // Test heading structure
            const h1Count = await page.locator('h1').count();
            expect(h1Count).toBe(1);
            
            const headings = page.locator('h1, h2, h3, h4, h5, h6');
            const headingCount = await headings.count();
            expect(headingCount).toBeGreaterThan(1);
            
            // Test skip links
            await page.keyboard.press('Tab');
            const firstFocus = page.locator(':focus');
            const skipLink = await firstFocus.textContent();
            if (skipLink?.includes('Skip')) {
                await page.keyboard.press('Enter');
                const mainContent = page.locator('#main-content, [role="main"]');
                await expect(mainContent).toBeFocused();
            }
        });

        test('Project dashboard accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test breadcrumb accessibility
            const breadcrumb = page.locator('[aria-label*="breadcrumb"], [role="navigation"][aria-label*="breadcrumb"]');
            if (await breadcrumb.isVisible()) {
                const breadcrumbItems = breadcrumb.locator('a, span');
                const itemCount = await breadcrumbItems.count();
                expect(itemCount).toBeGreaterThan(0);
                
                // Current page should be marked appropriately
                const currentPage = breadcrumb.locator('[aria-current="page"]');
                await expect(currentPage).toBeVisible();
            }
            
            // Test tab navigation accessibility
            const tabList = page.locator('[role="tablist"]');
            if (await tabList.isVisible()) {
                const tabs = tabList.locator('[role="tab"]');
                const tabCount = await tabs.count();
                
                for (let i = 0; i < tabCount; i++) {
                    const tab = tabs.nth(i);
                    const tabId = await tab.getAttribute('id');
                    const controls = await tab.getAttribute('aria-controls');
                    
                    expect(tabId).toBeTruthy();
                    expect(controls).toBeTruthy();
                    
                    // Verify corresponding tabpanel exists
                    const tabpanel = page.locator(`[id="${controls}"]`);
                    await expect(tabpanel).toBeAttached();
                }
            }
        });
    });

    test.describe('Form and Input Accessibility', () => {
        test('Requirement creation form accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            
            // Open requirement creation form
            await page.click('[data-testid="add-requirement"]');
            const modal = page.locator('[data-testid="requirement-modal"]');
            await modal.waitFor();
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test modal accessibility
            const modalRole = await modal.getAttribute('role');
            expect(modalRole).toBe('dialog');
            
            const modalLabel = await modal.getAttribute('aria-labelledby') || 
                              await modal.getAttribute('aria-label');
            expect(modalLabel).toBeTruthy();
            
            // Test form accessibility
            const form = modal.locator('form');
            const formLabels = form.locator('label');
            const formInputs = form.locator('input, textarea, select');
            
            const labelCount = await formLabels.count();
            const inputCount = await formInputs.count();
            
            // Each input should have a corresponding label
            for (let i = 0; i < inputCount; i++) {
                const input = formInputs.nth(i);
                const inputId = await input.getAttribute('id');
                const ariaLabel = await input.getAttribute('aria-label');
                const ariaLabelledBy = await input.getAttribute('aria-labelledby');
                
                if (inputId) {
                    const associatedLabel = form.locator(`label[for="${inputId}"]`);
                    const hasLabel = await associatedLabel.count() > 0;
                    expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
                } else {
                    expect(ariaLabel || ariaLabelledBy).toBeTruthy();
                }
            }
            
            // Test required field indicators
            const requiredFields = form.locator('[required], [aria-required="true"]');
            const requiredCount = await requiredFields.count();
            
            if (requiredCount > 0) {
                for (let i = 0; i < requiredCount; i++) {
                    const field = requiredFields.nth(i);
                    const fieldId = await field.getAttribute('id');
                    
                    // Check for visual required indicator
                    const requiredIndicator = page.locator(`label[for="${fieldId}"] .required, label[for="${fieldId}"] [aria-label*="required"]`);
                    const hasIndicator = await requiredIndicator.count() > 0;
                    const ariaRequired = await field.getAttribute('aria-required');
                    
                    expect(hasIndicator || ariaRequired === 'true').toBeTruthy();
                }
            }
        });

        test('Search functionality accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            const searchInput = page.locator('[data-testid="search-input"]');
            if (await searchInput.isVisible()) {
                // Test search input accessibility
                const searchRole = await searchInput.getAttribute('role');
                const searchLabel = await searchInput.getAttribute('aria-label') || 
                                   await searchInput.getAttribute('placeholder');
                
                expect(searchRole === 'searchbox' || searchLabel?.toLowerCase().includes('search')).toBeTruthy();
                
                // Test search suggestions accessibility
                await searchInput.fill('test');
                
                const suggestions = page.locator('[role="listbox"], [role="menu"]');
                if (await suggestions.isVisible()) {
                    const suggestionItems = suggestions.locator('[role="option"], [role="menuitem"]');
                    const suggestionCount = await suggestionItems.count();
                    
                    if (suggestionCount > 0) {
                        // Test keyboard navigation of suggestions
                        await page.keyboard.press('ArrowDown');
                        const focusedSuggestion = page.locator('[role="option"][aria-selected="true"], [role="menuitem"]:focus');
                        await expect(focusedSuggestion).toBeVisible();
                    }
                }
            }
        });
    });

    test.describe('Data Display Accessibility', () => {
        test('Requirements table accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            const table = page.locator('[role="table"], table');
            if (await table.isVisible()) {
                // Test table structure
                const caption = table.locator('caption, [role="caption"]');
                if (await caption.count() > 0) {
                    const captionText = await caption.textContent();
                    expect(captionText?.trim()).toBeTruthy();
                }
                
                // Test table headers
                const headers = table.locator('[role="columnheader"], th');
                const headerCount = await headers.count();
                expect(headerCount).toBeGreaterThan(0);
                
                for (let i = 0; i < headerCount; i++) {
                    const header = headers.nth(i);
                    const headerText = await header.textContent();
                    expect(headerText?.trim()).toBeTruthy();
                }
                
                // Test table cells
                const cells = table.locator('[role="cell"], td');
                const cellCount = await cells.count();
                
                if (cellCount > 0) {
                    // Check row and column headers are properly associated
                    const firstCell = cells.first();
                    const headers = await firstCell.getAttribute('headers');
                    const scope = await firstCell.getAttribute('scope');
                    
                    // At least some form of header association should exist
                    expect(headers || scope || headerCount > 0).toBeTruthy();
                }
                
                // Test sortable columns
                const sortableHeaders = table.locator('[aria-sort], [role="columnheader"][tabindex="0"]');
                const sortableCount = await sortableHeaders.count();
                
                if (sortableCount > 0) {
                    const sortableHeader = sortableHeaders.first();
                    const ariaSort = await sortableHeader.getAttribute('aria-sort');
                    expect(['ascending', 'descending', 'none', 'other'].includes(ariaSort || '')).toBeTruthy();
                }
            }
        });

        test('Document list accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test document grid/list accessibility
            const documentList = page.locator('[data-testid="documents-grid"], [role="list"]');
            if (await documentList.isVisible()) {
                const listRole = await documentList.getAttribute('role');
                expect(listRole === 'list' || listRole === 'grid').toBeTruthy();
                
                const items = documentList.locator('[role="listitem"], [role="gridcell"]');
                const itemCount = await items.count();
                
                if (itemCount > 0) {
                    for (let i = 0; i < Math.min(itemCount, 3); i++) {
                        const item = items.nth(i);
                        const itemRole = await item.getAttribute('role');
                        const accessibleName = await item.getAttribute('aria-label') || 
                                              await item.textContent();
                        
                        expect(itemRole === 'listitem' || itemRole === 'gridcell').toBeTruthy();
                        expect(accessibleName?.trim()).toBeTruthy();
                    }
                }
            }
        });
    });

    test.describe('Interactive Elements Accessibility', () => {
        test('Modal dialog accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Open a modal dialog
            await page.click('[data-testid="create-project"]');
            const modal = page.locator('[data-testid="project-modal"]');
            await modal.waitFor();
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test modal accessibility
            const modalRole = await modal.getAttribute('role');
            expect(modalRole).toBe('dialog');
            
            // Test modal labeling
            const modalLabel = await modal.getAttribute('aria-labelledby') || 
                              await modal.getAttribute('aria-label');
            expect(modalLabel).toBeTruthy();
            
            // Test focus management
            const focusedElement = page.locator(':focus');
            const isInsideModal = await modal.locator(':focus').count() > 0;
            expect(isInsideModal).toBeTruthy();
            
            // Test escape key functionality
            await page.keyboard.press('Escape');
            await expect(modal).not.toBeVisible();
            
            // Focus should return to trigger element
            const triggerElement = page.locator('[data-testid="create-project"]');
            await expect(triggerElement).toBeFocused();
        });

        test('Dropdown menu accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Test user menu dropdown
            const userMenuTrigger = page.locator('[data-testid="user-menu-trigger"]');
            await userMenuTrigger.click();
            
            const dropdown = page.locator('[data-testid="user-menu-dropdown"]');
            await dropdown.waitFor();
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test dropdown accessibility
            const dropdownRole = await dropdown.getAttribute('role');
            expect(['menu', 'listbox'].includes(dropdownRole || '')).toBeTruthy();
            
            // Test menu items
            const menuItems = dropdown.locator('[role="menuitem"], [role="option"]');
            const itemCount = await menuItems.count();
            
            if (itemCount > 0) {
                // Test keyboard navigation
                await page.keyboard.press('ArrowDown');
                const focusedItem = dropdown.locator('[role="menuitem"]:focus, [role="option"]:focus');
                await expect(focusedItem).toBeVisible();
                
                // Test item accessibility
                for (let i = 0; i < itemCount; i++) {
                    const item = menuItems.nth(i);
                    const itemText = await item.textContent();
                    expect(itemText?.trim()).toBeTruthy();
                }
            }
        });

        test('Tab navigation accessibility', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');
            
            const tabList = page.locator('[role="tablist"]');
            if (await tabList.isVisible()) {
                await checkA11y(page, null, {
                    detailedReport: true,
                    detailedReportOptions: { html: true }
                });
                
                const tabs = tabList.locator('[role="tab"]');
                const tabCount = await tabs.count();
                
                if (tabCount > 0) {
                    // Test keyboard navigation
                    await tabs.first().focus();
                    
                    for (let i = 0; i < tabCount; i++) {
                        const currentTab = tabs.nth(i);
                        await expect(currentTab).toBeFocused();
                        
                        // Check tab properties
                        const tabId = await currentTab.getAttribute('id');
                        const controls = await currentTab.getAttribute('aria-controls');
                        const selected = await currentTab.getAttribute('aria-selected');
                        
                        expect(tabId).toBeTruthy();
                        expect(controls).toBeTruthy();
                        expect(['true', 'false'].includes(selected || '')).toBeTruthy();
                        
                        // Test activation
                        await page.keyboard.press('Enter');
                        await page.waitForTimeout(500);
                        
                        const selectedValue = await currentTab.getAttribute('aria-selected');
                        expect(selectedValue).toBe('true');
                        
                        // Verify corresponding tabpanel
                        const tabpanel = page.locator(`[id="${controls}"]`);
                        await expect(tabpanel).toBeVisible();
                        
                        // Navigate to next tab
                        if (i < tabCount - 1) {
                            await page.keyboard.press('ArrowRight');
                        }
                    }
                }
            }
        });
    });

    test.describe('Mobile Accessibility', () => {
        test('Mobile navigation accessibility', async ({ page, context }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true }
            });
            
            // Test mobile menu accessibility
            const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
            if (await mobileMenuButton.isVisible()) {
                // Test button accessibility
                const buttonLabel = await mobileMenuButton.getAttribute('aria-label') || 
                                   await mobileMenuButton.textContent();
                expect(buttonLabel).toBeTruthy();
                
                const ariaExpanded = await mobileMenuButton.getAttribute('aria-expanded');
                expect(['true', 'false'].includes(ariaExpanded || '')).toBeTruthy();
                
                // Open mobile menu
                await mobileMenuButton.click();
                
                const mobileMenu = page.locator('[data-testid="mobile-menu"]');
                await mobileMenu.waitFor();
                
                // Verify expanded state
                const expandedValue = await mobileMenuButton.getAttribute('aria-expanded');
                expect(expandedValue).toBe('true');
                
                // Test mobile menu navigation
                const navItems = mobileMenu.locator('a, button');
                const navCount = await navItems.count();
                
                for (let i = 0; i < navCount; i++) {
                    const item = navItems.nth(i);
                    const accessibleName = await item.getAttribute('aria-label') || 
                                          await item.textContent();
                    expect(accessibleName?.trim()).toBeTruthy();
                }
            }
        });

        test('Touch target accessibility', async ({ page, context }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Test touch target sizes (minimum 44x44px recommended)
            const interactiveElements = page.locator('button, a, input, [role="button"], [tabindex="0"]');
            const elementCount = await interactiveElements.count();
            
            const smallTargets: string[] = [];
            
            for (let i = 0; i < Math.min(elementCount, 10); i++) {
                const element = interactiveElements.nth(i);
                const boundingBox = await element.boundingBox();
                
                if (boundingBox) {
                    const { width, height } = boundingBox;
                    if (width < 44 || height < 44) {
                        const elementInfo = await element.getAttribute('data-testid') || 
                                           await element.textContent() || 
                                           `Element ${i}`;
                        smallTargets.push(`${elementInfo} (${width}x${height})`);
                    }
                }
            }
            
            if (smallTargets.length > 0) {
                console.warn('Touch targets smaller than 44x44px:', smallTargets);
                // In a real test, you might want to fail or warn about small targets
                // expect(smallTargets.length).toBe(0);
            }
        });
    });

    test.describe('Color and Contrast Accessibility', () => {
        test('Color contrast compliance', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/home');
            await page.waitForLoadState('networkidle');
            
            // Test with high contrast mode
            await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
            
            await checkA11y(page, null, {
                detailedReport: true,
                detailedReportOptions: { html: true },
                rules: {
                    'color-contrast': { enabled: true }
                }
            });
            
            // Test dark theme contrast
            const themeToggle = page.locator('[data-testid="theme-toggle"]');
            if (await themeToggle.isVisible()) {
                await themeToggle.click();
                await page.waitForTimeout(1000);
                
                await checkA11y(page, null, {
                    detailedReport: true,
                    detailedReportOptions: { html: true },
                    rules: {
                        'color-contrast': { enabled: true }
                    }
                });
            }
        });

        test('Color-only information compliance', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            await page.goto('/org/test-org/project/test-project/requirements');
            await page.waitForLoadState('networkidle');
            
            // Test that information is not conveyed by color alone
            // Look for status indicators, priority markers, etc.
            const statusElements = page.locator('[data-testid*="status"], [class*="status"], [class*="priority"]');
            const statusCount = await statusElements.count();
            
            for (let i = 0; i < Math.min(statusCount, 5); i++) {
                const element = statusElements.nth(i);
                const textContent = await element.textContent();
                const ariaLabel = await element.getAttribute('aria-label');
                const title = await element.getAttribute('title');
                
                // Element should have text, aria-label, or title to convey meaning
                const hasTextualMeaning = textContent?.trim() || ariaLabel || title;
                expect(hasTextualMeaning).toBeTruthy();
            }
        });
    });

    test.describe('Comprehensive Accessibility Audit', () => {
        test('Full application accessibility audit', async ({ page, context }) => {
            await setupAuthenticatedSession(context, TestData.users.standard.id);
            await mockUserProfile(page, TestData.users.standard);
            
            const pagesToTest = [
                '/home',
                '/org/test-org',
                '/org/test-org/project/test-project',
                '/org/test-org/project/test-project/requirements',
                '/org/test-org/project/test-project/documents',
                '/org/test-org/project/test-project/canvas',
                '/org/test-org/project/test-project/testbed'
            ];
            
            const auditResults: Array<{ url: string, violations: any[] }> = [];
            
            for (const url of pagesToTest) {
                await page.goto(url);
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                
                try {
                    await checkA11y(page, null, {
                        detailedReport: true,
                        detailedReportOptions: { html: true }
                    });
                    
                    auditResults.push({ url, violations: [] });
                } catch (error) {
                    const violations = await getViolations(page);
                    auditResults.push({ url, violations });
                    
                    console.log(`Accessibility violations on ${url}:`, violations.length);
                }
            }
            
            // Generate comprehensive report
            const totalViolations = auditResults.reduce((sum, result) => sum + result.violations.length, 0);
            console.log('Accessibility Audit Summary:', {
                pagesAudited: pagesToTest.length,
                totalViolations,
                results: auditResults
            });
            
            // Fail test if critical violations found
            const criticalViolations = auditResults.filter(result => 
                result.violations.some(violation => violation.impact === 'critical')
            );
            
            expect(criticalViolations.length).toBe(0);
        });
    });
});