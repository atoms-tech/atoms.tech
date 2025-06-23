import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureTableDemos() {
  // Create screenshots directory
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
    console.log('🚀 Starting table demo capture...');

    // Navigate to the table research page
    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');

    // Wait for the page to load
    await page.waitForTimeout(3000);

    // Capture library comparison tab
    console.log('📸 Capturing library comparison...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'table-research-comparison.png'),
      fullPage: true
    });

    // Click on Material React Table demo tab
    console.log('🔄 Switching to Material React Table demo...');
    try {
      await page.click('button:has-text("Material React Table")');
    } catch (error) {
      // Try alternative selector
      await page.click('[value="material-demo"]');
    }
    await page.waitForTimeout(5000); // Wait for demo to load

    // Capture Material React Table demo
    console.log('📸 Capturing Material React Table demo...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'material-react-table-demo.png'),
      fullPage: true
    });

    // Test some interactions with Material React Table
    try {
      // Try to click add button if it exists
      const addButton = await page.locator('button:has-text("Add Requirement")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(2000);
        
        // Capture modal if it opens
        await page.screenshot({
          path: path.join(screenshotsDir, 'material-react-table-add-modal.png'),
          fullPage: true
        });

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('⚠️ Could not interact with Material React Table:', error.message);
    }

    // Click on Mantine React Table demo tab
    console.log('🔄 Switching to Mantine React Table demo...');
    try {
      await page.click('button:has-text("Mantine React Table")');
    } catch (error) {
      // Try alternative selector
      await page.click('[value="mantine-demo"]');
    }
    await page.waitForTimeout(5000); // Wait for demo to load

    // Capture Mantine React Table demo
    console.log('📸 Capturing Mantine React Table demo...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'mantine-react-table-demo.png'),
      fullPage: true
    });

    // Test some interactions with Mantine React Table
    try {
      // Try to click add button if it exists
      const addButton = await page.locator('button:has-text("Add Requirement")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(2000);
        
        // Capture modal if it opens
        await page.screenshot({
          path: path.join(screenshotsDir, 'mantine-react-table-add-modal.png'),
          fullPage: true
        });

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('⚠️ Could not interact with Mantine React Table:', error.message);
    }

    // Click on recommendation tab
    console.log('🔄 Switching to recommendation tab...');
    try {
      await page.click('button:has-text("Recommendation")');
    } catch (error) {
      // Try alternative selector
      await page.click('[value="recommendation"]');
    }
    await page.waitForTimeout(2000);

    // Capture recommendation
    console.log('📸 Capturing recommendation...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'table-research-recommendation.png'),
      fullPage: true
    });

    console.log('✅ All screenshots captured successfully!');
    console.log('📁 Screenshots saved to:', screenshotsDir);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the capture
captureTableDemos().catch(console.error);
