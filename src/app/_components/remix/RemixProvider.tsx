"use client";
/**
 * B5 기획 초안 대화상자를 페이지에 하나만 두는 컨텍스트. 근거: docs/trend-dev/spec.md 3.5 · roadmap T7
 *
 *   <RemixProvider>                       브레이크아웃 표처럼 행마다 버튼이 있는 화면을 감싼다(서버 컴포넌트 안에 둬도 된다)
 *     … <RemixButton video={…} /> …       행 버튼은 video 만 넘겨 연다
 *   </RemixProvider>
 *
 * VideoModal 은 이 컨텍스트를 자기 값으로 덮어(RemixContext.Provider), 버튼을 누르면 새 대화상자를 겹치지 않고
 * 같은 대화상자 안 내용을 기획 초안 화면으로 바꾼다.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { RemixVideo } from "@/lib/trend/remix-schema";
import { RemixDialog } from "./RemixDialog";

export type RemixHost = {
  open: (video: RemixVideo) => void;
  /** true 면 새 대화상자를 열지 않고 지금 대화상자 안 내용을 바꾼다(VideoModal). 버튼에 aria-haspopup 을 달지 않는다 */
  inline?: boolean;
};

export const RemixContext = createContext<RemixHost | null>(null);

export function useRemixHost(): RemixHost | null {
  return useContext(RemixContext);
}

export function RemixProvider({ children }: { children: ReactNode }) {
  const [video, setVideo] = useState<RemixVideo | null>(null);
  const host = useMemo<RemixHost>(() => ({ open: setVideo }), []);
  return (
    <RemixContext.Provider value={host}>
      {children}
      {video && <RemixDialog key={video.videoId} video={video} onClose={() => setVideo(null)} />}
    </RemixContext.Provider>
  );
}
