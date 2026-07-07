// ========================================================
// /api/bus-arrival — 버스 정류장 도착·막차 정보 (프록시)
// --------------------------------------------------------
// 지금은 뼈대만. 경기/서울 버스 API 키 발급되면 연결.
// 프론트: /api/bus-arrival?stationId=...
// ========================================================

export default async function handler(req, res) {
  const { stationId } = req.query;

  if (!stationId) {
    return res.status(400).json({ error: "stationId가 필요해요" });
  }

  const KEY = process.env.GG_BUS_API_KEY;

  // 키 미설정 시 목업
  if (!KEY || KEY.startsWith("여기에")) {
    return res.status(200).json({
      stationId,
      mock: true,
      message: "경기버스 API 키 미설정 — 목업 데이터입니다",
      buses: [
        { no: "1002", type: "직행좌석", predictTime1: 3, lastBus: "23:40" },
        { no: "700", type: "일반", predictTime1: 8, lastBus: "23:10" },
      ],
    });
  }

  // TODO: 경기 버스 도착정보 API 연결
  return res.status(200).json({ stationId, buses: [], todo: true });
}
