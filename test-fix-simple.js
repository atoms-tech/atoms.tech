import { chromium } from 'playwright';

async function testFix() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // Enable logging
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    try {
        console.log('Testing the GitHub SSO fix...');
        
        // Go to the home page
        await page.goto('http://localhost:3001/home');
        
        // Wait for the page to load
        await page.waitForTimeout(5000);
        
        const url = page.url();
        console.log('Current URL:', url);
        
        // Check for loading elements
        const hasLoading = await page.locator('[class*="animate-pulse"], [class*="skeleton"], .loading').count();
        console.log('Loading elements:', hasLoading);
        
        // Take screenshot
        await page.screenshot({ path: 'test-result.png' });
        console.log('Screenshot saved');
        
        if (hasLoading === 0) {
            console.log('✅ SUCCESS: No loading skeletons detected!');
        } else {
            console.log('❌ Still seeing loading skeletons');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

testFix().catch(console.error);
