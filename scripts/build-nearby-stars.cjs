const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "data", "nearby-stars.json");
const sourcePath = path.join(root, "data", "source", "nearby-stars-raw.json");
const namesPath = path.join(root, "data", "source", "nearby-star-names.json");
const GAIA_TAP = "https://gea.esac.esa.int/tap-server/tap/sync";
const SIMBAD_TAP = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const LY_LIMIT = 120;
const PARALLAX_LIMIT = 1000 / (LY_LIMIT / 3.261563777);
const MAXREC = 25000;
const SIMBAD_CHUNK = 80;

function round(value, digits) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function tapParams(query, format = "json", maxrec = null) {
  const params = new URLSearchParams({ REQUEST: "doQuery", LANG: "ADQL", FORMAT: format, QUERY: query });
  if (maxrec != null) params.set("MAXREC", String(maxrec));
  return params;
}

async function postTap(endpoint, query, maxrec = null) {
  const response = await fetch(endpoint, { method: "POST", body: tapParams(query, "json", maxrec) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${endpoint} ${response.status}: ${text.slice(0, 800)}`);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Could not parse TAP JSON: ${text.slice(0, 800)}`);
  }
}

async function postTapCsv(endpoint, query, maxrec = null) {
  const response = await fetch(endpoint, { method: "POST", body: tapParams(query, "csv", maxrec) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${endpoint} ${response.status}: ${text.slice(0, 800)}`);
  return parseCsv(text);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === `"` && next === `"`) {
        field += `"`;
        index += 1;
      } else if (char === `"`) {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === `"`) {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const header = rows.shift();
  return rows
    .filter((item) => item.length === header.length && item.some((value) => value !== ""))
    .map((item) => Object.fromEntries(item.map((value, index) => [header[index], value === "" ? null : value])));
}

function rowsFromTap(result) {
  const names = result.metadata.map((item) => item.name);
  return result.data.map((row) => Object.fromEntries(row.map((value, index) => [names[index], value])));
}

function sqlString(value) {
  return String(value).replaceAll("'", "''");
}

function normalizeId(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function aliasPriority(alias) {
  const id = normalizeId(alias);
  if (/^\*\s/.test(id)) return 5;
  if (/^[a-zA-Z]+\s+[A-Z][a-z]{2}$/.test(id)) return 8;
  if (/^(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.|nu\.|ksi|omi|pi\.|rho|sig|tau|ups|phi|chi|psi|ome)\s/i.test(id)) return 10;
  if (/^Ross\s+/i.test(id)) return 20;
  if (/^(Barnard|Kapteyn|Wolf|Lalande|Luyten|Teegarden|Proxima|Sirius|Vega|Altair|Fomalhaut|Arcturus|Capella|Rigel|Betelgeuse|Procyon|Aldebaran|Spica|Antares|Polaris)\b/i.test(id)) return 25;
  if (/^GJ\s+/i.test(id)) return 30;
  if (/^Gl\s+/i.test(id)) return 32;
  if (/^HIP\s+/i.test(id)) return 40;
  if (/^HD\s+/i.test(id)) return 45;
  if (/^BD[+-]/i.test(id)) return 50;
  if (/^CD-/i.test(id)) return 52;
  if (/^TYC\s+/i.test(id)) return 60;
  if (/^2MASS\s+/i.test(id)) return 70;
  if (/^WISE\s+/i.test(id)) return 80;
  if (/^Gaia\s+DR3\s+/i.test(id)) return 999;
  return 90;
}

function pickDisplayName(mainId, aliases, gaiaDesignation) {
  const candidates = [mainId, ...aliases]
    .map(normalizeId)
    .filter((id) => id && id !== gaiaDesignation && !/^Gaia\s+DR3\s+/i.test(id));
  candidates.sort((a, b) => aliasPriority(a) - aliasPriority(b) || a.length - b.length || a.localeCompare(b));
  return candidates[0] || gaiaDesignation;
}

async function fetchGaiaRows() {
  const query = `
SELECT
  source_id, ra, dec, ref_epoch, pmra, pmdec, parallax, parallax_error,
  phot_g_mean_mag, phot_bp_mean_mag, phot_rp_mean_mag, bp_rp, ruwe,
  astrometric_params_solved, visibility_periods_used
FROM gaiadr3.gaia_source
WHERE parallax >= ${PARALLAX_LIMIT}
ORDER BY phot_g_mean_mag ASC`;
  return postTapCsv(GAIA_TAP, query, MAXREC);
}

async function fetchSimbadNames(sourceIds) {
  const nameMap = new Map();
  for (let offset = 0; offset < sourceIds.length; offset += SIMBAD_CHUNK) {
    const chunk = sourceIds.slice(offset, offset + SIMBAD_CHUNK);
    const values = chunk.map((id) => `'Gaia DR3 ${sqlString(id)}'`).join(", ");
    const query = `
SELECT g.id AS gaia_id, b.main_id, i.id AS alias
FROM ident AS g
JOIN basic AS b ON b.oid = g.oidref
JOIN ident AS i ON i.oidref = b.oid
WHERE g.id IN (${values})`;
    try {
      const result = await postTap(SIMBAD_TAP, query, null);
      for (const row of rowsFromTap(result)) {
        const gaiaId = normalizeId(row.gaia_id).replace(/^Gaia DR3\s+/, "");
        if (!nameMap.has(gaiaId)) nameMap.set(gaiaId, { mainId: normalizeId(row.main_id), aliases: new Set() });
        nameMap.get(gaiaId).aliases.add(normalizeId(row.alias));
      }
    } catch (error) {
      console.warn(`SIMBAD chunk ${offset}-${offset + chunk.length} failed: ${error.message}`);
    }
    if ((offset / SIMBAD_CHUNK) % 10 === 0) {
      console.log(`SIMBAD ${Math.min(offset + chunk.length, sourceIds.length)}/${sourceIds.length}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 140));
  }

  const plain = {};
  for (const [sourceId, item] of nameMap.entries()) {
    const aliases = [...item.aliases].filter(Boolean).sort((a, b) => aliasPriority(a) - aliasPriority(b) || a.localeCompare(b));
    plain[sourceId] = { mainId: item.mainId, aliases };
  }
  return plain;
}

function compactStar(row, names) {
  const sourceId = String(row.source_id);
  const designation = `Gaia DR3 ${sourceId}`;
  const nameInfo = names[sourceId] || null;
  const aliases = nameInfo?.aliases?.filter((id) => id && id !== designation) || [];
  const displayName = nameInfo ? pickDisplayName(nameInfo.mainId, aliases, designation) : designation;
  const distanceLy = 3261.563777 / Number(row.parallax);
  const distanceErrorLy = distanceLy * (Number(row.parallax_error) / Number(row.parallax));

  return {
    sourceId,
    designation,
    displayName,
    mainId: nameInfo?.mainId || null,
    aliases: aliases.slice(0, 12),
    named: Boolean(nameInfo),
    ra: round(row.ra, 6),
    dec: round(row.dec, 6),
    refEpoch: round(row.ref_epoch, 1),
    pmra: round(row.pmra, 3),
    pmdec: round(row.pmdec, 3),
    parallax: round(row.parallax, 6),
    parallaxError: round(row.parallax_error, 6),
    distanceLy: round(distanceLy, 4),
    distanceErrorLy: round(distanceErrorLy, 4),
    gMag: round(row.phot_g_mean_mag, 4),
    bpMag: round(row.phot_bp_mean_mag, 4),
    rpMag: round(row.phot_rp_mean_mag, 4),
    bpRp: round(row.bp_rp, 4),
    ruwe: round(row.ruwe, 3),
    astrometricParamsSolved: Number(row.astrometric_params_solved ?? 0),
    visibilityPeriods: Number(row.visibility_periods_used ?? 0),
  };
}

(async () => {
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  console.log(`Gaia parallax limit: ${PARALLAX_LIMIT.toFixed(6)} mas`);
  const gaiaRows = await fetchGaiaRows();
  fs.writeFileSync(sourcePath, `${JSON.stringify({ parallaxLimit: PARALLAX_LIMIT, rows: gaiaRows })}\n`, "utf8");
  console.log(`Gaia rows: ${gaiaRows.length}`);

  const sourceIds = gaiaRows.map((row) => String(row.source_id));
  const names = await fetchSimbadNames(sourceIds);
  fs.writeFileSync(namesPath, `${JSON.stringify(names)}\n`, "utf8");
  console.log(`SIMBAD matched: ${Object.keys(names).length}`);

  const stars = gaiaRows.map((row) => compactStar(row, names)).sort((a, b) => a.distanceLy - b.distanceLy || a.gMag - b.gMag);
  const namedCount = stars.filter((star) => star.named).length;
  const displayNamedCount = stars.filter((star) => star.displayName !== star.designation).length;
  const output = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    source: {
      gaia: "ESA Gaia Archive gaiadr3.gaia_source",
      simbad: "SIMBAD TAP basic/ident crossmatch by Gaia DR3 identifier",
    },
    limit: {
      maxDistanceLy: LY_LIMIT,
      parallaxMinMas: round(PARALLAX_LIMIT, 8),
      formula: "distanceLy = 3261.563777 / parallaxMas",
    },
    counts: {
      total: stars.length,
      simbadMatched: namedCount,
      displayNamed: displayNamedCount,
    },
    fields: {
      displayName: "Preferred SIMBAD/catalog display name when found; otherwise Gaia DR3 designation.",
      aliases: "SIMBAD identifiers, shortened to the first 12 preferred aliases.",
    },
    stars,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(output.counts);
})();