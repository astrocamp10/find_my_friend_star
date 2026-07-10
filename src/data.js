export const OBSERVATORY = {
  name: "인천어린이천문대",
  address: "인천광역시 서구 원당대로 454-14, 2층",
  latitude: 37.5931,
  longitude: 126.6614,
  elevationMeters: 28,
  note: "좌표는 공개 지도 기반의 초기값입니다. 운영 전 건물 단위 좌표 검수를 권장합니다.",
};

export const DATASET_META = {
  release: "Gaia DR3",
  generatedAt: "2026-07-02",
  source: "ESA Gaia Archive TAP+ ADQL + SIMBAD/CDS identifiers",
  distanceFormula: "distance_ly = 3261.563777 / parallax_mas",
  filters: [
    "parallax >= 27.179698 mas",
    "distance <= 120 light years",
    "source_id stored as string",
    "search UI prefers stars with non-Gaia SIMBAD/CDS display names",
  ],
};
