/**
 * 검색 결과 아래 안내 카드 2장 (DESIGN 7.2 7행, 시안 design-final/silver/app.html 696~722행)
 * ① Pro 플랜(영상 수집 · CSV 내보내기 · 채널 분석 리포트) ② 팀비블 1:1 유튜브 컨설팅
 *
 * - 문구는 시안 그대로. Pro 가격·한도는 limitCopy 의 PRO 상수(한도 모달·인라인 카드와 같은 출처)에서 읽는다.
 *   컨설팅 월 49만원 · 매주 1회 1:1 · VOD 100강 (studio/class/consulting/page.tsx)
 * - 흰 면 없음(보조 버튼만). 이미 Pro 기능을 쓰는 계정에는 ① 을 그리지 않는다.
 */
import Link from "next/link";
import ChannelAvatar from "@/app/_components/home/ChannelAvatar";
import { cx } from "@/components/ui/button";
import { BTN_SECONDARY } from "./SelectionBar";
import { PRO } from "./limitCopy";

const BIBL_AVATAR =
  "https://yt3.googleusercontent.com/1wD45zOpnfNTAG4Kq8qs2T27tNyxqXTKC5a23qB6N8zl5SNlU8ugdUCx2yywcrFnBqywfz2z9w=s240-c-k-c0x00ffffff-no-rj";

const FOOT_CARD = "flex flex-col justify-between gap-5 rounded-card border border-line bg-surface p-5 lg:p-6";
const FOOT_ACTION = cx(BTN_SECONDARY, "h-11 self-start px-5 text-body-sm");
const NB = "whitespace-nowrap";
/** "월 ₩45,000 (연간 결제 시 월 ₩39,000)" → 줄바꿈은 괄호 앞에서만 */
const PRO_PRICE = PRO.price.split(/ (?=\()/);

export default function ResultFootCards({ showPlanCard = true }: { showPlanCard?: boolean }) {
  return (
    // 카드가 1장(Pro 계정)이면 2열로 나누지 않고 전체 폭으로 그린다
    <div className={cx("mt-12 grid gap-3 md:gap-4", showPlanCard && "md:grid-cols-2")} data-result-foot>
      {showPlanCard && (
        <aside aria-label="Pro 플랜 안내" className={FOOT_CARD}>
          <div>
            <p className="text-caption text-fg-3">Pro 플랜</p>
            <p className="mt-1 text-lead font-bold leading-[1.45] text-fg">
              <span className={NB}>영상 수집</span> · <span className={NB}>CSV 내보내기</span> ·{" "}
              <span className={NB}>채널 분석 리포트</span>
            </p>
            <p className="tnum mt-1.5 text-caption text-fg-3">
              {PRO_PRICE.map((part) => (
                <span key={part} className={NB}>
                  {part}{" "}
                </span>
              ))}
              · <span className={NB}>{PRO.searches}</span>
            </p>
          </div>
          <Link href="/pricing" className={FOOT_ACTION}>
            요금제 보기
          </Link>
        </aside>
      )}
      <aside aria-label="팀비블 1:1 유튜브 컨설팅 안내" className={FOOT_CARD}>
        <div className="flex items-start gap-4">
          <ChannelAvatar src={BIBL_AVATAR} size={48} className="size-12" />
          <div>
            <p className="text-caption text-fg-3">팀비블 1:1 유튜브 컨설팅</p>
            <p className="mt-1 text-lead font-bold leading-[1.45] text-fg">
              검색 결과를 어떤 영상으로 만들지 막막하다면, 비블과 1:1로 정하세요
            </p>
            <p className="tnum mt-1.5 text-caption text-fg-3">
              <span className={NB}>월 49만원</span> · <span className={NB}>매주 1:1 미팅</span> ·{" "}
              <span className={NB}>VOD 100강</span>
            </p>
          </div>
        </div>
        <Link href="/studio/class/consulting" className={FOOT_ACTION}>
          컨설팅 알아보기
        </Link>
      </aside>
    </div>
  );
}
