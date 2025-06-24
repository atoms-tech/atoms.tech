import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function recordTableDemos() {
  const videosDir = path.join(__dirname, '..', 'videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true, // Must be headless in server environment
    slowMo: 500 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videosDir,
      size: { width: 1920, height: 1080 }
    }
  });
  
  const page = await context.newPage();

  try {
    console.log('🎬 Starting table demo video recording...');

    // Navigate to the table research page
    await page.goto('http://localhost:3000/table-research', {
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    console.log('📄 Navigated to table research page');
    await page.waitForTimeout(3000);

    // Record overview of comparison page
    console.log('🎥 Recording library comparison overview...');
    await page.waitForTimeout(2000);

    // Scroll through the comparison to show features
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    // Navigate to Material React Table demo
    console.log('🔄 Switching to Material React Table demo...');
    const materialTab = page.locator('text=Material React Table').first();
    await materialTab.click();
    await page.waitForTimeout(3000);

    // Scroll to show the demo content
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
    await page.waitForTimeout(3000);

    // Navigate to Mantine React Table demo
    console.log('🔄 Switching to Mantine React Table demo...');
    const mantineTab = page.locator('text=Mantine React Table').first();
    await mantineTab.click();
    await page.waitForTimeout(3000);

    // Scroll to show the demo content
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
    await page.waitForTimeout(3000);

    // Navigate to Recommendation
    console.log('🔄 Switching to Recommendation tab...');
    const recommendationTab = page.locator('text=Recommendation').first();
    await recommendationTab.click();
    await page.waitForTimeout(3000);

    // Scroll through recommendation
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    await page.waitForTimeout(3000);

    console.log('✅ Video recording completed!');

  } catch (error) {
    console.error('❌ Error during video recording:', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    
    // List recorded videos
    console.log('\n📹 Recorded videos:');
    const files = fs.readdirSync(videosDir);
    files.forEach(file => {
      if (file.endsWith('.webm')) {
        const filePath = path.join(videosDir, file);
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024 / 1024)}MB)`);
      }
    });
  }
}

// Run the recording
recordTableDemos().catch(console.error);
