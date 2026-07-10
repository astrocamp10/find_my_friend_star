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
  await page.locator("#helpButton").click();
  await page.waitForFunction(() => !document.querySelector("#helpOverlay")?.classList.contains("hidden"), null, { timeout: 5000 });
  const helpText = await page.locator("#helpOverlay").innerText();
  if (!helpText.includes("빛의 속도는 빠르고 일정해요") || !helpText.includes("12광년 떨어진 별빛") || !helpText.includes("그래서 별빛 친구예요")) {
    errors.push(`Help explanation is incomplete: ${helpText}`);
  }
  await page.locator("#helpClose").click();
  await page.waitForFunction(() => document.querySelector("#helpOverlay")?.classList.contains("hidden"), null, { timeout: 5000 });
  await setRangeValue(page, "#birthYearInput", "2014");
  await setRangeValue(page, "#birthMonthInput", "4");
  await setRangeValue(page, "#birthDayInput", "18");
  await page.locator(".primary-action").click();
  await page.waitForFunction(
    () => document.querySelector(".candidate-inline-details")?.innerText.includes("광년"),
    null,
    { timeout: 20000 },
  );
  await page.screenshot({ path: `qa-${name}.png`, fullPage: true });

  const candidateCount = await page.locator(".candidate-card").count();
  const activeCandidateCount = await page.locator(".candidate-card.active").count();
  const inlineDetailCount = await page.locator(".candidate-inline-details").count();
  const inlineDetails = await page.locator(".candidate-inline-details").innerText();
  const lowerFactGridDisplay = await page.locator(".fact-grid").evaluate((element) => getComputedStyle(element).display);
  const title = await page.locator("#resultTitle").innerText();
  const candidateTexts = await page.locator(".candidate-card").evaluateAll((cards) => cards.map((card) => card.innerText));
  const distance = inlineDetails;
  const summary = await page.locator("#resultSummary").innerText();
  const pageText = await page.locator("body").innerText();
  if (candidateCount !== 3) errors.push(`Expected 3 friend candidates, saw ${candidateCount}`);
  if (activeCandidateCount !== 1) errors.push(`Expected 1 active friend candidate, saw ${activeCandidateCount}`);
  if (inlineDetailCount !== 1) errors.push(`Expected 1 inline candidate detail, saw ${inlineDetailCount}`);
  if (lowerFactGridDisplay !== "none") errors.push(`Expected lower friend fact grid to be hidden, saw display=${lowerFactGridDisplay}`);
  const belowHorizonCandidate = candidateTexts.find((text) => /고도\s*-/.test(text));
  if (belowHorizonCandidate) errors.push(`Below-horizon friend candidate shown: ${belowHorizonCandidate}`);
  if (!candidateTexts[0]?.includes("별자리 별 후보") || !candidateTexts[0]?.includes("별자리 선")) {
    errors.push(`First candidate is not a confirmed constellation-line star: ${candidateTexts[0]}`);
  }
  if (!title || title.startsWith("Gaia DR3")) errors.push(`Unexpected result title: ${title}`);
  if (!distance.includes("광년") || !distance.includes("겉보기등급") || !distance.includes("절대등급")) {
    errors.push(`Distance and brightness not shown: ${distance}`);
  }
  if (summary.includes("Gaia DR3")) errors.push(`Catalog designation leaked into summary: ${summary}`);
  if (pageText.includes("별빛 색") || pageText.includes("B-V")) errors.push("Removed color information is still visible");

  await page.locator("#resetView").click();
  await page.waitForFunction(() => !document.body.classList.contains("has-result"), null, { timeout: 5000 });
  const resetResultPanelDisplay = await page.locator(".result-panel").evaluate((element) => getComputedStyle(element).display);
  if (resetResultPanelDisplay !== "none") errors.push(`Expected result panel hidden after reset, saw display=${resetResultPanelDisplay}`);
  await page.close();
  return { name, title, candidateCount, activeCandidateCount, inlineDetailCount, lowerFactGridDisplay, candidateTexts, distance, summary, errors };
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
