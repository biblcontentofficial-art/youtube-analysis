import { ImageResponse } from "next/og";

export const alt = "비블랩 - 유튜브 키워드·채널 분석 도구";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #030712 0%, #0f172a 50%, #030712 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#000",
              border: "2px solid #374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 40, fontWeight: 900 }}>B</span>
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, color: "white" }}>
            bibl <span style={{ color: "#2dd4bf" }}>lab</span>
          </span>
        </div>
        <p style={{ fontSize: 28, color: "#9ca3af", margin: 0, textAlign: "center" }}>
          유튜브 키워드·채널 분석 도구
        </p>
        <p style={{ fontSize: 18, color: "#6b7280", margin: "12px 0 0 0", textAlign: "center" }}>
          트렌드 선점 · 반응도 분석 · 채널 찾기 · 영상 수집
        </p>
      </div>
    ),
    { ...size }
  );
}
