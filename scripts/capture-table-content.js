import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureTableContent() {
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
    console.log('🚀 Starting table content capture...');

    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // Capture Library Comparison tab (default)
    console.log('📸 Capturing Library Comparison with actual content...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'table-comparison-with-content.png'),
      fullPage: true
    });

    // Click Material React Table tab and capture the actual table
    console.log('🔄 Switching to Material React Table tab...');
    const materialTab = page.locator('text=Material React Table').first();
    await materialTab.click();
    await page.waitForTimeout(3000);

    console.log('📸 Capturing Material React Table with actual data...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'material-table-with-data.png'),
      fullPage: true
    });

    // Scroll to focus on just the table content
    await page.evaluate(() => {
      const tableElement = document.querySelector('table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    // Take a focused screenshot of just the table area
    const tableElement = await page.locator('table').first();
    if (await tableElement.isVisible()) {
      await tableElement.screenshot({
        path: path.join(screenshotsDir, 'material-table-focused.png')
      });
      console.log('📸 Captured focused Material React Table');
    }

    // Click Mantine React Table tab
    console.log('🔄 Switching to Mantine React Table tab...');
    const mantineTab = page.locator('text=Mantine React Table').first();
    await mantineTab.click();
    await page.waitForTimeout(3000);

    console.log('📸 Capturing Mantine React Table with actual data...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'mantine-table-with-data.png'),
      fullPage: true
    });

    // Scroll to focus on the Mantine table
    await page.evaluate(() => {
      const tableElement = document.querySelector('table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000);

    // Take a focused screenshot of the Mantine table
    const mantineTableElement = await page.locator('table').first();
    if (await mantineTableElement.isVisible()) {
      await mantineTableElement.screenshot({
        path: path.join(screenshotsDir, 'mantine-table-focused.png')
      });
      console.log('📸 Captured focused Mantine React Table');
    }

    // Click Recommendation tab
    console.log('🔄 Switching to Recommendation tab...');
    const recommendationTab = page.locator('text=Recommendation').first();
    await recommendationTab.click();
    await page.waitForTimeout(3000);

    console.log('📸 Capturing Recommendation with implementation details...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'recommendation-with-details.png'),
      fullPage: true
    });

    console.log('✅ All table content screenshots captured successfully!');

    // List all captured files
    const files = [
      'table-comparison-with-content.png',
      'material-table-with-data.png',
      'material-table-focused.png',
      'mantine-table-with-data.png',
      'mantine-table-focused.png',
      'recommendation-with-details.png'
    ];

    console.log('\n📋 Captured files:');
    files.forEach(file => {
      const filePath = path.join(screenshotsDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        console.log(`❌ ${file} (missing)`);
      }
    });

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the capture
captureTableContent().catch(console.error);
