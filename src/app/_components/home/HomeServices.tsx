/* eslint-disable @next/next/no-img-element -- 시안과 같은 크기의 정적 사진(public/home), 최적화 서버를 거치지 않는다 */
/**
 * 홈 서비스 5가지 #services(DESIGN 6.8 서비스 사진 카드 · 6.27 목록 패널 · 7.1 5행). 네비와 같은 두 묶음.
 * - 첫 기능(소유자 요청 2026-10-17): 유튜브 트렌드 서치 큰 카드. 그림 칸은 /trend-search 첫 화면(검색창 모양 + 결과 미리보기 표)
 * - 비블과 함께: 컨설팅 · 대행 사진 카드 + 인큐베이팅 큰 카드
 * - 함께 배우기: 커뮤니티&자료(1024 이상 미디어 칸 340px 목록 패널, 장식)
 * 카드 전체가 링크(제목 안 a 의 ::after). 포커스 링은 카드 둘레에 그린다.
 * 대행 링크는 결정 1 답 전까지 /studio/consulting(상담 신청). /studio 는 가드 때문에 일반 방문자가 홈으로 튕긴다.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SearchIcon } from "@/components/ui/icons";
import HomeResultPreview from "./HomeResultPreview";
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
  className = "lg:col-span-6",
  panel,
  title,
  href,
  desc,
  meta,
  more,
}: {
  className?: string;
  panel: { head: ReactNode; meta: string; items: { title: ReactNode; desc: string }[] };
  title: string;
  href: string;
  desc: string;
  meta: string[];
  more: string;
}) {
  return (
    <article className={cx(CARD, className)}>
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

/**
 * 유튜브 트렌드 서치 큰 카드: 위는 /trend-search 첫 화면 축소판(제목 · 검색창 모양 링크 · 예시 · 결과 미리보기 표),
 * 아래는 다른 카드와 같은 글 영역(제목 · 설명 · 무료 · 더 보기). 홈에서는 검색하지 않고 검색창을 누르면 /trend-search 로 간다.
 * 안에 링크가 여러 개라 카드 전체 링크(::after)를 쓰지 않는다.
 */
function TrendSearchCard() {
  const EXAMPLES = ["캠핑", "영어 공부", "주식 투자", "다이어트", "여행 브이로그"];
  return (
    <article className="overflow-hidden rounded-panel border border-line bg-surface">
      <div className="border-b border-line p-5 sm:p-6 lg:p-8">
        <p className="text-h4 font-extrabold md:text-h3">
          <span className="text-fg-3">키워드 하나로 </span>
          <span className="whitespace-nowrap">유튜브 트렌드</span>
          <span className="text-fg-3">를 파악하세요</span>
        </p>
        <Link
          href="/trend-search"
          className="group/search mt-5 flex h-14 max-w-2xl items-center gap-3 rounded-control border border-line-strong bg-canvas pl-4 pr-1.5 transition-colors duration-150 hover:border-line-hover"
        >
          <SearchIcon className="text-fg-3" />
          <span className="min-w-0 flex-1 truncate text-ui text-fg-3">분석할 키워드를 입력하세요</span>
          <span className="inline-flex h-11 shrink-0 items-center rounded-control bg-accent px-4 text-ui font-semibold text-accent-ink transition-colors duration-150 group-hover/search:bg-accent-hover">
            분석 시작
          </span>
          <span className="sr-only">유튜브 트렌드 서치에서 검색하기</span>
        </Link>
        <p aria-hidden="true" className="mt-3 flex flex-wrap items-center gap-1.5 text-caption text-fg-3">
          <span className="mr-1">예시</span>
          {EXAMPLES.map((k) => (
            <span key={k} className="inline-flex h-8 items-center rounded-control border border-line px-2.5 text-fg-2">{k}</span>
          ))}
        </p>
        <HomeResultPreview className="mt-6" linkHref="/trend-search" />
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:p-8">
        <div className="min-w-0">
          <h4 className="text-title">
            <Link href="/trend-search" className="hover:underline hover:underline-offset-4">유튜브 트렌드 서치</Link>
          </h4>
          <p className="mt-2.5 text-ui text-fg-2 lg:text-body">{`키워드${DOT}채널${DOT}데이터 분석 도구를 한곳에서 사용하세요. 영상 찾기${DOT}채널 찾기${DOT}채널 분석${DOT}브레이크아웃.`}</p>
        </div>
        <div className="shrink-0 border-t border-line pt-4 lg:min-w-[280px]">
          <p className="tnum text-h4 font-extrabold">무료</p>
          <Meta items={["영상 검색 하루 2회", "유료 월 19,000원부터"]} className="tnum mt-1" />
          <Link href="/trend-search" className={cx(MORE, "hover:text-fg-2")}>
            검색해 보기 <span aria-hidden="true" className={ARROW}>→</span>
          </Link>
        </div>
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

        {/* 첫 기능: 유튜브 트렌드 서치 */}
        <div className="mt-12 md:mt-16">
          <GroupHead title="직접 하기" desc="키워드 하나로 유튜브 트렌드를 바로 확인합니다" />
          <div className="mt-4">
            <TrendSearchCard />
          </div>
        </div>

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
              meta={["부가세 별도", "롱폼 4개 + 숏폼 10개"]}
              more="채널 대행 문의하기"
            />

            {/* 브랜드 인큐베이팅: 가로 전체 카드. 1024 이상은 왼쪽 사진·오른쪽 글이고, 높이를 위 두 카드와 같게 맞춘다.
                위 카드 높이 = 테두리 2px + 안쪽 폭의 16:9 사진 + 글 영역 302px. 위 카드 안쪽 폭 = (이 카드 안쪽 폭 cqw - 26px) / 2 → 사진 칸 높이를 같은 식으로 잡는다. */}
            <article className={cx(CARD, "@container lg:col-span-12 lg:grid lg:grid-cols-2")}>
              <div className="aspect-video overflow-hidden bg-surface-2 lg:aspect-auto lg:h-[calc((100cqw-26px)/2*0.5625+302px)]">
                <img
                  src="/home/svc-incubating-2.webp"
                  width={736}
                  height={981}
                  alt="높은 창가의 회의 테이블에 둘러앉아 이야기하는 사람들(흑백 사진)"
                  className="size-full object-cover object-[50%_78%]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-col p-5 sm:p-6 lg:p-8">
                <h4 className="text-title">
                  <Link href="/incubating" className={CARD_LINK}>브랜드 인큐베이팅</Link>
                </h4>
                <p className="mt-2.5 text-ui text-fg-2 lg:text-body">
                  {`채널 기획${DOT}제작${DOT}마케팅${DOT}상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.`}
                </p>
                <div className="mt-auto pt-6 lg:pt-8">
                  <div className="border-t border-line pt-4">
                    <p className="text-h4 font-extrabold">{`영어${DOT}수학 선생님 모집`}</p>
                    <Meta items={[`오픈채팅${DOT}메일로 지원`]} className="mt-1" />
                  </div>
                  <p aria-hidden="true" className={MORE}>
                    오픈채팅으로 지원하기 <span className={ARROW}>→</span>
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* 함께 배우기 */}
        <div className="mt-12 md:mt-16">
          <GroupHead title="함께 배우기" desc="실무 자료와 회원들의 답으로 혼자서도 꾸준히" />
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-6">
            <ToolCard
              className="lg:col-span-12"
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
