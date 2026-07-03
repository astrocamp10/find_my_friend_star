const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const atlasPath = path.join(root, "data", "sky-atlas.json");
const namesPath = path.join(root, "data", "source", "sky-atlas-star-names.json");
const SIMBAD_TAP = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const CHUNK = 100;

function normalizeId(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sqlString(value) {
  return String(value).replaceAll("'", "''");
}

function tapParams(query) {
  return new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: "json", QUERY: query });
}

async function postTap(query) {
  const response = await fetch(SIMBAD_TAP, { method: "POST", body: tapParams(query) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 800)}`);
  return JSON.parse(text);
}

function rowsFromTap(result) {
  const names = result.metadata.map((item) => item.name);
  return result.data.map((row) => Object.fromEntries(row.map((value, index) => [names[index], value])));
}

function cleanName(id) {
  const value = normalizeId(id);
  if (/^NAME\s+/i.test(value)) return value.replace(/^NAME\s+/i, "");
  if (/^\*\s+/.test(value)) return value.replace(/^\*\s+/, "");
  return value;
}

function aliasPriority(alias) {
  const id = normalizeId(alias);
  if (/^NAME\s+/i.test(id)) return 1;
  if (/^\*\s+(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.|nu\.|ksi|omi|pi\.|rho|sig|tau|ups|phi|chi|psi|ome)\s/i.test(id)) return 10;
  if (/^\*\s+\d+\s/i.test(id)) return 15;
  if (/^HR\s+/i.test(id)) return 20;
  if (/^HD\s+/i.test(id)) return 30;
  if (/^HIP\s+/i.test(id)) return 40;
  if (/^GJ\s+/i.test(id)) return 45;
  if (/^TYC\s+/i.test(id)) return 60;
  if (/^2MASS\s+/i.test(id)) return 70;
  return 90;
}

function pickDisplayName(mainId, aliases, fallback) {
  const candidates = [mainId, ...aliases]
    .map(normalizeId)
    .filter((id) => id && id !== fallback);
  candidates.sort((a, b) => aliasPriority(a) - aliasPriority(b) || cleanName(a).length - cleanName(b).length || a.localeCompare(b));
  return cleanName(candidates[0] || fallback);
}

function coordKey(ra, dec) {
  return `${Number(ra).toFixed(4)},${Number(dec).toFixed(4)}`;
}

async function fetchNames(hipIds) {
  const map = new Map();
  for (let offset = 0; offset < hipIds.length; offset += CHUNK) {
    const chunk = hipIds.slice(offset, offset + CHUNK);
    const values = chunk.map((id) => `'HIP ${sqlString(id)}'`).join(", ");
    const query = `
SELECT h.id AS hip_id, b.main_id, b.plx_value, b.plx_err, b.sp_type, i.id AS alias
FROM ident AS h
JOIN basic AS b ON b.oid = h.oidref
JOIN ident AS i ON i.oidref = b.oid
WHERE h.id IN (${values})`;
    try {
      const result = await postTap(query);
      for (const row of rowsFromTap(result)) {
        const hipId = normalizeId(row.hip_id).replace(/^HIP\s+/, "");
        if (!map.has(hipId)) {
          map.set(hipId, {
            mainId: normalizeId(row.main_id),
            parallaxMas: Number.isFinite(Number(row.plx_value)) ? Number(row.plx_value) : null,
            parallaxErrorMas: Number.isFinite(Number(row.plx_err)) ? Number(row.plx_err) : null,
            spectralType: normalizeId(row.sp_type) || null,
            aliases: new Set(),
          });
        }
        const item = map.get(hipId);
        if (item.parallaxMas == null && Number.isFinite(Number(row.plx_value))) item.parallaxMas = Number(row.plx_value);
        if (item.parallaxErrorMas == null && Number.isFinite(Number(row.plx_err))) item.parallaxErrorMas = Number(row.plx_err);
        if (!item.spectralType && normalizeId(row.sp_type)) item.spectralType = normalizeId(row.sp_type);
        item.aliases.add(normalizeId(row.alias));
      }
    } catch (error) {
      console.warn(`SIMBAD HIP chunk ${offset}-${offset + chunk.length} failed: ${error.message}`);
    }
    if ((offset / CHUNK) % 5 === 0) console.log(`SIMBAD HIP ${Math.min(offset + chunk.length, hipIds.length)}/${hipIds.length}`);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const plain = {};
  for (const [hipId, item] of map.entries()) {
    const aliases = [...item.aliases].filter(Boolean).sort((a, b) => aliasPriority(a) - aliasPriority(b) || a.localeCompare(b));
    plain[hipId] = {
      mainId: item.mainId,
      displayName: pickDisplayName(item.mainId, aliases, `HIP ${hipId}`),
      aliases: aliases.map(cleanName).filter((alias, index, arr) => alias && arr.indexOf(alias) === index).slice(0, 8),
      parallaxMas: item.parallaxMas,
      parallaxErrorMas: item.parallaxErrorMas,
      spectralType: item.spectralType,
    };
  }
  return plain;
}

(async () => {
  const atlas = JSON.parse(fs.readFileSync(atlasPath, "utf8"));
  const hipIds = atlas.stars.map((star) => star.id).filter((id) => /^\d+$/.test(String(id)));
  const names = await fetchNames(hipIds);
  fs.writeFileSync(namesPath, `${JSON.stringify(names)}\n`, "utf8");

  const starByCoord = new Map(atlas.stars.map((star) => [coordKey(star.ra, star.dec), star]));
  for (const star of atlas.stars) star.constellationIds = [];
  for (const constellation of atlas.constellations) {
    for (const line of constellation.lines) {
      for (const [ra, dec] of line) {
        const star = starByCoord.get(coordKey(ra, dec));
        if (star && !star.constellationIds.includes(constellation.id)) star.constellationIds.push(constellation.id);
      }
    }
  }

  for (const star of atlas.stars) {
    const info = names[star.id];
    star.displayName = info?.displayName || `HIP ${star.id}`;
    star.mainId = info?.mainId || null;
    star.aliases = info?.aliases || [];
    star.parallaxMas = info?.parallaxMas ?? null;
    star.parallaxErrorMas = info?.parallaxErrorMas ?? null;
    star.spectralType = info?.spectralType ?? null;
    star.clickable = star.constellationIds.length > 0;
  }

  atlas.generatedAt = new Date().toISOString();
  atlas.nameSource = {
    name: "SIMBAD TAP ident/basic crossmatch by HIP identifier",
    file: "data/source/sky-atlas-star-names.json",
  };
  atlas.counts = {
    stars: atlas.stars.length,
    namedStars: atlas.stars.filter((star) => star.mainId).length,
    constellationClickableStars: atlas.stars.filter((star) => star.clickable).length,
    absoluteMagnitudeStars: atlas.stars.filter((star) => Number(star.parallaxMas) > 0).length,
  };
  fs.writeFileSync(atlasPath, `${JSON.stringify(atlas)}\n`, "utf8");
  console.log(`Wrote ${atlasPath}`);
  console.log(atlas.counts);
})();