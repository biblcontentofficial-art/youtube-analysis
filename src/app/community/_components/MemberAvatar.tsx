/**
 * 회원 아바타 (소셜 로그인 프로필 사진 + 우하단 등급 배지)
 * 사진이 없거나 로드에 실패하면 이름 첫 글자 이니셜로 자연스럽게 폴백한다.
 */

import { GRADE_EMOJI, GRADE_NAMES, type MemberGrade } from "@/lib/community";

interface Props {
  name: string;
  /** 소셜 프로필 사진 URL (없으면 이니셜) */
  avatarUrl?: string | null;
  /** 회원 등급 1~4 (생략하면 배지 없음) */
  grade?: MemberGrade;
  /** 지름 px (기본 36 = h-9) */
  size?: number;
}

export default function MemberAvatar({ name, avatarUrl, grade, size = 36 }: Props) {
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "비";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        // 외부(구글·카카오) 이미지라 next/image 대신 img 를 쓴다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white"
          style={{ width: size, height: size }}
        >
          {initial}
        </div>
      )}
      {grade && (
        <span
          className="absolute -bottom-1 -right-1 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-900 text-[11px] leading-none"
          title={GRADE_NAMES[grade]}
          aria-label={`등급 ${GRADE_NAMES[grade]}`}
        >
          {GRADE_EMOJI[grade]}
        </span>
      )}
    </div>
  );
}
