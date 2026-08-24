"use client";

/**
 * 조회수 추적 — 마운트 시 1회만 POST /api/community/view 를 호출한다.
 *
 * 서버 렌더에서 올리면 댓글 등록·삭제 후 router.refresh() 마다 조회수가 늘어난다.
 * 그래서 조회수 증가는 이 클라이언트 컴포넌트가 전담한다.
 * - skip(작성자·운영진 본인)이면 아무 것도 하지 않는다.
 * - sessionStorage `cv:${postId}` 로 같은 세션 중복 호출을 막는다.
 * - 실패는 조용히 무시하고 화면에는 아무 것도 렌더하지 않는다.
 */

import { useEffect } from "react";

interface Props {
  postId: string;
  skip?: boolean;
}

export default function ViewTracker({ postId, skip = false }: Props) {
  useEffect(() => {
    if (skip || !postId) return;

    const key = `cv:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // 프라이빗 모드 등으로 sessionStorage 를 못 쓰면 중복 차단 없이 진행한다
    }

    void fetch("/api/community/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {
      // 조회수는 실패해도 사용자에게 알리지 않는다
    });
  }, [postId, skip]);

  return null;
}
