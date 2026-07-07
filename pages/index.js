import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import StationCard from "../components/StationCard";

// 카카오맵은 브라우저 전용(window 사용) → SSR 끄고 로드
const KakaoMap = dynamic(() => import("../components/KakaoMap"), {
  ssr: false,
});

// 기본 위치: 홍대입구역 (위치 권한 없을 때 폴백)
const DEFAULT_CENTER = { lat: 37.5572, lng: 126.9245 };

export default function Home() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [stations, setStations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("내 위치 찾는 중…♡");
  const [locReady, setLocReady] = useState(false);
  const [isMock, setIsMock] = useState(false);

  // 1) 내 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("위치 지원 안 됨 — 홍대 기준으로 표시할게~☆");
      setLocReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("");
        setLocReady(true);
      },
      () => {
        setStatus("위치 권한 거부됐어ㅠ 홍대 기준으로 보여줄게~☆");
        setLocReady(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // 2) 위치 기준 주변 정류장 불러오기 (프록시 호출)
  const loadNearby = useCallback(async (c) => {
    try {
      const r = await fetch(`/api/nearby?lng=${c.lng}&lat=${c.lat}&radius=500`);
      const d = await r.json();
      if (d.stations) {
        setStations(d.stations);
        setIsMock(!!d.mock);
        setStatus("");
      } else {
        setStatus("주변 정류장 못 불러왔어ㅠ: " + (d.error || d.message || "?"));
      }
    } catch (e) {
      setStatus("네트워크 삐끗ㅠ: " + String(e));
    }
  }, []);

  useEffect(() => {
    if (locReady) loadNearby(center);
  }, [locReady, center, loadNearby]);

  return (
    <div className="wrap">
      {/* 배경 반짝이 별들 */}
      <div className="stars" aria-hidden>
        {STAR_POSITIONS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: s.left,
              top: s.top,
              fontSize: s.size,
              animationDelay: s.delay,
            }}
          >
            {s.char}
          </span>
        ))}
      </div>

      <header className="top">
        <h1 className="logo">
          막차<span className="yaho">야호</span>
          <span className="star-badge">☆</span>
        </h1>
        <p className="sub">
          지금 안 타면 걸어가야 해~ 내 주변 막차{" "}
          <span className="count">{stations.length}</span>곳 발견
          {isMock && <span className="mock"> · 🧪데모</span>}
        </p>
      </header>

      <div className="map-area">
        <KakaoMap
          center={center}
          stations={stations}
          onStationClick={setSelected}
        />
        {status && <div className="status">{status}</div>}
      </div>

      <StationCard station={selected} onClose={() => setSelected(null)} />

      <style jsx>{`
        .wrap {
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(
            160deg,
            #1a0b2e 0%,
            #2d1155 40%,
            #4a1a6b 70%,
            #7a1f8f 100%
          );
          position: relative;
          overflow: hidden;
        }
        .stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .star {
          position: absolute;
          color: #ffd6f5;
          text-shadow: 0 0 8px #ff8ae2;
          animation: twinkle 2.4s ease-in-out infinite;
          opacity: 0.85;
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        .top {
          padding: 20px 20px 14px;
          position: relative;
          z-index: 2;
        }
        .logo {
          margin: 0;
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #ff6ec7 0%, #ff9ff3 50%, #b06bff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 12px rgba(255, 110, 199, 0.6));
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .yaho {
          font-style: italic;
        }
        .star-badge {
          -webkit-text-fill-color: #ffe95c;
          filter: drop-shadow(0 0 8px #ffd93d);
          animation: spin 4s linear infinite;
          display: inline-block;
          font-size: 26px;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .sub {
          margin: 8px 0 0;
          font-size: 13px;
          color: #ffd6f5;
          font-weight: 600;
        }
        .count {
          color: #ffe95c;
          font-weight: 900;
          font-size: 16px;
          text-shadow: 0 0 8px rgba(255, 233, 92, 0.6);
        }
        .mock {
          color: #ffe95c;
          font-weight: 700;
        }
        .map-area {
          flex: 1;
          position: relative;
          margin: 0 12px 12px;
          border-radius: 24px;
          overflow: hidden;
          border: 2px solid rgba(255, 110, 199, 0.5);
          box-shadow: 0 0 24px rgba(255, 110, 199, 0.35),
            inset 0 0 40px rgba(122, 31, 143, 0.2);
          z-index: 2;
        }
        .status {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #ff6ec7, #b06bff);
          color: #fff;
          padding: 9px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          z-index: 10;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(255, 110, 199, 0.5);
        }
      `}</style>
    </div>
  );
}

// 배경 별 위치 (고정 — 하이드레이션 안정성 위해 상수로)
const STAR_POSITIONS = [
  { left: "8%", top: "12%", size: "14px", delay: "0s", char: "✦" },
  { left: "22%", top: "28%", size: "10px", delay: "0.5s", char: "✧" },
  { left: "78%", top: "10%", size: "16px", delay: "0.2s", char: "★" },
  { left: "88%", top: "32%", size: "11px", delay: "0.9s", char: "✦" },
  { left: "15%", top: "60%", size: "12px", delay: "1.2s", char: "✧" },
  { left: "92%", top: "55%", size: "13px", delay: "0.4s", char: "☆" },
  { left: "45%", top: "8%", size: "10px", delay: "1.5s", char: "✦" },
  { left: "60%", top: "40%", size: "9px", delay: "0.7s", char: "✧" },
  { left: "35%", top: "48%", size: "11px", delay: "1.1s", char: "★" },
  { left: "70%", top: "22%", size: "10px", delay: "0.3s", char: "✦" },
];
