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
    console.log("Page title:", await page.title());

    // Wait 5 seconds for boot typing sequence to finish
    await page.waitForTimeout(5500);

    // Take screenshot of boot screen
    await page.screenshot({ path: "public/boot-screen.png" });
    console.log("Captured public/boot-screen.png");

    // Click Enter button
    const enterBtn = await page.waitForSelector("button:has-text('ENTRAR AL SISTEMA')", { timeout: 10000 });
    if (enterBtn) {
      console.log("Clicking ENTRAR AL SISTEMA button...");
      await enterBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "public/main-system.png" });
      console.log("Captured public/main-system.png");

      // Verify header HUD is rendered
      const hudTitle = await page.textContent("header");
      console.log("Header HUD text detected:", hudTitle ? hudTitle.substring(0, 40) : "none");

      // Test Puzzle 1: Input 243 and submit
      console.log("Testing Puzzle 1 input...");
      const numInput = await page.waitForSelector("input[type='number']", { timeout: 5000 });
      if (numInput) {
        await numInput.fill("243");
        const submitBtn = await page.waitForSelector("button:has-text('VERIFICAR SECUENCIA')");
        await submitBtn.click();
        await page.waitForTimeout(1000);
        console.log("Puzzle 1 submitted.");
      }

      // Test Opening Terminal
      console.log("Testing Terminal Open...");
      const terminalBtn = await page.waitForSelector("button:has-text('TERMINAL')");
      if (terminalBtn) {
        await terminalBtn.click();
        await page.waitForTimeout(500);
        const cliInput = await page.waitForSelector("input[placeholder*='Escribe un comando']");
        if (cliInput) {
          await cliInput.fill("status");
          await cliInput.press("Enter");
          await page.waitForTimeout(500);
          console.log("Terminal status command executed.");
        }
      }

      await page.screenshot({ path: "public/terminal-puzzle-solved.png" });
      console.log("Captured public/terminal-puzzle-solved.png");
    }

    console.log("Total Console Errors:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log("Errors detected:", consoleErrors);
    } else {
      console.log("SUCCESS: 0 console errors during interactive testing!");
    }

    await browser.close();
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
})();
