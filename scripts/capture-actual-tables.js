import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureActualTables() {
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
    console.log('🚀 Starting actual table capture...');

    // Navigate to the page
    await page.goto('http://localhost:3000/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // 1. Capture comparison tab
    console.log('📸 1. Capturing comparison tab...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'ACTUAL-01-comparison.png'),
      fullPage: true
    });

    // 2. Force click Material React Table tab using JavaScript
    console.log('🔄 2. Forcing Material React Table tab...');
    await page.evaluate(() => {
      // Find all buttons and click the one with Material React Table text
      const buttons = Array.from(document.querySelectorAll('button'));
      const materialButton = buttons.find(btn => btn.textContent?.includes('Material React Table'));
      if (materialButton) {
        materialButton.click();
      }
    });
    await page.waitForTimeout(3000);

    console.log('📸 2. Capturing Material React Table tab...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'ACTUAL-02-material-full.png'),
      fullPage: true
    });

    // Capture just the table area
    const tableContainer = await page.locator('.bg-gray-50').first();
    if (await tableContainer.isVisible()) {
      await tableContainer.screenshot({
        path: path.join(screenshotsDir, 'ACTUAL-03-material-table.png')
      });
      console.log('📸 2b. Captured Material table container');
    }

    // 3. Force click Mantine React Table tab
    console.log('🔄 3. Forcing Mantine React Table tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const mantineButton = buttons.find(btn => btn.textContent?.includes('Mantine React Table'));
      if (mantineButton) {
        mantineButton.click();
      }
    });
    await page.waitForTimeout(3000);

    console.log('📸 3. Capturing Mantine React Table tab...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'ACTUAL-04-mantine-full.png'),
      fullPage: true
    });

    // Capture just the Mantine table area
    const mantineContainer = await page.locator('.bg-blue-50').first();
    if (await mantineContainer.isVisible()) {
      await mantineContainer.screenshot({
        path: path.join(screenshotsDir, 'ACTUAL-05-mantine-table.png')
      });
      console.log('📸 3b. Captured Mantine table container');
    }

    // 4. Force click Recommendation tab
    console.log('🔄 4. Forcing Recommendation tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const recButton = buttons.find(btn => btn.textContent?.includes('Recommendation'));
      if (recButton) {
        recButton.click();
      }
    });
    await page.waitForTimeout(3000);

    console.log('📸 4. Capturing Recommendation tab...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'ACTUAL-06-recommendation.png'),
      fullPage: true
    });

    console.log('✅ Actual table capture completed!');

    // List all captured files
    const files = [
      'ACTUAL-01-comparison.png',
      'ACTUAL-02-material-full.png',
      'ACTUAL-03-material-table.png',
      'ACTUAL-04-mantine-full.png',
      'ACTUAL-05-mantine-table.png',
      'ACTUAL-06-recommendation.png'
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
    console.error('❌ Error during capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the capture
captureActualTables().catch(console.error);
