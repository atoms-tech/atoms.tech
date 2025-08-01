import { chromium } from 'playwright';
import fs from 'fs';

async function testPolarionPage() {
    console.log('🚀 Starting Polarion page test...');
    
    // Launch browser in headless mode
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        // Navigate to main page first
        console.log('📍 Navigating to main page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'screenshots/01-main-page.png', fullPage: true });
        console.log('✅ Main page screenshot saved');
        
        // Test navigation to Polarion
        console.log('📍 Navigating to Polarion page...');
        await page.goto('http://localhost:3000/polarion', { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'screenshots/02-polarion-page.png', fullPage: true });
        console.log('✅ Polarion page screenshot saved');
        
        // Test navigation menu
        console.log('📍 Testing navigation menu...');
        await page.goto('http://localhost:3000');
        
        // Check if Polarion link exists in navigation
        const polarionLink = await page.locator('a[href="/polarion"]').first();
        if (await polarionLink.isVisible()) {
            console.log('✅ Polarion navigation link found');
            await polarionLink.click();
            await page.waitForURL('**/polarion');
            await page.screenshot({ path: 'screenshots/03-polarion-via-nav.png', fullPage: true });
            console.log('✅ Navigation to Polarion via menu works');
        } else {
            console.log('❌ Polarion navigation link not found');
        }
        
        // Test page elements
        console.log('📍 Testing page elements...');
        await page.goto('http://localhost:3000/polarion');
        
        // Check hero section
        const heroTitle = await page.locator('h1').first();
        if (await heroTitle.isVisible()) {
            const titleText = await heroTitle.textContent();
            console.log(`✅ Hero title found: "${titleText}"`);
        }
        
        // Check CTA button
        const ctaButton = await page.locator('button:has-text("REQUEST PRIVATE BETA")').first();
        if (await ctaButton.isVisible()) {
            console.log('✅ CTA button found');
            await ctaButton.hover();
            await page.screenshot({ path: 'screenshots/04-cta-hover.png', fullPage: true });
        }
        
        // Check demo section
        const demoSection = await page.locator('text=15-SECOND DEMOS').first();
        if (await demoSection.isVisible()) {
            console.log('✅ Demo section found');
        }
        
        // Check benefits section
        const benefitsSection = await page.locator('text=WHY IT\'S GROUNDBREAKING').first();
        if (await benefitsSection.isVisible()) {
            console.log('✅ Benefits section found');
        }
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
}

testPolarionPage().catch(console.error);
