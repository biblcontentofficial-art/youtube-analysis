/* eslint-disable @next/next/no-img-element -- 시안과 같은 크기의 정적 사진(public/home), 최적화 서버를 거치지 않는다 */
/**
 * 홈 서비스 5가지 #services(DESIGN 6.8 서비스 사진 카드 · 6.27 목록 패널 · 7.1 5행). 네비와 같은 두 묶음.
 * - 비블과 함께: 컨설팅 5칸 · 대행 7칸 사진 카드 + 인큐베이팅 가로 띠
 * - 직접 하기: 트렌드 서치 · 커뮤니티&자료(1024 이상 미디어 칸 340px 목록 패널, 장식)
 * 카드 전체가 링크(제목 안 a 의 ::after). 포커스 링은 카드 둘레에 그린다.
 * 대행 링크는 결정 1 답 전까지 /studio/consulting(상담 신청). /studio 는 가드 때문에 일반 방문자가 홈으로 튕긴다.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import {
  LIST_PANEL,
  LIST_PANEL_DESC,
  LIST_PANEL_HEAD,
  LIST_PANEL_HEAD_META,
  LIST_PANEL_ITEM,
  LIST_PANEL_LIST,
  LIST_PANEL_TITLE,
} from "@/components/ui/list-panel";

/** 마케팅 카드(누를 수 있는 카드라 hover 는 선 색만) + 카드 둘레 포커스 링 */
const CARD =
  "group relative flex flex-col overflow-hidden rounded-panel border border-line bg-surface transition-colors duration-150 hover:border-line-hover has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent";

/** 제목 안 링크: 카드 전체를 덮는다. 링 자체는 카드가 그린다 */
const CARD_LINK = "after:absolute after:inset-0 focus-visible:outline-0";

const MORE = "mt-4 inline-flex items-center gap-1.5 text-ui font-semibold";
const ARROW = "transition-transform duration-150 group-hover:translate-x-0.5";

/** 가운뎃점에서 줄이 갈리지 않게 앞뒤에 WORD JOINER(U+2060) */
const DOT = "⁠·⁠";

function Meta({ items, className }: { items: string[]; className?: string }) {
  return (
    <p className={cx("text-caption text-fg-3", className)}>
      {items.map((item, i) => (
        <span key={item}>
          {i > 0 ? " · " : null}
          <span className="whitespace-nowrap">{item}</span>
        </span>
      ))}
    </p>
  );
}

function GroupHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <h3 className="text-ui font-bold">{title}</h3>
      <p className="text-caption text-fg-3">{desc}</p>
    </div>
  );
}

function PhotoCard({
  className,
  img,
  title,
  href,
  desc,
  price,
  meta,
  more,
}: {
  className: string;
  img: { src: string; width: number; height: number; alt: string; position: string };
  title: string;
  href: string;
  desc: ReactNode;
  price: string;
  meta: string[];
  more: string;
}) {
  return (
    <article className={cx(CARD, className)}>
      <div className="aspect-video overflow-hidden bg-surface-2">
        <img
          src={img.src}
          width={img.width}
          height={img.height}
          alt={img.alt}
          className={cx("size-full object-cover", img.position)}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-8">
        <h4 className="text-title">
          <Link href={href} className={CARD_LINK}>{title}</Link>
        </h4>
        <p className="mt-2.5 text-ui text-fg-2 lg:text-body">{desc}</p>
        <div className="mt-auto pt-6 lg:pt-8">
          <div className="border-t border-line pt-4">
            <p className="tnum text-h4 font-extrabold">{price}</p>
            <Meta items={meta} className="mt-1" />
          </div>
          <p aria-hidden="true" className={MORE}>
            {more} <span className={ARROW}>→</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function ToolCard({
  panel,
  title,
  href,
  desc,
  meta,
  more,
}: {
  panel: { head: ReactNode; meta: string; items: { title: ReactNode; desc: string }[] };
  title: string;
  href: string;
  desc: string;
  meta: string[];
  more: string;
}) {
  return (
    <article className={cx(CARD, "lg:col-span-6")}>
      {/* 1024 이상 미디어 칸: 장식 목록(누를 수 없음). 목록이 보이는 폭에서는 같은 말을 하는 설명 문장을 숨긴다 */}
      <div aria-hidden="true" className={cx(LIST_PANEL.media, "pointer-events-none hidden select-none lg:flex lg:h-[340px]")}>
        <div className={LIST_PANEL_HEAD}>
          {panel.head}
          <span className={LIST_PANEL_HEAD_META}>{panel.meta}</span>
        </div>
        <ul className={LIST_PANEL_LIST}>
          {panel.items.map((item) => (
            <li key={item.desc} className={LIST_PANEL_ITEM}>
              <p className={LIST_PANEL_TITLE}>{item.title}</p>
              <p className={LIST_PANEL_DESC}>{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-1 items-center gap-4 p-5 sm:p-6 lg:flex-col lg:items-stretch lg:gap-0 lg:p-8">
        <div className="min-w-0 flex-1 lg:flex lg:flex-col">
          <h4 className="text-title">
            <Link href={href} className={CARD_LINK}>{title}</Link>
          </h4>
          <p className="mt-1.5 text-body-sm text-fg-2 lg:hidden">{desc}</p>
          <div className="mt-3 lg:mt-auto lg:pt-6">
            <div className="flex flex-wrap items-baseline gap-x-2 lg:block lg:border-t lg:border-line lg:pt-4">
              <p className="tnum text-h4 font-extrabold">무료</p>
              <Meta items={meta} className="tnum lg:mt-1" />
            </div>
            <p aria-hidden="true" className={cx(MORE, "hidden lg:inline-flex")}>
              {more} <span className={ARROW}>→</span>
            </p>
          </div>
        </div>
        <span aria-hidden="true" className={cx("shrink-0 text-h4 text-fg-3 lg:hidden", ARROW)}>→</span>
      </div>
    </article>
  );
}

const PRO_TAG = "rounded border border-line-strong px-1 text-micro leading-[18px] text-fg-3";

export default function HomeServices() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-wide px-6 py-16 md:py-24 lg:px-8">
        <SectionHeader caption="비블랩 서비스 5가지" label="SERVICES" />
        <h2 id="services-title" className="text-h3 md:text-h1">
          <span className="block text-fg-3">비블과 함께하거나, 직접 하거나</span>
          <span className="block">필요한 만큼 고르세요</span>
        </h2>

        {/* 비블과 함께 */}
        <div className="mt-12 md:mt-16">
          <GroupHead title="비블과 함께" desc="비블이 직접 가르치고, 맡아서 운영하고, 함께 만듭니다" />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
            <PhotoCard
              className="lg:col-span-6"
              img={{
                src: "/home/svc-consulting-thumb.webp",
                width: 1280,
                height: 720,
                alt: "1:1 유튜브 컨설팅 팀비블 썸네일. 칠판 앞에서 마주 앉아 이야기하는 비블과 수강생",
                position: "object-center",
              }}
              title="팀비블 1:1 유튜브 컨설팅"
              href="/studio/class/consulting"
              desc="유튜브 채널 성장과 함께 사업을 성장시키는 방법까지, 비블이 1:1로 함께합니다."
              price="월 49만원"
              meta={["매주 1:1 미팅", "VOD 100강", "오프라인 커뮤니티"]}
              more="1:1 팀비블 신청하기"
            />
            <PhotoCard
              className="lg:col-span-6"
              img={{
                src: "/home/svc-studio-thumb.webp",
                width: 1280,
                height: 720,
                alt: "유튜브 채널대행(제작 및 운영) 썸네일. 실버 플레이 버튼 옆에서 이야기하는 비블",
                position: "object-center",
              }}
              title="유튜브 채널 대행"
              href="/studio/consulting"
              desc={`검증된 유튜브 전문가와 성장을 함께하세요. 기획${DOT}촬영${DOT}편집${DOT}업로드${DOT}채널관리까지 책임지고 운영해드립니다.`}
              price="월 350만원"
              meta={["부가세 별도", "롱폼 4개 + 쇼츠 4개"]}
              more="채널 대행 문의하기"
            />

            <article className={cx(CARD, "p-5 sm:p-6 lg:col-span-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-6 lg:px-8 lg:py-7")}>
              <div className="lg:col-span-4">
                <h4 className="text-title">
                  <Link href="/incubating" className={CARD_LINK}>브랜드 인큐베이팅</Link>
                </h4>
                <Meta items={[`영어${DOT}수학 선생님 모집`, `오픈채팅${DOT}메일로 지원`]} className="mt-1" />
              </div>
              <p className="mt-3 text-ui text-fg-2 lg:col-span-5 lg:mt-0 lg:text-body">
                {`채널 기획${DOT}제작${DOT}마케팅${DOT}상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.`}
              </p>
              <p aria-hidden="true" className={cx(MORE, "lg:col-span-3 lg:mt-0 lg:justify-self-end")}>
                오픈채팅으로 지원하기 <span className={ARROW}>→</span>
              </p>
            </article>
          </div>
        </div>

        {/* 직접 하기 */}
        <div className="mt-12 md:mt-16">
          <GroupHead title="직접 하기" desc="분석 도구와 실무 자료로 혼자서도 꾸준히" />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-6">
            <ToolCard
              panel={{
                head: <span className="text-caption font-semibold text-fg">분석 도구 4가지</span>,
                meta: "Free · Starter · Pro",
                items: [
                  { title: "영상 찾기", desc: "키워드로 최신 유튜브 영상을 수집합니다." },
                  { title: "채널 찾기", desc: `구독자 급상승${DOT}신생 채널 필터를 제공합니다.` },
                  { title: "채널 분석", desc: "내 채널의 데이터를 분석해 개선 포인트를 확인합니다." },
                  {
                    title: (
                      <>
                        수집한 영상<span className={PRO_TAG}>Pro</span>
                      </>
                    ),
                    desc: "마음에 드는 영상을 수집하고 CSV로 내보냅니다.",
                  },
                ],
              }}
              title="유튜브 트렌드 서치"
              href="/trend-search"
              desc={`키워드${DOT}채널${DOT}데이터 분석 도구를 한곳에서 사용하세요.`}
              meta={["영상 검색 하루 2회", "유료 월 19,000원부터"]}
              more="도구 4가지 보기"
            />
            <ToolCard
              panel={{
                head: (
                  <img src="/home/community-wordmark.png" width={743} height={91} alt="" className="h-[18px] w-auto" loading="lazy" decoding="async" />
                ),
                meta: "회원 전용 게시판",
                items: [
                  { title: "유튜브 실전 Q&A", desc: "막히는 지점을 묻고, 먼저 겪은 회원들의 답을 받습니다." },
                  { title: "자료실 다운로드", desc: `기획 템플릿${DOT}체크리스트${DOT}전자책 등 실무 자료를 받아갑니다.` },
                  { title: "매일 챌린지 · 스터디", desc: "혼자서는 못 지키는 업로드 루틴을 함께 만듭니다." },
                  { title: "성과 공유 · 협업", desc: "채널 성장과 매출 사례, 구인구직과 협업 제안이 오갑니다." },
                ],
              }}
              title="커뮤니티&자료"
              href="/community"
              desc={`막히는 지점을 묻고, 기획 템플릿${DOT}체크리스트${DOT}전자책 같은 실무 자료를 받아갑니다.`}
              meta={["회원가입만 하면 입장", "멤버 1,409명"]}
              more="무료로 가입하고 입장하기"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
