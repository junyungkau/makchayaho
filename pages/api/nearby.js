// ========================================================
// /api/nearby — 내 주변 정류장·역 검색 (ODsay 프록시)
// --------------------------------------------------------
// 폰 앱에서 ODsay를 직접 부르면 referer/IP 문제로 인증 실패가 났음.
// 이 함수(=Vercel 서버)가 대신 호출하면:
//   1) 고정된 서버 환경에서 호출 → IP/referer 문제 해결
//   2) API 키가 브라우저에 노출 안 됨 → 보안 ↑
// 프론트는 그냥 /api/nearby?lng=...&lat=... 만 부르면 됨.
//
// ★ 지금은 ODsay 콘솔(IP 등록) 접근이 막혀 인증이 안 됨.
//   그래서 ODsay 실패 시 자동으로 목업 정류장을 뿌려서
//   지도/마커/카드 UI가 전부 작동하도록 함.
//   나중에 ODsay 복구되면 USE_MOCK_FALLBACK 관련 부분만 신경쓰면 됨.
// ========================================================

// 내 위치 주변에 가짜 정류장 몇 개를 생성 (목업)
function makeMockStations(lng, lat) {
  const x = parseFloat(lng);
  const y = parseFloat(lat);
  // 위/경도 약간씩 흩뿌리기 (대략 100~300m 반경 느낌)
  const d = 0.0018;
  return [
    { id: "M-SUB-1", name: "반짝역♡ (데모)", class: 1, x: x + d, y: y + d },
    { id: "M-SUB-2", name: "별빛역☆ (데모)", class: 1, x: x - d, y: y + d * 0.5 },
    { id: "M-BUS-1", name: "핑크 정류장 (데모)", class: 2, x: x + d * 0.6, y: y - d },
    { id: "M-BUS-2", name: "하트 정류장 (데모)", class: 2, x: x - d * 1.2, y: y - d * 0.7 },
    { id: "M-BUS-3", name: "야호 정류장 (데모)", class: 2, x: x + d * 1.4, y: y + d * 0.3 },
  ];
}

export default async function handler(req, res) {
  const { lng, lat, radius = 500 } = req.query;

  // --- 입력 검증 ---
  if (!lng || !lat) {
    return res.status(400).json({ error: "lng, lat 좌표가 필요해요" });
  }

  const KEY = process.env.ODSAY_API_KEY;

  // 키가 없으면 바로 목업
  if (!KEY) {
    const stations = makeMockStations(lng, lat);
    return res.status(200).json({ count: stations.length, stations, mock: true, reason: "no-key" });
  }

  // ODsay '반경 내 정류장 검색' API
  // https://lab.odsay.com/guide/releaseReference#pointSearch
  const url =
    `https://api.odsay.com/v1/api/pointSearch` +
    `?lang=0&x=${lng}&y=${lat}&radius=${radius}&stationClass=2` +
    `&apiKey=${encodeURIComponent(KEY)}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    // ODsay가 에러(인증 실패 등)를 주면 → 목업으로 폴백
    if (data.error) {
      const stations = makeMockStations(lng, lat);
      return res.status(200).json({
        count: stations.length,
        stations,
        mock: true,
        reason: "odsay-error",
        odsayError: data.error,
      });
    }

    // 정상 응답 정규화
    const stations = (data.result?.station || []).map((s) => ({
      id: s.stationID,
      name: s.stationName,
      class: s.stationClass, // 1=지하철, 2=버스
      x: s.x,
      y: s.y,
    }));

    return res.status(200).json({ count: stations.length, stations, mock: false });
  } catch (e) {
    // 네트워크 오류 등 → 목업 폴백
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
