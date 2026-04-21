const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

(async () => {
  const outDir = path.resolve(__dirname, "..", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1600, height: 1400 } });
  const page = await context.newPage();

  // 1. Overview — the pass/fail grid
  await page.goto("http://localhost:9323", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "01-overview.png"), fullPage: true });
  console.log("✓ 01-overview.png");

  // 2. OpenRouter arbiter failure — the interesting failure
  const catLink = page.locator("a", { hasText: /Catalogue search returns relevant datasets/i }).first();
  if (await catLink.count()) {
    await catLink.click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(outDir, "02-catalogue-search-openrouter-failure.png"),
      fullPage: true,
    });
    console.log("✓ 02-catalogue-search-openrouter-failure.png");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
  }

  // 3. A passing dashboard — shows the semantic-assertion happy path
  const popLink = page
    .locator("a", { hasText: /Population dashboard renders core charts/i })
    .first();
  if (await popLink.count()) {
    await popLink.click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(outDir, "03-population-dashboard-pass.png"),
      fullPage: true,
    });
    console.log("✓ 03-population-dashboard-pass.png");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
  }

  // 4. OpenDOSM inflation — the hero semantic-range assertion
  const infLink = page
    .locator("a", { hasText: /OpenDOSM inflation dashboard shows plausible CPI values/i })
    .first();
  if (await infLink.count()) {
    await infLink.click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(outDir, "04-opendosm-inflation-hero.png"),
      fullPage: true,
    });
    console.log("✓ 04-opendosm-inflation-hero.png");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
  }

  // 5. KKMNow — the flaky-dashboard failure for comparison
  const kkmLink = page
    .locator("a", { hasText: /KKMNow hospital bed utilisation dashboard loads/i })
    .first();
  if (await kkmLink.count()) {
    await kkmLink.click();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(outDir, "05-kkmnow-flaky-failure.png"),
      fullPage: true,
    });
    console.log("✓ 05-kkmnow-flaky-failure.png");
  }

  await browser.close();
  console.log("\nDone. Screenshots in:", outDir);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
