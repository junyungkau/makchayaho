// ========================================================
// /api/subway-last — 지하철역 막차 시간
// --------------------------------------------------------
// 서울시 열린데이터 막차시간표를 미리 추려서 lib/subway-last.json에 내장.
// (405개 역, 요일·방면별 가장 늦은 차 = 막차)
// API 호출 없이 파일에서 역명으로 바로 조회 → 빠르고 인증 문제 없음.
//
// 데이터에 없는 역(경의중앙선 등 코레일 노선)은 "미제공"으로 안내.
// 프론트: /api/subway-last?station=강남
// ========================================================

import lastData from "../../lib/subway-last.json";

// 오늘 요일 → week_tag (1=평일, 2=토, 3=일)
function todayWeekTag() {
  const day = new Date().getDay(); // 0=일 ... 6=토
  if (day === 0) return "3"; // 일요일
  if (day === 6) return "2"; // 토요일
  return "1"; // 평일
}

// inout_tag → 방면 라벨
function dirLabel(io) {
  return io === "1" ? "상행" : "하행";
}

// "24:54:30" → "00:54" (표시용, 24시 이상은 다음날로 변환)
function formatTime(lt) {
  const [h, m] = lt.split(":");
  let hh = parseInt(h, 10);
  if (hh >= 24) hh -= 24;
  return `${String(hh).padStart(2, "0")}:${m}`;
}

export default async function handler(req, res) {
  const { station } = req.query;
  if (!station) {
    return res.status(400).json({ error: "station(역 이름)이 필요해요" });
  }

  // 역명 매칭: 원본 → 호선 제거 → 역 제거 순으로 시도
  // ("서울역"은 그대로, "강남역 2호선"은 정규화 필요)
  const candidates = [
    station.trim(),
    station.replace(/\s*\d*호선.*$/, "").trim(),
    station.replace(/\s*\d*호선.*$/, "").replace(/역$/, "").trim(),
  ];

  let clean = null;
  let stationData = null;
  for (const c of candidates) {
    if (lastData[c]) {
      clean = c;
      stationData = lastData[c];
      break;
    }
  }

  if (!stationData) {
    return res.status(200).json({
      station,
      lastTrains: [],
      unsupported: true,
      message: "이 역은 막차 정보가 없어ㅠ (서울 지하철만 돼)",
    });
  }

  const wk = todayWeekTag();
  // 해당 요일 데이터 없으면 평일로 폴백
  const dayData = stationData[wk] || stationData["1"] || {};

  const lastTrains = Object.entries(dayData).map(([io, info]) => ({
    line: "",
    direction: `${info.dest} 방면`,
    time: formatTime(info.lefttime),
    updn: dirLabel(io),
    rawTime: info.lefttime,
  }));

  // 늦은 시간 순 정렬
  lastTrains.sort((a, b) => (a.rawTime < b.rawTime ? 1 : -1));

  const weekName = wk === "1" ? "평일" : wk === "2" ? "토요일" : "일요일";

  return res.status(200).json({
    station: clean,
    lastTrains,
    week: weekName,
    mock: false,
  });
}
