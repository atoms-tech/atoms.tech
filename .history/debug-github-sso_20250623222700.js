import { chromium } from 'playwright';

async function debugGitHubSSO() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Enable console logging
    page.on('console', (msg) => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

    try {
        // Navigate to the current page
        await page.goto('http://localhost:3001');

        // Wait a moment for the page to load
        await page.waitForTimeout(2000);

        // Get current URL
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);

        // Check if user is authenticated
        const authState = await page.evaluate(() => {
            return {
                localStorage: Object.keys(localStorage).reduce((acc, key) => {
                    acc[key] = localStorage.getItem(key);
                    return acc;
                }, {}),
                cookies: document.cookie,
                userAgent: navigator.userAgent,
            };
        });

        console.log('Auth State:', JSON.stringify(authState, null, 2));

        // Look for loading skeletons
        const loadingElements = await page
            .locator('[class*="animate-pulse"], [class*="skeleton"], .loading')
            .count();
        console.log('Loading elements found:', loadingElements);

        // Check for user profile elements
        const userElements = await page.evaluate(() => {
            const elements = [];

            // Look for user name displays
            const nameElements = document.querySelectorAll(
                '[class*="full_name"], [class*="username"], [class*="user"]',
            );
            nameElements.forEach((el) => {
                elements.push({
                    type: 'name',
                    text: el.textContent?.trim(),
                    className: el.className,
                    tagName: el.tagName,
                });
            });

            // Look for avatar elements
            const avatarElements = document.querySelectorAll(
                'img[alt*="avatar"], img[alt*="profile"], [class*="avatar"]',
            );
            avatarElements.forEach((el) => {
                elements.push({
                    type: 'avatar',
                    src: el.src,
                    alt: el.alt,
                    className: el.className,
                });
            });

            return elements;
        });

        console.log(
            'User elements found:',
            JSON.stringify(userElements, null, 2),
        );

        // Check for any error messages
        const errorElements = await page
            .locator('[class*="error"], .error, [role="alert"]')
            .allTextContents();
        if (errorElements.length > 0) {
            console.log('Error messages:', errorElements);
        }

        // Take a screenshot
        await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
        console.log('Screenshot saved as debug-screenshot.png');

        // Check network requests
        const responses = [];
        page.on('response', (response) => {
            if (
                response.url().includes('profiles') ||
                response.url().includes('auth') ||
                response.url().includes('user')
            ) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                });
            }
        });

        // Refresh the page to capture network requests
        await page.reload();
        await page.waitForTimeout(3000);

        console.log(
            'Relevant network responses:',
            JSON.stringify(responses, null, 2),
        );
    } catch (error) {
        console.error('Error during debugging:', error);
    } finally {
        await browser.close();
    }
}

debugGitHubSSO().catch(console.error);
