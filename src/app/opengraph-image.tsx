import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "bibl lab - 유튜브 키워드 분석 도구";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Google Fonts에서 Noto Sans KR 로드 (한글 지원)
  const fontData = await fetch(
    "https://fonts.gstatic.com/s/notosanskr/v36/PbykFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: "#030712",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Noto Sans KR, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 그라디언트 */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(45,212,191,0.10) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* 상단 장식선 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, #2dd4bf 50%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* 로고 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 36,
          }}
        >
          {/* 플레이버튼 아이콘 */}
          <div
            style={{
              width: 60,
              height: 60,
              background: "#000",
              border: "1.5px solid #374151",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={28}
              height={28}
              fill="white"
            >
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
            <span style={{ color: "white", fontSize: 48, fontWeight: 700 }}>
              bibl
            </span>
            <span style={{ color: "#2dd4bf", fontSize: 48, fontWeight: 700 }}>
              {" "}
              lab
            </span>
          </div>
        </div>

        {/* 메인 헤드라인 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1px",
              textAlign: "center",
              display: "flex",
            }}
          >
            유튜브 키워드로 트렌드를
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            <span style={{ color: "#2dd4bf" }}>선점</span>
            <span style={{ color: "white" }}>하세요</span>
          </div>
        </div>

        {/* 서브타이틀 */}
        <div
          style={{
            color: "#6b7280",
            fontSize: 26,
            textAlign: "center",
            marginBottom: 52,
            display: "flex",
          }}
        >
          조회수 · 구독자 · 반응도를 한눈에 분석
        </div>

        {/* 하단 필 태그 */}
        <div style={{ display: "flex", gap: 14 }}>
          {["반응도 분석", "키워드 트렌드", "채널 인사이트"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(45, 212, 191, 0.08)",
                border: "1px solid rgba(45, 212, 191, 0.25)",
                borderRadius: 100,
                padding: "10px 26px",
                color: "#5eead4",
                fontSize: 20,
                fontWeight: 500,
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* URL 뱃지 */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            color: "#374151",
            fontSize: 18,
            display: "flex",
          }}
        >
          bibllab.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans KR",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
