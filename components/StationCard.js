import { useEffect, useState } from "react";

// ========================================================
// StationCard — 마커 클릭 시 하단에 뜨는 정보 카드 (갸루 ver.)
// 지하철이면 막차 시간, 버스면 도착/막차 정보를 프록시에서 가져옴
// ========================================================

export default function StationCard({ station, onClose }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!station) return;
    setLoading(true);
    setInfo(null);

    const isSubway = station.class === 1;
    const url = isSubway
      ? `/api/subway-last?station=${encodeURIComponent(station.name)}`
      : `/api/bus-arrival?stationId=${encodeURIComponent(station.id)}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch((e) => setInfo({ error: String(e) }))
      .finally(() => setLoading(false));
  }, [station]);

  if (!station) return null;

  const isSubway = station.class === 1;

  return (
    <div className="card">
      <div className="handle" />
      <div className="card-head">
        <div>
          <span className={`tag ${isSubway ? "subway" : "bus"}`}>
            {isSubway ? "🚇 지하철" : "🚌 버스"}
          </span>
          <h2>{station.name}</h2>
        </div>
        <button className="close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="card-body">
        {loading && <p className="dim">막차 시간 확인 중… 잠깐만~♡</p>}

        {info?.mock && (
          <p className="mock-badge">🧪 데모 데이터야! (진짜 API는 곧 연결✨)</p>
        )}

        {/* 지하철 막차 */}
        {!loading && isSubway && info?.lastTrains && (
          <>
            <p className="lead">막차 놓치면 택시비 폭탄이야~ 🏃‍♀️💨</p>
            <ul className="list">
              {info.lastTrains.map((t, i) => (
                <li key={i}>
                  <span className="line">{t.line}</span>
                  <span className="dir">{t.direction}</span>
                  <span className="time">{t.time}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* 버스 도착/막차 */}
        {!loading && !isSubway && info?.buses && (
          <>
            <p className="lead">버스 막차도 놓치지 말구~ 🚌✨</p>
            <ul className="list">
              {info.buses.map((b, i) => (
                <li key={i}>
                  <span className="line">{b.no}</span>
                  <span className="dir">{b.type}</span>
                  <span className="time">
                    {b.predictTime1 != null ? `${b.predictTime1}분` : ""}
                    {b.lastBus ? ` · 막차 ${b.lastBus}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {!loading && info?.error && (
          <p className="err">앗 에러났어ㅠ: {info.error}</p>
        )}
      </div>

      <style jsx>{`
        .card {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(160deg, #2d1155 0%, #1a0b2e 100%);
          border-top: 2px solid #ff6ec7;
          border-radius: 28px 28px 0 0;
          padding: 12px 22px 26px;
          box-shadow: 0 -8px 40px rgba(255, 110, 199, 0.4);
          z-index: 100;
          max-height: 52vh;
          overflow-y: auto;
          animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .handle {
          width: 44px;
          height: 5px;
          background: #ff6ec7;
          border-radius: 999px;
          margin: 0 auto 14px;
          opacity: 0.7;
        }
        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        h2 {
          margin: 8px 0 0;
          font-size: 21px;
          color: #fff;
          font-weight: 800;
        }
        .tag {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 999px;
          font-weight: 700;
        }
        .tag.subway {
          background: linear-gradient(135deg, #ff6ec7, #b06bff);
          color: #fff;
        }
        .tag.bus {
          background: linear-gradient(135deg, #ffb84d, #ff6ec7);
          color: #fff;
        }
        .close {
          background: rgba(255, 110, 199, 0.2);
          border: none;
          color: #ffd6f5;
          font-size: 16px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lead {
          font-size: 13px;
          color: #ffd6f5;
          font-weight: 600;
          margin: 0 0 12px;
        }
        .list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .list li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255, 110, 199, 0.2);
        }
        .line {
          font-weight: 800;
          color: #fff;
          min-width: 62px;
        }
        .dir {
          flex: 1;
          color: #d9b8f0;
          font-size: 14px;
        }
        .time {
          font-weight: 900;
          color: #ffe95c;
          text-shadow: 0 0 8px rgba(255, 233, 92, 0.5);
          font-size: 16px;
        }
        .dim {
          color: #b89dd4;
          font-weight: 600;
        }
        .mock-badge {
          font-size: 13px;
          color: #ffe95c;
          margin: 0 0 12px;
          font-weight: 700;
        }
        .err {
          color: #ff9ec7;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
