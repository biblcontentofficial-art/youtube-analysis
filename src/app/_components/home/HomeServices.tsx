/* eslint-disable @next/next/no-img-element -- 시안과 같은 크기의 정적 사진(public/home), 최적화 서버를 거치지 않는다 */
/**
 * 홈 서비스 5가지 #services(DESIGN 6.8 서비스 사진 카드 · 6.27 목록 패널 · 7.1 5행). 네비와 같은 두 묶음.
 * - 배치(소유자 요청 2026-10-17): 1줄 유튜브 트렌드 서치 큰 카드(그림 = /trend-search 첫 화면 축소판)
 *   2줄 팀비블 1:1 컨설팅 · 유튜브 채널 대행, 3줄 브랜드 인큐베이팅 · 커뮤니티 & 무료자료(모두 사진 카드)
 * 카드 전체가 링크(제목 안 a 의 ::after). 포커스 링은 카드 둘레에 그린다.
 * 모션 A(소유자 결정 2026-10-17): 머리·제목·카드가 화면에 들어올 때 한 번 떠오른다(data-animate="rise", 홈 AnimationObserver).
 *   사진 카드는 hover 때 선 색(기존) + 액자 안 사진만 1.02 확대(카드 들림 없음, 움직임 줄이기면 확대 없음).
 *   등장은 카드 바깥 칸(div)에 건다: 카드의 transition-colors 가 등장 전환을 덮지 않게.
 * 팀비블 카드(4기 마감, 2026-10-26): 컨설팅 페이지 #reserve 로 가서 5기 사전예약 창을 바로 연다.
 * 대행 링크는 결정 1 답 전까지 /studio/consulting(상담 신청). /studio 는 가드 때문에 일반 방문자가 홈으로 튕긴다.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SearchIcon } from "@/components/ui/icons";
import HomeResultPreview from "./HomeResultPreview";

/** 마케팅 카드(누를 수 있는 카드라 hover 는 선 색, 사진 카드는 사진만 1.02 확대) + 카드 둘레 포커스 링 */
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
    <div data-animate="rise" className={cx("flex", className)}>
      <article className={cx(CARD, "min-w-0 flex-1")}>
        <div className="aspect-video overflow-hidden bg-surface-2">
          <img
            src={img.src}
            width={img.width}
            height={img.height}
            alt={img.alt}
            className={cx(
              "size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.02]",
              img.position,
            )}
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
    </div>
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


export default function HomeServices() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-wide px-6 py-16 md:py-24 lg:px-8">
        <SectionHeader caption="비블랩 서비스 5가지" label="SERVICES" animate="rise" />
        <h2 id="services-title" data-animate="rise" className="text-h3 md:text-h1">
          <span className="block text-fg-3">여러분의 유튜브 성공을</span>
          <span className="block">돕기 위해 연구합니다</span>
        </h2>

        {/* 서비스 5가지(소유자 배치 2026-10-17): 1줄 트렌드 서치 · 2줄 컨설팅·채널 대행 · 3줄 인큐베이팅·커뮤니티 */}
        <div className="mt-12 grid grid-cols-1 gap-4 md:mt-16 lg:grid-cols-12 lg:gap-6">
          <div data-animate="rise" className="lg:col-span-12">
            <TrendSearchCard />
          </div>
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
              href="/studio/class/consulting#reserve"
              desc="유튜브 채널 성장과 함께 사업을 성장시키는 방법까지, 비블이 1:1로 함께합니다."
              price="월 49만원"
              meta={["매주 1:1 미팅", "VOD 100강", "오프라인 커뮤니티"]}
              more="5기 사전예약하기"
            />
            <PhotoCard
              className="lg:col-span-6"
              img={{
                src: "/home/svc-studio-photo.webp",
                width: 736,
                height: 981,
                alt: "흰 배경 촬영 스튜디오에서 조명을 세우고 촬영을 준비하는 사람들",
                position: "object-[50%_60%]",
              }}
              title="유튜브 채널 대행"
              href="/studio/consulting"
              desc={`검증된 유튜브 전문가와 성장을 함께하세요. 기획${DOT}촬영${DOT}편집${DOT}업로드${DOT}채널관리까지 책임지고 운영해드립니다.`}
              price="월 350만원"
              meta={["부가세 별도", "롱폼 4개 + 숏폼 10개"]}
              more="채널 대행 문의하기"
            />
            <PhotoCard
              className="lg:col-span-6"
              img={{
                src: "/home/svc-incubating-2.webp",
                width: 736,
                height: 981,
                alt: "높은 창가의 회의 테이블에 둘러앉아 이야기하는 사람들(흑백 사진)",
                position: "object-[50%_78%]",
              }}
              title="브랜드 인큐베이팅"
              href="/incubating"
              desc={`채널 기획${DOT}제작${DOT}마케팅${DOT}상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.`}
              price={`영어${DOT}수학 선생님 모집`}
              meta={[`오픈채팅${DOT}메일로 지원`]}
              more="오픈채팅으로 지원하기"
            />
            <PhotoCard
              className="lg:col-span-6"
              img={{
                src: "/home/svc-community.webp",
                width: 480,
                height: 600,
                alt: "모임 공간에 모여 앉아 발표를 듣는 사람들",
                position: "object-[50%_62%]",
              }}
              title="커뮤니티 & 무료자료"
              href="/community"
              desc={`막히는 지점을 묻고, 기획 템플릿${DOT}체크리스트${DOT}전자책 같은 실무 자료를 무료로 받아갑니다.`}
              price="무료"
              meta={["회원가입만 하면 입장", "멤버 1,409명"]}
              more="무료로 가입하고 입장하기"
            />
        </div>
      </div>
    </section>
  );
}
