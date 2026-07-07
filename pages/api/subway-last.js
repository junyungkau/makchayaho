// /api/subway-last — 지하철역 막차 시간 (서울교통공사 열차시간표 API)
const ENDPOINT = "https://apis.data.go.kr/B553766/schedule/getTrainSch";

function makeMock(station) {
  return {
    station, mock: true, message: "데모 데이터 (API 키 미설정)",
    lastTrains: [
      { line: "2호선", direction: "성수 방면", time: "00:12" },
      { line: "2호선", direction: "신도림 방면", time: "00:18" },
    ],
  };
}

function todayWkndSe() {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? "주말" : "평일";
}

export default async function handler(req, res) {
  const { station } = req.query;
  if (!station) {
    return res.status(400).json({ error: "station(역 이름)이 필요해요" });
  }

  const KEY = process.env.PUBLIC_DATA_KEY;
  if (!KEY) {
    return res.status(200).json(makeMock(station));
  }

  const wknd = todayWkndSe();

  try {
    const params = new URLSearchParams({
      serviceKey: KEY,
      stnNm: station,
      wkndSe: wknd,
      dataType: "JSON",
      numOfRows: "2000",
      pageNo: "1",
    });

    const r = await fetch(`${ENDPOINT}?${params.toString()}`);
    const data = await r.json();

    const items = data?.response?.body?.items?.item || [];

    if (!items.length) {
      return res.status(200).json({
        station, lastTrains: [], unsupported: true,
        message: "이 역은 막차 정보 미제공이야 (서울 1~9호선만 돼)",
      });
    }

    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      const hh = h < 4 ? h + 24 : h;
      return hh * 60 + m;
    };

    const groups = {};
    for (const it of items) {
      const dir = `${it.upbdnbSe}|${it.arvlStnNm}`;
      const dep = it.trainDptreTm?.slice(0, 5);
      if (!dep) continue;
      if (!groups[dir] || toMinutes(dep) > toMinutes(groups[dir].time)) {
        groups[dir] = {
          line: it.lineNm,
          direction: `${it.arvlStnNm} 방면`,
          upbdnb: it.upbdnbSe,
          time: dep,
        };
      }
    }

    const byUpDn = {};
    for (const g of Object.values(groups)) {
      const k = g.upbdnb;
      if (!byUpDn[k] || toMinutes(g.time) > toMinutes(byUpDn[k].time)) {
        byUpDn[k] = g;
      }
    }

    const lastTrains = Object.values(byUpDn)
      .sort((a, b) => toMinutes(b.time) - toMinutes(a.time))
      .map((g) => ({ line: g.line, direction: g.direction, time: g.time }));

    return res.status(200).json({ station, lastTrains, wknd, mock: false });
  } catch (e) {
    return res.status(200).json({ ...makeMock(station), error: String(e) });
  }
}
