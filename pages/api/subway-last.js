// ========================================================
// /api/subway-last — 지하철역 막차 시간 (프록시)
// --------------------------------------------------------
// 지금은 뼈대만. 서울 열린데이터광장 API 키 발급되면 연결.
// 프론트: /api/subway-last?station=강남
// ========================================================

export default async function handler(req, res) {
  const { station } = req.query;

  if (!station) {
    return res.status(400).json({ error: "station(역 이름)이 필요해요" });
  }

  const KEY = process.env.SEOUL_API_KEY;

  // 키가 아직 없으면 목업 데이터로 응답 (프론트 개발 계속 가능)
  if (!KEY || KEY.startsWith("여기에")) {
    return res.status(200).json({
      station,
      mock: true,
      message: "서울 API 키 미설정 — 목업 데이터입니다",
      lastTrains: [
        { line: "2호선", direction: "성수 방면", time: "00:12" },
        { line: "2호선", direction: "신도림 방면", time: "00:18" },
      ],
    });
  }

  // TODO: 서울 열린데이터광장 지하철 막차 API 연결
  // const url = `http://openapi.seoul.go.kr:8088/${KEY}/json/...`;
  // const r = await fetch(url);
  // const data = await r.json();

  return res.status(200).json({ station, lastTrains: [], todo: true });
}
