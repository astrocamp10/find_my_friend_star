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
  const beforeClock = await page.locator("#clockText").innerText();
  await page.waitForTimeout(1200);
  const afterClock = await page.locator("#clockText").innerText();
  const status = await page.locator("#timeStatus").innerText();
  const buttonCount = await page.locator(".time-button").count();
  await page.screenshot({ path: "qa-time.png", fullPage: true });
  await browser.close();

  const ok = beforeClock !== afterClock && status.includes("현재 시각") && buttonCount === 0 && errors.length === 0;
  console.log(JSON.stringify({ beforeClock, afterClock, status, buttonCount, errors }, null, 2));
  if (!ok) process.exit(1);
})();