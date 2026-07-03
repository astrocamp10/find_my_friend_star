const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:4173";

async function setRangeValue(page, selector, value) {
  await page.locator(selector).evaluate((input, nextValue) => {
    input.value = nextValue;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function testViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      errors.push(`${message.text()} @ ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });
  page.on("pageerror", (error) => errors.push(error.stack || error.message));

  await page.goto(url, { waitUntil: "networkidle" });
  await setRangeValue(page, "#birthYearInput", "2014");
  await setRangeValue(page, "#birthMonthInput", "4");
  await setRangeValue(page, "#birthDayInput", "18");
  await page.locator(".primary-action").click();
  await page.waitForFunction(
    () => document.querySelector("#distanceFact")?.innerText.includes("광년"),
    null,
    { timeout: 20000 },
  );
  await page.screenshot({ path: `qa-${name}.png`, fullPage: true });

  const title = await page.locator("#resultTitle").innerText();
  const distance = await page.locator("#distanceFact").innerText();
  const summary = await page.locator("#resultSummary").innerText();
  const color = await page.locator("#colorFact").innerText();
  if (!title || title.startsWith("Gaia DR3")) errors.push(`Unexpected result title: ${title}`);
  if (!distance.includes("광년") || !distance.includes("겉보기등급") || !distance.includes("절대등급")) {
    errors.push(`Distance and brightness not shown: ${distance}`);
  }
  if (summary.includes("Gaia DR3")) errors.push(`Catalog designation leaked into summary: ${summary}`);
  if (!color.includes("별") || color.includes("B-V")) errors.push(`Color not shown as Korean prose: ${color}`);

  await page.close();
  return { name, title, distance, summary, color, errors };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  });
  const results = [];
  results.push(await testViewport(browser, "desktop", { width: 1440, height: 960 }));
  results.push(await testViewport(browser, "mobile", { width: 390, height: 844 }));
  await browser.close();

  const allErrors = results.flatMap((result) => result.errors);
  console.log(JSON.stringify({ url, results, errorCount: allErrors.length, errors: allErrors }, null, 2));
  if (allErrors.length) process.exit(1);
})();