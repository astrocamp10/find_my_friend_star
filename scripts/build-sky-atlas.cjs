const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const starsPath = path.join(root, "data", "source", "stars.6.json");
const linesPath = path.join(root, "data", "source", "stellarium-western-index.json");
const namesPath = path.join(root, "data", "source", "sky-atlas-star-names.json");
const extraStarsPath = path.join(root, "data", "source", "stellarium-line-extra-stars.json");
const rankSourcePath = path.join(root, "data", "source", "constellations.lines.json");
const previousAtlasPath = path.join(root, "data", "sky-atlas.json");
const outPath = path.join(root, "data", "sky-atlas.json");

const starsGeo = JSON.parse(fs.readFileSync(starsPath, "utf8"));
const stellarium = JSON.parse(fs.readFileSync(linesPath, "utf8"));
const rankSource = fs.existsSync(rankSourcePath) ? JSON.parse(fs.readFileSync(rankSourcePath, "utf8")) : null;
const previousAtlas = fs.existsSync(previousAtlasPath) ? JSON.parse(fs.readFileSync(previousAtlasPath, "utf8")) : null;
const extraLineStars = fs.existsSync(extraStarsPath) ? JSON.parse(fs.readFileSync(extraStarsPath, "utf8")) : [];
const cachedNames = fs.existsSync(namesPath) ? JSON.parse(fs.readFileSync(namesPath, "utf8")) : {};

const sourceRanks = new Map((rankSource?.features ?? []).map((feature) => [feature.id, Number(feature.properties?.rank)]));
const previousRanks = new Map((previousAtlas?.constellations ?? []).map((constellation) => [constellation.id, constellation.rank]));

function normalizeRa(ra) {
  return ((Number(ra) % 360) + 360) % 360;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function constellationCode(id) {
  const match = String(id || "").match(/^CON\s+\S+\s+([A-Za-z0-9]+)$/);
  return match?.[1] || String(id || "").trim();
}

function normalizeId(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanName(value) {
  return normalizeId(value).replace(/^NAME\s+/i, "").replace(/^\*\s+/, "").trim();
}

function aliasPriority(id) {
  if (/^NAME\s+/i.test(id)) return 0;
  if (/^\*\s+/i.test(id)) return 5;
  if (/^[a-z]{2,3}\s/i.test(id)) return 10;
  if (/^V\*\s/i.test(id)) return 20;
  if (/^HD\s+/i.test(id)) return 30;
  if (/^HIP\s+/i.test(id)) return 40;
  if (/^GJ\s+/i.test(id)) return 45;
  if (/^TYC\s+/i.test(id)) return 60;
  return 90;
}

function pickDisplayName(mainId, aliases, fallback) {
  const candidates = [mainId, ...aliases]
    .map(normalizeId)
    .filter(Boolean)
    .sort((a, b) => aliasPriority(a) - aliasPriority(b) || a.localeCompare(b));
  return cleanName(candidates[0] || fallback);
}

function atlasStarFromSource(source, options = {}) {
  const id = String(source.id);
  const info = cachedNames[id];
  const aliases = (info?.aliases ?? []).map(cleanName).filter((alias, index, arr) => alias && arr.indexOf(alias) === index).slice(0, 8);
  return {
    id,
    ra: round(normalizeRa(source.ra), 4),
    dec: round(source.dec, 4),
    mag: round(source.mag, 2),
    bv: source.bv == null ? null : round(source.bv, 3),
    constellationIds: [],
    displayName: info?.displayName || source.displayName || pickDisplayName(info?.mainId || source.mainId, aliases, `HIP ${id}`),
    mainId: info?.mainId || source.mainId || null,
    aliases,
    clickable: false,
    parallaxMas: info?.parallaxMas ?? source.parallaxMas ?? null,
    parallaxErrorMas: info?.parallaxErrorMas ?? source.parallaxErrorMas ?? null,
    spectralType: info?.spectralType ?? source.spectralType ?? null,
    ...(options.lineOnly ? { lineOnly: true } : {}),
  };
}

const baseStars = starsGeo.features.map((feature) => {
  const [ra, dec] = feature.geometry.coordinates;
  return atlasStarFromSource({
    id: feature.id,
    ra,
    dec,
    mag: feature.properties.mag,
    bv: feature.properties.bv,
  });
});

const existingStarIds = new Set(baseStars.map((star) => star.id));
const extraStars = extraLineStars
  .filter((star) => !existingStarIds.has(String(star.id)))
  .map((star) => atlasStarFromSource(star, { lineOnly: true }));

const stars = [...baseStars, ...extraStars].sort((a, b) => a.mag - b.mag);

const starByHip = new Map(stars.map((star) => [star.id, star]));

function pointForHip(hip) {
  const star = starByHip.get(String(hip));
  return star ? [star.ra, star.dec] : null;
}

function parseLineDefinition(sourceLine) {
  const line = Array.isArray(sourceLine) ? sourceLine : [];
  const weight = typeof line[0] === "string" ? line[0] : "normal";
  const firstHipIndex = weight === "normal" ? 0 : 1;
  const hips = line.slice(firstHipIndex)
    .filter((item) => Number.isInteger(Number(item)))
    .filter((hip, index, items) => index === 0 || String(hip) !== String(items[index - 1]));
  return { weight, hips };
}

function splitLineByAvailableStars(hipLine) {
  const segments = [];
  let current = [];

  for (const hip of hipLine) {
    const point = pointForHip(hip);
    if (point) {
      current.push(point);
      continue;
    }
    if (current.length >= 2) segments.push(current);
    current = [];
  }

  if (current.length >= 2) segments.push(current);
  return segments;
}

const missingHips = new Set();
const constellations = stellarium.constellations
  .map((constellation) => {
    const id = constellationCode(constellation.id);
    const sourceLines = constellation.lines ?? [];
    const lines = [];
    const lineWeights = [];

    for (const sourceLine of sourceLines) {
      const { weight, hips } = parseLineDefinition(sourceLine);
      for (const hip of hips) {
        const star = starByHip.get(String(hip));
        if (star) {
          if (!star.constellationIds.includes(id)) star.constellationIds.push(id);
        } else {
          missingHips.add(String(hip));
        }
      }
      const segments = splitLineByAvailableStars(hips);
      lines.push(...segments);
      lineWeights.push(...segments.map(() => weight));
    }

    return {
      id,
      rank: Number(sourceRanks.get(id) ?? previousRanks.get(id) ?? 3),
      lines,
      lineWeights,
      sourceName: constellation.common_name?.native || constellation.common_name?.english || id,
    };
  })
  .filter((constellation) => constellation.lines.length > 0);

for (const star of stars) {
  star.clickable = star.constellationIds.length > 0;
}

const atlas = {
  schemaVersion: "1.2.0",
  generatedAt: new Date().toISOString(),
  source: {
    name: "Stellarium western sky culture + D3-Celestial bright stars",
    url: "https://github.com/Stellarium/stellarium-skycultures/blob/master/western/index.json",
    license: "Stellarium sky culture data; see upstream sky culture credits. D3-Celestial stars are BSD-3-Clause.",
    files: ["stars.6.json", "stellarium-western-index.json", "stellarium-line-extra-stars.json", "sky-atlas-star-names.json"],
    lineSet: {
      id: stellarium.id,
      edgesType: stellarium.edges_type ?? null,
      edgesSource: stellarium.edges_source ?? null,
      edgesEpoch: stellarium.edges_epoch ?? null,
    },
  },
  coordinateFrame: "J2000/ICRS-like coordinates from D3-Celestial bright stars; constellation lines from Stellarium western HIP polylines",
  counts: {
    stars: stars.length,
    constellations: constellations.length,
    constellationLineStars: stars.filter((star) => star.clickable).length,
    constellationClickableStars: stars.filter((star) => star.clickable).length,
    namedStars: stars.filter((star) => star.mainId).length,
    absoluteMagnitudeStars: stars.filter((star) => Number(star.parallaxMas) > 0).length,
    missingLineHipStars: missingHips.size,
  },
  stars,
  constellations,
};

fs.writeFileSync(outPath, `${JSON.stringify(atlas)}\n`, "utf8");
console.log(`Wrote ${outPath}`);
console.log(`${stars.length} stars, ${constellations.length} constellations`);
console.log(`${atlas.counts.constellationLineStars} clickable constellation stars, ${missingHips.size} missing HIP endpoints`);
if (missingHips.size) console.log(`Missing HIP endpoints: ${[...missingHips].sort((a, b) => Number(a) - Number(b)).join(", ")}`);
