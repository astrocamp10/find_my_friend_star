# 나의 친구 별 찾기

인천어린이천문대 기준의 현재 하늘에서, 학생의 생일 또는 나이와 광년 거리가 가까운 실제 별을 찾아 보여주는 정적 웹앱입니다. 120광년 이내 Gaia DR3 별 목록을 로컬 JSON으로 저장하고, SIMBAD/CDS에서 확인한 이름을 화면에 우선 표시합니다.

## 핵심 기능

- 생일 또는 나이 입력
- 자세한 나이를 년/개월/일 단위와 소수년 단위로 계산
- Gaia DR3 시차값으로 계산한 120광년 이내 별 거리와 나이 비교
- SIMBAD/CDS 이름이 확인된 별을 우선 표시해서 `Gaia DR3 ...` 번호만 보이는 상황 완화
- 인천어린이천문대 초기 좌표 기준 현재 Alt/Az 계산
- 실시간 별하늘 캔버스, 실제 밝은 별 5,046개, Stellarium modern_iau 별자리 선 88개
- 별자리 선에 포함된 밝은 별 클릭 시 이름, 별자리, 방향, 한글 별빛 색, 겉보기등급, 절대등급 표시
- 친구 별 확대 애니메이션
- 학생용 설명 카드와 개인정보 미저장 안내

## 로컬 실행

이 앱은 빌드 없이 동작하는 정적 사이트입니다. 로컬 파일을 직접 열기보다 작은 웹 서버로 여는 편이 안정적입니다.

```powershell
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.mjs
```

그 다음 브라우저에서 `http://localhost:4173`을 엽니다.

## QA

```powershell
$env:NODE_PATH="C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules;C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\.pnpm\node_modules"
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check src\app.js
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\parse-data-check.cjs
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\import-check.cjs http://localhost:4173
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\time-check.cjs http://localhost:4173
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\smoke.cjs http://localhost:4173
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\atlas-click-check.cjs http://localhost:4173
```

## 데이터 파일

- `data/nearby-stars.json`: Gaia DR3 기준 120광년 이내 전체 목록 18,148개. `sourceId`는 JavaScript 정수 정밀도 문제를 피하려고 문자열로 저장합니다.
- `data/nearby-stars-search.json`: 화면 검색용 경량 목록 15,587개. SIMBAD/CDS에서 Gaia 번호가 아닌 이름이 확인된 별만 포함합니다.
- `data/sky-atlas.json`: D3-Celestial 밝은 별 좌표 5,044개에 Stellarium modern_iau 선 보강 별 2개를 더하고, Stellarium modern_iau 별자리 선 88개를 적용했습니다. HIP 번호로 SIMBAD/CDS 이름과 시차를 붙였고, 별자리 선에 포함된 745개 별은 클릭 대상입니다. 5,038개 별은 절대등급 계산이 가능합니다.
- `data/source/nearby-stars-raw.json`: Gaia Archive 원본 보존용 중간 산출물.
- `data/source/nearby-star-names.json`: 120광년 별 SIMBAD/CDS 이름 교차확인 결과.
- `data/source/sky-atlas-star-names.json`: 별자리 배경 별 SIMBAD/CDS 이름, 시차, 스펙트럼형 교차확인 결과.
- `data/source/stellarium-modern-iau-index.json`: Stellarium modern_iau sky culture 별자리 선 원본.
- `data/source/stellarium-line-extra-stars.json`: Stellarium 선 끝점 중 6등급 밝은 별 목록에 없던 HIP 2개 좌표/밝기 보강값.

## 데이터 재생성

```powershell
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\build-nearby-stars.cjs
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\build-nearby-search.cjs
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\build-sky-atlas.cjs
& "C:\Users\Incheon\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\build-sky-atlas-names.cjs
```

SIMBAD/CDS 교차확인은 외부 서비스 요청이 많아서 시간이 걸릴 수 있습니다. 이미 생성된 JSON은 정적 파일이므로 GitHub Pages에 올려도 동작합니다. 절대등급은 별을 10파섹 거리에 둔다고 가정한 밝기이며, Gaia 검색 결과는 Gaia G 등급/거리, 별자리 클릭 결과는 V 등급/SIMBAD 시차로 계산하고, 별자리 선은 Stellarium modern_iau HIP 연결 자료를 사용합니다.

## 운영 전 확인

- 인천어린이천문대 건물 단위 좌표 검수
- ESA Gaia/DPAC acknowledgement 문구 최종 확인
- SIMBAD/CDS, D3-Celestial, Stellarium sky culture 라이선스/출처 표기 최종 확인
- GitHub Pages 대역폭이 부담되면 `nearby-stars-search.json`을 거리 구간별로 분할해 지연 로딩

## 데이터 출처

- 근처 별 거리와 천체측정값: [ESA Gaia Archive](https://gea.esac.esa.int/archive/) TAP+ ADQL 기반 추출
- 별 이름 교차확인: [SIMBAD Astronomical Database, CDS](https://simbad.cds.unistra.fr/simbad/)
- 밝은 별 좌표/등급: [D3-Celestial](https://github.com/ofrohn/d3-celestial), BSD-3-Clause
- 별자리 선: [Stellarium modern_iau sky culture](https://github.com/Stellarium/stellarium/blob/master/skycultures/modern_iau/index.json), HIP 연결 자료

## GitHub Pages 배포

GitHub 저장소 `Settings > Pages`에서 Source를 `GitHub Actions`로 설정한 뒤, `.github/workflows/deploy.yml` 워크플로를 사용합니다. 현재 앱은 정적 파일 구조라 별도 빌드 없이 배포됩니다.