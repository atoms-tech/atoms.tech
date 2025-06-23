import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function manualTableCapture() {
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
    console.log('🚀 Starting manual table demo capture...');

    // Navigate to Material React Table demo directly
    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // Try to find and click the Material React Table tab
    console.log('🔍 Looking for Material React Table tab...');
    
    // Wait for tabs to be visible
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    
    // Get all tab buttons
    const tabs = await page.locator('[role="tab"]').all();
    console.log(`Found ${tabs.length} tabs`);
    
    for (let i = 0; i < tabs.length; i++) {
      const tabText = await tabs[i].textContent();
      console.log(`Tab ${i}: ${tabText}`);
      
      if (tabText && tabText.includes('Material React Table')) {
        console.log('🎯 Found Material React Table tab, clicking...');
        await tabs[i].click();
        await page.waitForTimeout(5000);
        
        console.log('📸 Capturing Material React Table demo...');
        await page.screenshot({
          path: path.join(screenshotsDir, 'material-react-table-demo.png'),
          fullPage: true
        });
        break;
      }
    }

    // Try to find and click the Mantine React Table tab
    console.log('🔍 Looking for Mantine React Table tab...');
    const tabsAgain = await page.locator('[role="tab"]').all();
    
    for (let i = 0; i < tabsAgain.length; i++) {
      const tabText = await tabsAgain[i].textContent();
      
      if (tabText && tabText.includes('Mantine React Table')) {
        console.log('🎯 Found Mantine React Table tab, clicking...');
        await tabsAgain[i].click();
        await page.waitForTimeout(5000);
        
        console.log('📸 Capturing Mantine React Table demo...');
        await page.screenshot({
          path: path.join(screenshotsDir, 'mantine-react-table-demo.png'),
          fullPage: true
        });
        break;
      }
    }

    // Try to find and click the Recommendation tab
    console.log('🔍 Looking for Recommendation tab...');
    const tabsThird = await page.locator('[role="tab"]').all();
    
    for (let i = 0; i < tabsThird.length; i++) {
      const tabText = await tabsThird[i].textContent();
      
      if (tabText && tabText.includes('Recommendation')) {
        console.log('🎯 Found Recommendation tab, clicking...');
        await tabsThird[i].click();
        await page.waitForTimeout(3000);
        
        console.log('📸 Capturing Recommendation...');
        await page.screenshot({
          path: path.join(screenshotsDir, 'table-research-recommendation.png'),
          fullPage: true
        });
        break;
      }
    }

    console.log('✅ Manual screenshots captured successfully!');

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the capture
manualTableCapture().catch(console.error);
