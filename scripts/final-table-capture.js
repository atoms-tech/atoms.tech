import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function finalTableCapture() {
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
    console.log('🚀 Starting final table demo capture...');

    await page.goto('http://localhost:3001/table-research', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // Capture Library Comparison tab (default)
    console.log('📸 Capturing Library Comparison tab...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'table-research-comparison-final.png'),
      fullPage: true
    });

    // Click Material React Table tab
    console.log('🔄 Switching to Material React Table tab...');
    const materialTab = page.locator('text=Material React Table').first();
    await materialTab.click();
    await page.waitForTimeout(3000);

    console.log('📸 Capturing Material React Table demo...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'material-react-table-demo-final.png'),
      fullPage: true
    });

    // Click Mantine React Table tab
    console.log('🔄 Switching to Mantine React Table tab...');
    const mantineTab = page.locator('text=Mantine React Table').first();
    await mantineTab.click();
    await page.waitForTimeout(3000);

    console.log('📸 Capturing Mantine React Table demo...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'mantine-react-table-demo-final.png'),
      fullPage: true
    });

    // Click Recommendation tab
    console.log('🔄 Switching to Recommendation tab...');
    const recommendationTab = page.locator('text=Recommendation').first();
    await recommendationTab.click();
    await page.waitForTimeout(3000);

    console.log('📸 Capturing Recommendation tab...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'table-research-recommendation-final.png'),
      fullPage: true
    });

    console.log('✅ All final screenshots captured successfully!');
    console.log('📁 Screenshots saved to:', screenshotsDir);

    // List all captured files
    const files = [
      'table-research-comparison-final.png',
      'material-react-table-demo-final.png', 
      'mantine-react-table-demo-final.png',
      'table-research-recommendation-final.png'
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
finalTableCapture().catch(console.error);
