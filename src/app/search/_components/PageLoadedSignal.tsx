"use client";

import { useEffect, useRef } from "react";
import { useNavigationLoading } from "@/app/_components/NavigationLoader";

/**
 * 검색 결과 페이지가 완전히 마운트되면 로딩 오버레이를 닫습니다.
 * 부모에서 key를 검색마다 변경해 주어야 매번 리마운트가 보장됩니다.
 * (예: key={`signal-${query}-${filter}-${searchCount}`})
 */
export default function PageLoadedSignal() {
  const { hideLoading } = useNavigationLoading();
  // ref로 최신 hideLoading 참조 유지
  const hideRef = useRef(hideLoading);
  hideRef.current = hideLoading;

  useEffect(() => {
    // 마운트 즉시 로딩 해제
    hideRef.current();
  }, []); // 의존성 배열 비움 → 리마운트 시 항상 실행

  return null;
}
