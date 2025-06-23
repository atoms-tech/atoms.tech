import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugPage() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting page debug...');

    await page.goto('http://localhost:3001/table-research', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(5000);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'debug-latest.png'),
      fullPage: true
    });

    // Get page HTML and save it
    const html = await page.content();
    fs.writeFileSync(path.join(screenshotsDir, 'page-content.html'), html);

    // Look for any buttons that might be tabs
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      try {
        const text = await buttons[i].textContent();
        const isVisible = await buttons[i].isVisible();
        console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
      } catch (e) {
        console.log(`Button ${i}: Error getting text`);
      }
    }

    // Look for elements with specific text
    const materialTab = page.locator('text=Material React Table').first();
    const mantineTab = page.locator('text=Mantine React Table').first();
    const recommendationTab = page.locator('text=Recommendation').first();

    console.log('Material tab visible:', await materialTab.isVisible().catch(() => false));
    console.log('Mantine tab visible:', await mantineTab.isVisible().catch(() => false));
    console.log('Recommendation tab visible:', await recommendationTab.isVisible().catch(() => false));

    // Try clicking Material tab if visible
    if (await materialTab.isVisible().catch(() => false)) {
      console.log('🎯 Clicking Material React Table tab...');
      await materialTab.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, 'debug-material-tab.png'),
        fullPage: true
      });
    }

    console.log('✅ Debug completed!');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugPage().catch(console.error);
