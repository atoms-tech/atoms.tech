import { test as base, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth.page';
import { HomePage } from '../page-objects/home.page';
import { NavigationPage } from '../page-objects/navigation.page';
import { DocumentPage } from '../page-objects/document.page';
import { ProjectPage } from '../page-objects/project.page';
import { SettingsPage } from '../page-objects/settings.page';

/**
 * Test Data Factory for consistent test data generation
 */
export class TestDataFactory {
    static generateUser() {
        const timestamp = Date.now();
        return {
            email: `test.user.${timestamp}@example.com`,
            password: 'TestPassword123!',
            name: `Test User ${timestamp}`,
            organization: `Test Org ${timestamp}`,
        };
    }

    static generateProject() {
        const timestamp = Date.now();
        return {
            name: `Test Project ${timestamp}`,
            description: `Automated test project created at ${new Date().toISOString()}`,
            type: 'Software Development',
        };
    }

    static generateDocument() {
        const timestamp = Date.now();
        return {
            title: `Test Document ${timestamp}`,
            content: `This is a test document created by automated tests at ${new Date().toISOString()}`,
            type: 'Requirements',
        };
    }

    static generateRequirement() {
        const timestamp = Date.now();
        return {
            id: `REQ-${timestamp}`,
            title: `Test Requirement ${timestamp}`,
            description: `Automated test requirement generated at ${new Date().toISOString()}`,
            priority: 'High',
            status: 'Draft',
        };
    }
}

/**
 * Custom Test Context with Page Objects and Utilities
 */
export interface TestContext {
    authPage: AuthPage;
    homePage: HomePage;
    navigationPage: NavigationPage;
    documentPage: DocumentPage;
    projectPage: ProjectPage;
    settingsPage: SettingsPage;
    userData: ReturnType<typeof TestDataFactory.generateUser>;
    projectData: ReturnType<typeof TestDataFactory.generateProject>;
    documentData: ReturnType<typeof TestDataFactory.generateDocument>;
    requirementData: ReturnType<typeof TestDataFactory.generateRequirement>;
}

/**
 * Extended Playwright test with custom fixtures
 */
export const test = base.extend<TestContext>({
    // Page Object Fixtures
    authPage: async ({ page }, use) => {
        await use(new AuthPage(page));
    },

    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    navigationPage: async ({ page }, use) => {
        await use(new NavigationPage(page));
    },

    documentPage: async ({ page }, use) => {
        await use(new DocumentPage(page));
    },

    projectPage: async ({ page }, use) => {
        await use(new ProjectPage(page));
    },

    settingsPage: async ({ page }, use) => {
        await use(new SettingsPage(page));
    },

    // Test Data Fixtures
    userData: async ({}, use) => {
        await use(TestDataFactory.generateUser());
    },

    projectData: async ({}, use) => {
        await use(TestDataFactory.generateProject());
    },

    documentData: async ({}, use) => {
        await use(TestDataFactory.generateDocument());
    },

    requirementData: async ({}, use) => {
        await use(TestDataFactory.generateRequirement());
    },
});

/**
 * Performance Test Utilities
 */
export class PerformanceMonitor {
    static async measurePageLoad(page: any) {
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstContentfulPaint: 0, // Will be populated by observer
                totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
            };
        });

        return performanceMetrics;
    }

    static async measureInteraction(page: any, action: () => Promise<void>) {
        const startTime = Date.now();
        await action();
        const endTime = Date.now();
        return endTime - startTime;
    }

    static async checkWebVitals(page: any) {
        return await page.evaluate(() => {
            return new Promise((resolve) => {
                const vitals: any = {};
                
                // Largest Contentful Paint
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    vitals.lcp = entries[entries.length - 1].startTime;
                }).observe({ entryTypes: ['largest-contentful-paint'] });

                // First Input Delay
                new PerformanceObserver((list) => {
                    vitals.fid = list.getEntries()[0].processingStart - list.getEntries()[0].startTime;
                }).observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift
                let clsValue = 0;
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!(entry as any).hadRecentInput) {
                            clsValue += (entry as any).value;
                        }
                    }
                    vitals.cls = clsValue;
                }).observe({ entryTypes: ['layout-shift'] });

                setTimeout(() => resolve(vitals), 2000);
            });
        });
    }
}

/**
 * Browser Compatibility Utilities
 */
export class BrowserUtils {
    static async detectBrowserFeatures(page: any) {
        return await page.evaluate(() => {
            return {
                webgl: !!window.WebGLRenderingContext,
                websockets: !!window.WebSocket,
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage,
                indexedDB: !!window.indexedDB,
                serviceWorker: 'serviceWorker' in navigator,
                pushManager: 'PushManager' in window,
                notifications: 'Notification' in window,
                geolocation: 'geolocation' in navigator,
                mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            };
        });
    }

    static async simulateNetworkConditions(page: any, conditions: { offline?: boolean; downloadThroughput?: number; uploadThroughput?: number; latency?: number }) {
        const client = await page.context().newCDPSession(page);
        await client.send('Network.emulateNetworkConditions', {
            offline: conditions.offline || false,
            downloadThroughput: conditions.downloadThroughput || -1,
            uploadThroughput: conditions.uploadThroughput || -1,
            latency: conditions.latency || 0,
        });
    }
}

/**
 * Accessibility Testing Utilities
 */
export class AccessibilityUtils {
    static async checkKeyboardNavigation(page: any, selectors: string[]) {
        const results = [];
        
        for (const selector of selectors) {
            const element = page.locator(selector);
            await element.focus();
            
            const isFocused = await element.evaluate((el: HTMLElement) => document.activeElement === el);
            results.push({ selector, isFocused });
        }
        
        return results;
    }

    static async checkAriaAttributes(page: any, selector: string) {
        return await page.locator(selector).evaluate((element: HTMLElement) => {
            return {
                hasAriaLabel: element.hasAttribute('aria-label'),
                hasAriaDescribedBy: element.hasAttribute('aria-describedby'),
                hasRole: element.hasAttribute('role'),
                ariaExpanded: element.getAttribute('aria-expanded'),
                ariaDisabled: element.getAttribute('aria-disabled'),
                tabIndex: element.tabIndex,
            };
        });
    }
}

/**
 * Error Simulation Utilities
 */
export class ErrorSimulator {
    static async simulateNetworkError(page: any) {
        await page.route('**/*', route => {
            if (route.request().url().includes('/api/')) {
                route.abort('internetdisconnected');
            } else {
                route.continue();
            }
        });
    }

    static async simulateSlowResponse(page: any, delay: number = 5000) {
        await page.route('**/*', async route => {
            await new Promise(resolve => setTimeout(resolve, delay));
            route.continue();
        });
    }

    static async simulate404Error(page: any, endpoints: string[]) {
        await page.route('**/*', route => {
            const url = route.request().url();
            if (endpoints.some(endpoint => url.includes(endpoint))) {
                route.fulfill({ status: 404, body: 'Not Found' });
            } else {
                route.continue();
            }
        });
    }

    static async simulate500Error(page: any, endpoints: string[]) {
        await page.route('**/*', route => {
            const url = route.request().url();
            if (endpoints.some(endpoint => url.includes(endpoint))) {
                route.fulfill({ status: 500, body: 'Internal Server Error' });
            } else {
                route.continue();
            }
        });
    }
}

export { expect };