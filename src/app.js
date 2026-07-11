import { DATASET_META, OBSERVATORY } from "./data.js";
import {
  calculateDetailedAge,
  clamp,
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
const candidateList = document.querySelector("#candidateList");
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
const brightnessFact = document.querySelector("#brightnessFact");
const directionFact = document.querySelector("#directionFact");
const factLabels = [...document.querySelectorAll(".fact-grid dt")];
const scienceNote = document.querySelector("#scienceNote");
const resetView = document.querySelector("#resetView");
const helpButton = document.querySelector("#helpButton");
const skyBackgroundToggle = document.querySelector("#skyBackgroundToggle");
const skyBackgroundState = document.querySelector("#skyBackgroundState");
const skyGridToggle = document.querySelector("#skyGridToggle");
const skyGridState = document.querySelector("#skyGridState");
const helpOverlay = document.querySelector("#helpOverlay");
const helpClose = document.querySelector("#helpClose");
const modeButtons = [...document.querySelectorAll(".mode-button")];

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const LIGHT_YEARS_PER_PARSEC = 3.261563777;
const MAX_BIRTHDAY_AGE = 120;
const FRIEND_ATLAS_MATCH_MAX_DEGREES = 0.06;
const VISIBLE_FRIEND_ALTITUDE_MIN = 0;
const MIN_VIEW_ALTITUDE = 6;
const MAX_VIEW_ALTITUDE = 88;
const HORIZON_SAMPLES = Array.from({ length: 181 }, (_, index) => index * 2);
const LANDSCAPE_SAMPLES = Array.from({ length: 121 }, (_, index) => -120 + index * 2);
const LANDSCAPE_PROJECTION_MARGIN = 720;
const LANDSCAPE_ALPHA_MASK_WIDTH = 1024;
const LANDSCAPE_ALPHA_THRESHOLD = 36;
const OCCLUDED_LANDSCAPE_OPACITY = 0.22;
const PANORAMA_IMAGE_URL = new URL("../assets/incheon-observatory-panorama.png", import.meta.url).href;
const PANORAMA_AZIMUTH_OFFSET = 0;
const PANORAMA_HORIZON_SOURCE_RATIO = 0.48;
const OBSERVATORY_HILL_AZIMUTH = 185;
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
  Acamar: "아카마르",
  Achernar: "아케르나르",
  Acrux: "아크룩스",
  Acubens: "아쿠벤스",
  Adhafera: "아드하페라",
  Adhara: "아다라",
  Agena: "아게나",
  Ahadi: "아하디",
  Ain: "아인",
  Albali: "알발리",
  Albereo: "알비레오",
  Albireo: "알비레오",
  Alcaid: "알카이드",
  Alchiba: "알키바",
  Alcor: "알코르",
  Alcyone: "알키오네",
  Aldebaran: "알데바란",
  Alderamin: "알데라민",
  Aldhanab: "알다나브",
  Aldhibah: "알디바",
  Alfirk: "알피르크",
  Algedi: "알게디",
  Algenib: "알게니브",
  Algieba: "알기에바",
  Algol: "알골",
  "Algol A": "알골 A",
  "Algol B": "알골 B",
  "Algol C": "알골 C",
  Algorab: "알고라브",
  Alhena: "알헤나",
  Alioth: "알리오트",
  Alkaid: "알카이드",
  Alkes: "알케스",
  Almach: "알마크",
  Alnair: "알나이르",
  Alnasl: "알나슬",
  Alnilam: "알닐람",
  Alnitak: "알니탁",
  Alphard: "알파르드",
  Alphecca: "알페카",
  Alpheratz: "알페라츠",
  Alpherg: "알페르그",
  Alrescha: "알레샤",
  Alsciaukat: "알시아우카트",
  Alshain: "알샤인",
  Altair: "알타이르",
  Altais: "알타이스",
  Altaleban: "알탈레반",
  Altarf: "알타르프",
  Aludra: "알루드라",
  Ancha: "안카",
  Ankaa: "안카",
  Anser: "안세르",
  Antares: "안타레스",
  Arcturus: "아크투루스",
  "Arkab Posterior": "아르카브 포스테리어",
  Arneb: "아르네브",
  Ascella: "아스셀라",
  "Asellus Australis": "아셀루스 아우스트랄리스",
  "Asellus Borealis": "아셀루스 보레알리스",
  Aspidiske: "아스피디스케",
  Atik: "아티크",
  Atlas: "아틀라스",
  Atria: "아트리아",
  Avior: "아비오르",
  Azha: "아자",
  "Barnard's star": "바너드별",
  "Baten Kaitos": "바텐 카이토스",
  Bellatrix: "벨라트릭스",
  Betelgeuse: "베텔게우스",
  Biham: "비함",
  Brachium: "브라키움",
  Canopus: "카노푸스",
  Capella: "카펠라",
  Caph: "카프",
  Castor: "카스토르",
  "Castor AB": "카스토르 AB",
  Cebalrai: "세발라이",
  Chara: "카라",
  Chertan: "체르탄",
  Chow: "차우",
  "Cor Caroli": "코르 카롤리",
  Cursa: "쿠르사",
  Dabih: "다비흐",
  "Dabih Major": "다비흐 메이저",
  Deneb: "데네브",
  "Deneb Algedi": "데네브 알게디",
  Denebola: "데네볼라",
  Diadem: "디아뎀",
  Diphda: "디프다",
  Dschubba: "주바",
  Dubhe: "두베",
  Edasich: "에다시크",
  Elnath: "엘나스",
  Eltanin: "엘타닌",
  Enif: "에니프",
  Errai: "에라이",
  Fomalhaut: "포말하우트",
  Furud: "푸루드",
  Gacrux: "가크룩스",
  "Gamma Cephei": "에라이",
  Giausar: "기아우사르",
  Gienah: "기에나",
  "GJ 273": "루이텐의 별",
  Gomeisa: "고메이사",
  "Gorgonea Tertia": "고르고네아 테르티아",
  Grumium: "그루미엄",
  Gudja: "구자",
  Hadar: "하다르",
  Hadir: "하디르",
  Hamal: "하말",
  Hassaleh: "하살레",
  Heka: "헤카",
  Heze: "헤제",
  Homam: "호맘",
  Imai: "이마이",
  Izar: "이자르",
  Kaffaljidhma: "카팔지드마",
  Kaus: "카우스",
  "Kaus Australis": "카우스 아우스트랄리스",
  "Kaus Borealis": "카우스 보레알리스",
  "Kaus Media": "카우스 메디아",
  Kitalpha: "키탈파",
  Kochab: "코카브",
  Kornephoros: "코르네포로스",
  Kraz: "크라즈",
  Lodestar: "북극성",
  "Luyten's Star": "루이텐의 별",
  Maasym: "마아심",
  Mahasim: "마하심",
  Markab: "마르카브",
  Markeb: "마르케브",
  Matar: "마타르",
  Mebsuta: "메브수타",
  Megrez: "메그레즈",
  Meissa: "메이사",
  Mekbuda: "메크부다",
  Menkalinan: "멘칼리난",
  Menkar: "멘카르",
  Menkent: "멘켄트",
  Menkhib: "멘키브",
  Menkib: "멘키브",
  Merak: "메라크",
  Mesarthim: "메사르팀",
  Miaplacidus: "미아플라키두스",
  Mimosa: "미모사",
  Minelauva: "미넬라우바",
  Minkar: "민카르",
  Mintaka: "민타카",
  Mirach: "미라크",
  Miram: "미람",
  Mirfak: "미르파크",
  Mirzam: "미르잠",
  Mizar: "미자르",
  Mothallah: "모탈라",
  Muliphein: "물리페인",
  Muphrid: "무프리드",
  Muscida: "무스키다",
  Naos: "나오스",
  Nashira: "나시라",
  Nekkar: "네카르",
  Nihal: "니할",
  "North Star": "북극성",
  Nunki: "눈키",
  Nusakan: "누사칸",
  Paikauhale: "파이카우할레",
  Peacock: "피콕",
  Phact: "팍트",
  Phecda: "페크다",
  Pherkad: "페르카드",
  Polaris: "북극성",
  Polis: "폴리스",
  Pollux: "폴룩스",
  Porrima: "포리마",
  Praecipua: "프라이시푸아",
  "Prima Hyadum": "프리마 히아둠",
  Procyon: "프로키온",
  "Procyon A": "프로키온 A",
  Propus: "프로푸스",
  "Proxima Centauri": "프록시마 센타우리",
  Ran: "란",
  Rana: "라나",
  Rasalas: "라살라스",
  Rasalgethi: "라살게티",
  Rasalhague: "라살하게",
  Rastaban: "라스타반",
  Regor: "레고르",
  Regulus: "레굴루스",
  Rigel: "리겔",
  "Rigel Kentaurus": "리겔 켄타우루스",
  Rigil: "리길",
  "Rigil Kentaurus": "리길 켄타우루스",
  Rotanev: "로타네브",
  Ruchbah: "루크바",
  Rukbat: "루크바트",
  Sabik: "사비크",
  Sadachbia: "사다크비아",
  Sadalbari: "사달바리",
  Sadalmelik: "사달멜리크",
  Sadalsuud: "사달수드",
  Sadr: "사드르",
  Saiph: "사이프",
  Sargas: "사르가스",
  Sarin: "사린",
  Sceptrum: "셉트룸",
  Scheat: "셰아트",
  Schedar: "셰다르",
  "Secunda Hyadum": "세쿤다 히아둠",
  Segin: "세긴",
  Seginus: "세기누스",
  Sham: "샴",
  Shaula: "샤울라",
  Sheliak: "셸리아크",
  Sheratan: "셰라탄",
  Sirius: "시리우스",
  "Sirius A": "시리우스 A",
  Sirrah: "시라",
  Skat: "스카트",
  Spica: "스피카",
  Sualocin: "수알로신",
  Suhail: "수하일",
  Sulafat: "술라파트",
  Syrma: "시르마",
  Tabit: "타비트",
  Taiyangshou: "타이양쇼우",
  Taleban: "탈레반",
  Talitha: "탈리타",
  "Tania Australis": "타니아 아우스트랄리스",
  "Tania Borealis": "타니아 보레알리스",
  Tarazed: "타라제드",
  "Teegarden's Star": "티가든의 별",
  Tejat: "테잣트",
  Theemin: "테민",
  Thuban: "투반",
  Toliman: "톨리만",
  Torcular: "토르쿨라르",
  Tureis: "투레이스",
  Tyl: "틸",
  Unukalhai: "우누칼하이",
  Vega: "베가",
  Vindemiatrix: "빈데미아트릭스",
  Wasat: "와사트",
  Wazn: "와즌",
  Wezen: "웨젠",
  "Wolf 359": "울프 359",
  "Yed Posterior": "예드 포스터리어",
  Yildun: "일둔",
  Zibal: "지발",
  Zosma: "조스마",
  Zubenelgenubi: "주베넬게누비",
  Zubeneschamali: "주벤에샤마리",
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
let friendCandidates = [];
let activeTargetAge = null;
let animationStart = 0;
let view = { azimuth: 180, altitude: 35, zoom: 1 };
let targetView = { azimuth: 180, altitude: 35, zoom: 1 };
let showLandscape = true;
let landscapeAutoDimmed = false;
let showHorizonGrid = false;
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let viewport = { width: window.innerWidth, height: window.innerHeight };
let skyAtlas = { stars: [], constellations: [] };
let nearbyStars = [];
let nearbyMeta = null;
let nearbyStarsPromise = null;
let skyFrameCache = null;
let horizonPanoramaImage = null;
let horizonPanoramaReady = false;
let horizonPanoramaRenderer = null;
let horizonPanoramaAlphaMask = null;
let dragState = null;
let pinchState = null;
let activePointers = new Map();
let atlasHitTargets = [];
let constellationLineStarIdentifierIndex = { source: null, byIdentifier: new Map() };
let preferredBirthDay = null;
let lastPaintAt = 0;
let renderLoopActive = false;
let resizeTimer = null;
let lastClockSecond = "";
let timeStatusMessage = "";
let lastSkySyncBucket = -1;
let helpLastFocus = null;

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
loadLandscapePanorama();
scheduleNearbyStarPrefetch();
attachSkyControls();
populateBirthdayInputs();
syncClockAndSky();
helpButton?.addEventListener("click", () => openHelpOverlay());
skyBackgroundToggle?.addEventListener("change", () => {
  showLandscape = skyBackgroundToggle.checked;
  if (!showLandscape) landscapeAutoDimmed = false;
  updateLandscapeControl();
  requestPaint();
});
skyGridToggle?.addEventListener("change", () => {
  showHorizonGrid = skyGridToggle.checked;
  if (skyGridState) skyGridState.textContent = showHorizonGrid ? "ON" : "OFF";
  skyGridToggle.closest(".sky-toggle")?.classList.toggle("active", showHorizonGrid);
  requestPaint();
});
helpOverlay?.addEventListener("click", (event) => {
  if (event.target.closest("[data-help-close]")) closeHelpOverlay();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && helpOverlay && !helpOverlay.classList.contains("hidden")) {
    closeHelpOverlay();
  }
});

function openHelpOverlay() {
  if (!helpOverlay) return;
  helpLastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  helpOverlay.classList.remove("hidden");
  helpButton?.setAttribute("aria-expanded", "true");
  helpClose?.focus({ preventScroll: true });
}

function closeHelpOverlay() {
  if (!helpOverlay) return;
  helpOverlay.classList.add("hidden");
  helpButton?.setAttribute("aria-expanded", "false");
  helpLastFocus?.focus?.({ preventScroll: true });
}

function updateLandscapeControl() {
  const control = skyBackgroundToggle?.closest(".sky-background-toggle");
  control?.classList.toggle("active", showLandscape);
  control?.classList.toggle("auto-dimmed", showLandscape && landscapeAutoDimmed);
  if (skyBackgroundState) {
    skyBackgroundState.textContent = !showLandscape ? "OFF" : landscapeAutoDimmed ? "옅게" : "ON";
  }
}

function setLandscapeAutoDimmed(dimmed) {
  const nextValue = Boolean(showLandscape && dimmed);
  if (nextValue === landscapeAutoDimmed) return;
  landscapeAutoDimmed = nextValue;
  updateLandscapeControl();
}

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

function showResultSheet(options = {}) {
  document.body.classList.add("has-result");
  if (!options.preserveScroll) resetPanelScroll(resultPanel);
}

function showInputSheet() {
  document.body.classList.remove("has-result");
  resultPanel?.classList.remove("friend-result");
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
    resultTitle.textContent = "별빛 친구를 찾고 있어요";
    resultSummary.textContent = "120광년 이내 실제 별 데이터를 불러와 나이와 가장 가까운 별을 계산하고 있습니다.";
    ageFact.textContent = "계산 중";
    distanceFact.textContent = "계산 중";
    brightnessFact.textContent = "계산 중";
    directionFact.textContent = "계산 중";

    const candidates = await loadNearbyStars();
    friendCandidates = chooseFriendStarCandidates(candidates, OBSERVATORY, targetAgeYears, skyNow);
    activeTargetAge = targetAgeYears;
    selectFriendCandidate(friendCandidates[0], targetAgeYears);
  } catch (error) {
    resultTitle.textContent = "입력값을 확인해 주세요";
    resultSummary.textContent = error.message;
  }
});

resetView.addEventListener("click", () => {
  selected = null;
  friendCandidates = [];
  activeTargetAge = null;
  renderFriendCandidateList([]);
  animationStart = performance.now();
  targetView = { azimuth: 180, altitude: 35, zoom: 1 };
  showInputSheet();
  setFactLabels();
  resultTitle.textContent = "인천 하늘 전체 보기";
  resultSummary.textContent =
    "하늘을 마우스나 손가락으로 드래그하면 북쪽, 동쪽, 서쪽도 둘러볼 수 있습니다.";
  ageFact.textContent = "-";
  distanceFact.textContent = "-";
  brightnessFact.textContent = "-";
  directionFact.textContent = "-";
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

function loadLandscapePanorama() {
  const image = new Image();
  horizonPanoramaImage = image;
  image.decoding = "async";
  image.onload = () => {
    horizonPanoramaReady = true;
    horizonPanoramaRenderer = createPanoramaRenderer(image);
    horizonPanoramaAlphaMask = createPanoramaAlphaMask(image);
    requestPaint();
  };
  image.onerror = () => {
    horizonPanoramaReady = false;
    horizonPanoramaRenderer = null;
    horizonPanoramaAlphaMask = null;
    requestPaint();
  };
  image.src = PANORAMA_IMAGE_URL;
}

function createPanoramaAlphaMask(image) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return null;

  const width = Math.min(LANDSCAPE_ALPHA_MASK_WIDTH, sourceWidth);
  const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * width));
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
  if (!maskContext) return null;

  try {
    maskContext.drawImage(image, 0, 0, width, height);
    const pixels = maskContext.getImageData(0, 0, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let index = 0; index < alpha.length; index += 1) {
      alpha[index] = pixels[index * 4 + 3];
    }
    return { width, height, alpha, sourceWidth, sourceHeight };
  } catch {
    return null;
  }
}

async function loadSkyAtlas() {
  try {
    const response = await fetch(new URL("../data/sky-atlas.json?v=stellarium-western-1", import.meta.url));
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
    targetView.altitude = clamp(dragState.altitude + dy * sensitivity, MIN_VIEW_ALTITUDE, MAX_VIEW_ALTITUDE);
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

function setFactLabels(labels = ["나의 나이", "거리", "밝기", "지금 방향"]) {
  labels.forEach((label, index) => {
    if (factLabels[index]) factLabels[index].textContent = label;
  });
}

function selectFriendCandidate(candidate, targetAgeYears = activeTargetAge, options = {}) {
  if (!candidate) return;
  selected = { ...candidate, type: "friend" };
  activeTargetAge = targetAgeYears;
  animationStart = performance.now();
  targetView = {
    azimuth: selected.horizontal.azimuth,
    altitude: clamp(selected.horizontal.altitude, 12, 82),
    zoom: selected.horizontal.altitude > 0 ? 4.8 : 3,
  };
  requestPaint();
  updateResult(selected, targetAgeYears, options);
}

function chooseFriendStarCandidates(stars, location = OBSERVATORY, targetAge = 0, date = new Date()) {
  if (!Array.isArray(stars) || stars.length === 0) {
    throw new RangeError("stars must contain at least one star.");
  }

  const targetYears = targetAgeToYears(targetAge);
  const scored = stars
    .map((star, index) => scoreFriendCandidate(star, index, location, targetYears, date))
    .filter(Boolean)
    .sort((a, b) => a.ageGap - b.ageGap || a.score - b.score || a.index - b.index);
  const visibleScored = scored.filter((candidate) => candidate.horizontal.altitude >= VISIBLE_FRIEND_ALTITUDE_MIN);
  if (visibleScored.length === 0) {
    throw new RangeError("지금 인천 하늘 위에 있는 별빛 친구 후보를 찾지 못했습니다.");
  }

  const selectedItems = [];
  const addCandidate = (candidate, role) => {
    if (!candidate) return;
    const existing = selectedItems.find((item) => friendCandidateIdentityKey(item) === friendCandidateIdentityKey(candidate));
    if (existing) {
      if (!existing.roles.includes(role)) existing.roles.push(role);
      return;
    }
    selectedItems.push({ ...candidate, roles: [role] });
  };

  addCandidate(chooseConstellationLineCandidate(visibleScored, location, targetYears, date), "별자리 별 후보");
  addCandidate(visibleScored[0], "가장 가까운 후보");

  for (const candidate of visibleScored) {
    if (selectedItems.length >= 3) break;
    if (selectedItems.some((item) => friendCandidateIdentityKey(item) === friendCandidateIdentityKey(candidate))) continue;
    const hasNextRole = selectedItems.some((item) => item.roles.includes("다음 가까운 후보"));
    addCandidate(candidate, hasNextRole ? "그다음 가까운 후보" : "다음 가까운 후보");
  }

  return selectedItems.slice(0, 3).map((candidate, index) => ({ ...candidate, candidateIndex: index }));
}

function scoreFriendCandidate(star, index, location, targetYears, date) {
  const horizontal = equatorialToHorizontal(star, location, date);
  const distanceLy = Number(star.distanceLy ?? star.distance ?? 0);
  if (!Number.isFinite(distanceLy) || distanceLy <= 0) return null;

  const ageGap = Math.abs(distanceLy - targetYears);
  const skyPenalty = horizontal.altitude > 10 ? 0 : horizontal.altitude > 0 ? 0.25 : 1.25;
  const brightnessPenalty = clamp(Number(star.gMag ?? star.magnitude ?? 8) - 8, 0, 6) * 0.035;
  return {
    star,
    horizontal,
    ageGap,
    score: ageGap + skyPenalty + brightnessPenalty,
    index,
  };
}

function chooseConstellationLineCandidate(scored, location, targetYears, date) {
  let best = null;
  const consider = (candidate) => {
    if (!candidate) return;
    if (
      !best ||
      candidate.constellationScore < best.constellationScore ||
      (candidate.constellationScore === best.constellationScore && candidate.index < best.index)
    ) {
      best = candidate;
    }
  };

  for (const candidate of scored) {
    const atlasStar = findConstellationLineCounterpart(candidate.star);
    if (!isConstellationLineStar(atlasStar)) continue;
    consider(withConstellationLineMatch(candidate, atlasStar));
  }

  for (const [index, atlasStar] of (skyAtlas.stars ?? []).entries()) {
    consider(scoreAtlasLineCandidate(atlasStar, index, location, targetYears, date));
  }

  return best;
}

function withConstellationLineMatch(candidate, atlasStar) {
  const constellationMatch = constellationLineMatch(atlasStar);
  const constellationScore = constellationCandidateScore(candidate, atlasStar);
  return { ...candidate, constellationMatch, atlasStar, constellationScore };
}

function scoreAtlasLineCandidate(atlasStar, index, location, targetYears, date) {
  if (!isConstellationLineStar(atlasStar)) return null;
  const distanceLy = atlasDistanceLy(atlasStar);
  if (!Number.isFinite(distanceLy) || distanceLy <= 0 || distanceLy > MAX_BIRTHDAY_AGE) return null;

  const star = friendStarFromAtlasLine(atlasStar, distanceLy);
  const horizontal = equatorialToHorizontal(star, location, date);
  if (horizontal.altitude < VISIBLE_FRIEND_ALTITUDE_MIN) return null;

  const ageGap = Math.abs(distanceLy - targetYears);
  const candidate = {
    star,
    horizontal,
    ageGap,
    score: ageGap,
    index: 100000 + index,
    constellationMatch: constellationLineMatch(atlasStar),
    atlasStar,
  };
  return { ...candidate, constellationScore: constellationCandidateScore(candidate, atlasStar) };
}

function friendStarFromAtlasLine(atlasStar, distanceLy = atlasDistanceLy(atlasStar)) {
  return {
    sourceId: `atlas-line-${atlasStar.id}`,
    designation: atlasStar.mainId || atlasStar.displayName || `HIP ${atlasStar.id}`,
    displayName: atlasStar.displayName,
    mainId: atlasStar.mainId,
    aliases: atlasStar.aliases ?? [],
    named: true,
    ra: atlasStar.ra,
    dec: atlasStar.dec,
    distanceLy,
    gMag: atlasStar.mag,
    bpRp: atlasStar.bv,
    bv: atlasStar.bv,
    fromAtlasLine: true,
    atlasStar,
  };
}

function constellationCandidateScore(candidate, atlasStar) {
  const altitudePenalty = candidate.horizontal.altitude > 10 ? 0 : 0.2;
  const brightnessPenalty = clamp(Number(atlasStar.mag ?? candidate.star.gMag ?? 6) - 3, 0, 5) * 0.03;
  return candidate.ageGap + altitudePenalty + brightnessPenalty;
}

function isConstellationLineStar(star) {
  return Boolean(star?.clickable && Array.isArray(star.constellationIds) && star.constellationIds.length > 0);
}

function findConstellationLineCounterpart(star) {
  const identifiers = starIdentifierSet(star);
  if (!identifiers.size) return null;

  const { byIdentifier } = constellationLineStarIndex();
  const ra = Number(star.ra ?? star.raDegrees);
  const dec = Number(star.dec ?? star.decDegrees);
  let best = null;

  for (const identifier of identifiers) {
    const matches = byIdentifier.get(identifier);
    if (!matches) continue;

    for (const atlasStar of matches) {
      const separation = angularSeparationDegrees(ra, dec, Number(atlasStar.ra), Number(atlasStar.dec));
      if (!Number.isFinite(separation) || separation > 0.25) continue;
      if (!best || separation < best.separation) best = { star: atlasStar, separation };
    }
  }

  return best?.star ?? null;
}

function constellationLineStarIndex() {
  if (constellationLineStarIdentifierIndex.source === skyAtlas.stars) return constellationLineStarIdentifierIndex;

  const byIdentifier = new Map();
  for (const atlasStar of skyAtlas.stars ?? []) {
    if (!isConstellationLineStar(atlasStar)) continue;
    for (const identifier of starIdentifierSet(atlasStar)) {
      if (!byIdentifier.has(identifier)) byIdentifier.set(identifier, []);
      byIdentifier.get(identifier).push(atlasStar);
    }
  }

  constellationLineStarIdentifierIndex = { source: skyAtlas.stars, byIdentifier };
  return constellationLineStarIdentifierIndex;
}

function constellationLineMatch(atlasStar) {
  const constellationId = atlasStar.constellationIds?.[0];
  return {
    star: atlasStar,
    separationDegrees: 0,
    exact: true,
    constellationId,
    constellationName: CONSTELLATION_LABELS[constellationId] ?? constellationId ?? "별자리",
  };
}

function targetAgeToYears(age) {
  if (Number.isFinite(Number(age))) return Number(age);
  if (Number.isFinite(Number(age?.decimalYears))) return Number(age.decimalYears);
  if (Number.isFinite(Number(age?.totalDays))) return Number(age.totalDays) / 365.2425;
  return Number(age?.years ?? 0) + Number(age?.months ?? 0) / 12 + Number(age?.days ?? 0) / 365.2425;
}

function friendCandidateKey(star) {
  return String(star?.sourceId ?? star?.designation ?? star?.id ?? "");
}

function friendCandidateIdentityKey(candidate) {
  const atlasStar = candidate?.atlasStar ?? candidate?.star?.atlasStar;
  if (atlasStar?.id) return `atlas:${atlasStar.id}`;
  return `star:${friendCandidateKey(candidate?.star)}`;
}

function renderFriendCandidateList(candidates = [], activeMatch = selected) {
  if (!candidateList) return;
  candidateList.replaceChildren();
  candidateList.classList.toggle("hidden", candidates.length === 0);
  if (!candidates.length) return;

  const activeKey = friendCandidateIdentityKey(activeMatch);
  candidates.forEach((candidate, index) => {
    const card = document.createElement("article");
    card.className = "candidate-card";
    card.dataset.index = String(index);
    if (friendCandidateIdentityKey(candidate) === activeKey) card.classList.add("active");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "candidate-card-button";
    button.setAttribute("aria-pressed", String(friendCandidateIdentityKey(candidate) === activeKey));

    const badge = document.createElement("span");
    badge.className = "candidate-badge";
    badge.textContent = candidate.roles.join(" · ");

    const title = document.createElement("strong");
    title.textContent = friendStarDisplayName(candidate.star);

    const meta = document.createElement("span");
    meta.className = "candidate-meta";
    meta.textContent = friendCandidateMeta(candidate);

    button.append(badge, title, meta);
    card.append(button);

    if (friendCandidateIdentityKey(candidate) === activeKey) {
      card.append(createCandidateInlineDetails(candidate, activeTargetAge));
    }

    candidateList.append(card);
  });
}

function friendCandidateMeta(candidate) {
  const distance = formatDistance(candidate.star.distanceLy);
  const ageGap = candidate.ageGap.toFixed(2);
  const direction = `${directionLabel(candidate.horizontal.azimuth)}쪽 고도 ${candidate.horizontal.altitude.toFixed(1)}도`;
  const constellation = candidate.constellationMatch
    ? candidate.constellationMatch.exact
      ? ` · ${candidate.constellationMatch.constellationName} 별자리 선`
      : ` · ${candidate.constellationMatch.constellationName} 근처 ${candidate.constellationMatch.separationDegrees.toFixed(1)}도`
    : "";
  return `거리 ${distance}광년 · 차이 ${ageGap}광년 · ${direction}${constellation}`;
}


function createCandidateInlineDetails(candidate, targetAgeYears = activeTargetAge) {
  const details = document.createElement("div");
  details.className = "candidate-inline-details";

  const name = friendStarDisplayName(candidate.star);
  const summary = document.createElement("p");
  summary.className = "candidate-inline-summary";
  summary.textContent = `${name}${subjectMarker(name)} 나이와 별빛 거리 차이가 약 ${candidate.ageGap.toFixed(2)}광년입니다.`;

  const grid = document.createElement("dl");
  grid.className = "candidate-inline-grid";
  const bayer = bayerDesignationInfo(candidate.star.atlasStar ?? candidate.star);
  const bayerRows = bayer ? [["별자리 표기", formatBayerDescription(bayer)]] : [];
  const rows = [
    ...bayerRows,
    ["나의 나이", targetAgeYears != null ? formatAge(targetAgeYears) : "계산 중"],
    ["거리", formatFriendDistance(candidate.star)],
    ["밝기", formatFriendBrightness(candidate.star)],
    ["지금 방향", `${directionLabel(candidate.horizontal.azimuth)}쪽, 고도 ${candidate.horizontal.altitude.toFixed(1)}도`],
  ];

  for (const [label, value] of rows) {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    grid.append(item);
  }

  details.append(summary, grid);
  return details;
}
candidateList?.addEventListener("click", (event) => {
  const button = event.target.closest(".candidate-card");
  if (!button) return;
  const candidate = friendCandidates[Number(button.dataset.index)];
  if (!candidate) return;
  selectFriendCandidate(candidate, activeTargetAge, { preserveScroll: true });
});
function updateAtlasStarResult(selection) {
  resultPanel?.classList.remove("friend-result");
  friendCandidates = [];
  activeTargetAge = null;
  renderFriendCandidateList([]);
  showResultSheet();
  const { star, horizontal } = selection;
  const constellations = star.constellationIds?.map((id) => CONSTELLATION_LABELS[id] ?? id).join(", ") || "별자리 정보 없음";
  const bayer = bayerDesignationInfo(star);
  const name = atlasStarDisplayName(star);

  setFactLabels([bayer ? "별자리 표기" : "별자리", "거리", "밝기", "지금 방향"]);
  resultTitle.textContent = name;
  resultSummary.textContent = atlasStarSummary(star, name, constellations);
  ageFact.textContent = bayer ? formatBayerDescription(bayer) : constellations;
  distanceFact.textContent = formatAtlasDistance(star);
  brightnessFact.textContent = formatAtlasBrightness(star);
  directionFact.textContent = `${directionLabel(horizontal.azimuth)}쪽, 고도 ${horizontal.altitude.toFixed(1)}도`;
  scienceNote.textContent =
    "겉보기 등급은 지구에서 보이는 밝기이고, 절대등급은 별을 10파섹 거리에 둔다고 가정한 실제 밝기입니다. 별자리 선은 Stellarium western의 HIP 연결 자료를 사용합니다.";
}

function updateResult(match, targetAgeYears, options = {}) {
  resultPanel?.classList.add("friend-result");
  showResultSheet({ preserveScroll: options.preserveScroll });
  const { star, horizontal, ageGap } = match;
  renderFriendCandidateList(friendCandidates, match);
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
  distanceFact.textContent = formatFriendDistance(star);
  brightnessFact.textContent = formatFriendBrightness(star);
  directionFact.textContent = `${directionLabel(horizontal.azimuth)}쪽, 고도 ${horizontal.altitude.toFixed(1)}도`;
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
    return `${displayName}${subjectMarker(displayName)} 별자리 표기로는 ${formatBayerDescription(bayer)}입니다. ${atlasBrightnessSentence(star)}`;
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

function formatBayerDescription(bayer) {
  if (!bayer) return "";
  const bayerName = `${bayer.greek}${bayer.number ? Number(bayer.number) : ""}`;
  return `${bayer.constellation}자리 ${bayerName}별`;
}
function atlasBrightnessSentence(star) {
  const magnitude = Number(star.mag);
  if (!Number.isFinite(magnitude)) return "별자리 선에서 다른 별들과 이어져 모양을 잡아 줍니다.";
  if (magnitude <= 1.5) return `겉보기등급 ${magnitude.toFixed(2)}등급으로 맨눈에도 매우 밝게 보이는 별입니다.`;
  if (magnitude <= 3.2) return `겉보기등급 ${magnitude.toFixed(2)}등급으로 별자리 모양을 찾을 때 도움이 되는 밝은 별입니다.`;
  return `겉보기등급 ${magnitude.toFixed(2)}등급으로 별자리 선에서 위치를 잡아 주는 별입니다.`;
}
function friendStarDisplayName(star) {
  const atlasStar = star?.atlasStar ?? findFriendAtlasCounterpart(star);
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
    .replace(/^NAME(?:-IAU)?\s+/i, "")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function starDisplayName(star) {
  const properName = findProperStarName(star);
  const mainId = String(star.mainId || "").trim();
  return properName || star.displayName || star.commonName || cleanStarNameCandidate(mainId) || star.designation;
}

function atlasStarDisplayName(star) {
  const koreanProperName = findKoreanProperName(star);
  const englishProperName = findEnglishProperName(star);
  if (koreanProperName && englishProperName && koreanProperName !== englishProperName) return `${koreanProperName} (${englishProperName})`;
  if (koreanProperName) return koreanProperName;
  if (englishProperName) return englishProperName;

  const englishName = starDisplayName(star);
  const bayerName = bayerKoreanName(star);
  return bayerName && bayerName !== englishName ? `${bayerName} (${englishName})` : englishName;
}

function koreanStarName(star) {
  return findProperStarName(star) || bayerKoreanName(star);
}

function findProperStarName(star) {
  return findKoreanProperName(star) || findEnglishProperName(star);
}

function findKoreanProperName(star) {
  const names = [star.displayName, star.mainId, ...(star.aliases ?? [])].map(cleanStarNameCandidate);
  for (const name of names) {
    for (const variant of properNameLookupVariants(name)) {
      if (KOREAN_PROPER_STAR_NAMES[variant]) return KOREAN_PROPER_STAR_NAMES[variant];
    }
  }
  return null;
}

function findEnglishProperName(star) {
  const names = [star.displayName, star.commonName, star.mainId, ...(star.aliases ?? [])].map(cleanStarNameCandidate);
  for (const name of names) {
    for (const variant of properNameLookupVariants(name)) {
      if (isProperStarNameCandidate(variant)) return variant;
    }
  }
  return null;
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
  const value = String(name || "").trim();
  if (!value) return false;
  if (/^(alf|bet|gam|del|eps|zet|eta|tet|iot|kap|lam|mu\.?|nu\.?|ksi|omi|pi\.?|rho|sig|tau|ups|phi|chi|psi|ome)(\d{1,2})?\s+[A-Z][A-Za-z0-9]{2}(?:\s|$)/i.test(value)) return false;
  if (/^(HR|HD|HIP|TYC|GJ|BD|CD|CPD|CPC|CCDM|ADS|Gaia|2MASS|1RXS|1ES|2E|AG|ASCC|FK5|SAO|BD)\b/i.test(value)) return false;
  if (/^[A-Z]{1,4}[+-]?\d/i.test(value)) return false;
  if (/\d/.test(value)) return false;
  if (/[*_[\]]/.test(value)) return false;
  if (/^[a-z]{1,4}\.?\s+[A-Z][A-Za-z0-9]{2}$/i.test(value)) return false;
  return /[A-Za-z]/.test(value);
}

function cleanStarNameCandidate(value) {
  return String(value || "")
    .replace(/^NAME(?:-IAU)?\s+/i, "")
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

function formatFriendDistance(star) {
  return `${formatDistance(star.distanceLy)}광년`;
}

function formatFriendBrightness(star) {
  const apparentMagnitude = Number(star.gMag);
  const absoluteMagnitude = absoluteMagnitudeFromDistance(apparentMagnitude, Number(star.distanceLy));
  const band = star.fromAtlasLine ? "V" : "G";
  return [
    formatMagnitudeLine(`겉보기등급(${band})`, apparentMagnitude),
    formatMagnitudeLine(`절대등급(${band})`, absoluteMagnitude),
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

function formatAtlasDistance(star) {
  const distanceLy = atlasDistanceLy(star);
  return Number.isFinite(distanceLy) ? `${formatDistance(distanceLy)}광년` : "계산 불가";
}

function atlasDistanceLy(star) {
  const parallaxMas = Number(star.parallaxMas);
  if (!Number.isFinite(parallaxMas) || parallaxMas <= 0) return Number.NaN;
  return (1000 / parallaxMas) * LIGHT_YEARS_PER_PARSEC;
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
  const camera = getCamera();
  drawSkyBackdrop(camera);
  const skyFrame = getSkyFrame(skyNow);
  atlasHitTargets = [];
  drawAtmosphere(camera);
  drawConstellationLines(skyFrame.constellations, camera);
  drawAtlasStars(skyFrame.stars, camera);
  drawFriendStars(skyNow, perfNow, camera);
  const autoDimLandscape = selectedStarIsBehindLandscape(skyNow);
  setLandscapeAutoDimmed(autoDimLandscape);
  if (showLandscape) {
    drawGroundScene(camera, perfNow, autoDimLandscape ? OCCLUDED_LANDSCAPE_OPACITY : 1);
  }
  if (showHorizonGrid) drawHorizon(camera);
}

function selectedStarIsBehindLandscape(skyNow) {
  if (!showLandscape || !selected?.star) return false;

  const horizontal = equatorialToHorizontal(selected.star, OBSERVATORY, skyNow);
  const altitude = Number(horizontal.altitude);
  const azimuth = Number(horizontal.azimuth);
  if (!Number.isFinite(altitude) || !Number.isFinite(azimuth) || altitude < 0) return false;

  if (horizonPanoramaAlphaMask) return panoramaOccludesHorizontal(azimuth, altitude);
  return altitude <= nearRidgeAltitude(azimuth) + 0.8;
}

function panoramaOccludesHorizontal(azimuth, altitude) {
  const mask = horizonPanoramaAlphaMask;
  if (!mask) return false;

  const verticalRadians = TWO_PI * (mask.sourceHeight / mask.sourceWidth);
  const sourceX = normalizeDegrees(azimuth - PANORAMA_AZIMUTH_OFFSET) / 360;
  const sourceY = PANORAMA_HORIZON_SOURCE_RATIO - (altitude * DEG_TO_RAD) / verticalRadians;
  if (sourceY < 0 || sourceY > 1) return false;

  const centerX = Math.floor(sourceX * mask.width) % mask.width;
  const centerY = clamp(Math.floor(sourceY * mask.height), 0, mask.height - 1);
  const sampleRadius = 2;

  for (let y = centerY - sampleRadius; y <= centerY + sampleRadius; y += 1) {
    if (y < 0 || y >= mask.height) continue;
    for (let x = centerX - sampleRadius; x <= centerX + sampleRadius; x += 1) {
      const wrappedX = (x + mask.width) % mask.width;
      if (mask.alpha[y * mask.width + wrappedX] >= LANDSCAPE_ALPHA_THRESHOLD) return true;
    }
  }
  return false;
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
    lines: (constellation.renderLines ?? constellation.lines).map((line) => ({
      weight: line.weight ?? "normal",
      points: (line.points ?? line).map(([ra, dec]) => toHorizontal(ra, dec)),
    })),
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
      renderLines: constellation.lines.map((line, index) => ({
        weight: constellationLineWeight(constellation, line, index),
        points: densifyConstellationLine(line.points ?? line),
      })),
    })),
  };
}

function constellationLineWeight(constellation, line, index) {
  return line.weight ?? constellation.lineWeights?.[index] ?? "normal";
}

function densifyConstellationLine(line) {
  if (!Array.isArray(line) || line.length < 2) return line;

  const points = [line[0]];
  for (let index = 1; index < line.length; index += 1) {
    const from = equatorialVector(line[index - 1]);
    const to = equatorialVector(line[index]);
    const angle = Math.acos(clamp(dot(from, to), -1, 1));
    const steps = clamp(Math.ceil((angle / DEG_TO_RAD) / 2.5), 1, 24);

    for (let step = 1; step <= steps; step += 1) {
      points.push(vectorToEquatorial(slerpVector(from, to, step / steps)));
    }
  }

  return points;
}

function equatorialVector(point) {
  const [ra, dec] = point;
  const raRad = Number(ra) * DEG_TO_RAD;
  const decRad = Number(dec) * DEG_TO_RAD;
  const cosDec = Math.cos(decRad);
  return {
    x: cosDec * Math.cos(raRad),
    y: cosDec * Math.sin(raRad),
    z: Math.sin(decRad),
  };
}

function vectorToEquatorial(vector) {
  const normalized = normalizeVector(vector);
  return [
    normalizeDegrees(Math.atan2(normalized.y, normalized.x) / DEG_TO_RAD),
    Math.asin(clamp(normalized.z, -1, 1)) / DEG_TO_RAD,
  ];
}

function slerpVector(from, to, amount) {
  const angle = Math.acos(clamp(dot(from, to), -1, 1));
  if (angle < 1e-5) {
    return normalizeVector({
      x: lerp(from.x, to.x, amount),
      y: lerp(from.y, to.y, amount),
      z: lerp(from.z, to.z, amount),
    });
  }

  const sinAngle = Math.sin(angle);
  const fromScale = Math.sin((1 - amount) * angle) / sinAngle;
  const toScale = Math.sin(amount * angle) / sinAngle;
  return {
    x: from.x * fromScale + to.x * toScale,
    y: from.y * fromScale + to.y * toScale,
    z: from.z * fromScale + to.z * toScale,
  };
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
  const projectionScale = viewport.height / (4 * Math.tan(fov / 4));

  return {
    forward,
    right,
    up,
    fov,
    projectionScale,
    focal: projectionScale,
    centerX: viewport.width / 2,
    centerY: viewport.height / 2,
  };
}

function drawSkyBackdrop(camera) {
  const { width, height } = viewport;
  ctx.fillStyle = "#02050a";
  ctx.fillRect(0, 0, width, height);

  const horizon = projectHorizontal({ azimuth: view.azimuth, altitude: 0 }, camera, height * 3);
  const horizonY = Number.isFinite(horizon.y) ? horizon.y : height * 1.5;
  const glow = ctx.createLinearGradient(0, horizonY - height * 0.78, 0, horizonY + height * 0.08);
  glow.addColorStop(0, "rgba(4, 10, 18, 0)");
  glow.addColorStop(0.62, "rgba(15, 29, 43, 0.34)");
  glow.addColorStop(1, "rgba(61, 66, 50, 0.34)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
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
  glow.addColorStop(0, "rgba(34, 54, 79, 0.14)");
  glow.addColorStop(0.55, "rgba(26, 45, 61, 0.05)");
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
    const touchBoost = isCoarsePointer() ? 0.1 : 0;

    for (const line of constellation.lines) {
      const points = line.points ?? line;
      const lineAlpha = clamp(alpha + touchBoost + constellationLineWeightAlpha(line.weight), 0, 0.72);
      ctx.strokeStyle = `rgba(126, 181, 205, ${lineAlpha})`;
      ctx.lineWidth = constellationLineWidth(constellation.rank, line.weight);

      drawProjectedPolyline(points, camera, (point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });

      for (const horizontal of points) {
        if (labelPoint || horizontal.altitude < 14) continue;
        const projected = projectHorizontal(horizontal, camera, 120);
        if (projected.visible) labelPoint = projected;
      }
    }
    if (labelPoint && shouldDrawConstellationLabel(constellation) && CONSTELLATION_LABELS[constellation.id]) {
      ctx.fillStyle = isCoarsePointer() ? "rgba(205, 225, 232, 0.72)" : "rgba(186, 211, 222, 0.62)";
      ctx.font = `600 ${isCoarsePointer() ? 12 : 11}px system-ui, sans-serif`;
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
  if (rank <= 1) return view.zoom < 1.45 ? 0.48 : 0.54;
  if (rank === 2) return 0.33;
  return 0.22;
}

function constellationLineWeightAlpha(weight) {
  if (weight === "thin") return -0.05;
  if (weight === "bold") return 0.05;
  return 0;
}

function constellationLineWidth(rank, weight = "normal") {
  const touch = isCoarsePointer();
  const base = rank <= 1 ? (touch ? 1.35 : 1.08) : rank === 2 ? (touch ? 1.08 : 0.86) : (touch ? 0.9 : 0.72);
  const scale = weight === "thin" ? 0.74 : weight === "bold" ? 1.24 : 1;
  return base * scale * 1.36;
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

    const brightness = Math.pow(2.512, clamp(5.1 - star.mag, -1.5, 6.8));
    const radius =
      clamp(0.38 + Math.sqrt(brightness) * 0.27, 0.54, 5.8) *
      clamp(Math.sqrt(view.zoom), 1, 1.85);
    const color = starColor(star.bv);

    const altitudeAlpha = clamp((horizontal.altitude + 2) / 18, 0.14, 1);
    const thresholdAlpha = clamp((magnitudeLimit - star.mag + 0.25) / 0.85, 0.24, 1);
    ctx.globalAlpha = altitudeAlpha * thresholdAlpha;
    ctx.shadowBlur = star.mag < 1.5 ? 6 + (1.5 - star.mag) * 2.4 : 0;
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
  if (view.zoom < 1.4) return 5.35;
  if (view.zoom < 2.2) return 5.9;
  return 6.45;
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

function drawGroundScene(camera, perfNow, opacity = 1) {
  if (drawPanoramaGround(camera, opacity)) return;

  drawTerrainBand(camera, distantRidgeAltitude, {
    alpha: 0.72 * opacity,
    edge: "rgba(170, 197, 177, 0.16)",
    stops: [
      [0, "rgba(40, 58, 58, 0.46)"],
      [0.58, "rgba(25, 38, 34, 0.64)"],
      [1, "rgba(7, 10, 9, 0.86)"],
    ],
  });
  drawTerrainBand(camera, nearRidgeAltitude, {
    alpha: 0.92 * opacity,
    edge: "rgba(214, 205, 172, 0.18)",
    stops: [
      [0, "rgba(37, 51, 38, 0.78)"],
      [0.5, "rgba(22, 32, 23, 0.9)"],
      [1, "rgba(7, 10, 7, 0.98)"],
    ],
  });
  drawObservatorySilhouette(camera, perfNow, opacity);
}

function drawPanoramaGround(camera, opacity = 1) {
  const image = horizonPanoramaImage;
  const sourceWidth = image?.naturalWidth || image?.width || 0;
  const sourceHeight = image?.naturalHeight || image?.height || 0;
  if (!horizonPanoramaReady || !sourceWidth || !sourceHeight) return false;

  if (horizonPanoramaRenderer) {
    const pixelRatio = clamp(canvas.width / Math.max(1, viewport.width), 1, 2);
    const projectedCanvas = horizonPanoramaRenderer.render(camera, viewport.width, viewport.height, pixelRatio);
    if (projectedCanvas) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(projectedCanvas, 0, 0, viewport.width, viewport.height);
      ctx.restore();
      return true;
    }
  }

  const sourceHorizonY = sourceHeight * PANORAMA_HORIZON_SOURCE_RATIO;
  const centerHorizon = projectHorizontal({ azimuth: view.azimuth, altitude: 0 }, camera, LANDSCAPE_PROJECTION_MARGIN);
  if (centerHorizon.depth <= 0.04) return true;

  const scale = (TWO_PI * camera.projectionScale) / sourceWidth;
  const targetW = sourceWidth * scale;
  const targetH = sourceHeight * scale;
  const targetY = centerHorizon.y - sourceHorizonY * scale;
  if (targetY > viewport.height + 120 || targetY + targetH < -80) return true;

  const sourceCenterX = (normalizeDegrees(view.azimuth - PANORAMA_AZIMUTH_OFFSET) / 360) * targetW;
  let drawX = viewport.width / 2 - sourceCenterX;
  drawX = ((drawX % targetW) + targetW) % targetW - targetW;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "brightness(62%) saturate(74%) contrast(108%) sepia(10%) hue-rotate(165deg)";

  for (let x = drawX; x < viewport.width; x += targetW) {
    if (x + targetW < -1) continue;
    ctx.drawImage(image, x, targetY, targetW, targetH);
  }

  ctx.restore();
  return true;
}

function createPanoramaRenderer(image) {
  const projectionCanvas = document.createElement("canvas");
  const gl = projectionCanvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision highp float;
    uniform sampler2D u_panorama;
    uniform vec2 u_resolution;
    uniform float u_projectionScale;
    uniform vec3 u_forward;
    uniform vec3 u_right;
    uniform vec3 u_up;
    uniform float u_horizonRatio;
    uniform float u_verticalRadians;
    uniform float u_azimuthOffset;

    const float TWO_PI = 6.283185307179586;

    void main() {
      vec2 plane = (gl_FragCoord.xy - u_resolution * 0.5) / u_projectionScale;
      float radiusSquared = dot(plane, plane);
      float denominator = 4.0 + radiusSquared;
      vec3 localDirection = vec3(
        4.0 * plane.x / denominator,
        4.0 * plane.y / denominator,
        (4.0 - radiusSquared) / denominator
      );
      vec3 worldDirection = normalize(
        u_right * localDirection.x +
        u_up * localDirection.y +
        u_forward * localDirection.z
      );

      float azimuth = atan(worldDirection.x, worldDirection.z) - u_azimuthOffset;
      float altitude = asin(clamp(worldDirection.y, -1.0, 1.0));
      float sourceX = fract(azimuth / TWO_PI + 1.0);
      float sourceY = u_horizonRatio - altitude / u_verticalRadians;
      if (sourceY < 0.0 || sourceY > 1.0) discard;

      vec4 panorama = texture2D(u_panorama, vec2(sourceX, sourceY));
      float luminance = dot(panorama.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 blueHour = vec3(luminance) * vec3(0.62, 0.72, 0.92);
      vec3 evening = mix(panorama.rgb, blueHour, 0.42) * 0.6;
      evening = pow(max(evening, vec3(0.0)), vec3(1.04));

      float warmHighlight =
        smoothstep(0.12, 0.38, panorama.r - panorama.b) *
        smoothstep(0.42, 0.85, luminance);
      evening += vec3(0.1, 0.045, 0.008) * warmHighlight;
      evening += vec3(0.006, 0.012, 0.022) * panorama.a;

      gl_FragColor = vec4(evening, panorama.a);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const locations = {
    position: gl.getAttribLocation(program, "a_position"),
    resolution: gl.getUniformLocation(program, "u_resolution"),
    projectionScale: gl.getUniformLocation(program, "u_projectionScale"),
    forward: gl.getUniformLocation(program, "u_forward"),
    right: gl.getUniformLocation(program, "u_right"),
    up: gl.getUniformLocation(program, "u_up"),
    horizonRatio: gl.getUniformLocation(program, "u_horizonRatio"),
    verticalRadians: gl.getUniformLocation(program, "u_verticalRadians"),
    azimuthOffset: gl.getUniformLocation(program, "u_azimuthOffset"),
    panorama: gl.getUniformLocation(program, "u_panorama"),
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(locations.position);
  gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1i(locations.panorama, 0);
  gl.uniform1f(locations.horizonRatio, PANORAMA_HORIZON_SOURCE_RATIO);
  gl.uniform1f(locations.verticalRadians, TWO_PI * (image.naturalHeight / image.naturalWidth));
  gl.uniform1f(locations.azimuthOffset, PANORAMA_AZIMUTH_OFFSET * DEG_TO_RAD);

  return {
    render(camera, width, height, pixelRatio) {
      if (gl.isContextLost()) return null;
      const pixelWidth = Math.max(1, Math.round(width * pixelRatio));
      const pixelHeight = Math.max(1, Math.round(height * pixelRatio));
      if (projectionCanvas.width !== pixelWidth || projectionCanvas.height !== pixelHeight) {
        projectionCanvas.width = pixelWidth;
        projectionCanvas.height = pixelHeight;
      }

      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(locations.resolution, pixelWidth, pixelHeight);
      gl.uniform1f(locations.projectionScale, camera.projectionScale * pixelRatio);
      gl.uniform3f(locations.forward, camera.forward.x, camera.forward.y, camera.forward.z);
      gl.uniform3f(locations.right, camera.right.x, camera.right.y, camera.right.z);
      gl.uniform3f(locations.up, camera.up.x, camera.up.y, camera.up.z);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return projectionCanvas;
    },
  };
}

function drawTerrainBand(camera, altitudeForAzimuth, paint) {
  const segments = projectTerrainSegments(camera, altitudeForAzimuth);
  if (!segments.length) return;

  const bottom = viewport.height + 80;
  const gradient = ctx.createLinearGradient(0, Math.max(0, viewport.height * 0.58), 0, bottom);
  for (const [stop, color] of paint.stops) gradient.addColorStop(stop, color);

  ctx.save();
  ctx.globalAlpha = paint.alpha ?? 1;
  ctx.fillStyle = gradient;
  for (const points of segments) {
    if (points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }
    ctx.lineTo(points[points.length - 1].x, bottom);
    ctx.lineTo(points[0].x, bottom);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = paint.alpha ?? 1;
  ctx.strokeStyle = paint.edge;
  ctx.lineWidth = 1;
  for (const points of segments) {
    if (points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function projectTerrainSegments(camera, altitudeForAzimuth) {
  const segments = [];
  let segment = [];

  function finishSegment() {
    if (segment.length > 1) segments.push(segment);
    segment = [];
  }

  for (const offset of LANDSCAPE_SAMPLES) {
    const azimuth = normalizeDegrees(view.azimuth + offset);
    const point = projectHorizontal(
      { azimuth, altitude: altitudeForAzimuth(azimuth) },
      camera,
      LANDSCAPE_PROJECTION_MARGIN,
    );
    if (!point.visible) {
      finishSegment();
      continue;
    }
    segment.push(point);
  }

  finishSegment();
  return segments;
}

function distantRidgeAltitude(azimuth) {
  const wave =
    0.18 * Math.sin((azimuth + 28) * DEG_TO_RAD) +
    0.12 * Math.sin((azimuth * 2.1 - 34) * DEG_TO_RAD);
  return clamp(0.34 + wave + angularHill(azimuth, normalizeDegrees(OBSERVATORY_HILL_AZIMUTH - 14), 42, 0.62), -0.05, 1.65);
}

function nearRidgeAltitude(azimuth) {
  const wave =
    0.2 * Math.sin((azimuth - 18) * DEG_TO_RAD) +
    0.14 * Math.sin((azimuth * 1.7 + 64) * DEG_TO_RAD);
  const observatoryHill = angularHill(azimuth, OBSERVATORY_HILL_AZIMUTH, 25, 2.25);
  const sideHill = angularHill(azimuth, normalizeDegrees(OBSERVATORY_HILL_AZIMUTH + 78), 36, 0.36);
  return clamp(0.58 + wave + observatoryHill + sideHill, 0.08, 3.55);
}

function angularHill(azimuth, center, widthDegrees, heightDegrees) {
  const distance = shortestAngle(azimuth - center);
  return Math.exp(-(distance * distance) / (2 * widthDegrees * widthDegrees)) * heightDegrees;
}

function drawObservatorySilhouette(camera, perfNow, opacity = 1) {
  const hillAltitude = nearRidgeAltitude(OBSERVATORY_HILL_AZIMUTH) + 0.08;
  const anchor = projectHorizontal({ azimuth: OBSERVATORY_HILL_AZIMUTH, altitude: hillAltitude }, camera, 240);
  if (!anchor.visible) return;

  const width = clamp((camera.focal * 0.34) / Math.max(anchor.depth, 0.28), isCoarsePointer() ? 92 : 118, isCoarsePointer() ? 156 : 226);
  const height = width * 0.47;
  const alpha = clamp((anchor.depth - 0.05) / 0.58, 0.62, 0.96);
  const glow = perfNow ? 0.38 + Math.sin(perfNow / 1400) * 0.08 : 0.38;
  const x = -width / 2;
  const y = -height;

  ctx.save();
  ctx.translate(anchor.x, anchor.y + height * 0.08);
  ctx.globalAlpha = alpha * opacity;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const glassGradient = ctx.createLinearGradient(0, y, 0, 0);
  glassGradient.addColorStop(0, "rgba(8, 15, 17, 0.96)");
  glassGradient.addColorStop(0.46, "rgba(19, 35, 39, 0.92)");
  glassGradient.addColorStop(1, "rgba(54, 66, 68, 0.9)");

  ctx.fillStyle = "rgba(3, 6, 6, 0.5)";
  ctx.beginPath();
  ctx.ellipse(0, height * 0.08, width * 0.58, height * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(18, 21, 21, 0.98)";
  ctx.fillRect(x - width * 0.2, y + height * 0.08, width * 0.28, height * 0.92);

  ctx.fillStyle = glassGradient;
  ctx.fillRect(x + width * 0.05, y, width * 0.95, height);
  ctx.fillStyle = "rgba(158, 159, 153, 0.3)";
  ctx.fillRect(x + width * 0.05, y, width * 0.95, height * 0.08);

  ctx.strokeStyle = "rgba(191, 197, 189, 0.26)";
  ctx.lineWidth = Math.max(0.8, width * 0.006);
  for (let index = 1; index < 6; index += 1) {
    const px = x + width * (0.05 + index * 0.15);
    ctx.beginPath();
    ctx.moveTo(px, y + height * 0.08);
    ctx.lineTo(px, 0);
    ctx.stroke();
  }
  for (let index = 1; index < 3; index += 1) {
    const py = y + height * (0.18 + index * 0.25);
    ctx.beginPath();
    ctx.moveTo(x + width * 0.05, py);
    ctx.lineTo(x + width, py);
    ctx.stroke();
  }

  ctx.fillStyle = `rgba(86, 142, 158, ${0.16 + glow * 0.22})`;
  ctx.fillRect(x + width * 0.55, y + height * 0.22, width * 0.3, height * 0.28);
  ctx.fillStyle = "rgba(13, 16, 17, 0.98)";
  ctx.fillRect(x + width * 0.33, y + height * 0.62, width * 0.22, height * 0.38);
  ctx.fillStyle = `rgba(245, 201, 106, ${glow})`;
  ctx.fillRect(x + width * 0.39, y + height * 0.67, width * 0.04, height * 0.08);

  ctx.fillStyle = "rgba(178, 170, 153, 0.92)";
  ctx.fillRect(x + width * 0.26, y + height * 0.42, width * 0.46, height * 0.09);
  ctx.fillStyle = "rgba(235, 241, 230, 0.94)";
  ctx.font = `700 ${Math.max(10, width * 0.088)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ASTROCAMP", x + width * 0.5, y + height * 0.36);

  ctx.strokeStyle = "rgba(235, 241, 230, 0.9)";
  ctx.lineWidth = Math.max(1, width * 0.01);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.25, y + height * 0.36);
  ctx.lineTo(x + width * 0.31, y + height * 0.26);
  ctx.lineTo(x + width * 0.38, y + height * 0.22);
  ctx.moveTo(x + width * 0.31, y + height * 0.26);
  ctx.lineTo(x + width * 0.29, y + height * 0.45);
  ctx.moveTo(x + width * 0.31, y + height * 0.34);
  ctx.lineTo(x + width * 0.24, y + height * 0.5);
  ctx.moveTo(x + width * 0.31, y + height * 0.34);
  ctx.lineTo(x + width * 0.37, y + height * 0.5);
  ctx.stroke();

  ctx.fillStyle = "rgba(5, 8, 8, 0.96)";
  ctx.fillRect(x + width * 0.16, y + height * 0.51, width * 0.76, height * 0.07);
  ctx.fillStyle = `rgba(245, 201, 106, ${0.26 + glow * 0.36})`;
  ctx.fillRect(x + width * 0.12, y + height * 0.78, width * 0.08, height * 0.05);
  ctx.fillRect(x + width * 0.78, y + height * 0.18, width * 0.1, height * 0.045);

  ctx.restore();
}

function drawFriendStar(star, horizontal, active, perfNow, camera) {
  if (horizontal.altitude < 0) return;

  const point = projectHorizontal(horizontal, camera, 100);
  if (!point.visible) return;

  const baseSize = clamp(8.8 - star.gMag * 0.72, 1.35, 5.6);
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
    ctx.fillText(friendStarDisplayName(star), point.x, Math.max(36, point.y - radius - 24));
  }
  ctx.restore();
}

function projectHorizontal(horizontal, camera, margin = 80) {
  const vector = vectorFromHorizontal(horizontal.azimuth, horizontal.altitude);
  const depth = dot(vector, camera.forward);
  const denominator = 1 + depth;
  if (denominator <= 0.08) return { visible: false, x: 0, y: 0, depth };

  const scale = (2 * camera.projectionScale) / denominator;
  const x = camera.centerX + dot(vector, camera.right) * scale;
  const y = camera.centerY - dot(vector, camera.up) * scale;
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

function starColor(colorIndex) {
  const value = Number(colorIndex);
  if (!Number.isFinite(value)) return "#f7f4e9";
  if (value < 0.1) return "#dceeff";
  if (value < 0.8) return "#f7f4e9";
  if (value < 1.5) return "#ffe3b5";
  if (value < 2.8) return "#ffc491";
  return "#ffad9c";
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

