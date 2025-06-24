import { chromium } from 'playwright';

async function simpleDebug() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log('Opening browser to localhost:3001...');
        await page.goto('http://localhost:3001');
        await page.waitForTimeout(2000);
        
        console.log('Current URL:', page.url());
        
        // Check if we can see any loading elements
        const hasLoading = await page.locator('[class*="animate-pulse"], [class*="skeleton"], .loading').count();
        console.log('Loading elements found:', hasLoading);
        
        // Take screenshot
        await page.screenshot({ path: 'current-state.png' });
        console.log('Screenshot saved');
        
        // Keep browser open for manual inspection
        console.log('Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}

simpleDebug().catch(console.error);
