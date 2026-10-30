const { chromium } = require("C:/dev/projects/portafolioV2/node_modules/playwright-core");

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Click Play Escape Mode
    const playBtn = await page.waitForSelector("button:has-text('JUGAR // MODO ESCAPE')");
    await playBtn.click();
    await page.waitForTimeout(200);

    for (let i = 0; i < 6; i++) {
      const pos = await page.evaluate(() => window.__RONALD_POS);
      console.log(`Sample ${i} (t=${i * 500}ms): Ronald Position =`, pos);
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: "public/images/screenshot-ronald-active.png" });
    await browser.close();
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
})();
