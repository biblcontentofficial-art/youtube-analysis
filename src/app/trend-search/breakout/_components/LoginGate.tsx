/**
 * 브레이크아웃 구역 로그인 안내 상자(비로그인). 다섯 탭이 같이 쓴다.
 * 기존 breakout/page.tsx 의 안내 상자를 그대로 옮기고, 돌아올 주소(next)와 앞 한 줄 설명(desc)만 받는다.
 * 섹션 머리·h1 은 탭마다 달라서 page 가 그린다.
 *
 *   <LoginGate next="/trend-search/breakout" desc="오늘 유튜브에서 …" />
 *
 * 상태 메시지(DESIGN 6.13 안내): 기호는 fg-2, 면은 칠하지 않는다. 주 버튼(흰 면)은 이 화면에 하나뿐이다.
 */
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { InfoIcon } from "@/components/ui/icons";

export function LoginGate({ next, desc }: { next: string; desc: string }) {
  return (
    <div className="mt-8 flex max-w-reading gap-3 rounded-card border border-line bg-surface p-4 md:p-5">
      <InfoIcon className="mt-0.5 text-fg-2" />
      <div className="min-w-0">
        <p className="text-body-sm text-fg-2 md:text-ui">{desc} <span className="font-semibold text-fg">로그인하면 바로 볼 수 있어요.</span></p>
        <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className={`${buttonClass({ variant: "primary", size: "md" })} mt-4`}>로그인하고 보기</Link>
      </div>
    </div>
  );
}
