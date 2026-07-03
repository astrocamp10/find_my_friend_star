const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost:4173";
const modules = ["src/data.js", "src/astro.js", "src/app.js"];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  });
  const page = await browser.newPage();
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
  const results = [];

  for (const modulePath of modules) {
    const specifier = `${baseUrl}/${modulePath}`;
    const result = await page.evaluate(async (url) => {
      try {
        await import(url);
        return { ok: true };
      } catch (error) {
        return { ok: false, name: error.name, message: error.message, stack: error.stack };
      }
    }, specifier);
    results.push({ modulePath, ...result });
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  if (results.some((result) => !result.ok)) process.exit(1);
})();
