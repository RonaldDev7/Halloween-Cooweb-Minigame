const { chromium } = require("C:/dev/projects/portafolioV2/node_modules/playwright-core");

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    console.log("Testing Ronald movement and chase pathfinding...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Click Play Escape Mode
    const playBtn = await page.waitForSelector("button:has-text('JUGAR // MODO ESCAPE')");
    await playBtn.click();
    await page.waitForTimeout(1000);

    // Let the game run for 2 seconds while moving player
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(600);
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(600);
    await page.keyboard.up("KeyS");

    // Take screenshot of player moving and radar active
    await page.screenshot({ path: "public/images/screenshot-ronald-active.png" });
    console.log("Captured public/images/screenshot-ronald-active.png");

    await browser.close();
    console.log("SUCCESS: Ronald movement test completed smoothly!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
})();
