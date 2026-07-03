const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const fullPath = path.join(root, "data", "nearby-stars.json");
const outPath = path.join(root, "data", "nearby-stars-search.json");
const full = JSON.parse(fs.readFileSync(fullPath, "utf8"));
const round = (value, digits) => {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(digits)) : null;
};
const stars = full.stars
  .filter((star) => star.displayName && star.displayName !== star.designation)
  .map((star) => ({
    designation: star.designation,
    displayName: star.displayName,
    mainId: star.mainId && star.mainId !== star.displayName ? star.mainId : undefined,
    ra: round(star.ra, 6),
    dec: round(star.dec, 6),
    distanceLy: round(star.distanceLy, 4),
    gMag: round(star.gMag, 4),
    bpRp: round(star.bpRp, 4),
    note: star.note || undefined,
  }))
  .sort((a, b) => a.distanceLy - b.distanceLy || a.gMag - b.gMag);

const output = {
  schemaVersion: full.schemaVersion,
  generatedAt: new Date().toISOString(),
  source: full.source,
  limit: full.limit,
  counts: {
    totalFullCatalog: full.counts.total,
    searchCandidates: stars.length,
  },
  note: "App search subset containing nearby Gaia DR3 stars with SIMBAD/catalog display names.",
  stars,
};

fs.writeFileSync(outPath, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Wrote ${outPath}`);
console.log(output.counts);