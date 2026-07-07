import { useEffect, useRef } from "react";

// ========================================================
// KakaoMap — 카카오맵을 띄우고, 내 위치 + 정류장 마커를 표시
// props:
//   center: {lat, lng}  지도 중심 (내 위치)
//   stations: [{id, name, class, x, y}]  주변 정류장/역
//   onStationClick: (station) => void   마커 클릭 콜백
// ========================================================

export default function KakaoMap({ center, stations = [], onStationClick }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markersRef = useRef([]);

  // 1) 카카오 SDK 로드 + 지도 생성
  useEffect(() => {
    const KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!KEY) {
      console.warn("NEXT_PUBLIC_KAKAO_JS_KEY 없음 — .env.local 확인");
      return;
    }

    // 이미 로드됐으면 재사용
    const init = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;
        const options = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: 4,
        };
        mapObj.current = new window.kakao.maps.Map(mapRef.current, options);

        // 내 위치 마커 (파란 원)
        const myPos = new window.kakao.maps.LatLng(center.lat, center.lng);
        new window.kakao.maps.Marker({
          position: myPos,
          map: mapObj.current,
          image: new window.kakao.maps.MarkerImage(
            "data:image/svg+xml;base64," +
              btoa(
                `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="11" fill="#ff6ec7" fill-opacity="0.3"/><circle cx="14" cy="14" r="7" fill="#b06bff" stroke="#fff" stroke-width="3"/></svg>`
              ),
            new window.kakao.maps.Size(28, 28)
          ),
        });
      });
    };

    if (window.kakao && window.kakao.maps) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  // 2) 정류장 마커 갱신
  useEffect(() => {
    if (!mapObj.current || !window.kakao) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    stations.forEach((s) => {
      const pos = new window.kakao.maps.LatLng(s.y, s.x);
      // 지하철=핑크, 버스=노랑 (갸루 네온)
      const color = s.class === 1 ? "#ff6ec7" : "#ffd93d";
      const marker = new window.kakao.maps.Marker({
        position: pos,
        map: mapObj.current,
        image: new window.kakao.maps.MarkerImage(
          "data:image/svg+xml;base64," +
            btoa(
              `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>`
            ),
          new window.kakao.maps.Size(24, 24)
        ),
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        onStationClick && onStationClick(s);
      });
      markersRef.current.push(marker);
    });
  }, [stations, onStationClick]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
