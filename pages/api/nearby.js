// /api/nearby — 내 주변 지하철역·버스정류장 검색 (카카오 로컬 API)
const KAKAO_CATEGORY_URL = "https://dapi.kakao.com/v2/local/search/category.json";
const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

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

export default async function handler(req, res) {
  const { lng, lat, radius = 500 } = req.query;

  if (!lng || !lat) {
    return res.status(400).json({ error: "lng, lat 좌표가 필요해요" });
  }

  const KEY = process.env.KAKAO_REST_KEY;

  if (!KEY) {
    const stations = makeMockStations(lng, lat);
    return res.status(200).json({ count: stations.length, stations, mock: true, reason: "no-key" });
  }

  try {
    const subwayData = await kakaoGet(
      KAKAO_CATEGORY_URL,
      { category_group_code: "SW8", x: lng, y: lat, radius, sort: "distance", size: 15 },
      KEY
    );

    const busData = await kakaoGet(
      KAKAO_KEYWORD_URL,
      { query: "버스정류장", x: lng, y: lat, radius, sort: "distance", size: 15 },
      KEY
    );

    if (subwayData.errorType || busData.errorType) {
      const stations = makeMockStations(lng, lat);
      return res.status(200).json({
        count: stations.length, stations, mock: true, reason: "kakao-error",
        kakaoError: subwayData.errorType || busData.errorType,
        detail: subwayData.message || busData.message,
      });
    }

    const subwayStations = (subwayData.documents || []).map((d) => ({
      id: d.id, name: d.place_name, class: 1,
      x: parseFloat(d.x), y: parseFloat(d.y),
      distance: d.distance ? parseInt(d.distance) : null,
    }));

    const busStations = (busData.documents || [])
      .filter((d) => d.place_name.includes("정류장") || d.category_name?.includes("교통"))
      .map((d) => ({
        id: d.id, name: d.place_name, class: 2,
        x: parseFloat(d.x), y: parseFloat(d.y),
        distance: d.distance ? parseInt(d.distance) : null,
      }));

    const stations = [...subwayStations, ...busStations].sort(
      (a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)
    );

    return res.status(200).json({ count: stations.length, stations, mock: false });
  } catch (e) {
    const stations = makeMockStations(lng, lat);
    return res.status(200).json({
      count: stations.length, stations, mock: true, reason: "fetch-failed", detail: String(e),
    });
  }
}
