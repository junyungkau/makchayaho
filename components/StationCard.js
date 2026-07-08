import { useEffect, useState } from "react";
import { lineColor } from "../lib/line-colors";

// ========================================================
// StationCard — 마커 클릭 시 하단에 뜨는 정보 카드 (갸루 ver.)
// 지하철이면 막차 시간, 버스면 도착/막차 정보를 프록시에서 가져옴
// ========================================================

// 막차 시간("00:54")까지 지금부터 몇 분 남았는지.
// 막차는 밤~새벽이므로, 이미 지난 시각이면 자정 넘긴 것으로 봄.
function minutesUntil(hhmm) {
  if (!hhmm || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  // 막차가 새벽(0~3시)인데 지금이 낮/저녁이면 → 내일 새벽
  if (h < 4 && now.getHours() >= 4) {
    target.setDate(target.getDate() + 1);
  }
  // 막차가 밤(20~23시)인데 이미 지났으면 → 이미 끊김(음수)
  const diff = Math.round((target - now) / 60000);
  return diff;
}

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
          {isSubway && station.line && (
            <span
              className="line-badge"
              style={{ background: lineColor(station.line) }}
            >
              {station.line}
            </span>
          )}
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
            <p className="lead">🌙 오늘 막차 · 놓치면 택시비 폭탄이야~ 🏃‍♀️💨</p>
            <ul className="list">
              {info.lastTrains.map((t, i) => {
                const left = minutesUntil(t.time);
                return (
                  <li
                    key={i}
                    className="train-item"
                    style={{
                      borderLeft: `4px solid ${lineColor(station.line)}`,
                    }}
                  >
                    <div className="train-main">
                      <span className="dir">{t.direction}</span>
                      <span className="time">{t.time}</span>
                    </div>
                    {left != null && (
                      <div className="left-time">
                        {left > 0 ? `${left}분 남았어!` : "끊겼어ㅠ"}
                      </div>
                    )}
                  </li>
                );
              })}
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
        .line-badge {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 800;
          color: #fff;
          margin-left: 6px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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
        .train-item {
          flex-direction: column;
          align-items: stretch !important;
          gap: 4px !important;
          padding: 12px 14px !important;
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          border-bottom: none !important;
        }
        .train-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .left-time {
          font-size: 13px;
          color: #ffe95c;
          font-weight: 700;
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
