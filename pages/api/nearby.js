// ========================================================
// /api/nearby — 내 주변 지하철역·버스정류장 검색
// --------------------------------------------------------
// 카카오 로컬 API(카테고리 검색)로 주변 정류장을 찾음.
// ODsay 대신 카카오를 쓰는 이유: 카카오 키는 이미 있고,
// 콘솔 접근도 되니까 (ODsay는 콘솔 잠김).
//
// 카카오 카테고리 코드:
//   SW8 = 지하철역
//   (버스정류장은 카카오 카테고리 코드가 없어서 키워드 검색으로 보완)
//
// 이 함수(=Vercel 서버)가 REST 키로 호출 → 키 노출 안 됨.
// 프론트: /api/nearby?lng=...&lat=...&radius=...
// ========================================================

const KAKAO_CATEGORY_URL =
  "https://dapi.kakao.com/v2/local/search/category.json";
const KAKAO_KEYWORD_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";

// 내 위치 주변 목업 (키 없을 때 폴백)
function makeMockStations(lng, lat) {
  const x = parseFloat(lng);
  const y = parseFloat(lat);
  const d = 0.0018;
  return [
    { id: "M-SUB-1", name: "반짝역♡ (데모)", class: 1, x: x + d, y: y + d },
    { id: "M-SUB-2", name: "별빛역☆ (데모)", class: 1, x: x - d, y: y + d * 0.5 },
    { id: "M-BUS-1", name: "핑크 정류장 (데모)", class: 2, x: x + d * 0.6, y: y - d },
    { id: "M-BUS-2", name: "하트 정류장 (데모)", class: 2, x: x - d * 1.2, y: y - d * 0.7 },
    { id: "M-BUS-3", name: "야호 정류장 (데모)", class: 2, x: x + d * 1.4, y: y + d * 0.3 },
  ];
}

async function kakaoGet(url, params, key) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${url}?${qs}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });
  return r.json();
}

// 카카오 데이터에서 호선 추출
// place_name: "샛강역 9호선", category_name: "...지하철,철도 > 수도권9호선"
function extractLine(placeName, categoryName) {
  const text = `${placeName} ${categoryName || ""}`;
  // "9호선", "2호선", "경의중앙선", "신분당선", "공항철도" 등
  const patterns = [
    /(\d)호선/,
    /(경의중앙|수인분당|신분당|공항철도|경춘|경강|서해|김포골드|의정부|용인에버|우이신설|신림)선?/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].replace(/^수도권/, "");
  }
  return "";
}

export default async function handler(req, res) {
  const { lng, lat, radius = 500 } = req.query;

  if (!lng || !lat) {
    return res.status(400).json({ error: "lng, lat 좌표가 필요해요" });
  }

  const KEY = process.env.KAKAO_REST_KEY;

  // 키 없으면 목업
  if (!KEY) {
    const stations = makeMockStations(lng, lat);
    return res
      .status(200)
      .json({ count: stations.length, stations, mock: true, reason: "no-key" });
  }

  try {
    // 1) 지하철역 (카테고리 SW8)
    const subwayData = await kakaoGet(
      KAKAO_CATEGORY_URL,
      { category_group_code: "SW8", x: lng, y: lat, radius, sort: "distance", size: 15 },
      KEY
    );

    // 2) 버스정류장 (카테고리 코드 없음 → 키워드 "버스정류장")
    const busData = await kakaoGet(
      KAKAO_KEYWORD_URL,
      { query: "버스정류장", x: lng, y: lat, radius, sort: "distance", size: 15 },
      KEY
    );

    // 카카오 인증 실패 등 에러 → 목업 폴백
    if (subwayData.errorType || busData.errorType) {
      const stations = makeMockStations(lng, lat);
      return res.status(200).json({
        count: stations.length,
        stations,
        mock: true,
        reason: "kakao-error",
        kakaoError: subwayData.errorType || busData.errorType,
        detail: subwayData.message || busData.message,
      });
    }

    const subwayStations = (subwayData.documents || []).map((d) => ({
      id: d.id,
      name: d.place_name,
      class: 1, // 지하철
      line: extractLine(d.place_name, d.category_name), // 호선 추출
      x: parseFloat(d.x),
      y: parseFloat(d.y),
      distance: d.distance ? parseInt(d.distance) : null,
    }));

    const busStations = (busData.documents || [])
      // 키워드 검색이라 정류장 아닌 것도 섞일 수 있어 필터
      .filter((d) => d.place_name.includes("정류장") || d.category_name?.includes("교통"))
      .map((d) => ({
        id: d.id,
        name: d.place_name,
        class: 2, // 버스
        x: parseFloat(d.x),
        y: parseFloat(d.y),
        distance: d.distance ? parseInt(d.distance) : null,
      }));

    const stations = [...subwayStations, ...busStations].sort(
      (a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)
    );

    return res.status(200).json({ count: stations.length, stations, mock: false });
  } catch (e) {
    const stations = makeMockStations(lng, lat);
    return res.status(200).json({
      count: stations.length,
      stations,
      mock: true,
      reason: "fetch-failed",
      detail: String(e),
    });
  }
}
