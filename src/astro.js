/**
 * Browser astronomy utilities for "나의 친구 별 찾기".
 * Dependency-free: no server calls, no packages, just Date and math.
 */

const DAY_MS = 86_400_000;
const J2000_JULIAN_DATE = 2_451_545.0;

export const INCHEON_LOCATION = Object.freeze({
  name: "Incheon, Korea",
  latitudeDegrees: 37.4563,
  longitudeDegrees: 126.7052,
  elevationMeters: 0,
});

export const STAR_CATALOG = Object.freeze([
  ["sirius", "Sirius", "시리우스", "Canis Major", "큰개자리", 6.75248, -16.7161, -1.46, "A1V", "white-blue"],
  ["arcturus", "Arcturus", "아크투루스", "Bootes", "목동자리", 14.261, 19.1825, -0.05, "K1.5III", "orange"],
  ["vega", "Vega", "베가", "Lyra", "거문고자리", 18.61565, 38.7837, 0.03, "A0V", "white-blue"],
  ["capella", "Capella", "카펠라", "Auriga", "마차부자리", 5.27815, 45.998, 0.08, "G3III", "yellow"],
  ["rigel", "Rigel", "리겔", "Orion", "오리온자리", 5.2423, -8.2016, 0.13, "B8Ia", "blue-white"],
  ["procyon", "Procyon", "프로키온", "Canis Minor", "작은개자리", 7.65503, 5.225, 0.34, "F5IV-V", "white-yellow"],
  ["betelgeuse", "Betelgeuse", "베텔게우스", "Orion", "오리온자리", 5.91953, 7.4071, 0.42, "M1-M2Ia", "red-orange"],
  ["altair", "Altair", "알타이르", "Aquila", "독수리자리", 19.84639, 8.8683, 0.77, "A7V", "white"],
  ["aldebaran", "Aldebaran", "알데바란", "Taurus", "황소자리", 4.59868, 16.5093, 0.86, "K5III", "orange-red"],
  ["spica", "Spica", "스피카", "Virgo", "처녀자리", 13.41988, -11.1613, 0.98, "B1III-IV", "blue-white"],
  ["antares", "Antares", "안타레스", "Scorpius", "전갈자리", 16.49013, -26.4319, 1.06, "M1.5Iab", "red"],
  ["pollux", "Pollux", "폴룩스", "Gemini", "쌍둥이자리", 7.75526, 28.0262, 1.14, "K0III", "orange"],
  ["fomalhaut", "Fomalhaut", "포말하우트", "Piscis Austrinus", "남쪽물고기자리", 22.96085, -29.6222, 1.16, "A3V", "white"],
  ["deneb", "Deneb", "데네브", "Cygnus", "백조자리", 20.69053, 45.2803, 1.25, "A2Ia", "white-blue"],
  ["regulus", "Regulus", "레굴루스", "Leo", "사자자리", 10.13953, 11.9672, 1.35, "B7V", "blue-white"],
  ["castor", "Castor", "카스토르", "Gemini", "쌍둥이자리", 7.57667, 31.8883, 1.58, "A1V", "white"],
  ["polaris", "Polaris", "폴라리스", "Ursa Minor", "작은곰자리", 2.5303, 89.2641, 1.98, "F7Ib", "yellow-white"],
  ["mirfak", "Mirfak", "미르파크", "Perseus", "페르세우스자리", 3.40538, 49.8612, 1.79, "F5Ib", "yellow-white"],
  ["dubhe", "Dubhe", "두베", "Ursa Major", "큰곰자리", 11.06213, 61.751, 1.81, "K0III", "orange"],
  ["alpheratz", "Alpheratz", "알페라츠", "Andromeda", "안드로메다자리", 0.13979, 29.0904, 2.06, "B8IV", "blue-white"],
].map(([id, name, nameKo, constellation, constellationKo, raHours, decDegrees, magnitude, spectralType, color]) => Object.freeze({
  id,
  name,
  nameKo,
  constellation,
  constellationKo,
  raHours,
  decDegrees,
  magnitude,
  spectralType,
  color,
})));

export function calculateDetailedAge(input, asOf = new Date(), options = {}) {
  if (isPlainObject(input) && !Object.prototype.hasOwnProperty.call(input, "birthDate")) {
    const rawBirthday = input.birthday;
    const rawAge = input.ageYears ?? input.age;
    const hasBirthday = rawBirthday !== undefined && rawBirthday !== null && String(rawBirthday).trim() !== "";
    const hasAge = rawAge !== undefined && rawAge !== null && String(rawAge).trim() !== "";

    if (hasBirthday && !hasAge) {
      return calculateAgeFromBirthday(rawBirthday, input.asOf ?? asOf, mergeAgeOptions(options, input));
    }

    if (!hasBirthday && hasAge) {
      return calculateAgeFromYears(rawAge, input.asOf ?? asOf);
    }
  }

  if (isPlainObject(input) && Object.prototype.hasOwnProperty.call(input, "birthDate")) {
    return calculateAgeFromBirthday(input.birthDate, input.asOf ?? asOf, mergeAgeOptions(options, input));
  }

  if (isPlainObject(input) && hasAgeAndBirthday(input)) {
    const inferred = inferBirthDateFromAge(
      Number(input.ageYears ?? input.age),
      input.birthday,
      input.asOf ?? asOf,
      mergeAgeOptions(options, input),
    );
    const age = calculateAgeFromBirthday(inferred.birthDate, input.asOf ?? asOf, mergeAgeOptions(options, input));

    return {
      ...age,
      inferred: true,
      source: "age-and-birthday",
      inference: inferred,
    };
  }

  return calculateAgeFromBirthday(input, asOf, options);
}
export function calculateAgeFromBirthday(birthDate, asOf = new Date(), options = {}) {
  const leapDayMode = options.leapDayMode ?? "feb28";
  const birth = toPlainDate(birthDate, "birthDate");
  const today = toPlainDate(asOf, "asOf");
  assertValidPlainDate(birth, "birthDate");
  assertValidPlainDate(today, "asOf");

  if (comparePlainDates(today, birth) < 0) {
    throw new RangeError("birthDate must be on or before asOf.");
  }

  const birthdayThisYear = birthdayForYear(birth, today.year, leapDayMode);
  let years = today.year - birth.year;
  if (comparePlainDates(today, birthdayThisYear) < 0) years -= 1;

  let ageAnchor = birthdayForYear(birth, birth.year + years, leapDayMode);
  while (comparePlainDates(ageAnchor, today) > 0) {
    years -= 1;
    ageAnchor = birthdayForYear(birth, birth.year + years, leapDayMode);
  }

  let months = 0;
  let monthAnchor = ageAnchor;
  while (months < 12) {
    const nextAnchor = addMonthsClamped(ageAnchor, months + 1);
    if (comparePlainDates(nextAnchor, today) > 0) break;
    months += 1;
    monthAnchor = nextAnchor;
  }

  const days = daysBetweenPlainDates(monthAnchor, today);
  const totalDays = daysBetweenPlainDates(birth, today);
  const nextBirthday = getNextBirthday(birth, today, leapDayMode);
  const daysUntilNextBirthday = daysBetweenPlainDates(today, nextBirthday);
  const isBirthday = daysUntilNextBirthday === 0;

  return {
    birthDate: formatPlainDate(birth),
    asOf: formatPlainDate(today),
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
    nextBirthday: formatPlainDate(nextBirthday),
    daysUntilNextBirthday,
    isBirthday,
    nextBirthdayAge: isBirthday ? years : years + 1,
    koreanCountingAge: today.year - birth.year + 1,
  };
}

export function inferBirthDateFromAge(ageYears, birthday, asOf = new Date(), options = {}) {
  const normalizedAge = Number(ageYears);
  if (!Number.isInteger(normalizedAge) || normalizedAge < 0) {
    throw new TypeError("ageYears must be a non-negative integer.");
  }

  const leapDayMode = options.leapDayMode ?? "feb28";
  const today = toPlainDate(asOf, "asOf");
  const birthMonthDay = toBirthdayMonthDay(birthday, today.year, leapDayMode);
  const observedBirthday = birthdayForYear({ year: today.year, ...birthMonthDay }, today.year, leapDayMode);
  const birthdayPassed = comparePlainDates(today, observedBirthday) >= 0;
  const birthYear = today.year - normalizedAge - (birthdayPassed ? 0 : 1);
  const birthDate = {
    year: birthYear,
    month: birthMonthDay.month,
    day: Math.min(birthMonthDay.day, daysInMonth(birthYear, birthMonthDay.month)),
  };

  return {
    ageYears: normalizedAge,
    birthday: formatMonthDay(birthMonthDay),
    asOf: formatPlainDate(today),
    birthDate: formatPlainDate(birthDate),
    birthDateParts: birthDate,
    birthdayPassed,
    confidence: "inferred-from-current-full-age",
  };
}

export function estimateBirthDateRangeFromAge(ageYears, asOf = new Date()) {
  const normalizedAge = Number(ageYears);
  if (!Number.isInteger(normalizedAge) || normalizedAge < 0) {
    throw new TypeError("ageYears must be a non-negative integer.");
  }

  const today = toPlainDate(asOf, "asOf");
  const earliest = addDaysPlainDate({ year: today.year - normalizedAge - 1, month: today.month, day: today.day }, 1);
  const latest = {
    year: today.year - normalizedAge,
    month: today.month,
    day: Math.min(today.day, daysInMonth(today.year - normalizedAge, today.month)),
  };

  return {
    ageYears: normalizedAge,
    asOf: formatPlainDate(today),
    earliestBirthDate: formatPlainDate(earliest),
    latestBirthDate: formatPlainDate(latest),
  };
}

export function calculateAgeFromYears(ageYears, asOf = new Date()) {
  const decimalYears = Number(ageYears);
  if (!Number.isFinite(decimalYears) || decimalYears < 0) {
    throw new TypeError("ageYears must be a non-negative number.");
  }

  const years = Math.floor(decimalYears);
  const monthFloat = (decimalYears - years) * 12;
  const months = Math.floor(monthFloat);
  const days = Math.round((monthFloat - months) * 30.4375);
  const totalDays = Math.round(decimalYears * 365.2425);

  return {
    asOf: formatPlainDate(toPlainDate(asOf, "asOf")),
    years,
    months,
    days,
    decimalYears,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: decimalYears * 12,
    approximate: true,
    source: "age-only",
  };
}
export function equatorialToHorizontal(coordinates, options = {}, legacyDate) {
  const normalizedOptions = isLocationLike(options) || legacyDate !== undefined
    ? { location: options, date: legacyDate ?? new Date(), raUnit: "degrees" }
    : options;
  const date = toDateTime(normalizedOptions.date ?? new Date(), "date");
  const location = normalizeLocation(normalizedOptions.location ?? INCHEON_LOCATION);
  const raValue = coordinates.raDegrees ?? coordinates.raHours ?? coordinates.ra;
  const raUnit = coordinates.raDegrees !== undefined
    ? "degrees"
    : coordinates.raHours !== undefined
      ? "hours"
      : (normalizedOptions.raUnit ?? "hours");
  const raDegrees = parseRightAscension(raValue, raUnit);
  const decDegrees = parseDeclination(coordinates.decDegrees ?? coordinates.dec);
  const latitude = degreesToRadians(location.latitudeDegrees);
  const declination = degreesToRadians(decDegrees);
  const lstDegrees = localSiderealTime(date, location.longitudeDegrees).degrees;
  const hourAngleDegrees = normalizeSignedDegrees(lstDegrees - raDegrees);
  const hourAngle = degreesToRadians(hourAngleDegrees);
  const sinAltitude =
    Math.sin(declination) * Math.sin(latitude) +
    Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle);
  const altitudeDegrees = radiansToDegrees(Math.asin(clamp(sinAltitude, -1, 1)));
  const altitude = degreesToRadians(altitudeDegrees);
  const cosAltitude = Math.max(Math.cos(altitude), 1e-12);
  const sinAzimuth = (-Math.cos(declination) * Math.sin(hourAngle)) / cosAltitude;
  const cosAzimuth =
    (Math.sin(declination) - Math.sin(altitude) * Math.sin(latitude)) /
    (cosAltitude * Math.cos(latitude));
  const azimuthDegrees = normalizeDegrees(radiansToDegrees(Math.atan2(sinAzimuth, cosAzimuth)));
  const refractionDegrees = normalizedOptions.refraction === false ? 0 : atmosphericRefractionDegrees(altitudeDegrees);
  const apparentAltitudeDegrees = altitudeDegrees + refractionDegrees;

  return {
    date: date.toISOString(),
    location,
    raDegrees,
    raHours: raDegrees / 15,
    decDegrees,
    localSiderealTimeDegrees: lstDegrees,
    localSiderealTimeHours: lstDegrees / 15,
    hourAngleDegrees,
    altitudeDegrees,
    altitude: apparentAltitudeDegrees,
    apparentAltitudeDegrees,
    azimuthDegrees,
    azimuth: azimuthDegrees,
    azimuthCompass: compassPoint(azimuthDegrees),
    refractionDegrees,
    aboveHorizon: apparentAltitudeDegrees > 0,
  };
}
export function horizontalForStar(star, options = {}) {
  return equatorialToHorizontal(star, options);
}

export function julianDate(date = new Date()) {
  return toDateTime(date, "date").getTime() / DAY_MS + 2_440_587.5;
}

export function greenwichSiderealTime(date = new Date()) {
  const jd = julianDate(date);
  const daysSinceJ2000 = jd - J2000_JULIAN_DATE;
  const centuriesSinceJ2000 = daysSinceJ2000 / 36_525;
  const degrees =
    280.46061837 +
    360.98564736629 * daysSinceJ2000 +
    0.000387933 * centuriesSinceJ2000 * centuriesSinceJ2000 -
    (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 38_710_000;

  return normalizeDegrees(degrees);
}

export function localSiderealTime(date = new Date(), longitudeDegrees = INCHEON_LOCATION.longitudeDegrees) {
  const degrees = normalizeDegrees(greenwichSiderealTime(date) + longitudeDegrees);
  return { degrees, hours: degrees / 15 };
}

export function selectStarCandidates(options = {}) {
  const date = toDateTime(options.date ?? options.asOf ?? new Date(), "date");
  const location = normalizeLocation(options.location ?? INCHEON_LOCATION);
  const limit = options.limit ?? 5;
  const minAltitudeDegrees = options.minAltitudeDegrees ?? options.minAltitude ?? 8;
  const catalog = options.catalog ?? STAR_CATALOG;
  const signal = buildBirthSignal(options, date);
  const includeBelowHorizon = options.includeBelowHorizon ?? false;
  const candidates = catalog
    .map((star, index) => {
      const horizontal = horizontalForStar(star, { date, location });
      const scoreBreakdown = scoreStarCandidate(star, horizontal, signal, minAltitudeDegrees, index);

      return {
        ...star,
        horizontal,
        visible: horizontal.apparentAltitudeDegrees >= minAltitudeDegrees,
        score: round(scoreBreakdown.total, 4),
        scoreBreakdown,
        reasons: buildCandidateReasons(star, horizontal, scoreBreakdown, minAltitudeDegrees),
      };
    })
    .filter((candidate) => includeBelowHorizon || candidate.horizontal.aboveHorizon)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    generatedAt: date.toISOString(),
    location,
    minAltitudeDegrees,
    age: signal.ageDetails,
    birthSignal: signal.publicSignal,
    consideredCount: catalog.length,
    candidates,
  };
}

export function scoreStarCandidate(star, horizontal, signal = {}, minAltitudeDegrees = 8, index = 0) {
  const altitude = horizontal.apparentAltitudeDegrees;
  const altitudeScore = clamp((altitude - minAltitudeDegrees) / (80 - minAltitudeDegrees), 0, 1);
  const horizonGrace = altitude > 0 ? 0.15 : 0;
  const visibilityScore = Math.max(altitudeScore, horizonGrace);
  const starMagnitude = Number(star.magnitude ?? star.gMag ?? 6);
  const brightnessScore = clamp((2.7 - starMagnitude) / 4.2, 0, 1);
  const starRaDegrees = star.raHours !== undefined ? star.raHours * 15 : Number(star.raDegrees ?? star.ra ?? 0);
  const birthdayScore = signal.birthdayAngleDegrees == null
    ? 0.5
    : 1 - angularDistanceDegrees(signal.birthdayAngleDegrees, starRaDegrees) / 180;
  const ageScore = signal.ageYears == null ? 0.5 : ageCycleScore(signal.ageYears, star, index);
  const total = visibilityScore * 0.5 + brightnessScore * 0.22 + birthdayScore * 0.18 + ageScore * 0.1;

  return {
    total,
    visibility: round(visibilityScore, 4),
    brightness: round(brightnessScore, 4),
    birthday: round(birthdayScore, 4),
    age: round(ageScore, 4),
  };
}

export function parseRightAscension(value, unit = "hours") {
  if (typeof value === "number") return unit === "degrees" ? normalizeDegrees(value) : normalizeDegrees(value * 15);
  if (typeof value !== "string") throw new TypeError("Right ascension must be a number or a string.");

  const trimmed = value.trim();
  const looksLikeDegrees = /deg|degree|degrees|°/i.test(trimmed) || unit === "degrees";
  const numeric = parseSexagesimal(trimmed).value;
  return looksLikeDegrees ? normalizeDegrees(numeric) : normalizeDegrees(numeric * 15);
}

export function parseDeclination(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") throw new TypeError("Declination must be a number or a string.");
  return parseSexagesimal(value.trim()).value;
}

export function formatHms(hours) {
  const totalSeconds = Math.round(normalizeHours(hours) * 3600);
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}h ${pad2(m)}m ${pad2(s)}s`;
}

export function formatDms(degrees) {
  const sign = degrees < 0 ? "-" : "+";
  const totalSeconds = Math.round(Math.abs(degrees) * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${sign}${pad2(d)}° ${pad2(m)}′ ${pad2(s)}″`;
}

export const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;
export const radiansToDegrees = (radians) => (radians * 180) / Math.PI;
export const normalizeDegrees = (degrees) => positiveModulo(degrees, 360);
export const normalizeHours = (hours) => positiveModulo(hours, 24);
export function normalizeSignedDegrees(degrees) {
  const normalized = normalizeDegrees(degrees);
  return normalized > 180 ? normalized - 360 : normalized;
}

export function chooseFriendStar(stars, location = INCHEON_LOCATION, targetAge = 0, date = new Date()) {
  if (!Array.isArray(stars) || stars.length === 0) {
    throw new RangeError("stars must contain at least one star.");
  }

  const targetYears = extractAgeYears(targetAge);
  const scored = stars.map((star, index) => {
    const horizontal = equatorialToHorizontal(star, location, date);
    const distanceLy = Number(star.distanceLy ?? star.distance ?? 0);
    const ageGap = Math.abs(distanceLy - targetYears);
    const skyPenalty = horizontal.altitude > 10 ? 0 : horizontal.altitude > 0 ? 0.25 : 1.25;
    const brightnessPenalty = clamp(Number(star.gMag ?? star.magnitude ?? 8) - 8, 0, 6) * 0.035;
    const score = ageGap + skyPenalty + brightnessPenalty;

    return { star, horizontal, ageGap, score, index };
  });

  scored.sort((a, b) => a.score - b.score || a.ageGap - b.ageGap || a.index - b.index);
  return scored[0];
}

export function formatAge(age) {
  if (isPlainObject(age)) {
    const years = Number(age.years ?? 0);
    const months = Number(age.months ?? 0);
    const days = Number(age.days ?? 0);
    const decimalYears = years + months / 12 + days / 365.2425;
    const parts = [`${years}년`];
    if (months > 0) parts.push(`${months}개월`);
    if (days > 0) parts.push(`${days}일`);
    return `${decimalYears.toFixed(2)}세 (${parts.join(" ")})`;
  }

  const years = extractAgeYears(age);
  if (!Number.isFinite(years)) return "-";
  if (Math.abs(years - Math.round(years)) < 0.005) return `${Math.round(years)}세`;

  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);
  return months === 12 ? `${whole + 1}세` : `${whole}세 ${months}개월`;
}

export function directionLabel(azimuthDegrees) {
  const labels = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동", "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
  return labels[Math.round(normalizeDegrees(azimuthDegrees) / 22.5) % labels.length];
}

export function describeColor(bpRp) {
  const colorIndex = Number(bpRp);
  if (!Number.isFinite(colorIndex)) return "색 정보 없음";
  if (colorIndex < 0.1) return "푸른빛이 도는 뜨거운 별";
  if (colorIndex < 0.8) return "흰빛 또는 옅은 노란빛의 별";
  if (colorIndex < 1.5) return "노란빛이 따뜻한 별";
  if (colorIndex < 2.8) return "주황빛이 강한 차가운 별";
  return "붉은빛이 도는 매우 차가운 별";
}

function extractAgeYears(age) {
  if (typeof age === "number") return age;
  if (typeof age === "string" && age.trim() !== "") return Number(age);
  if (isPlainObject(age)) {
    if (Number.isFinite(Number(age.decimalYears))) return Number(age.decimalYears);
    const years = Number(age.years ?? 0);
    const months = Number(age.months ?? 0);
    const days = Number(age.days ?? 0);
    return years + months / 12 + days / 365.2425;
  }
  return Number(age);
}
function buildBirthSignal(options, date) {
  const asOf = options.asOf ?? date;
  let ageDetails = null;
  let birthday = null;
  let ageYears = null;

  if (options.birthDate !== undefined) {
    ageDetails = calculateDetailedAge(options.birthDate, asOf, options);
    const birth = toPlainDate(options.birthDate, "birthDate");
    birthday = { month: birth.month, day: birth.day };
    ageYears = ageDetails.years;
  } else if (hasAgeAndBirthday(options)) {
    ageDetails = calculateDetailedAge({ ageYears: options.ageYears ?? options.age, birthday: options.birthday, asOf }, asOf, options);
    const birth = toPlainDate(ageDetails.birthDate, "birthDate");
    birthday = { month: birth.month, day: birth.day };
    ageYears = ageDetails.years;
  } else {
    if (options.birthday !== undefined) {
      const today = toPlainDate(asOf, "asOf");
      birthday = toBirthdayMonthDay(options.birthday, today.year, options.leapDayMode ?? "feb28");
    }
    if (options.ageYears !== undefined || options.age !== undefined) ageYears = Number(options.ageYears ?? options.age);
  }

  const today = toPlainDate(asOf, "asOf");
  const birthdayAngleDegrees = birthday ? birthdayAngleForYear(birthday, today.year, options.leapDayMode ?? "feb28") : null;

  return {
    ageDetails,
    ageYears: Number.isFinite(ageYears) ? ageYears : null,
    birthdayAngleDegrees,
    publicSignal: {
      birthday: birthday ? formatMonthDay(birthday) : null,
      birthdayAngleDegrees,
      ageYears: Number.isFinite(ageYears) ? ageYears : null,
    },
  };
}

function buildCandidateReasons(star, horizontal, scoreBreakdown, minAltitudeDegrees) {
  const altitude = horizontal.apparentAltitudeDegrees;
  const reasons = [];

  if (altitude >= minAltitudeDegrees) {
    reasons.push(`인천 기준 현재 ${formatDegrees(altitude)} 고도, ${horizontal.azimuthCompass} 방향에 있습니다.`);
  } else if (altitude > 0) {
    reasons.push(`수평선 위에 있지만 고도가 ${formatDegrees(altitude)}로 낮습니다.`);
  } else {
    reasons.push(`현재는 지평선 아래(${formatDegrees(altitude)})에 있습니다.`);
  }

  if (star.magnitude <= 0.5) reasons.push("맨눈으로 매우 밝게 보이는 대표적인 밝은 별입니다.");
  else if (star.magnitude <= 1.5) reasons.push("도시 하늘에서도 조건이 좋으면 찾기 쉬운 밝기입니다.");
  if (scoreBreakdown.birthday >= 0.75) reasons.push("생일 계절 신호와 별의 적경 위치가 잘 맞습니다.");
  if (scoreBreakdown.age >= 0.75) reasons.push("나이 주기 점수가 높아 친구 별 후보로 잘 어울립니다.");

  return reasons;
}

function ageCycleScore(ageYears, star, index) {
  const ageAngle = normalizeDegrees(ageYears * 37.2 + index * 11.25);
  const starRaDegrees = star.raHours !== undefined ? star.raHours * 15 : Number(star.raDegrees ?? star.ra ?? 0);
  const starDecDegrees = Number(star.decDegrees ?? star.dec ?? 0);
  const starAngle = normalizeDegrees(starRaDegrees + starDecDegrees * 0.35);
  return 1 - angularDistanceDegrees(ageAngle, starAngle) / 180;
}

function birthdayAngleForYear(birthday, year, leapDayMode) {
  const observed = birthdayForYear({ year, ...birthday }, year, leapDayMode);
  const yearLength = isLeapYear(year) ? 366 : 365;
  return ((getDayOfYear(observed) - 1) / yearLength) * 360;
}

function atmosphericRefractionDegrees(altitudeDegrees) {
  if (altitudeDegrees < -1) return 0;
  const denominator = Math.tan(degreesToRadians(altitudeDegrees + 10.3 / (altitudeDegrees + 5.11)));
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) return 0;
  return (1.02 / denominator) / 60;
}

function compassPoint(azimuthDegrees) {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return points[Math.round(normalizeDegrees(azimuthDegrees) / 22.5) % points.length];
}

function parseSexagesimal(value) {
  const sign = /^\s*-/.test(value.replace(/[−–—]/g, "-")) ? -1 : 1;
  const parts = value
    .replace(/[−–—]/g, "-")
    .replace(/[^\d.+-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);

  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) {
    throw new TypeError(`Could not parse sexagesimal value: ${value}`);
  }

  const numeric = Math.abs(parts[0]) + Math.abs(parts[1] ?? 0) / 60 + Math.abs(parts[2] ?? 0) / 3600;
  return { sign, value: sign * numeric };
}

function toDateTime(input, fieldName) {
  if (input instanceof Date) {
    const copy = new Date(input.getTime());
    if (Number.isNaN(copy.getTime())) throw new TypeError(`${fieldName} is an invalid Date.`);
    return copy;
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${fieldName} must be a valid Date or date-time string.`);
  return date;
}

function toPlainDate(input, fieldName) {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) throw new TypeError(`${fieldName} is an invalid Date.`);
    return { year: input.getFullYear(), month: input.getMonth() + 1, day: input.getDate() };
  }

  if (typeof input === "string") {
    const dateMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/.exec(input.trim());
    if (!dateMatch) throw new TypeError(`${fieldName} must be in YYYY-MM-DD format.`);
    return { year: Number(dateMatch[1]), month: Number(dateMatch[2]), day: Number(dateMatch[3]) };
  }

  if (isPlainObject(input)) return { year: Number(input.year), month: Number(input.month), day: Number(input.day) };
  throw new TypeError(`${fieldName} must be a Date, YYYY-MM-DD string, or date object.`);
}

function toBirthdayMonthDay(input, year, leapDayMode) {
  if (typeof input === "string") {
    const trimmed = input.trim();
    const fullDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    const monthDay = /^(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (fullDate) return { month: Number(fullDate[2]), day: Number(fullDate[3]) };
    if (monthDay) return { month: Number(monthDay[1]), day: Number(monthDay[2]) };
  }

  if (isPlainObject(input)) return { month: Number(input.month), day: Number(input.day) };
  const normalized = toPlainDate(input, "birthday");
  const observed = birthdayForYear({ year, month: normalized.month, day: normalized.day }, year, leapDayMode);
  return { month: observed.month, day: observed.day };
}

function isLocationLike(value) {
  return isPlainObject(value) && (
    Object.prototype.hasOwnProperty.call(value, "latitude") ||
    Object.prototype.hasOwnProperty.call(value, "latitudeDegrees") ||
    Object.prototype.hasOwnProperty.call(value, "longitude") ||
    Object.prototype.hasOwnProperty.call(value, "longitudeDegrees")
  );
}

function normalizeLocation(location) {
  const normalized = {
    name: location.name ?? "Custom location",
    latitudeDegrees: Number(location.latitudeDegrees ?? location.latitude),
    longitudeDegrees: Number(location.longitudeDegrees ?? location.longitude),
    elevationMeters: Number(location.elevationMeters ?? location.elevation ?? 0),
  };

  if (!Number.isFinite(normalized.latitudeDegrees) || normalized.latitudeDegrees < -90 || normalized.latitudeDegrees > 90) {
    throw new RangeError("location latitude must be between -90 and 90 degrees.");
  }
  if (!Number.isFinite(normalized.longitudeDegrees)) {
    throw new RangeError("location longitude must be a finite degree value.");
  }

  normalized.longitudeDegrees = normalizeSignedDegrees(normalized.longitudeDegrees);
  return normalized;
}

function mergeAgeOptions(base, input) {
  return { ...base, leapDayMode: input.leapDayMode ?? base.leapDayMode };
}

function hasAgeAndBirthday(input) {
  return isPlainObject(input) &&
    (Object.prototype.hasOwnProperty.call(input, "ageYears") || Object.prototype.hasOwnProperty.call(input, "age")) &&
    Object.prototype.hasOwnProperty.call(input, "birthday");
}

function assertValidPlainDate(date, fieldName) {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day) ||
    date.month < 1 || date.month > 12 || date.day < 1 || date.day > daysInMonth(date.year, date.month)) {
    throw new RangeError(`${fieldName} is not a valid calendar date.`);
  }
}

function birthdayForYear(birthDate, year, leapDayMode) {
  if (birthDate.month === 2 && birthDate.day === 29 && !isLeapYear(year)) {
    return leapDayMode === "mar1" ? { year, month: 3, day: 1 } : { year, month: 2, day: 28 };
  }
  return { year, month: birthDate.month, day: Math.min(birthDate.day, daysInMonth(year, birthDate.month)) };
}

function getNextBirthday(birthDate, today, leapDayMode) {
  const thisYear = birthdayForYear(birthDate, today.year, leapDayMode);
  return comparePlainDates(thisYear, today) >= 0 ? thisYear : birthdayForYear(birthDate, today.year + 1, leapDayMode);
}

function comparePlainDates(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function daysBetweenPlainDates(a, b) {
  return Math.round((plainDateToUtcMs(b) - plainDateToUtcMs(a)) / DAY_MS);
}

function plainDateToUtcMs(date) {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function addMonthsClamped(date, months) {
  const monthIndex = date.month - 1 + months;
  const year = date.year + Math.floor(monthIndex / 12);
  const month = positiveModulo(monthIndex, 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

function addDaysPlainDate(date, days) {
  const result = new Date(plainDateToUtcMs(date) + days * DAY_MS);
  return { year: result.getUTCFullYear(), month: result.getUTCMonth() + 1, day: result.getUTCDate() };
}

function getDayOfYear(date) {
  return daysBetweenPlainDates({ year: date.year, month: 1, day: 1 }, date) + 1;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function angularDistanceDegrees(a, b) {
  return Math.abs(normalizeSignedDegrees(a - b));
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatPlainDate(date) {
  return `${String(date.year).padStart(4, "0")}-${pad2(date.month)}-${pad2(date.day)}`;
}

function formatMonthDay(date) {
  return `${pad2(date.month)}-${pad2(date.day)}`;
}

function formatDegrees(degrees) {
  return `${round(degrees, 1)}°`;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

const FriendStarAstro = Object.freeze({
  INCHEON_LOCATION,
  STAR_CATALOG,
  calculateDetailedAge,
  calculateAgeFromBirthday,
  inferBirthDateFromAge,
  estimateBirthDateRangeFromAge,
  calculateAgeFromYears,
  equatorialToHorizontal,
  horizontalForStar,
  julianDate,
  greenwichSiderealTime,
  localSiderealTime,
  selectStarCandidates,
  scoreStarCandidate,
  chooseFriendStar,
  formatAge,
  directionLabel,
  describeColor,
  parseRightAscension,
  parseDeclination,
  formatHms,
  formatDms,
  degreesToRadians,
  radiansToDegrees,
  normalizeDegrees,
  normalizeSignedDegrees,
  normalizeHours,
  clamp,
});

if (typeof window !== "undefined") {
  window.FriendStarAstro = FriendStarAstro;
}

export default FriendStarAstro;




