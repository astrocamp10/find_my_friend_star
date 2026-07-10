const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:4173";

function attachErrorCollectors(page, errors) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      const location = message.location();
      errors.push(`console: ${message.text()} @ ${location.url}:${location.lineNumber}:${location.columnNumber}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`));
  page.on("response", (response) => {
    const status = response.status();
    const target = response.url();
    if (status >= 400 && /\/(src|data)\/|index\.html|favicon\.svg/.test(target)) {
      errors.push(`response ${status}: ${target}`);
    }
  });
}

async function canvasStats(page) {
  return page.locator("#skyCanvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    let alphaPixels = 0;
    let min = Infinity;
    let max = -Infinity;
    let checksum = 0;
    let sampleIndex = 0;

    for (let yStep = 1; yStep <= 18; yStep += 1) {
      for (let xStep = 1; xStep <= 24; xStep += 1) {
        const x = Math.min(width - 1, Math.max(0, Math.round((xStep / 25) * width)));
        const y = Math.min(height - 1, Math.max(0, Math.round((yStep / 19) * height)));
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const value = pixel[0] + pixel[1] + pixel[2];
        if (pixel[3] > 0) alphaPixels += 1;
        min = Math.min(min, value);
        max = Math.max(max, value);
        checksum = (checksum + value * (sampleIndex + 1)) % 1000000007;
        sampleIndex += 1;
      }
    }

    return { width, height, alphaPixels, variance: max - min, checksum };
  });
}

function pixelDistance(a, b) {
  return (
    Math.abs(a.variance - b.variance) +
    Math.abs(a.alphaPixels - b.alphaPixels) +
    Math.abs(a.width - b.width) +
    Math.abs(a.height - b.height) +
    Math.abs(a.checksum - b.checksum)
  );
}

async function dispatchTouchDrag(page, start, end) {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y, radiusX: 4, radiusY: 4, id: 1 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: end.x, y: end.y, radiusX: 4, radiusY: 4, id: 1 }],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

async function dispatchPinch(page, center) {
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: center.x - 34, y: center.y, radiusX: 4, radiusY: 4, id: 1 },
      { x: center.x + 34, y: center.y, radiusX: 4, radiusY: 4, id: 2 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: center.x - 62, y: center.y, radiusX: 4, radiusY: 4, id: 1 },
      { x: center.x + 62, y: center.y, radiusX: 4, radiusY: 4, id: 2 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

async function testMobile(browser, name, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: viewport.width <= 430 ? 3 : 2,
  });
  const page = await context.newPage();
  const errors = [];
  attachErrorCollectors(page, errors);

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#skyCanvas");
  await page.waitForTimeout(600);

  const layout = await page.evaluate(() => {
    const control = document.querySelector(".control-panel").getBoundingClientRect();
    const result = document.querySelector(".result-panel").getBoundingClientRect();
    const canvas = document.querySelector("#skyCanvas");
    const factGrid = document.querySelector(".fact-grid");
    return {
      innerWidth,
      innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      controlLeft: control.left,
      controlRight: control.right,
      resultLeft: result.left,
      resultRight: result.right,
      controlTop: control.top,
      controlBottom: control.bottom,
      controlHeight: control.height,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      cssTouchAction: getComputedStyle(canvas).touchAction,
      factGridColumns: getComputedStyle(factGrid).gridTemplateColumns.split(" ").filter(Boolean).length,
      dpr: devicePixelRatio,
    };
  });

  if (layout.scrollWidth > layout.innerWidth + 1) errors.push(`${name}: horizontal overflow ${layout.scrollWidth}/${layout.innerWidth}`);
  if (layout.controlLeft < -1 || layout.controlRight > layout.innerWidth + 1) errors.push(`${name}: control panel outside viewport`);
  if (layout.resultLeft < -1 || layout.resultRight > layout.innerWidth + 1) errors.push(`${name}: result panel outside viewport`);
  if (viewport.width < 820 && layout.factGridColumns !== 1) errors.push(`${name}: fact grid not one column`);
  if (layout.cssTouchAction !== "none") errors.push(`${name}: canvas touch-action is ${layout.cssTouchAction}`);
    if (viewport.width <= 640) {
    const visibleSheetHeight = layout.innerHeight - layout.controlTop;
    if (layout.controlTop < layout.innerHeight * 0.58 || layout.controlTop > layout.innerHeight * 0.76) {
      errors.push(`${name}: bottom sheet top looks off (${layout.controlTop})`);
    }
    if (visibleSheetHeight < layout.innerHeight * 0.25 || visibleSheetHeight > layout.innerHeight * 0.42) {
      errors.push(`${name}: bottom sheet height ratio looks off (${visibleSheetHeight}/${layout.innerHeight})`);
    }
  } else if (layout.controlTop < 80 || layout.controlTop > 230) {
    errors.push(`${name}: control panel top looks off (${layout.controlTop})`);
  }

  const expectedCanvasWidth = Math.floor(layout.innerWidth * Math.min(layout.dpr, 2));
  const expectedCanvasHeight = Math.floor(layout.innerHeight * Math.min(layout.dpr, 2));
  if (Math.abs(layout.canvasWidth - expectedCanvasWidth) > 3) errors.push(`${name}: canvas backing width ${layout.canvasWidth}, expected ${expectedCanvasWidth}`);
  if (Math.abs(layout.canvasHeight - expectedCanvasHeight) > 3) errors.push(`${name}: canvas backing height ${layout.canvasHeight}, expected ${expectedCanvasHeight}`);

  const beforeCanvas = await canvasStats(page);
  if (beforeCanvas.alphaPixels < 300 || beforeCanvas.variance < 12) errors.push(`${name}: canvas appears blank ${JSON.stringify(beforeCanvas)}`);

  const previewBefore = await page.locator("#birthDatePreview").innerText();
  await page.locator("#birthYearInput").fill("2012");
  await page.locator("#birthMonthInput").fill("5");
  await page.locator("#birthDayInput").fill("10");
  const previewAfter = await page.locator("#birthDatePreview").innerText();
  if (previewBefore === previewAfter || !previewAfter.includes("2012") || !previewAfter.includes("10")) {
    errors.push(`${name}: birthday inputs did not update preview (${previewAfter})`);
  }

  const skyBox = await page.locator("#skyCanvas").boundingBox();
  const touchStart = { x: Math.min(viewport.width - 30, skyBox.x + viewport.width * 0.72), y: Math.max(48, skyBox.y + 90) };
  const touchEnd = { x: Math.max(30, skyBox.x + viewport.width * 0.28), y: touchStart.y + 18 };
  await dispatchTouchDrag(page, touchStart, touchEnd);
  await page.waitForTimeout(250);
  const afterDrag = await canvasStats(page);
  await dispatchPinch(page, { x: viewport.width / 2, y: 120 });
  await page.waitForTimeout(250);
  const afterPinch = await canvasStats(page);
  if (pixelDistance(beforeCanvas, afterDrag) === 0 && pixelDistance(afterDrag, afterPinch) === 0) {
    errors.push(`${name}: touch drag/pinch did not affect canvas samples`);
  }

  await page.screenshot({ path: `qa-mobile-${name}.png`, fullPage: true });
  await context.close();
  return { name, viewport, layout, previewBefore, previewAfter, errors };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  });
  const results = [];
  results.push(await testMobile(browser, "390", { width: 390, height: 844 }));
  results.push(await testMobile(browser, "430", { width: 430, height: 932 }));
  results.push(await testMobile(browser, "768", { width: 768, height: 1024 }));
  await browser.close();

  const errors = results.flatMap((result) => result.errors);
  console.log(JSON.stringify({ url, errorCount: errors.length, errors, results }, null, 2));
  if (errors.length) process.exit(1);
})();
