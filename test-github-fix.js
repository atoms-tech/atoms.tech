import { chromium } from 'playwright';

async function testGitHubFix() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Enable logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    try {
        console.log('Testing GitHub SSO fix...');
        
        // Navigate to the home page (where GitHub OAuth should redirect)
        await page.goto('http://localhost:3001/home');
        
        // Wait for the page to load and any profile creation to complete
        console.log('Waiting for page to load...');
        await page.waitForTimeout(8000);
        
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        // Check if we're still seeing loading skeletons
        const loadingCheck = await page.evaluate(() => {
            const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"], .loading, [class*="LoadingSpinner"]');
            const userElements = document.querySelectorAll('[class*="full_name"], [class*="username"], [class*="user"]');
            
            // Look for specific user display elements
            const sidebarUser = document.querySelector('.sidebar [class*="user"], .sidebar [class*="profile"]');
            const headerUser = document.querySelector('header [class*="user"], nav [class*="user"]');
            
            return {
                skeletonCount: skeletons.length,
                userElementCount: userElements.length,
                hasSidebarUser: !!sidebarUser,
                hasHeaderUser: !!headerUser,
                sidebarUserText: sidebarUser?.textContent?.trim(),
                headerUserText: headerUser?.textContent?.trim(),
                pageTitle: document.title,
                bodyText: document.body.textContent?.substring(0, 200)
            };
        });
        
        console.log('=== LOADING CHECK RESULTS ===');
        console.log(JSON.stringify(loadingCheck, null, 2));
        
        // Take a screenshot
        await page.screenshot({ path: 'github-fix-test.png', fullPage: true });
        console.log('Screenshot saved as github-fix-test.png');
        
        // Check if we can see the user's name/email anywhere
        const userInfo = await page.evaluate(() => {
            const textContent = document.body.textContent || '';
            const hasEmail = textContent.includes('@');
            const hasWelcome = textContent.toLowerCase().includes('welcome');
            const hasGreeting = textContent.toLowerCase().includes('good') || textContent.toLowerCase().includes('hello');
            
            return {
                hasEmail,
                hasWelcome,
                hasGreeting,
                textSnippet: textContent.substring(0, 500)
            };
        });
        
        console.log('=== USER INFO CHECK ===');
        console.log(JSON.stringify(userInfo, null, 2));
        
        // Success criteria
        const isFixed = loadingCheck.skeletonCount === 0 && 
                       (loadingCheck.userElementCount > 0 || userInfo.hasGreeting || userInfo.hasWelcome);
        
        console.log('=== RESULT ===');
        console.log(isFixed ? '✅ GITHUB SSO ISSUE APPEARS TO BE FIXED!' : '❌ Still seeing loading skeleton issue');
        
        if (!isFixed) {
            console.log('Waiting 10 more seconds to see if it resolves...');
            await page.waitForTimeout(10000);
            
            const finalCheck = await page.evaluate(() => {
                const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"], .loading, [class*="LoadingSpinner"]');
                return {
                    skeletonCount: skeletons.length,
                    pageText: document.body.textContent?.substring(0, 300)
                };
            });
            
            console.log('=== FINAL CHECK ===');
            console.log(JSON.stringify(finalCheck, null, 2));
            
            await page.screenshot({ path: 'github-fix-final.png', fullPage: true });
            console.log('Final screenshot saved');
        }
        
    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        // Keep browser open for manual inspection
        console.log('Keeping browser open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        await browser.close();
    }
}

testGitHubFix().catch(console.error);
