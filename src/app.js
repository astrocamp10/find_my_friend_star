import { DATASET_META, OBSERVATORY } from "./data.js";
import {
  calculateDetailedAge,
  chooseFriendStar,
  clamp,
  describeColor,
  directionLabel,
  equatorialToHorizontal,
  formatAge,
  localSiderealTime,
} from "./astro.js";

const canvas = document.querySelector("#skyCanvas");
const ctx = canvas.getContext("2d");
const form = document.querySelector("#friendForm");
const controlPanel = document.querySelector(".control-panel");
const resultPanel = document.querySelector(".result-panel");
const birthYearInput = document.querySelector("#birthYearInput");
const birthMonthInput = document.querySelector("#birthMonthInput");
const birthDayInput = document.querySelector("#birthDayInput");
const birthDatePreview = document.querySelector("#birthDatePreview");
const ageInput = document.querySelector("#ageInput");
const birthdayField = document.querySelector(".birthday-field");
const ageField = document.querySelector(".age-field");
const clockText = document.querySelector("#clockText");
const timeStatus = document.querySelector("#timeStatus");
const resultTitle = document.querySelector("#resultTitle");
const resultSummary = document.querySelector("#resultSummary");
const ageFact = document.querySelector("#ageFact");
const distanceFact = document.querySelector("#distanceFact");
const directionFact = document.querySelector("#directionFact");
const colorFact = document.querySelector("#colorFact");
const factLabels = [...document.querySelectorAll(".fact-grid dt")];
const scienceNote = document.querySelector("#scienceNote");
const resetView = document.querySelector("#resetView");
const modeButtons = [...document.querySelectorAll(".mode-button")];

const DEG_TO_RAD = Math.PI / 180;
const LIGHT_YEARS_PER_PARSEC = 3.261563777;
const MAX_BIRTHDAY_AGE = 120;
const FRIEND_ATLAS_MATCH_MAX_DEGREES = 0.06;
const HORIZON_SAMPLES = Array.from({ length: 181 }, (_, index) => index * 2);
const CONSTELLATION_LABELS = {
  And: "안드로메다",
  Ant: "공기펌프",
  Aps: "극락조",
  Aqr: "물병",
  Aql: "독수리",
  Ara: "제단",
  Ari: "양",
  Aur: "마차부",
  Boo: "목동",
  Cae: "조각칼",
  Cam: "기린",
  Cnc: "게",
  CVn: "사냥개",
  CMa: "큰개",
  CMi: "작은개",
  Cap: "염소",
  Car: "용골",
  Cas: "카시오페이아",
  Cen: "센타우루스",
  Cep: "케페우스",
  Cet: "고래",
  Cha: "카멜레온",
  Cir: "컴퍼스",
  Col: "비둘기",
  Com: "머리털",
  CrA: "남쪽왕관",
  CrB: "북쪽왕관",
  Crv: "까마귀",
  Crt: "컵",
  Cru: "남십자",
  Cyg: "백조",
  Del: "돌고래",
  Dor: "황새치",
  Dra: "용",
  Equ: "조랑말",
  Eri: "에리다누스",
  For: "화로",
  Gem: "쌍둥이",
  Gru: "두루미",
  Her: "헤라클레스",
  Hor: "시계",
  Hya: "바다뱀",
  Hyi: "물뱀",
  Ind: "인디언",
  Lac: "도마뱀",
  Leo: "사자",
  LMi: "작은사자",
  Lep: "토끼",
  Lib: "천칭",
  Lup: "이리",
  Lyn: "살쾡이",
  Lyr: "거문고",
  Men: "테이블산",
  Mic: "현미경",
  Mon: "외뿔소",
  Mus: "파리",
  Nor: "직각자",
  Oct: "팔분의",
  Oph: "뱀주인",
  Ori: "오리온",
  Pav: "공작",
  Peg: "페가수스",
  Per: "페르세우스",
  Phe: "불사조",
  Pic: "화가",
  Psc: "물고기",
  PsA: "남쪽물고기",
  Pup: "고물",
  Pyx: "나침반",
  Ret: "그물",
  Sge: "화살",
  Sco: "전갈",
  Sgr: "궁수",
  Scl: "조각가",
  Sct: "방패",
  Ser: "뱀",
  Sex: "육분의",
  Tau: "황소",
  Tel: "망원경",
  Tri: "삼각형",
  TrA: "남쪽삼각형",
  Tuc: "큰부리새",
  UMa: "큰곰",
  UMi: "작은곰",
  Vel: "돛",
  Vir: "처녀",
  Vol: "날치",
  Vul: "여우",
};

const KOREAN_PROPER_STAR_NAMES = {
  Achernar: "아케르나르",
  Acrux: "아크룩스",
  Adhara: "아다라",
  Agena: "아게나",
  Albireo: "알비레오",
  Alcor: "알코르",
  Alcyone: "알키오네",
  Aldebaran: "알데바란",
  Alderamin: "알데라민",
  Algenib: "알게니브",
  Algieba: "알기에바",
  Algol: "알골",
  Alhena: "알헤나",
  Alioth: "알리오트",
  Alkaid: "알카이드",
  Alnair: "알나이르",
  Alnilam: "알닐람",
  Alnitak: "알니탁",
  Alphard: "알파르드",
  Alpheratz: "알페라츠",
  Altair: "알타이르",
  Ankaa: "안카",
  Antares: "안타레스",
  Arcturus: "아크투루스",
  Atria: "아트리아",
  Avior: "아비오르",
  Bellatrix: "벨라트릭스",
  Betelgeuse: "베텔게우스",
  Canopus: "카노푸스",
  Capella: "카펠라",
  Castor: "카스토르",
  Caph: "카프",
  Deneb: "데네브",
  Denebola: "데네볼라",
  Dubhe: "두베",
  Elnath: "엘나스",
  Enif: "에니프",
  Fomalhaut: "포말하우트",
  Gacrux: "가크룩스",
  Hadar: "하다르",
  Hamal: "하말",
  Kaus: "카우스",
  "Kaus Australis": "카우스 아우스트랄리스",
  Markab: "마르카브",
  Menkalinan: "멘칼리난",
  Menkar: "멘카르",
  Merak: "메라크",
  Miaplacidus: "미아플라키두스",
  Mimosa: "미모사",
  Mintaka: "민타카",
  Mirach: "미라크",
  Mirfak: "미르파크",
  Mirzam: "미르잠",
  Mizar: "미자르",
  Nunki: "눈키",
  Peacock: "피콕",
  Phecda: "페크다",
  Polaris: "북극성",
  Pollux: "폴룩스",
  Procyon: "프로키온",
  Rasalhague: "라살하게",
  Regulus: "레굴루스",
  Rigel: "리겔",
  Rigil: "리길",
  Saiph: "사이프",
  Sargas: "사르가스",
  Scheat: "셰아트",
  Schedar: "셰다르",
  Shaula: "샤울라",
  Sirius: "시리우스",
  Spica: "스피카",
  Suhail: "수하일",
  Toliman: "톨리만",
  Vega: "베가",
  Wezen: "웨젠",
  Zubenelgenubi: "주베넬게누비",
};

const GREEK_LETTER_LABELS = {
  alf: "알파",
  bet: "베타",
  gam: "감마",
  del: "델타",
  eps: "엡실론",
  zet: "제타",
  eta: "에타",
  tet: "세타",
  iot: "이오타",
  kap: "카파",
  lam: "람다",
  "mu.": "뮤",
  mu: "뮤",
  "nu.": "뉴",
  nu: "뉴",
  ksi: "크시",
  omi: "오미크론",
  "pi.": "파이",
  pi: "파이",
  rho: "로",
  sig: "시그마",
  tau: "타우",
  ups: "입실론",
  phi: "파이",
  chi: "카이",
  psi: "프시",
  ome: "오메가",
};
const ATLAS_STAR_CONTEXT = {
  Deneb: {
    role: "백조자리의 꼬리 별입니다.",
    note: "베가, 알타이르와 함께 여름철 대삼각형을 이루는 푸른빛 초거성입니다.",
  },
  Vega: {
    role: "거문고자리에서 가장 밝은 별입니다.",
    note: "데네브, 알타이르와 함께 여름철 대삼각형을 이루며 밝기 기준 별로도 유명합니다.",
  },
  Altair: {
    role: "독수리자리의 중심부에서 가장 밝은 별입니다.",
    note: "지구에서 비교적 가까운 밝은 별이고, 빠르게 자전하는 별로 알려져 있습니다.",
  },
  Sirius: {
    role: "큰개자리의 목 또는 가슴 쪽에서 가장 밝은 별입니다.",
    note: "밤하늘 전체에서 가장 밝게 보이는 별입니다.",
  },
  Procyon: {
    role: "작은개자리에서 가장 밝은 별입니다.",
    note: "시리우스, 베텔게우스와 함께 겨울철 대삼각형을 이룹니다.",
  },
  Betelgeuse: {
    role: "오리온자리의 붉은 어깨에 해당하는 별입니다.",
    note: "크기가 매우 큰 적색초거성이라 밝기 변화가 관측되는 별입니다.",
  },
  Rigel: {
    role: "오리온자리의 푸른 발 쪽을 표시하는 별입니다.",
    note: "오리온자리에서 매우 밝게 보이는 청색초거성입니다.",
  },
  Bellatrix: {
    role: "오리온자리의 다른 쪽 어깨에 해당하는 별입니다.",
    note: "오리온의 허리띠 위쪽에서 밝게 보이며 푸른빛이 강한 별입니다.",
  },
  Saiph: {
    role: "오리온자리의 다리 쪽을 이루는 별입니다.",
    note: "리겔과 함께 오리온의 아래쪽 윤곽을 잡아 줍니다.",
  },
  Mintaka: {
    role: "오리온자리 허리띠의 서쪽 별입니다.",
    note: "알닐람, 알니탁과 나란히 서서 오리온의 허리띠를 만듭니다.",
  },
  Alnilam: {
    role: "오리온자리 허리띠의 가운데 별입니다.",
    note: "세 허리띠 별 중 가운데에서 가장 눈에 띄는 푸른빛 초거성입니다.",
  },
  Alnitak: {
    role: "오리온자리 허리띠의 동쪽 별입니다.",
    note: "근처에 말머리성운과 불꽃성운이 있어 사진 관측에서 자주 등장합니다.",
  },
  Polaris: {
    role: "작은곰자리 꼬리 끝에 있는 북극성입니다.",
    note: "하늘의 북극 가까이에 있어 북쪽 방향을 찾는 기준 별입니다.",
  },
  Spica: {
    role: "처녀자리의 보리 이삭에 해당하는 별입니다.",
    note: "봄철 남쪽 하늘에서 밝게 보이는 푸른빛 쌍성입니다.",
  },
  Regulus: {
    role: "사자자리의 심장에 해당하는 별입니다.",
    note: "황도 가까이에 있어 달과 행성이 근처를 지나는 모습을 볼 수 있습니다.",
  },
  Denebola: {
    role: "사자자리의 꼬리 쪽을 표시하는 별입니다.",
    note: "레굴루스와 함께 사자자리의 긴 몸통 방향을 잡아 줍니다.",
  },
  Antares: {
    role: "전갈자리의 붉은 심장에 해당하는 별입니다.",
    note: "화성처럼 붉게 보여 이름도 '화성에 맞서는 별'이라는 뜻에서 왔습니다.",
  },
  Shaula: {
    role: "전갈자리 꼬리 끝의 독침 부근에 있는 별입니다.",
    note: "여름 남쪽 하늘에서 전갈의 휘어진 꼬리를 찾을 때 중요한 표지입니다.",
  },
  Aldebaran: {
    role: "황소자리의 붉은 눈에 해당하는 별입니다.",
    note: "히아데스 성단 앞쪽에 보이지만 실제로는 성단보다 훨씬 가까운 거성입니다.",
  },
  Elnath: {
    role: "황소자리의 뿔 끝에 놓인 별입니다.",
    note: "마차부자리와 황소자리 경계 가까이에 있어 겨울 하늘 길잡이로 좋습니다.",
  },
  Albireo: {
    role: "백조자리의 머리 또는 부리 쪽에 놓인 별입니다.",
    note: "망원경으로 보면 금빛과 푸른빛이 나란히 보이는 아름다운 이중성으로 유명합니다.",
  },
  Arcturus: {
    role: "목동자리에서 가장 밝은 별입니다.",
    note: "봄철 대곡선을 따라 북두칠성 손잡이에서 이어 찾기 좋은 주황빛 거성입니다.",
  },
  Capella: {
    role: "마차부자리에서 가장 밝은 별입니다.",
    note: "겨울 하늘 높은 곳에서 노란빛으로 빛나는 밝은 쌍성계입니다.",
  },
  Fomalhaut: {
    role: "남쪽물고기자리의 입에 해당하는 별입니다.",
    note: "가을 남쪽 하늘에서 주변 별보다 홀로 밝게 보여 찾기 쉽습니다.",
  },
  Castor: {
    role: "쌍둥이자리의 한쪽 머리에 해당하는 별입니다.",
    note: "망원경으로 나뉘어 보이는 다중성계로, 폴룩스와 짝을 이룹니다.",
  },
  Pollux: {
    role: "쌍둥이자리의 다른 쪽 머리에 해당하는 별입니다.",
    note: "카스토르보다 조금 더 밝고 주황빛이 도는 거성입니다.",
  },
  Dubhe: {
    role: "큰곰자리 국자 앞쪽 그릇의 윗별입니다.",
    note: "메라크와 이으면 북극성을 찾는 길잡이 선이 됩니다.",
  },
  Merak: {
    role: "큰곰자리 국자 앞쪽 그릇의 아랫별입니다.",
    note: "두베와 함께 북극성을 찾는 대표적인 포인터 별입니다.",
  },
  Phecda: {
    role: "큰곰자리 국자 그릇의 아래 안쪽 별입니다.",
    note: "북두칠성 그릇 모양을 단단하게 잡아 주는 별입니다.",
  },
  Megrez: {
    role: "큰곰자리 국자 그릇과 손잡이가 만나는 별입니다.",
    note: "북두칠성 일곱 별 중 비교적 어둡지만 모양의 꺾이는 지점입니다.",
  },
  Alioth: {
    role: "큰곰자리 국자 손잡이의 첫 번째 밝은 별입니다.",
    note: "북두칠성에서 가장 밝은 축에 드는 별로 손잡이 방향을 잡아 줍니다.",
  },
  Mizar: {
    role: "큰곰자리 국자 손잡이 가운데 별입니다.",
    note: "곁의 알코르와 함께 눈으로 분리해 보는 시력 테스트 별로 유명합니다.",
  },
  Alkaid: {
    role: "큰곰자리 국자 손잡이 끝별입니다.",
    note: "북두칠성 손잡이 끝에서 봄철 대곡선이 시작됩니다.",
  },
  Alpheratz: {
    role: "안드로메다자리 머리이자 페가수스 사각형의 한 꼭짓점입니다.",
    note: "가을 하늘에서 안드로메다 은하 방향을 찾아갈 때 좋은 출발점입니다.",
  },
  Mirach: {
    role: "안드로메다자리의 허리 부근에 있는 별입니다.",
    note: "알페라츠에서 미라크를 지나가면 안드로메다 은하를 찾기 쉽습니다.",
  },
  Mirfak: {
    role: "페르세우스자리의 중심부에서 가장 밝은 별입니다.",
    note: "주변에 밝은 별들이 모인 알파 페르세우스 성단이 퍼져 보입니다.",
  },
  Algol: {
    role: "페르세우스자리에서 메두사의 머리를 나타내는 별입니다.",
    note: "규칙적으로 밝기가 변하는 식쌍성으로 오래전부터 알려져 있습니다.",
  },
};
let inputMode = "birthday";
let selected = null;
let animationStart = 0;
let view = { azimuth: 180, altitude: 35, zoom: 1 };
let targetView = { azimuth: 180, altitude: 35, zoom: 1 };
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let viewport = { width: window.innerWidth, height: window.innerHeight };
let skyAtlas = { stars: [], constellations: [] };
let nearbyStars = [];
let nearbyMeta = null;
let nearbyStarsPromise = null;
let skyFrameCache = null;
let dragState = null;
let pinchState = null;
let activePointers = new Map();
let atlasHitTargets = [];
let preferredBirthDay = null;
let lastPaintAt = 0;
let renderLoopActive = false;
let resizeTimer = null;
let lastClockSecond = "";
let timeStatusMessage = "";
let lastSkySyncBucket = -1;

resizeCanvas();
window.addEventListener("resize", scheduleResizeCanvas, { passive: true });
window.visualViewport?.addEventListener("resize", scheduleResizeCanvas, { passive: true });
window.addEventListener("blur", clearPointerState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearPointerState();
    renderLoopActive = false;
    return;
  }
  skyFrameCache = null;
  syncClockAndSky();
  requestPaint();
});
window.setInterval(syncClockAndSky, 1000);
loadSkyAtlas();
scheduleNearbyStarPrefetch();
attachSkyControls();
populateBirthdayInputs();
syncClockAndSky();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setInputMode(button.dataset.mode, { focus: true }));
});

setInputMode(inputMode);


function birthdayControls() {
  return [birthYearInput, birthMonthInput, birthDayInput].filter(Boolean);
}

function populateBirthdayInputs(asOf = new Date()) {
  const { today, oldest } = birthdayBounds(asOf);
  const defaultYear = clamp(today.getFullYear() - 12, oldest.getFullYear(), today.getFullYear());
  preferredBirthDay = today.getDate();

  birthYearInput.placeholder = String(defaultYear);
  birthMonthInput.placeholder = String(today.getMonth() + 1);
  birthDayInput.placeholder = String(preferredBirthDay);
  birthYearInput.value = String(defaultYear);
  birthMonthInput.value = String(today.getMonth() + 1);
  birthDayInput.value = String(preferredBirthDay);

  for (const input of birthdayControls()) {
    input.addEventListener("input", handleBirthdayInput);
    input.addEventListener("change", () => normalizeBirthdayInputs());
    input.addEventListener("blur", () => normalizeBirthdayInputs());
  }

  normalizeBirthdayInputs(asOf, { force: true });
}

function handleBirthdayInput(event) {
  sanitizeBirthdayInput(event.target);
  if (event.target === birthDayInput && event.target.value) {
    preferredBirthDay = clampInteger(event.target.value, 1, 31);
  }
  updateBirthdayInputLimits();
  updateBirthdayPreview();
}

function sanitizeBirthdayInput(input) {
  const maxLength = input === birthYearInput ? 4 : 2;
  const nextValue = String(input.value || "").replace(/\D/g, "").slice(0, maxLength);
  if (input.value !== nextValue) input.value = nextValue;
}

function normalizeBirthdayInputs(asOf = new Date(), options = {}) {
  const baseDate = asOf instanceof Event ? new Date() : asOf;
  for (const input of birthdayControls()) sanitizeBirthdayInput(input);

  const yearText = birthYearInput.value.trim();
  if (!options.force && yearText && yearText.length < 4) {
    updateBirthdayInputLimits(baseDate);
    updateBirthdayPreview(baseDate);
    return;
  }

  const { today, oldest } = birthdayBounds(baseDate);
  const defaultYear = clamp(today.getFullYear() - 12, oldest.getFullYear(), today.getFullYear());
  const year = clampInteger(parseBirthdayInt(birthYearInput.value) ?? defaultYear, oldest.getFullYear(), today.getFullYear());
  birthYearInput.value = String(year);

  const monthMin = year === oldest.getFullYear() ? oldest.getMonth() + 1 : 1;
  const monthMax = year === today.getFullYear() ? today.getMonth() + 1 : 12;
  const month = clampInteger(parseBirthdayInt(birthMonthInput.value) ?? monthMin, monthMin, monthMax);
  birthMonthInput.value = String(month);

  const rawDay = parseBirthdayInt(birthDayInput.value);
  if (rawDay) preferredBirthDay = clampInteger(rawDay, 1, 31);

  let dayMin = 1;
  let dayMax = daysInMonth(year, month);
  if (year === oldest.getFullYear() && month === oldest.getMonth() + 1) dayMin = oldest.getDate();
  if (year === today.getFullYear() && month === today.getMonth() + 1) dayMax = today.getDate();
  const day = clampInteger(preferredBirthDay ?? rawDay ?? dayMin, dayMin, dayMax);
  birthDayInput.value = String(day);

  updateBirthdayInputLimits(baseDate);
  updateBirthdayPreview(baseDate);
}

function updateBirthdayInputLimits(asOf = new Date()) {
  const { today, oldest } = birthdayBounds(asOf);
  const year = parseBirthdayInt(birthYearInput.value);
  const boundedYear = year && year >= oldest.getFullYear() && year <= today.getFullYear() ? year : null;
  const monthMin = boundedYear === oldest.getFullYear() ? oldest.getMonth() + 1 : 1;
  const monthMax = boundedYear === today.getFullYear() ? today.getMonth() + 1 : 12;

  birthYearInput.setAttribute("aria-valuemin", String(oldest.getFullYear()));
  birthYearInput.setAttribute("aria-valuemax", String(today.getFullYear()));
  birthMonthInput.setAttribute("aria-valuemin", String(monthMin));
  birthMonthInput.setAttribute("aria-valuemax", String(monthMax));

  const month = parseBirthdayInt(birthMonthInput.value);
  const boundedMonth = month ? clampInteger(month, monthMin, monthMax) : 1;
  let dayMin = 1;
  let dayMax = boundedYear ? daysInMonth(boundedYear, boundedMonth) : 31;
  if (boundedYear === oldest.getFullYear() && boundedMonth === oldest.getMonth() + 1) dayMin = oldest.getDate();
  if (boundedYear === today.getFullYear() && boundedMonth === today.getMonth() + 1) dayMax = today.getDate();
  birthDayInput.setAttribute("aria-valuemin", String(dayMin));
  birthDayInput.setAttribute("aria-valuemax", String(dayMax));
}

function updateBirthdayPreview(asOf = new Date()) {
  const parts = currentBirthdayParts(asOf);
  birthDatePreview.textContent = parts
    ? `${parts.year}년 ${parts.month}월 ${parts.day}일 · 만 ${birthdayPreviewAge(parts.year, parts.month, parts.day)}`
    : "YYYY년 MM월 DD일";
}

function currentBirthdayParts(asOf = new Date()) {
  const yearText = birthYearInput.value.trim();
  const monthText = birthMonthInput.value.trim();
  const dayText = birthDayInput.value.trim();
  if (yearText.length !== 4 || !monthText || !dayText) return null;

  const year = parseBirthdayInt(yearText);
  const month = parseBirthdayInt(monthText);
  const day = parseBirthdayInt(dayText);
  if (!year || !month || !day) return null;

  const { today, oldest } = birthdayBounds(asOf);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return null;
  if (birth < oldest || birth > today) return null;
  return { year, month, day };
}

function parseBirthdayInt(value) {
  const text = String(value || "").trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}
function birthdayPreviewAge(year, month, day) {
  try {
    const age = calculateDetailedAge({ birthday: `${year}-${pad2(month)}-${pad2(day)}` });
    const parts = [`${age.years}세`];
    if (age.months) parts.push(`${age.months}개월`);
    if (age.days) parts.push(`${age.days}일`);
    return parts.join(" ");
  } catch {
    return "-";
  }
}

function selectedBirthdayValue() {
  for (const input of birthdayControls()) sanitizeBirthdayInput(input);
  if (birthYearInput.value.trim().length !== 4 || !birthMonthInput.value.trim() || !birthDayInput.value.trim()) {
    throw new RangeError("생년월일을 숫자로 정확히 입력해 주세요.");
  }

  normalizeBirthdayInputs(new Date(), { force: true });
  const parts = currentBirthdayParts(new Date());
  if (!parts) throw new RangeError("최대 120살까지, 오늘 이전의 실제 날짜를 입력해 주세요.");

  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function birthdayBounds(asOf = new Date()) {
  const today = localDateOnly(asOf);
  const oldest = new Date(today.getFullYear() - MAX_BIRTHDAY_AGE, today.getMonth(), today.getDate());
  return { today, oldest };
}

function clampInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function localDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function pad2(value) {
  return String(value).padStart(2, "0");
}
function scheduleNearbyStarPrefetch() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSmallScreen = window.matchMedia("(max-width: 700px)").matches;
  const isSlowConnection = /(^|-)2g$/.test(connection?.effectiveType || "");
  if (isSmallScreen || connection?.saveData || isSlowConnection) return;

  const load = () => loadNearbyStars().catch(() => {});
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 1400);
  }
}

function showResultSheet() {
  document.body.classList.add("has-result");
  resetPanelScroll(resultPanel);
}

function showInputSheet() {
  document.body.classList.remove("has-result");
  resetPanelScroll(controlPanel);
}

function resetPanelScroll(panel) {
  const reset = () => {
    if (panel) panel.scrollTop = 0;
    const root = document.scrollingElement;
    if (root) {
      root.scrollTop = 0;
      root.scrollLeft = 0;
    }
  };
  reset();
  window.requestAnimationFrame(reset);
}
function setInputMode(nextMode, options = {}) {
  inputMode = nextMode === "age" ? "age" : "birthday";
  const isAgeMode = inputMode === "age";

  modeButtons.forEach((item) => {
    const isActive = item.dataset.mode === inputMode;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });

  birthdayField.classList.toggle("hidden", isAgeMode);
  ageField.classList.toggle("hidden", !isAgeMode);
  for (const input of birthdayControls()) {
    input.disabled = isAgeMode;
  }
  ageInput.disabled = !isAgeMode;
  ageInput.required = isAgeMode;
  if (options.focus) {
    (isAgeMode ? ageInput : birthYearInput).focus();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const targetAgeYears = calculateDetailedAge({
      birthday: inputMode === "birthday" ? selectedBirthdayValue() : "",
      ageYears: inputMode === "age" ? ageInput.value : "",
    });
    const skyNow = getSkyNow(performance.now());
    resultTitle.textContent = "친구 별을 찾고 있어요";
    resultSummary.textContent = "120광년 이내 실제 별 데이터를 불러와 나이와 가장 가까운 별을 계산하고 있습니다.";
    ageFact.textContent = "계산 중";
    distanceFact.textContent = "계산 중";
    directionFact.textContent = "계산 중";
    colorFact.textContent = "계산 중";

    const candidates = await loadNearbyStars();
    selected = { ...chooseFriendStar(candidates, OBSERVATORY, targetAgeYears, skyNow), type: "friend" };
    animationStart = performance.now();
    targetView = {
      azimuth: selected.horizontal.azimuth,
      altitude: clamp(selected.horizontal.altitude, 12, 82),
      zoom: selected.horizontal.altitude > 0 ? 4.8 : 3,
    };
    requestPaint();

    updateResult(selected, targetAgeYears);
  } catch (error) {
    resultTitle.textContent = "입력값을 확인해 주세요";
    resultSummary.textContent = error.message;
  }
});

resetView.addEventListener("click", () => {
  selected = null;
  animationStart = performance.now();
  targetView = { azimuth: 180, altitude: 35, zoom: 1 };
  showInputSheet();
  setFactLabels();
  resultTitle.textContent = "인천 하늘 전체 보기";
  resultSummary.textContent =
    "하늘을 마우스나 손가락으로 드래그하면 북쪽, 동쪽, 서쪽도 둘러볼 수 있습니다.";
  ageFact.textContent = "-";
  distanceFact.textContent = "-";
  directionFact.textContent = "-";
  colorFact.textContent = "-";
  requestPaint();
});

requestPaint();

async function loadNearbyStars() {
  if (nearbyStars.length) return nearbyStars;
  if (nearbyStarsPromise) return nearbyStarsPromise;

  nearbyStarsPromise = fetch(new URL("../data/nearby-stars-search.json", import.meta.url))
    .then((response) => {
      if (!response.ok) throw new Error(`120광년 근처 별 데이터를 불러오지 못했습니다. (${response.status})`);
      return response.json();
    })
    .then((catalog) => {
      nearbyMeta = catalog;
      nearbyStars = catalog.stars;
      if (!nearbyStars.length) throw new Error("이름이 확인된 근처 별 데이터가 비어 있습니다.");
      return nearbyStars;
    })
    .catch((error) => {
      nearbyStarsPromise = null;
      throw error;
    });

  return nearbyStarsPromise;
}

async function loadSkyAtlas() {
  try {
    const response = await fetch(new URL("../data/sky-atlas.json?v=stellarium-modern-iau-1", import.meta.url));
    if (!response.ok) throw new Error(`별자리 데이터를 불러오지 못했습니다. (${response.status})`);
    skyAtlas = prepareSkyAtlas(await response.json());
    skyFrameCache = null;
    if (!selected) {
      resultTitle.textContent = "인천 하늘 전체 보기";
      resultSummary.textContent =
        `별 ${skyAtlas.stars.length.toLocaleString("ko-KR")}개와 별자리 ${skyAtlas.constellations.length}개 선을 불러왔습니다. 하늘을 드래그해 둘러보세요.`;
    }
    requestPaint();
  } catch (error) {
    if (!selected) {
      resultTitle.textContent = "별자리 데이터를 확인해 주세요";
      resultSummary.textContent = error.message;
    }
  }
}

function attachSkyControls() {
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (!activePointers.has(event.pointerId) && activePointers.size >= 2) return;

    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    requestPaint();

    if (activePointers.size === 2) {
      const points = [...activePointers.values()];
      pinchState = {
        distance: distanceBetween(points[0], points[1]),
        zoom: targetView.zoom,
      };
      dragState = null;
      return;
    }

    dragState = {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      azimuth: targetView.azimuth,
      altitude: targetView.altitude,
    };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size === 2 && pinchState) {
      const points = [...activePointers.values()];
      const ratio = distanceBetween(points[0], points[1]) / Math.max(30, pinchState.distance);
      targetView.zoom = clamp(pinchState.zoom * ratio, 1, 8);
      requestPaint();
      return;
    }

    if (!dragState) return;
    const dx = event.clientX - dragState.x;
    const dy = event.clientY - dragState.y;
    const sensitivity = 0.13 / Math.sqrt(targetView.zoom);
    targetView.azimuth = normalizeDegrees(dragState.azimuth - dx * sensitivity);
    targetView.altitude = clamp(dragState.altitude - dy * sensitivity, 6, 88);
    requestPaint();
  });

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", (event) => endPointer(event, { skipPick: true }));
  canvas.addEventListener("lostpointercapture", (event) => {
    if (activePointers.has(event.pointerId)) endPointer(event, { skipPick: true });
  });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.001);
    targetView.zoom = clamp(targetView.zoom * factor, 1, 8);
    requestPaint();
  }, { passive: false });
}

function endPointer(event, options = {}) {
  if (!options.skipPick && dragState && activePointers.size === 1) {
    const tapSlop = isCoarsePointer() ? 14 : 7;
    const moved = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    if (moved < tapSlop) pickAtlasStar(event);
  }

  if (canvas.hasPointerCapture?.(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  activePointers.delete(event.pointerId);
  if (activePointers.size === 0) {
    dragState = null;
    pinchState = null;
    canvas.classList.remove("dragging");
  } else if (activePointers.size === 1) {
    const point = [...activePointers.values()][0];
    dragState = {
      x: point.x,
      y: point.y,
      startX: point.x,
      startY: point.y,
      azimuth: targetView.azimuth,
      altitude: targetView.altitude,
    };
    pinchState = null;
  }
  requestPaint();
}

function clearPointerState() {
  activePointers.clear();
  dragState = null;
  pinchState = null;
  canvas.classList.remove("dragging");
}

function isCoarsePointer() {
  return viewport.width <= 700 || window.matchMedia("(pointer: coarse)").matches;
}

function getSkyNow() {
  return new Date();
}

function pickAtlasStar(event) {
  if (!atlasHitTargets.length) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let best = null;

  for (const target of atlasHitTargets) {
    const distance = Math.hypot(target.x - x, target.y - y);
    if (distance > target.radius) continue;
    if (!best || distance < best.distance) best = { ...target, distance };
  }

  if (!best) return;

  selected = { type: "atlas", star: best.star, horizontal: best.horizontal };
  animationStart = performance.now();
  targetView = {
    azimuth: best.horizontal.azimuth,
    altitude: clamp(best.horizontal.altitude, 16, 82),
    zoom: 3.4,
  };
  updateAtlasStarResult(selected);
}

function setFactLabels(labels = ["나의 자세한 나이", "거리와 밝기", "지금 방향", "별빛 색"]) {
  labels.forEach((label, index) => {
    if (factLabels[index]) factLabels[index].textContent = label;
  });
}

function updateAtlasStarResult(selection) {
  showResultSheet();
  const { star, horizontal } = selection;
  const constellations = star.constellationIds?.map((id) => CONSTELLATION_LABELS[id] ?? id).join(", ") || "별자리 정보 없음";
  const name = atlasStarDisplayName(star);

  setFactLabels(["별자리", "밝기 등급", "지금 방향", "별빛 색"]);
  resultTitle.textContent = name;
  resultSummary.textContent = atlasStarSummary(star, name, constellations);
  ageFact.textContent = constellations;
  distanceFact.textContent = formatAtlasBrightness(star);
  directionFact.textContent = `${directionLabel(horizontal.azimuth)}쪽, 고도 ${horizontal.altitude.toFixed(1)}도`;
  colorFact.textContent = starColorDescription(star.bv);
  scienceNote.textContent =
    "겉보기 등급은 지구에서 보이는 밝기이고, 절대등급은 별을 10파섹 거리에 둔다고 가정한 실제 밝기입니다. 별자리 선은 Stellarium modern_iau의 HIP 연결 자료를 사용합니다.";
}

function updateResult(match, targetAgeYears) {
  showResultSheet();
  const { star, horizontal, ageGap } = match;
  const visibleText =
    horizontal.altitude > 10
      ? "지금 인천 하늘 위에 떠 있어요."
      : horizontal.altitude > 0
        ? "지평선 가까이에 낮게 떠 있어요."
        : "지금은 지평선 아래에 있어요. 별의 위치는 계속 움직입니다.";

  const name = friendStarDisplayName(star);

  setFactLabels();
  resultTitle.textContent = name;
  resultSummary.textContent =
    `${name}${subjectMarker(name)} 나이와 별빛 거리 차이가 약 ${ageGap.toFixed(2)}광년인 후보입니다. ${visibleText}`;
  ageFact.textContent = formatAge(targetAgeYears);
  distanceFact.textContent = formatFriendDistanceAndBrightness(star);
  directionFact.textContent = `${directionLabel(horizontal.azimuth)}쪽, 고도 ${horizontal.altitude.toFixed(1)}도`;
  colorFact.textContent = describeColor(star.bpRp);
  scienceNote.textContent = [
    star.note,
    `${DATASET_META.release}에서 120광년 이내 별 ${nearbyMeta?.counts?.totalFullCatalog?.toLocaleString("ko-KR") ?? "18,148"}개를 내려받고, SIMBAD/CDS 식별자로 이름을 교차확인했습니다. 겉보기 등급은 Gaia G 등급, 절대등급은 Gaia 거리로 계산한 G 절대등급입니다.`,
  ].filter(Boolean).join(" ");
}

function atlasStarSummary(star, displayName, constellationText) {
  const context = atlasStarContext(star);
  if (context) return `${displayName}${subjectMarker(displayName)} ${context.role} ${context.note}`;

  const bayer = bayerDesignationInfo(star);
  if (bayer) {
    const bayerName = `${bayer.greek}${bayer.number ? Number(bayer.number) : ""}`;
    return `${displayName}${subjectMarker(displayName)} ${bayer.constellation}자리의 ${bayerName}별입니다. ${atlasBrightnessSentence(star)}`;
  }

  return `${displayName}${subjectMarker(displayName)} ${constellationText} 별자리 선에서 위치를 잡는 기준 별입니다. ${atlasBrightnessSentence(star)}`;
}

function atlasStarContext(star) {
  const names = [star.displayName, star.mainId, ...(star.aliases ?? [])]
    .map(cleanStarNameCandidate)
    .filter(Boolean);
  for (const name of names) {
    if (ATLAS_STAR_CONTEXT[name]) return ATLAS_STAR_CONTEXT[name];
  }
  return null;
}

function bayerDesignationInfo(star) {
  const names = [star.mainId, star.displayName, ...(star.aliases ?? [])].map(cleanStarNameCandidate);
  for (const name of names) {
    const match = /^(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.?|nu\.?|ksi|omi|pi\.?|rho|sig|tau|ups|phi|chi|psi|ome)(\d{1,2})?\s+([A-Z][A-Za-z0-9]{2})(?:\s|$)/i.exec(name);
    if (!match) continue;
    const greekKey = match[1].toLowerCase();
    const greek = GREEK_LETTER_LABELS[greekKey] ?? GREEK_LETTER_LABELS[greekKey.replace(/\.$/, "")];
    const constellation = CONSTELLATION_LABELS[match[3]] ?? CONSTELLATION_LABELS[star.constellationIds?.[0]];
    if (greek && constellation) return { greek, number: match[2] || "", constellation };
  }
  return null;
}

function atlasBrightnessSentence(star) {
  const magnitude = Number(star.mag);
  if (!Number.isFinite(magnitude)) return "별자리 선에서 다른 별들과 이어져 모양을 잡아 줍니다.";
  if (magnitude <= 1.5) return `겉보기등급 ${magnitude.toFixed(2)}등급으로 맨눈에도 매우 밝게 보이는 별입니다.`;
  if (magnitude <= 3.2) return `겉보기등급 ${magnitude.toFixed(2)}등급으로 별자리 모양을 찾을 때 도움이 되는 밝은 별입니다.`;
  return `겉보기등급 ${magnitude.toFixed(2)}등급으로 별자리 선에서 위치를 잡아 주는 별입니다.`;
}
function friendStarDisplayName(star) {
  const atlasStar = findFriendAtlasCounterpart(star);
  if (!atlasStar) return starDisplayName(star);
  return koreanStarName(atlasStar) || starDisplayName(atlasStar);
}

function findFriendAtlasCounterpart(star) {
  const ra = Number(star.ra ?? star.raDegrees);
  const dec = Number(star.dec ?? star.decDegrees);
  if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Array.isArray(skyAtlas.stars)) return null;

  const identifiers = starIdentifierSet(star);
  let best = null;
  for (const candidate of skyAtlas.stars) {
    if (!candidate.clickable) continue;
    const candidateRa = Number(candidate.ra);
    const candidateDec = Number(candidate.dec);
    const separation = angularSeparationDegrees(ra, dec, candidateRa, candidateDec);
    if (!Number.isFinite(separation)) continue;

    const sharedIdentifier = starSharesIdentifier(identifiers, candidate);
    const maxSeparation = sharedIdentifier ? 0.2 : FRIEND_ATLAS_MATCH_MAX_DEGREES;
    if (separation > maxSeparation) continue;

    const score = separation + (sharedIdentifier ? -0.3 : 0);
    if (!best || score < best.score) best = { star: candidate, score };
  }
  return best?.star ?? null;
}

function angularSeparationDegrees(raA, decA, raB, decB) {
  if (![raA, decA, raB, decB].every(Number.isFinite)) return Infinity;
  const raDelta = shortestAngle(raA - raB) * DEG_TO_RAD;
  const decDelta = (decA - decB) * DEG_TO_RAD;
  const meanDec = ((decA + decB) / 2) * DEG_TO_RAD;
  return Math.hypot(raDelta * Math.cos(meanDec), decDelta) / DEG_TO_RAD;
}

function starSharesIdentifier(identifiers, star) {
  for (const identifier of starIdentifierSet(star)) {
    if (identifiers.has(identifier)) return true;
  }
  return false;
}

function starIdentifierSet(star) {
  const identifiers = new Set();
  const values = [star.displayName, star.commonName, star.mainId, star.designation, ...(star.aliases ?? [])];
  for (const value of values) {
    for (const identifier of starIdentifierVariants(value)) identifiers.add(identifier);
  }
  return identifiers;
}

function starIdentifierVariants(value) {
  const cleaned = cleanStarNameCandidate(value);
  const normalized = normalizeStarIdentifier(cleaned);
  if (!normalized) return [];

  const variants = new Set([normalized]);
  const withoutComponent = normalized
    .replace(/\s+(?:aa|ab|ac|ad|ba|bb|bc|bd|a|b|c|d)$/i, "")
    .replace(/(\d+)(?:a|b|c|d)$/i, "$1")
    .trim();
  if (withoutComponent) variants.add(withoutComponent);

  const withoutBayerNumber = withoutComponent
    .replace(/\b(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu|nu|ksi|omi|pi|rho|sig|tau|ups|phi|chi|psi|ome)0?\d+\b/i, "$1")
    .trim();
  if (withoutBayerNumber) variants.add(withoutBayerNumber);

  return [...variants].filter((identifier) => identifier.length > 1);
}

function normalizeStarIdentifier(value) {
  return String(value || "")
    .replace(/^\*+\s*/i, "")
    .replace(/^NAME\s+/i, "")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function starDisplayName(star) {
  const mainId = String(star.mainId || "").trim();
  const properName = /^NAME\s+/i.test(mainId) ? cleanStarNameCandidate(mainId) : null;
  return properName || star.displayName || star.commonName || cleanStarNameCandidate(mainId) || star.designation;
}

function atlasStarDisplayName(star) {
  const englishName = starDisplayName(star);
  const koreanName = koreanStarName(star);
  return koreanName && koreanName !== englishName ? `${koreanName} (${englishName})` : englishName;
}

function koreanStarName(star) {
  const properName = findKoreanProperName(star);
  if (properName) return properName;
  return bayerKoreanName(star);
}

function findKoreanProperName(star) {
  const names = [star.displayName, star.mainId, ...(star.aliases ?? [])].map(cleanStarNameCandidate);
  for (const name of names) {
    if (KOREAN_PROPER_STAR_NAMES[name]) return KOREAN_PROPER_STAR_NAMES[name];
  }
  return null;
}

function cleanStarNameCandidate(value) {
  return String(value || "")
    .replace(/^NAME\s+/i, "")
    .replace(/^\*\s+/, "")
    .trim();
}

function bayerKoreanName(star) {
  const names = [star.mainId, star.displayName, ...(star.aliases ?? [])].map(cleanStarNameCandidate);
  for (const name of names) {
    const match = /^(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.?|nu\.?|ksi|omi|pi\.?|rho|sig|tau|ups|phi|chi|psi|ome)(\d{1,2})?\s+([A-Z][A-Za-z0-9]{2})(?:\s|$)/i.exec(name);
    if (!match) continue;
    const greekKey = match[1].toLowerCase();
    const greek = GREEK_LETTER_LABELS[greekKey] ?? GREEK_LETTER_LABELS[greekKey.replace(/\.$/, "")];
    const constellation = CONSTELLATION_LABELS[match[3]] ?? CONSTELLATION_LABELS[star.constellationIds?.[0]];
    if (greek && constellation) return `${constellation}자리 ${greek}${match[2] ? Number(match[2]) : ""}별`;
  }
  return null;
}

function subjectMarker(text) {
  const value = String(text || "").trim().replace(/\s*\([^)]*\)\s*$/, "");
  const last = value.at(-1);
  if (!last) return "은";
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? "는" : "은";
  if (/\d/.test(last)) return "013678".includes(last) ? "은" : "는";
  return "는";
}

function formatFriendDistanceAndBrightness(star) {
  const apparentMagnitude = Number(star.gMag);
  const absoluteMagnitude = absoluteMagnitudeFromDistance(apparentMagnitude, Number(star.distanceLy));
  return [
    `거리 ${formatDistance(star.distanceLy)}광년`,
    formatMagnitudeLine("겉보기등급(G)", apparentMagnitude),
    formatMagnitudeLine("절대등급(G)", absoluteMagnitude),
  ].join("\n");
}

function formatAtlasBrightness(star) {
  const apparentMagnitude = Number(star.mag);
  const absoluteMagnitude = absoluteMagnitudeFromParallax(apparentMagnitude, Number(star.parallaxMas));
  return [
    formatMagnitudeLine("겉보기등급(V)", apparentMagnitude),
    formatMagnitudeLine("절대등급(V)", absoluteMagnitude),
  ].join("\n");
}

function formatDistance(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "계산 불가";
}

function formatMagnitudeLine(label, value) {
  return Number.isFinite(value) ? `${label} ${value.toFixed(2)}등급` : `${label} 계산 불가`;
}

function absoluteMagnitudeFromDistance(apparentMagnitude, distanceLy) {
  if (!Number.isFinite(apparentMagnitude) || !Number.isFinite(distanceLy) || distanceLy <= 0) return Number.NaN;
  const distanceParsec = distanceLy / LIGHT_YEARS_PER_PARSEC;
  return apparentMagnitude - 5 * Math.log10(distanceParsec / 10);
}

function absoluteMagnitudeFromParallax(apparentMagnitude, parallaxMas) {
  if (!Number.isFinite(apparentMagnitude) || !Number.isFinite(parallaxMas) || parallaxMas <= 0) return Number.NaN;
  return apparentMagnitude + 5 * Math.log10(parallaxMas) - 10;
}

function requestPaint() {
  if (document.hidden || renderLoopActive) return;
  renderLoopActive = true;
  requestAnimationFrame(draw);
}

function syncClockAndSky() {
  const skyNow = getSkyNow();
  updateClockStatus(skyNow);
  const skyBucket = Math.floor(skyNow.getTime() / 10000);
  if (skyBucket !== lastSkySyncBucket) {
    lastSkySyncBucket = skyBucket;
    skyFrameCache = null;
    requestPaint();
  }
}

function updateClockStatus(skyNow) {
  const secondKey = Math.floor(skyNow.getTime() / 1000);
  if (String(secondKey) === lastClockSecond) return;
  lastClockSecond = String(secondKey);
  clockText.textContent = `하늘 시각 ${skyNow.toLocaleString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
  setTimeStatus("현재 시각과 동기화 중입니다. 하늘을 드래그해 다른 방향을 둘러볼 수 있어요.");
}

function setTimeStatus(message) {
  if (message === timeStatusMessage) return;
  timeStatusMessage = message;
  timeStatus.textContent = message;
}

function draw(perfNow) {
  if (document.hidden) {
    renderLoopActive = false;
    return;
  }

  const frameInterval = viewport.width <= 700 ? 33 : 16;
  if (perfNow - lastPaintAt < frameInterval) {
    requestAnimationFrame(draw);
    return;
  }
  lastPaintAt = perfNow;

  const skyNow = getSkyNow();
  lastSkySyncBucket = Math.floor(skyNow.getTime() / 10000);
  updateClockStatus(skyNow);

  const easing = reducedMotion ? 1 : Math.min(1, (perfNow - animationStart) / 1600);
  const smooth = 1 - Math.pow(1 - easing, 3);
  view = {
    azimuth: lerpAngle(view.azimuth, targetView.azimuth, selected ? 0.035 + smooth * 0.045 : 0.08),
    altitude: lerp(view.altitude, targetView.altitude, selected ? 0.045 + smooth * 0.04 : 0.08),
    zoom: lerp(view.zoom, targetView.zoom, selected ? 0.04 + smooth * 0.05 : 0.08),
  };

  const animating = activePointers.size > 0 || cameraIsSettling() || friendHighlightIsAnimating(perfNow);
  paintSky(skyNow, reducedMotion || !animating ? 0 : perfNow);

  if (animating) {
    requestAnimationFrame(draw);
  } else {
    renderLoopActive = false;
  }
}

function cameraIsSettling() {
  return (
    Math.abs(shortestAngle(targetView.azimuth - view.azimuth)) > 0.03 ||
    Math.abs(targetView.altitude - view.altitude) > 0.03 ||
    Math.abs(targetView.zoom - view.zoom) > 0.003
  );
}

function friendHighlightIsAnimating(perfNow) {
  return !reducedMotion && selected?.type === "friend" && perfNow - animationStart < 4200;
}

function paintSky(skyNow, perfNow) {
  const { width, height } = viewport;
  ctx.clearRect(0, 0, width, height);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, "#05070d");
  skyGradient.addColorStop(0.58, "#101a24");
  skyGradient.addColorStop(1, "#1d201c");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  const camera = getCamera();
  const skyFrame = getSkyFrame(skyNow);
  atlasHitTargets = [];
  drawAtmosphere(camera);
  drawConstellationLines(skyFrame.constellations, camera);
  drawAtlasStars(skyFrame.stars, camera);
  drawFriendStars(skyNow, perfNow, camera);
  drawHorizon(camera);
  drawGroundScene(perfNow);
}

function getSkyFrame(skyNow) {
  const bucketMs = 10000;
  const key = `${Math.floor(skyNow.getTime() / bucketMs)}:${skyAtlas.stars.length}:${skyAtlas.constellations.length}`;
  if (skyFrameCache?.key === key) return skyFrameCache;

  const toHorizontal = makeHorizontalConverter(skyNow);
  const stars = skyAtlas.stars.map((star) => ({
    star,
    horizontal: toHorizontal(star.ra, star.dec),
  }));

  const constellations = skyAtlas.constellations.map((constellation) => ({
    id: constellation.id,
    rank: constellation.rank,
    lines: (constellation.renderLines ?? constellation.lines).map((line) =>
      line.map(([ra, dec]) => toHorizontal(ra, dec)),
    ),
  }));

  skyFrameCache = { key, stars, constellations };
  return skyFrameCache;
}

function makeHorizontalConverter(skyNow) {
  const latitude = Number(OBSERVATORY.latitudeDegrees ?? OBSERVATORY.latitude) * DEG_TO_RAD;
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const lstDegrees = localSiderealTime(skyNow, Number(OBSERVATORY.longitudeDegrees ?? OBSERVATORY.longitude)).degrees;

  return (ra, dec) => {
    const declination = Number(dec) * DEG_TO_RAD;
    const hourAngle = shortestAngle(lstDegrees - Number(ra)) * DEG_TO_RAD;
    const sinDeclination = Math.sin(declination);
    const cosDeclination = Math.cos(declination);
    const sinAltitude = sinDeclination * sinLatitude + cosDeclination * cosLatitude * Math.cos(hourAngle);
    const altitudeDegrees = Math.asin(clamp(sinAltitude, -1, 1)) / DEG_TO_RAD;
    const altitude = altitudeDegrees * DEG_TO_RAD;
    const cosAltitude = Math.max(Math.cos(altitude), 1e-12);
    const sinAzimuth = (-cosDeclination * Math.sin(hourAngle)) / cosAltitude;
    const cosAzimuth = (sinDeclination - Math.sin(altitude) * sinLatitude) / (cosAltitude * cosLatitude);
    const azimuth = normalizeDegrees(Math.atan2(sinAzimuth, cosAzimuth) / DEG_TO_RAD);

    return {
      altitude: altitudeDegrees + atmosphericRefractionDegrees(altitudeDegrees),
      azimuth,
    };
  };
}

function atmosphericRefractionDegrees(altitudeDegrees) {
  if (altitudeDegrees < -1) return 0;
  const denominator = Math.tan((altitudeDegrees + 10.3 / (altitudeDegrees + 5.11)) * DEG_TO_RAD);
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) return 0;
  return (1.02 / denominator) / 60;
}

function prepareSkyAtlas(atlas) {
  return {
    ...atlas,
    constellations: atlas.constellations.map((constellation) => ({
      ...constellation,
      renderLines: constellation.lines.map(densifyConstellationLine),
    })),
  };
}
function densifyConstellationLine(line) {
  if (!Array.isArray(line) || line.length < 2) return line;

  const points = [line[0]];
  for (let index = 1; index < line.length; index += 1) {
    const [fromRa, fromDec] = line[index - 1];
    const [toRa, toDec] = line[index];
    const raDelta = shortestAngle(Number(toRa) - Number(fromRa));
    const decDelta = Number(toDec) - Number(fromDec);
    const averageDec = ((Number(fromDec) + Number(toDec)) / 2) * DEG_TO_RAD;
    const angularSpan = Math.hypot(raDelta * Math.cos(averageDec), decDelta);
    const steps = clamp(Math.ceil(angularSpan / 2.5), 1, 18);

    for (let step = 1; step <= steps; step += 1) {
      const amount = step / steps;
      points.push([
        normalizeDegrees(Number(fromRa) + raDelta * amount),
        Number(fromDec) + decDelta * amount,
      ]);
    }
  }

  return points;
}

function getCamera() {
  const forward = vectorFromHorizontal(view.azimuth, view.altitude);
  let right = normalizeVector({
    x: Math.cos(view.azimuth * DEG_TO_RAD),
    y: 0,
    z: -Math.sin(view.azimuth * DEG_TO_RAD),
  });
  if (!Number.isFinite(right.x)) right = { x: 1, y: 0, z: 0 };
  const up = normalizeVector(cross(forward, right));
  const fov = clamp(76 / Math.sqrt(view.zoom), 22, 82) * DEG_TO_RAD;
  const focal = Math.min(viewport.width, viewport.height) / (2 * Math.tan(fov / 2));

  return {
    forward,
    right,
    up,
    focal,
    centerX: viewport.width / 2,
    centerY: viewport.height / 2,
  };
}

function drawAtmosphere(camera) {
  const zenith = projectHorizontal({ azimuth: view.azimuth, altitude: 90 }, camera, 0);
  const glow = ctx.createRadialGradient(
    zenith.visible ? zenith.x : viewport.width / 2,
    zenith.visible ? zenith.y : viewport.height * 0.2,
    20,
    viewport.width / 2,
    viewport.height / 2,
    Math.max(viewport.width, viewport.height) * 0.8,
  );
  glow.addColorStop(0, "rgba(49, 72, 94, 0.22)");
  glow.addColorStop(0.55, "rgba(35, 60, 64, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawConstellationLines(constellations, camera) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const constellation of constellations) {
    if (!shouldDrawConstellation(constellation)) continue;

    let labelPoint = null;
    const alpha = constellationLineAlpha(constellation.rank);
    ctx.strokeStyle = `rgba(141, 216, 193, ${alpha})`;
    ctx.lineWidth = constellation.rank <= 1 ? 0.95 : 0.72;

    for (const line of constellation.lines) {
      drawProjectedPolyline(line, camera, (point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });

      for (const horizontal of line) {
        if (labelPoint || horizontal.altitude < 14) continue;
        const projected = projectHorizontal(horizontal, camera, 120);
        if (projected.visible) labelPoint = projected;
      }
    }

    if (labelPoint && shouldDrawConstellationLabel(constellation) && CONSTELLATION_LABELS[constellation.id]) {
      ctx.fillStyle = "rgba(199, 224, 209, 0.58)";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillText(CONSTELLATION_LABELS[constellation.id], labelPoint.x + 8, labelPoint.y - 8);
    }
  }

  ctx.restore();
}

function shouldDrawConstellation(constellation) {
  if (view.zoom < 1.45) return constellation.rank <= 1;
  if (view.zoom < 2.35) return constellation.rank <= 2;
  return true;
}

function shouldDrawConstellationLabel(constellation) {
  if (view.zoom < 1.65) return constellation.rank <= 1;
  if (view.zoom < 2.5) return constellation.rank <= 2;
  return constellation.rank <= 3;
}

function constellationLineAlpha(rank) {
  if (rank <= 1) return view.zoom < 1.45 ? 0.24 : 0.3;
  if (rank === 2) return 0.15;
  return 0.09;
}

function drawProjectedPolyline(line, camera, drawPoint) {
  let indexInSegment = 0;

  function finishSegment() {
    if (indexInSegment > 1) ctx.stroke();
    indexInSegment = 0;
  }

  for (const horizontal of line) {
    if (horizontal.altitude < -0.25) {
      finishSegment();
      continue;
    }

    const point = projectHorizontal(horizontal, camera, 240);
    if (!point.visible) {
      finishSegment();
      continue;
    }

    if (indexInSegment === 0) ctx.beginPath();
    drawPoint(point, indexInSegment);
    indexInSegment += 1;
  }

  finishSegment();
}

function drawAtlasStars(stars, camera) {
  ctx.save();
  ctx.lineCap = "round";

  const magnitudeLimit = visibleMagnitudeLimit();
  const coarsePointer = isCoarsePointer();
  const minHitRadius = coarsePointer ? 22 : 10;
  const hitPadding = coarsePointer ? 12 : 8;
  let startIndex = stars.length - 1;
  while (startIndex >= 0 && stars[startIndex].star.mag > magnitudeLimit) startIndex -= 1;

  for (let index = startIndex; index >= 0; index -= 1) {
    const { star, horizontal } = stars[index];
    if (horizontal.altitude < 0) continue;
    const point = projectHorizontal(horizontal, camera, 80);
    if (!point.visible) continue;

    const brightness = clamp(6.5 - star.mag, 0.25, 8);
    const radius = clamp(0.28 + brightness * brightness * 0.14, 0.32, 5.8) * Math.sqrt(view.zoom);
    const color = starColor(star.bv);

    ctx.globalAlpha = clamp(horizontal.altitude / 28, 0.18, star.mag < 2 ? 1 : 0.9);
    ctx.shadowBlur = star.mag < 1.5 ? 10 + (1.5 - star.mag) * 4 : 0;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (star.clickable) {
      atlasHitTargets.push({
        star,
        horizontal,
        x: point.x,
        y: point.y,
        radius: Math.max(minHitRadius, radius + hitPadding),
      });
    }

    if (selected?.type === "atlas" && selected.star.id === star.id) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255, 245, 199, 0.9)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function visibleMagnitudeLimit() {
  if (view.zoom < 1.4) return 4.95;
  if (view.zoom < 2.2) return 5.55;
  return 6.25;
}

function drawFriendStars(skyNow, perfNow, camera) {
  if (!selected || selected.type !== "friend") return;

  const horizontal = equatorialToHorizontal(selected.star, OBSERVATORY, skyNow);
  drawFriendStar(selected.star, horizontal, true, perfNow, camera);
}

function drawHorizon(camera) {
  ctx.save();
  ctx.strokeStyle = "rgba(229, 219, 192, 0.38)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  let drawing = false;

  for (const azimuth of HORIZON_SAMPLES) {
    const point = projectHorizontal({ azimuth, altitude: 0 }, camera, 400);
    if (!point.visible) {
      drawing = false;
      continue;
    }
    if (drawing) ctx.lineTo(point.x, point.y);
    else ctx.moveTo(point.x, point.y);
    drawing = true;
  }
  ctx.stroke();

  ctx.fillStyle = "rgba(232, 221, 194, 0.74)";
  ctx.font = `${Math.max(12, Math.min(15, viewport.width * 0.015))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  [
    ["북", 0],
    ["동", 90],
    ["남", 180],
    ["서", 270],
  ].forEach(([label, azimuth]) => {
    const point = projectHorizontal({ azimuth, altitude: -2 }, camera, 60);
    if (point.visible) ctx.fillText(label, point.x, point.y + 22);
  });
  ctx.restore();
}

function drawGroundScene(perfNow) {
  const { width, height } = viewport;
  const groundTop = height * 0.86;
  const gradient = ctx.createLinearGradient(0, groundTop, 0, height);
  gradient.addColorStop(0, "#263126");
  gradient.addColorStop(0.5, "#1b241b");
  gradient.addColorStop(1, "#0d110d");

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, groundTop + 8);
  ctx.quadraticCurveTo(width * 0.22, groundTop - 10, width * 0.5, groundTop + 4);
  ctx.quadraticCurveTo(width * 0.74, groundTop + 16, width, groundTop - 5);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawGrass(width, height, perfNow);
}

function drawGrass(width, height, perfNow) {
  const count = Math.floor(width / 34);
  ctx.save();
  ctx.strokeStyle = "rgba(104, 133, 93, 0.38)";
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i += 1) {
    const x = i * 34 + ((i * 17) % 13);
    const base = height - 8 - ((i * 7) % 18);
    const sway = perfNow ? Math.sin(perfNow / 900 + i) * 2 : 0;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x + sway, base - 10 - (i % 7));
    ctx.stroke();
  }
  ctx.restore();
}

function drawFriendStar(star, horizontal, active, perfNow, camera) {
  if (horizontal.altitude < 0) return;

  const point = projectHorizontal(horizontal, camera, 100);
  if (!point.visible) return;

  const baseSize = clamp(8.5 - star.gMag * 0.72, 1.2, 5.2);
  const pulse = active ? (perfNow ? 1.2 + Math.sin(perfNow / 180) * 0.28 : 1.08) : 1;
  const radius = baseSize * Math.sqrt(view.zoom) * pulse;
  const color = starColor(star.bpRp);

  ctx.save();
  ctx.globalAlpha = active ? 1 : clamp((horizontal.altitude + 8) / 30, 0.25, 0.8);
  ctx.shadowBlur = active ? 32 : 8;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (active) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 245, 199, 0.88)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 248, 220, 0.96)";
    ctx.font = `600 ${Math.max(14, Math.min(18, viewport.width * 0.016))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(starDisplayName(star), point.x, Math.max(36, point.y - radius - 24));
  }
  ctx.restore();
}

function projectHorizontal(horizontal, camera, margin = 80) {
  const vector = vectorFromHorizontal(horizontal.azimuth, horizontal.altitude);
  const depth = dot(vector, camera.forward);
  if (depth <= 0.04) return { visible: false, x: 0, y: 0, depth };

  const x = camera.centerX + (dot(vector, camera.right) / depth) * camera.focal;
  const y = camera.centerY - (dot(vector, camera.up) / depth) * camera.focal;
  return {
    x,
    y,
    depth,
    visible: x > -margin && x < viewport.width + margin && y > -margin && y < viewport.height + margin,
  };
}

function vectorFromHorizontal(azimuth, altitude) {
  const az = azimuth * DEG_TO_RAD;
  const alt = altitude * DEG_TO_RAD;
  const cosAlt = Math.cos(alt);
  return {
    x: cosAlt * Math.sin(az),
    y: Math.sin(alt),
    z: cosAlt * Math.cos(az),
  };
}

function starColorDescription(colorIndex) {
  const value = Number(colorIndex);
  if (!Number.isFinite(value)) return "색 정보 없음";
  if (value < 0.1) return "푸른빛이 도는 뜨거운 별";
  if (value < 0.8) return "흰빛 또는 옅은 노란빛의 별";
  if (value < 1.5) return "노란빛이 따뜻한 별";
  if (value < 2.8) return "주황빛이 강한 차가운 별";
  return "붉은빛이 도는 매우 차가운 별";
}

function starColor(colorIndex) {
  const value = Number(colorIndex);
  if (!Number.isFinite(value)) return "#fff7df";
  if (value < 0.1) return "#d8f0ff";
  if (value < 0.8) return "#fff7df";
  if (value < 1.5) return "#ffd88f";
  if (value < 2.8) return "#ffad6c";
  return "#ff7b66";
}

function scheduleResizeCanvas() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(resizeCanvas, 80);
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(window.visualViewport?.width ?? window.innerWidth));
  const height = Math.max(1, Math.round(window.visualViewport?.height ?? window.innerHeight));
  const pixelWidth = Math.floor(width * dpr);
  const pixelHeight = Math.floor(height * dpr);

  if (canvas.width === pixelWidth && canvas.height === pixelHeight && viewport.width === width && viewport.height === height) {
    return;
  }

  viewport = { width, height };
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  requestPaint();
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function lerpAngle(start, end, amount) {
  return start + shortestAngle(end - start) * amount;
}

function shortestAngle(angle) {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

