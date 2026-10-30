const { chromium } = require("C:/dev/projects/portafolioV2/node_modules/playwright-core");

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const consoleErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    console.log("Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    console.log("Page Title:", await page.title());

    // 1. Verify Main Menu
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "public/images/screenshot-main-menu.png" });
    console.log("Captured public/images/screenshot-main-menu.png");

    // 2. Click Play Escape Mode
    const playBtn = await page.waitForSelector("button:has-text('JUGAR // MODO ESCAPE')");
    await playBtn.click();
    await page.waitForTimeout(1500);

    // Verify canvas is present
    const canvas = await page.waitForSelector("canvas");
    console.log("Canvas element verified:", !!canvas);

    // Press movement keys
    await page.keyboard.press("KeyD");
    await page.keyboard.press("KeyS");
    await page.keyboard.press("KeyF"); // Toggle flashlight
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "public/images/screenshot-gameplay.png" });
    console.log("Captured public/images/screenshot-gameplay.png");

    // Return to menu by clicking CooWeb logo
    const logoBtn = await page.waitForSelector("img[alt='CooWeb']");
    await logoBtn.click();
    await page.waitForTimeout(1000);

    // 3. Test Containment Mode & Leaderboard
    const containBtn = await page.waitForSelector("button:has-text('PROTOCOLO: CONTENCIÓN')");
    await containBtn.click();
    await page.waitForTimeout(1500);

    // Trigger game over or wait for interaction
    // Click logo to return and test Leaderboard modal
    const logo2 = await page.waitForSelector("img[alt='CooWeb']");
    await logo2.click();
    await page.waitForTimeout(1000);

    const leaderBtn = await page.waitForSelector("button:has-text('CLASIFICACIÓN GLOBAL')");
    await leaderBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: "public/images/screenshot-leaderboard.png" });
    console.log("Captured public/images/screenshot-leaderboard.png");

    console.log("Total Console Errors:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log("Errors detected:", consoleErrors);
    } else {
      console.log("SUCCESS: 0 console errors during survival horror interactive test!");
    }

    await browser.close();
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
})();
