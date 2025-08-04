import { Page, expect } from '@playwright/test';

/**
 * Visual Testing Utilities
 * 
 * Helper functions for comprehensive visual regression testing
 */

export interface VisualTestOptions {
    waitForAnimations?: boolean;
    maskDynamicContent?: boolean;
    fullPage?: boolean;
    threshold?: number;
    maxDiffPixels?: number;
}

export interface ComponentState {
    state: 'default' | 'hover' | 'focus' | 'disabled' | 'active' | 'loading';
    selector: string;
    action?: () => Promise<void>;
}

export interface ThemeVariant {
    name: 'light' | 'dark';
    setup: (page: Page) => Promise<void>;
}

export interface ResponsiveBreakpoint {
    name: string;
    width: number;
    height: number;
}

/**
 * Standard responsive breakpoints for testing
 */
export const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'large', width: 2560, height: 1440 },
];

/**
 * Theme variants for visual testing
 */
export const THEME_VARIANTS: ThemeVariant[] = [
    {
        name: 'light',
        setup: async (page: Page) => {
            await page.evaluate(() => {
                localStorage.setItem('theme', 'light');
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.classList.remove('dark');
            });
        },
    },
    {
        name: 'dark',
        setup: async (page: Page) => {
            await page.evaluate(() => {
                localStorage.setItem('theme', 'dark');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.classList.add('dark');
            });
        },
    },
];

/**
 * Common component states for testing
 */
export const COMPONENT_STATES: Record<string, ComponentState[]> = {
    button: [
        { state: 'default', selector: 'button' },
        { state: 'hover', selector: 'button', action: async () => {} },
        { state: 'focus', selector: 'button', action: async () => {} },
        { state: 'disabled', selector: 'button[disabled]' },
    ],
    input: [
        { state: 'default', selector: 'input' },
        { state: 'focus', selector: 'input', action: async () => {} },
        { state: 'disabled', selector: 'input[disabled]' },
    ],
    card: [
        { state: 'default', selector: '[data-testid="card"]' },
        { state: 'hover', selector: '[data-testid="card"]', action: async () => {} },
    ],
};

/**
 * Wait for all animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
    await page.waitForTimeout(500); // Wait for initial animations
    
    // Wait for any CSS transitions to complete
    await page.evaluate(() => {
        return new Promise((resolve) => {
            const elements = document.querySelectorAll('*');
            let transitionCount = 0;
            
            elements.forEach((element) => {
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.transitionDuration !== '0s') {
                    transitionCount++;
                    element.addEventListener('transitionend', () => {
                        transitionCount--;
                        if (transitionCount === 0) {
                            resolve(undefined);
                        }
                    });
                }
            });
            
            if (transitionCount === 0) {
                resolve(undefined);
            }
        });
    });
}

/**
 * Wait for fonts to load
 */
export async function waitForFonts(page: Page): Promise<void> {
    await page.evaluate(() => {
        return document.fonts.ready;
    });
}

/**
 * Mask dynamic content for consistent screenshots
 */
export async function maskDynamicContent(page: Page): Promise<void> {
    await page.addStyleTag({
        content: `
            /* Mask timestamps and dynamic content */
            [data-testid="timestamp"],
            .timestamp,
            time,
            [data-dynamic="true"] {
                background: #888 !important;
                color: transparent !important;
            }
            
            /* Mask avatars and user images */
            [data-testid="avatar"] img,
            .avatar img,
            [data-testid="user-image"] {
                background: #ccc !important;
                opacity: 0.5 !important;
            }
            
            /* Mask loading states */
            [data-testid="loading"],
            .loading,
            .skeleton {
                background: #f0f0f0 !important;
                animation: none !important;
            }
        `,
    });
}

/**
 * Setup page for visual testing
 */
export async function setupVisualTest(
    page: Page,
    options: VisualTestOptions = {}
): Promise<void> {
    // Set viewport if not already set
    if (!page.viewportSize()) {
        await page.setViewportSize({ width: 1920, height: 1080 });
    }
    
    // Wait for fonts to load
    await waitForFonts(page);
    
    // Mask dynamic content if requested
    if (options.maskDynamicContent) {
        await maskDynamicContent(page);
    }
    
    // Wait for animations if requested
    if (options.waitForAnimations) {
        await waitForAnimations(page);
    }
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `,
    });
}

/**
 * Take a screenshot with consistent settings
 */
export async function takeVisualScreenshot(
    page: Page,
    name: string,
    options: VisualTestOptions = {}
): Promise<void> {
    await setupVisualTest(page, options);
    
    const screenshotOptions = {
        fullPage: options.fullPage || false,
        threshold: options.threshold || 0.3,
        maxDiffPixels: options.maxDiffPixels || 100,
    };
    
    await expect(page).toHaveScreenshot(`${name}.png`, screenshotOptions);
}

/**
 * Test component in different states
 */
export async function testComponentStates(
    page: Page,
    componentName: string,
    states: ComponentState[],
    options: VisualTestOptions = {}
): Promise<void> {
    for (const state of states) {
        // Setup the component state
        if (state.action) {
            if (state.state === 'hover') {
                await page.hover(state.selector);
            } else if (state.state === 'focus') {
                await page.focus(state.selector);
            } else {
                await state.action();
            }
        }
        
        // Take screenshot
        await takeVisualScreenshot(
            page,
            `${componentName}-${state.state}`,
            options
        );
        
        // Reset state
        await page.evaluate(() => {
            const activeElement = document.activeElement;
            if (activeElement && 'blur' in activeElement) {
                (activeElement as HTMLElement).blur();
            }
        });
    }
}

/**
 * Test component across themes
 */
export async function testComponentThemes(
    page: Page,
    componentName: string,
    testFunction: () => Promise<void>,
    options: VisualTestOptions = {}
): Promise<void> {
    for (const theme of THEME_VARIANTS) {
        await theme.setup(page);
        await page.waitForTimeout(100); // Wait for theme to apply
        
        await testFunction();
        
        await takeVisualScreenshot(
            page,
            `${componentName}-theme-${theme.name}`,
            options
        );
    }
}

/**
 * Test component across responsive breakpoints
 */
export async function testComponentResponsive(
    page: Page,
    componentName: string,
    testFunction: () => Promise<void>,
    options: VisualTestOptions = {}
): Promise<void> {
    for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
        await page.setViewportSize({
            width: breakpoint.width,
            height: breakpoint.height,
        });
        
        await testFunction();
        
        await takeVisualScreenshot(
            page,
            `${componentName}-${breakpoint.name}`,
            options
        );
    }
}

/**
 * Test modal or dialog component
 */
export async function testModalComponent(
    page: Page,
    modalName: string,
    triggerSelector: string,
    options: VisualTestOptions = {}
): Promise<void> {
    // Test modal closed state
    await takeVisualScreenshot(
        page,
        `${modalName}-closed`,
        options
    );
    
    // Open modal
    await page.click(triggerSelector);
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Test modal open state
    await takeVisualScreenshot(
        page,
        `${modalName}-open`,
        { ...options, fullPage: true }
    );
    
    // Test modal with focus
    await page.keyboard.press('Tab');
    await takeVisualScreenshot(
        page,
        `${modalName}-focused`,
        { ...options, fullPage: true }
    );
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
}

/**
 * Test loading states
 */
export async function testLoadingStates(
    page: Page,
    componentName: string,
    options: VisualTestOptions = {}
): Promise<void> {
    // Add loading state
    await page.evaluate(() => {
        document.body.setAttribute('data-loading', 'true');
    });
    
    await takeVisualScreenshot(
        page,
        `${componentName}-loading`,
        options
    );
    
    // Remove loading state
    await page.evaluate(() => {
        document.body.removeAttribute('data-loading');
    });
}

/**
 * Test empty states
 */
export async function testEmptyStates(
    page: Page,
    componentName: string,
    options: VisualTestOptions = {}
): Promise<void> {
    await takeVisualScreenshot(
        page,
        `${componentName}-empty`,
        options
    );
}

/**
 * Test error states
 */
export async function testErrorStates(
    page: Page,
    componentName: string,
    options: VisualTestOptions = {}
): Promise<void> {
    // Add error state
    await page.evaluate(() => {
        document.body.setAttribute('data-error', 'true');
    });
    
    await takeVisualScreenshot(
        page,
        `${componentName}-error`,
        options
    );
    
    // Remove error state
    await page.evaluate(() => {
        document.body.removeAttribute('data-error');
    });
}