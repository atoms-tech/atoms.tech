import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugTabs() {
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
    console.log('🚀 Starting tab debugging...');

    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'debug-tabs-initial.png'),
      fullPage: true
    });

    // Get all buttons and their text
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      try {
        const text = await buttons[i].textContent();
        const isVisible = await buttons[i].isVisible();
        console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
      } catch (e) {
        console.log(`Button ${i}: Error getting text - ${e.message}`);
      }
    }

    // Look for tab-related elements
    console.log('\n🔍 Looking for tab elements...');
    
    // Check for any elements with "Material" in text
    const materialElements = await page.locator('text=Material').all();
    console.log(`Found ${materialElements.length} elements with "Material"`);
    
    for (let i = 0; i < materialElements.length; i++) {
      try {
        const text = await materialElements[i].textContent();
        const tagName = await materialElements[i].evaluate(el => el.tagName);
        const isVisible = await materialElements[i].isVisible();
        console.log(`Material element ${i}: "${text}" (${tagName}, visible: ${isVisible})`);
      } catch (e) {
        console.log(`Material element ${i}: Error - ${e.message}`);
      }
    }

    // Try to click the first Material element that's visible
    for (let i = 0; i < materialElements.length; i++) {
      try {
        const isVisible = await materialElements[i].isVisible();
        if (isVisible) {
          console.log(`\n🎯 Clicking Material element ${i}...`);
          await materialElements[i].click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({
            path: path.join(screenshotsDir, `debug-after-material-click-${i}.png`),
            fullPage: true
          });
          break;
        }
      } catch (e) {
        console.log(`Failed to click Material element ${i}: ${e.message}`);
      }
    }

    // Check for tables
    const tables = await page.locator('table').all();
    console.log(`\n📊 Found ${tables.length} tables`);
    
    for (let i = 0; i < tables.length; i++) {
      try {
        const isVisible = await tables[i].isVisible();
        console.log(`Table ${i}: visible=${isVisible}`);
        
        if (isVisible) {
          await tables[i].screenshot({
            path: path.join(screenshotsDir, `debug-table-${i}.png`)
          });
          console.log(`📸 Captured table ${i}`);
        }
      } catch (e) {
        console.log(`Table ${i}: Error - ${e.message}`);
      }
    }

    console.log('✅ Tab debugging completed!');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugTabs().catch(console.error);
