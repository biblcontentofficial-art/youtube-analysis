import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#0d9488", // teal-600
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "sans-serif",
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          bi
        </span>
      </div>
    ),
    { ...size }
  );
}
