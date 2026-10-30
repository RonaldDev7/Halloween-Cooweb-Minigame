const { chromium } = require("C:/dev/projects/portafolioV2/node_modules/playwright-core");

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    const consoleErrors = [];
    
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    console.log("Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // Wait for boot sequence
    await page.waitForTimeout(5200);
    const enterBtn = await page.waitForSelector("button:has-text('ENTRAR AL SISTEMA')", { timeout: 10000 });
    await enterBtn.click();
    await page.waitForTimeout(1500);

    // Solve Puzzle 1: 243
    console.log("Solving Puzzle 1...");
    const p1Input = await page.waitForSelector("input[type='number']");
    await p1Input.fill("243");
    const p1Btn = await page.waitForSelector("button:has-text('VERIFICAR SECUENCIA')");
    await p1Btn.click();
    await page.waitForTimeout(1000);

    // Solve Puzzle 2: NEXUS-RONALD-2041
    console.log("Solving Puzzle 2...");
    const p2Input = await page.waitForSelector("input[placeholder*='contraseña']");
    await p2Input.fill("NEXUS-RONALD-2041");
    const p2Btn = await page.waitForSelector("button:has-text('VALIDAR CREDENCIAL')");
    await p2Btn.click();
    await page.waitForTimeout(1000);

    // Solve Puzzle 3: EVA-OMEGA
    console.log("Solving Puzzle 3...");
    const p3Input = await page.waitForSelector("input[placeholder*='código neural']");
    await p3Input.fill("EVA-OMEGA");
    const p3Btn = await page.waitForSelector("button:has-text('SINCRONIZAR')");
    await p3Btn.click();
    await page.waitForTimeout(1000);

    // Solve Puzzle 4: Timed purge challenge
    console.log("Solving Puzzle 4...");
    const startTimedBtn = await page.waitForSelector("button:has-text('INICIAR PURGA')");
    await startTimedBtn.click();
    await page.waitForTimeout(500);

    // Click all 4 nodes
    for (let i = 1; i <= 4; i++) {
      const nodeBtn = await page.waitForSelector(`button:has-text('NODO 0${i}')`);
      await nodeBtn.click();
      await page.waitForTimeout(200);
    }
    console.log("Puzzle 4 completed! Waiting for E.V.A. Takeover...");

    // Wait for takeover screen
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "public/eva-takeover.png" });
    console.log("Captured public/eva-takeover.png");

    // Wait for final revelation screen
    await page.waitForTimeout(9500);
    await page.screenshot({ path: "public/final-revelation.png" });
    console.log("Captured public/final-revelation.png");

    console.log("Total Console Errors during full play-through:", consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log("Console errors:", consoleErrors);
    } else {
      console.log("SUCCESS: Entire narrative and gameplay completed with ZERO console errors!");
    }

    await browser.close();
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
})();
