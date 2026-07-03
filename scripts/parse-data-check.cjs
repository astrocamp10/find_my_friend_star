const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const nearby = readJson("data/nearby-stars.json");
const search = readJson("data/nearby-stars-search.json");
const atlas = readJson("data/sky-atlas.json");

assert(nearby.stars.length === nearby.counts.total, "nearby total count mismatch");
assert(nearby.stars.length >= 18000, "nearby catalog is unexpectedly small");
assert(search.stars.length === search.counts.searchCandidates, "search count mismatch");
assert(search.stars.length >= 10000, "search catalog is unexpectedly small");

const sourceIds = new Set();
for (const star of nearby.stars) {
  assert(typeof star.sourceId === "string" && /^\d+$/.test(star.sourceId), `bad sourceId: ${star.sourceId}`);
  assert(!sourceIds.has(star.sourceId), `duplicate sourceId: ${star.sourceId}`);
  sourceIds.add(star.sourceId);
  assert(star.distanceLy <= 120.01, `distance over 120 ly: ${star.sourceId} ${star.distanceLy}`);
}

const ross = nearby.stars.find((star) => star.sourceId === "3796072592206250624");
assert(ross, "Ross 128 Gaia DR3 source id missing");
assert(ross.displayName === "Ross 128", `Ross 128 display name mismatch: ${ross.displayName}`);

for (const star of search.stars) {
  const searchSourceId = star.sourceId || String(star.designation || "").replace(/^Gaia DR3\s+/, "");
  assert(sourceIds.has(searchSourceId), `search star missing from full catalog: ${searchSourceId}`);
  assert(star.displayName && !star.displayName.startsWith("Gaia DR3"), `bad display name: ${searchSourceId}`);
}

assert(atlas.stars.length === atlas.counts.stars, "atlas star count mismatch");
assert(atlas.counts.namedStars >= 5000, "atlas names missing");
assert(atlas.counts.constellationClickableStars >= 700, "clickable constellation stars missing");
assert(atlas.counts.absoluteMagnitudeStars >= 5000, "atlas parallax data missing");
const spica = atlas.stars.find((star) => star.displayName === "Spica" && star.clickable);
assert(spica, "Spica clickable atlas star missing");
assert(Number(spica.parallaxMas) > 0, "Spica parallax missing");

console.log(JSON.stringify({
  ok: true,
  nearby: nearby.counts,
  search: search.counts,
  atlas: atlas.counts,
  ross: { sourceId: ross.sourceId, displayName: ross.displayName, distanceLy: ross.distanceLy },
  spica: { displayName: spica.displayName, parallaxMas: spica.parallaxMas, mag: spica.mag },
}, null, 2));