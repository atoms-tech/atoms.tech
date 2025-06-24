import { chromium } from 'playwright';

async function debugLoggedInState() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Enable comprehensive logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
    
    // Track network requests for profile/auth related calls
    const networkRequests = [];
    page.on('response', response => {
        if (response.url().includes('profiles') || 
            response.url().includes('auth') || 
            response.url().includes('user') ||
            response.url().includes('organizations')) {
            networkRequests.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                headers: Object.fromEntries(response.headers())
            });
        }
    });

    try {
        // Navigate to the home page (where user should be after GitHub login)
        console.log('Navigating to /home...');
        await page.goto('http://localhost:3001/home');
        
        // Wait for page to load and any redirects
        await page.waitForTimeout(5000);
        
        const currentUrl = page.url();
        console.log('Current URL after navigation:', currentUrl);
        
        // Check for loading skeletons and user profile elements
        const pageState = await page.evaluate(() => {
            // Find loading skeletons
            const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"], .loading, [class*="LoadingSpinner"]');
            
            // Find user profile elements
            const userNameElements = document.querySelectorAll('[class*="full_name"], [class*="username"], [class*="user"], [data-testid*="user"]');
            
            // Find sidebar user elements
            const sidebarUserElements = document.querySelectorAll('.sidebar [class*="user"], .sidebar [class*="profile"]');
            
            // Check for any error messages
            const errorElements = document.querySelectorAll('[class*="error"], .error, [role="alert"]');
            
            // Get page title and meta info
            const pageInfo = {
                title: document.title,
                bodyClasses: document.body.className,
                hasReactRoot: !!document.querySelector('#__next, [data-reactroot]'),
                readyState: document.readyState
            };
            
            return {
                pageInfo,
                skeletons: {
                    count: skeletons.length,
                    elements: Array.from(skeletons).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent?.trim().substring(0, 100),
                        visible: el.offsetParent !== null,
                        rect: el.getBoundingClientRect()
                    }))
                },
                userElements: {
                    count: userNameElements.length,
                    elements: Array.from(userNameElements).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent?.trim(),
                        visible: el.offsetParent !== null
                    }))
                },
                sidebarElements: {
                    count: sidebarUserElements.length,
                    elements: Array.from(sidebarUserElements).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent?.trim(),
                        visible: el.offsetParent !== null
                    }))
                },
                errors: {
                    count: errorElements.length,
                    messages: Array.from(errorElements).map(el => el.textContent?.trim()).filter(Boolean)
                }
            };
        });
        
        console.log('=== PAGE STATE ANALYSIS ===');
        console.log(JSON.stringify(pageState, null, 2));
        
        console.log('=== NETWORK REQUESTS ===');
        console.log(JSON.stringify(networkRequests, null, 2));
        
        // Take a screenshot for visual inspection
        await page.screenshot({ path: 'logged-in-state.png', fullPage: true });
        console.log('Screenshot saved as logged-in-state.png');
        
        // If we see loading skeletons, wait a bit more and check again
        if (pageState.skeletons.count > 0) {
            console.log('Loading skeletons detected, waiting 10 more seconds...');
            await page.waitForTimeout(10000);
            
            const finalState = await page.evaluate(() => {
                const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"], .loading, [class*="LoadingSpinner"]');
                const userElements = document.querySelectorAll('[class*="full_name"], [class*="username"], [class*="user"]');
                
                return {
                    skeletonCount: skeletons.length,
                    userElementCount: userElements.length,
                    userTexts: Array.from(userElements).map(el => el.textContent?.trim()).filter(Boolean)
                };
            });
            
            console.log('=== FINAL STATE AFTER WAITING ===');
            console.log(JSON.stringify(finalState, null, 2));
            
            await page.screenshot({ path: 'final-state.png', fullPage: true });
            console.log('Final screenshot saved as final-state.png');
        }
        
    } catch (error) {
        console.error('Error during debugging:', error);
    } finally {
        await browser.close();
    }
}

debugLoggedInState().catch(console.error);
