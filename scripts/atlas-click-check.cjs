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
  await page.waitForTimeout(1000);

  const target = await page.evaluate(async () => {
    const { equatorialToHorizontal } = await import("/src/astro.js");
    const { OBSERVATORY } = await import("/src/data.js");
    const atlas = await (await fetch("/data/sky-atlas.json")).json();
    const DEG_TO_RAD = Math.PI / 180;
    const view = { azimuth: 180, altitude: 35, zoom: 1 };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function vectorFromHorizontal(azimuth, altitude) {
      const az = azimuth * DEG_TO_RAD;
      const alt = altitude * DEG_TO_RAD;
      const cosAlt = Math.cos(alt);
      return { x: cosAlt * Math.sin(az), y: Math.sin(alt), z: cosAlt * Math.cos(az) };
    }
    function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
    function normalizeVector(vector) {
      const length = Math.hypot(vector.x, vector.y, vector.z);
      return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
    }
    const forward = vectorFromHorizontal(view.azimuth, view.altitude);
    const right = normalizeVector({ x: Math.cos(view.azimuth * DEG_TO_RAD), y: 0, z: -Math.sin(view.azimuth * DEG_TO_RAD) });
    const up = normalizeVector(cross(forward, right));
    const fov = clamp(76 / Math.sqrt(view.zoom), 22, 82) * DEG_TO_RAD;
    const focal = Math.min(viewport.width, viewport.height) / (2 * Math.tan(fov / 2));
    function project(horizontal) {
      const vector = vectorFromHorizontal(horizontal.azimuth, horizontal.altitude);
      const depth = dot(vector, forward);
      if (depth <= 0.04) return null;
      const x = viewport.width / 2 + (dot(vector, right) / depth) * focal;
      const y = viewport.height / 2 - (dot(vector, up) / depth) * focal;
      if (x < 500 || x > 800 || y < 80 || y > 700) return null;
      return { x, y, depth };
    }
    const now = new Date();
    const candidates = [];
    for (const star of atlas.stars) {
      if (!star.clickable || star.mag > 4.95 || !(Number(star.parallaxMas) > 0)) continue;
      const horizontal = equatorialToHorizontal(star, OBSERVATORY, now);
      if (horizontal.altitude < 0) continue;
      const point = project(horizontal);
      if (!point) continue;
      candidates.push({ ...point, name: star.displayName, mag: star.mag });
    }
    candidates.sort((a, b) => a.mag - b.mag);
    return candidates[0] || null;
  });

  if (!target) throw new Error("No clickable atlas star target found");
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(600);
  const title = await page.locator("#resultTitle").innerText();
  const summary = await page.locator("#resultSummary").innerText();
  const firstLabel = await page.locator(".fact-grid dt").first().innerText();
  const secondLabel = await page.locator(".fact-grid dt").nth(1).innerText();
  const constellationFact = await page.locator("#ageFact").innerText();
  const brightness = await page.locator("#distanceFact").innerText();
  const color = await page.locator("#colorFact").innerText();
  await page.screenshot({ path: "qa-atlas-click.png", fullPage: true });
  await browser.close();

  const ok = title && !title.startsWith("Gaia DR3") && title.includes("(") && title.includes(target.name) && summary.includes("자리") && summary.includes("별입니다") && !summary.includes("화면의 별 크기") && firstLabel === "별자리 표기" && constellationFact.includes("자리") && constellationFact.includes("별") && secondLabel === "거리와 밝기" && brightness.includes("거리") && brightness.includes("광년") && brightness.includes("겉보기등급") && brightness.includes("절대등급") && !color.includes("B-V") && errors.length === 0;
  console.log(JSON.stringify({ ok, target, title, summary, firstLabel, constellationFact, secondLabel, brightness, color, errors }, null, 2));
  if (!ok) process.exit(1);
})();