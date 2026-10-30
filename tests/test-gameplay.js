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
    await page.waitForTimeout(1000);

    // Verify canvas is present
    const canvas = await page.waitForSelector("canvas");
    console.log("Canvas element verified:", !!canvas);

    // Aim mouse to the right-down to shine flashlight across the lab room
    await page.mouse.move(800, 500);

    // Walk around with WASD
    await page.keyboard.down("KeyD");
    await page.waitForTimeout(400);
    await page.keyboard.up("KeyD");
    await page.keyboard.down("KeyS");
    await page.waitForTimeout(400);
    await page.keyboard.up("KeyS");

    await page.waitForTimeout(800);
    await page.screenshot({ path: "public/images/screenshot-escape-mode.png" });
    console.log("Captured public/images/screenshot-escape-mode.png");

    // Return to menu
    const menuBtn = await page.waitForSelector("button[title='Volver al menú principal']");
    await menuBtn.click();
    await page.waitForTimeout(1000);

    // 3. Test Containment Mode
    const containBtn = await page.waitForSelector("button:has-text('PROTOCOLO: CONTENCIÓN')");
    await containBtn.click();
    await page.waitForTimeout(1000);

    // Aim mouse and move in containment mode
    await page.mouse.move(750, 450);
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(300);
    await page.keyboard.up("KeyW");

    await page.waitForTimeout(800);
    await page.screenshot({ path: "public/images/screenshot-containment-mode.png" });
    console.log("Captured public/images/screenshot-containment-mode.png");

    // Return to menu and test Leaderboard
    const menuBtn2 = await page.waitForSelector("button[title='Volver al menú principal']");
    await menuBtn2.click();
    await page.waitForTimeout(1000);

    const leaderBtn = await page.waitForSelector("button:has-text('CLASIFICACIÓN GLOBAL')");
    await leaderBtn.click();
    await page.waitForTimeout(1200);

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
