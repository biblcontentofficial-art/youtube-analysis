import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** 홈 화면 아이콘. 실버 판 B(DESIGN 6.1): 판 #e3e3e3(logo-plate) + 검정 B(판 높이의 약 61%) */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#e3e3e3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 굵은 B 를 도형으로 그린다(ImageResponse 기본 글꼴에는 900 굵기가 없어 글자로는 얇게 나온다) */}
        <svg width={91.2} height={110} viewBox="20 12 68 82">
          <path fill="#000000" fillRule="evenodd" d="M20 12H58C74 12 84 21 84 34C84 42 80 48 73 51C83 54 88 61 88 71C88 86 77 94 60 94H20ZM42 29V44H55C60 44 63 41 63 36.5C63 32 60 29 55 29ZM42 60V77H57C63 77 66 74 66 68.5C66 63 63 60 57 60Z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
