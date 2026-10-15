"use client";

/**
 * 커뮤니티 머리 (클라이언트 잎)
 * 레이아웃은 서버 컴포넌트라 경로 판정을 여기서 한다.
 *   - /community(피드) 에서만 '비블 커뮤니티' 가 h1
 *   - 하위 화면(글 상세·글쓰기·랭킹·소개)은 자기 h1 이 있으므로 p (한 화면 h1 하나)
 * 오른쪽 '새 포스트' 가 이 화면의 흰 면 버튼 하나다.
 * 모바일은 사이드바(오픈채팅 참여코드)가 없으므로 머리 아래에 오픈채팅 보조 버튼을 둔다.
 */

import { KakaoTalkIcon } from "@/components/ui/icons";
import { usePathname } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import NewPostButton from "./NewPostButton";

export default function CommunityChrome() {
  const pathname = usePathname() || "/community";
  const isFeed = pathname === "/community";
  const Title = isFeed ? "h1" : "p";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Title className="text-h4 font-extrabold text-fg">비블 커뮤니티</Title>
          <p className="mt-1 text-caption text-fg-3">유튜브로 사업을 키우는 사람들의 공간</p>
        </div>
        <NewPostButton className={buttonClass({ variant: "primary", size: "md" }) + " shrink-0"} />
      </div>

      {/* 모바일 전용: 오픈채팅 (데스크톱은 사이드바 정보 카드) */}
      <a
        href="https://open.kakao.com/o/gsMC55Jh"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass({ variant: "secondary", block: true }) + " mt-4 lg:hidden"}
      >
        <KakaoTalkIcon size={20} />
        <span>비블 오픈채팅방 참여</span>
        <span className="text-caption font-medium text-fg-3">참여코드 230000</span>
        <span className="sr-only">(새 창)</span>
      </a>
    </div>
  );
}
