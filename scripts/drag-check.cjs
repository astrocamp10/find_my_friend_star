const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:4173";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.stack || error.message));

  await page.goto(url, { waitUntil: "networkidle" });
  const before = await page.screenshot();
  await page.mouse.move(720, 240);
  await page.mouse.down();
  await page.mouse.move(1040, 240, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "qa-drag.png", fullPage: true });
  const after = await page.screenshot();
  await browser.close();

  const changed = Buffer.compare(before, after) !== 0;
  console.log(JSON.stringify({ changed, errors }, null, 2));
  if (!changed || errors.length) process.exit(1);
})();
