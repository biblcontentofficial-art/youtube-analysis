import Image from "next/image";
import Link from "next/link";
import TrackVisit from "@/app/_components/TrackVisit";
import { BottomCTABar } from "@/components/ui/bottom-cta-bar";
import { buttonClass } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { ReserveButton, ReserveDialog } from "./_components/Reserve";

/**
 * 팀비블 1:1 유튜브 컨설팅 상세 페이지 (서버 컴포넌트, 방문 기록·하단 바만 클라이언트)
 * - 첫 화면: 사진 카드 히어로 + '월 49만원' + 이미지 속 사실(4.png 구성, 6.png 결제) + 신청 버튼
 * - 상세 이미지 7장 (public/studio/consulting/1~7.png). 실제 크기를 선언해 로딩 중 높이가 바뀌지 않게 한다
 * - 가격 이미지(6번) 바로 뒤에 HTML 신청 블록
 * - 4기 마감(소유자 2026-10-21): 신청 버튼은 모두 "5기 사전예약하기" → 같은 페이지 설문 팝업(_components/Reserve.tsx).
 *   Latpeed 결제 주소는 아래 주석(APPLY_URL)에 남겨 둔다.
 * - '20명 소수 정예 · 평균 3개월 대기'는 결정 6 전까지 이미지 안에만 둔다(HTML 에 올리지 않음)
 */

// 5기 결제를 다시 열 때 쓴다(지금은 사전예약):
// const APPLY_URL = "https://www.latpeed.com/memberships/6969983ba5c296323a6eb78c/pay/eLjQa";

/** 상세 이미지: 실제 크기(1000px 폭) + 이미지 속 소제목 한 줄 alt + 점프 링크 앵커 */
const DETAIL_IMAGES: { n: number; height: number; alt: string; id?: string }[] =
  [
    {
      n: 1,
      height: 8695,
      alt: "유튜브를 통한 수익화 어떻게 해야 될까? 비블이 운영하는 채널과, 이 컨설팅이 뭐가 다른가요",
    },
    {
      n: 2,
      height: 10132,
      alt: "저는 총 구독자 70만 유튜버이며, 사업을 직접 하고 있는 사업가입니다. 세계유명 골프정보 채널 사례",
    },
    {
      n: 3,
      height: 7741,
      alt: "영어키위새 채널 사례: 내 업을 어떻게 유튜브 안에서 잘 해나갈 수 있을까",
    },
    {
      n: 4,
      height: 8637,
      alt: "1:1 컨설팅 팀비블 안내, 비블의 컨설팅 차별점은 명확합니다",
      id: "process",
    },
    {
      n: 5,
      height: 7379,
      alt: "왜 내 유튜브는 안 됐던 걸까? 그래서 비블의 1:1 컨설팅은 업종 구조 파악부터 매출 전환 구조까지",
    },
    {
      n: 6,
      height: 8465,
      alt: "현재 비블과 함께하는 분들의 후기, 자주 묻는 질문, 팀비블 1:1 맞춤 컨설팅 부가세 포함 월 490,000원",
      id: "review",
    },
    { n: 7, height: 5066, alt: "팀 비블, 유튜브 프로젝트 목차", id: "toc" },
  ];

/** 이미지 속 기존 문장(4.png 1~4번 구성). 새 수치는 넣지 않는다 */
const FACTS = [
  "매주 1회, 30분간 비블 1:1 컨설팅",
  "유튜브, 비즈니스 VOD 100강 제공",
  "매월 오프라인 유튜버 커뮤니티",
  "24시간 내 답변드리는 비블 핫라인",
];

const JUMP_LINKS = [
  { href: "#process", label: "구성" },
  { href: "#review", label: "후기" },
  { href: "#faq", label: "FAQ" },
  { href: "#toc", label: "목차" },
];

// data-apply-cta: 이 버튼이 화면에 보이는 동안 하단 고정 신청 바를 숨긴다(흰 버튼은 한 화면에 하나)
function ApplyButton({ block = false }: { block?: boolean }) {
  return (
    <ReserveButton data-apply-cta="" className={buttonClass({ size: "lg", block })}>
      5기 사전예약하기
      <ArrowRightIcon size={20} />
    </ReserveButton>
  );
}

export default function TeamBiblConsultingPage() {
  return (
    <main className="min-h-screen bg-canvas text-fg">
      {/* 방문 기록은 페이지당 한 번 (신청 버튼마다 두면 첫 방문에 2건이 쌓인다) */}
      <TrackVisit page="consulting-class" />

      {/* 보조 헤더 (데스크톱 한 줄 메뉴 이상에서만: 그 아래는 하단 고정 바가 신청을 맡는다) */}
      <div className="sticky top-[var(--nav-h)] z-30 hidden border-b border-line bg-canvas nav:block">
        <div className="mx-auto flex h-14 max-w-wide items-center justify-between px-6 lg:px-8">
          <Link
            href="/studio"
            className="inline-flex h-11 items-center gap-1.5 text-body-sm font-medium text-fg-3 transition-colors hover:text-fg"
          >
            <span aria-hidden="true">←</span> 스튜디오
          </Link>
          <ReserveButton className={buttonClass({ variant: "secondary", size: "sm" })}>
            5기 사전예약
          </ReserveButton>
        </div>
      </div>

      {/* 첫 화면: 사진 카드 히어로 */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-wide px-6 pb-16 pt-8 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-14">
          <SectionHeader caption="비블의 1:1 유튜브 컨설팅" label="TEAM BIBL" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-6 lg:gap-y-10">
            {/* 제목 + 리드 */}
            <div className="lg:col-span-7 lg:row-start-1">
              <h1 className="text-h2 text-silver sm:text-[44px] lg:text-h1 xl:text-display">
                <span className="block">팀비블</span>
                <span className="block text-accent">1:1 유튜브 컨설팅</span>
              </h1>
              <p className="mt-4 max-w-xl text-body text-fg-2 lg:mt-5 lg:text-lead">
                유튜브 채널 성장과 함께 사업을 성장시키는 방법까지, 비블이 1:1로
                함께합니다.
              </p>
            </div>

            {/* 사진 카드: 가격 + 신청 */}
            <article className="overflow-hidden rounded-panel border border-line bg-surface lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
              <div className="aspect-video overflow-hidden bg-surface-2">
                <Image
                  src="/home/svc-consulting-thumb.webp"
                  width={1280}
                  height={720}
                  alt="1:1 유튜브 컨설팅 팀비블 썸네일. 칠판 앞에서 마주 앉아 이야기하는 비블과 수강생"
                  sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, 100vw"
                  className="size-full object-cover"
                  priority
                />
              </div>
              <div className="p-5 sm:p-6 lg:p-8">
                <p className="text-caption text-fg-3">팀비블 1:1 맞춤 컨설팅</p>
                <p className="mt-1 text-[44px] font-extrabold leading-none tracking-[-0.035em] tabular-nums sm:text-[48px] xl:text-[56px]">
                  월 49만원
                </p>
                <p className="mt-2 text-caption text-fg-3">
                  <span className="whitespace-nowrap">부가세 포함</span> ·{" "}
                  <span className="whitespace-nowrap">
                    카드결제로만 등록이 가능합니다
                  </span>
                </p>

                {/* lg 미만: 오른쪽은 카카오 상담 버튼 자리로 비운다(첫 화면 겹침 0) */}
                <div className="mt-6 border-t border-line pt-6 max-lg:pr-14">
                  <ApplyButton block />
                  <p className="mt-2.5 text-caption text-fg-3">
                    4기 마감 · 5기 오픈 때 가장 먼저 연락드려요
                  </p>
                </div>
              </div>
            </article>

            {/* 구성(이미지 속 문장) + 점프 링크: 이미지 경계(4번 구성 · 6번 후기와 FAQ · 7번 목차) */}
            <div className="lg:col-span-7 lg:row-start-2">
              <h2 className="text-caption text-fg-3">1:1 컨설팅 팀비블 안내</h2>
              <ul className="mt-3 max-w-xl divide-y divide-line-soft border-y border-line">
                {FACTS.map((fact, i) => (
                  <li
                    key={fact}
                    className="flex items-baseline gap-3 py-2.5 text-ui text-fg-2"
                  >
                    <span
                      aria-hidden="true"
                      className="tabular-nums text-body-sm font-bold text-silver"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
              <nav aria-label="상세 목차" className="mt-8">
                <ul className="flex flex-wrap items-center gap-x-1">
                  {JUMP_LINKS.map((link, i) => (
                    <li key={link.href} className="flex items-center">
                      {i > 0 && (
                        <span aria-hidden="true" className="px-1 text-fg-4">
                          ·
                        </span>
                      )}
                      <a
                        href={link.href}
                        className="inline-flex h-11 items-center px-1.5 text-ui font-semibold text-fg-2 transition-colors hover:text-fg"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* 상세 이미지 */}
      <div className="mx-auto max-w-[1000px]">
        {DETAIL_IMAGES.map((img) => (
          <div key={img.n}>
            {/* 앵커 이동: 데스크톱은 sticky 보조 헤더(h-14)만큼 더 내려서 멈춘다(전역 scroll-padding 은 네비만 피한다) */}
            <figure id={img.id} className="relative w-full leading-[0] nav:scroll-mt-16">
              {/* FAQ 는 6번 이미지 중간(세로 약 54.6% 지점)에서 시작한다 */}
              {img.n === 6 && (
                <span
                  id="faq"
                  aria-hidden="true"
                  className="absolute left-0 top-[54.6%] h-px w-px nav:scroll-mt-16"
                />
              )}
              <Image
                src={`/studio/consulting/${img.n}.png`}
                alt={img.alt}
                width={1000}
                height={img.height}
                sizes="(max-width: 1000px) 100vw, 1000px"
                className="h-auto w-full"
                priority={img.n === 1}
              />
            </figure>

            {/* 가격(6번) 바로 뒤 신청 블록. 좌우 여백 7.8% = 상세 이미지 안 내용 시작선(1000px 중 78px) */}
            {img.n === 6 && (
              <section className="border-y border-line px-6 py-16 md:px-[7.8%] md:py-24">
                <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-h3 md:text-h2">
                    5기 사전예약을 받고 있어요
                  </h2>
                  <div>
                    <ApplyButton />
                    <p className="mt-2.5 text-caption text-fg-3">
                      4기 마감 · 5기 오픈 때 가장 먼저 연락드려요
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        ))}
      </div>

      {/* 하단 고정 신청 바 (데스크톱 한 줄 메뉴 미만: 모바일·태블릿). 위의 신청 버튼이 화면에 보이는 동안은 숨는다.
          카카오 상담 버튼은 globals.css 의 data-bottom-bar 규칙으로 바 위에 뜬다. */}
      <BottomCTABar hideFrom="nav" hideWhenVisible="[data-apply-cta]">
        <ReserveButton className={buttonClass({ size: "lg", block: true })}>
          5기 사전예약하기
        </ReserveButton>
      </BottomCTABar>
      <ReserveDialog />
    </main>
  );
}
