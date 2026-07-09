const fs = require("fs");

const app = fs.readFileSync("src/app.js", "utf8");
const atlas = JSON.parse(fs.readFileSync("data/sky-atlas.json", "utf8"));
const mapMatch = app.match(/const KOREAN_PROPER_STAR_NAMES = \{([\s\S]*?)\n\};/);
if (!mapMatch) throw new Error("KOREAN_PROPER_STAR_NAMES block not found");
const koreanNames = Function(`return ({${mapMatch[1]}\n});`)();

function cleanStarNameCandidate(value) {
  return String(value || "")
    .replace(/^NAME(?:-IAU)?\s+/i, "")
    .replace(/^\*\s+/, "")
    .trim();
}

function properNameLookupVariants(name) {
  const value = cleanStarNameCandidate(name);
  if (!value) return [];
  const variants = [value];
  const withoutComponent = value.replace(/\s+(?:Aa|Ab|Ac|Ad|Ba|Bb|Bc|Bd|A|B|C|D)$/i, "").trim();
  if (withoutComponent && withoutComponent !== value) variants.push(withoutComponent);
  return variants;
}

function isProperStarNameCandidate(name) {
  const value = cleanStarNameCandidate(name);
  if (!value) return false;
  if (/^(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.?|nu\.?|ksi|omi|pi\.?|rho|sig|tau|ups|phi|chi|psi|ome)(\d{1,2})?\s+[A-Z][A-Za-z0-9]{2}(?:\s|$)/i.test(value)) return false;
  if (/^(HR|HD|HIP|TYC|GJ|BD|CD|CPD|CPC|CCDM|ADS|Gaia|2MASS|1RXS|1ES|2E|AG|ASCC|FK5|SAO|BD|NLTT|LTT|LHS|LSPM|PLX|PPM|WEB|WDS|GC|GCRV|GEN|TIC|UBV|WISE|WISEA|IRAS|IRC|JP11|N30|PM|RAFGL|ROT|SKY|TD1|UCAC|USNO|YZ|CNS5|CSI|CSV|NSV)\b/i.test(value)) return false;
  if (/^[A-Z]{1,4}[+-]?\d/i.test(value)) return false;
  if (/\d/.test(value)) return false;
  if (/[*_[\]]/.test(value)) return false;
  if (/^[a-z]{1,4}\.?\s+[A-Z][A-Za-z0-9]{2}$/i.test(value)) return false;
  return /[A-Za-z]/.test(value);
}

const properNames = new Set();
for (const star of atlas.stars) {
  if (!star.clickable || !(star.constellationIds || []).length) continue;
  const names = [star.displayName, star.commonName, star.mainId, ...(star.aliases || [])];
  for (const rawName of names) {
    for (const name of properNameLookupVariants(rawName)) {
      if (isProperStarNameCandidate(name)) properNames.add(name);
    }
  }
}

const missingNames = [...properNames].filter((name) => !koreanNames[name]).sort((a, b) => a.localeCompare(b));
const result = {
  clickableConstellationStars: atlas.stars.filter((star) => star.clickable && (star.constellationIds || []).length).length,
  properNames: properNames.size,
  mapped: properNames.size - missingNames.length,
  missing: missingNames.length,
  missingNames,
};
console.log(JSON.stringify(result, null, 2));
if (missingNames.length > 0) process.exit(1);