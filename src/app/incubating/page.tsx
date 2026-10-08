/**
 * /incubating — 브랜드 인큐베이팅 (영어·수학) 공개 페이지
 *
 * 본문은 커뮤니티 글(INCUBATING_POST_ID)을 그대로 가져와 렌더한다.
 * 글 하나만 고치면 커뮤니티와 이 페이지가 함께 바뀐다.
 *
 * 레이아웃(DESIGN 7.3 브랜드 인큐베이팅): 배너 히어로(모집 분야 · h1 · 흰 '지원하기' · 본문 첫 사진)
 * → 역할 분담 01~04 → 제안서 본문 → 채널 실적 부품(HomeChannels 재사용) → 지원(#apply, 오픈채팅 흰 버튼)
 * → 모바일 하단 지원 바. 흰 면 버튼은 한 폴드에 하나: 히어로 '지원하기'는 768 미만에서 보조 버튼이 되고,
 * 하단 바는 지원 카드의 오픈채팅 버튼이 보이는 동안 숨는다.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getPost } from "@/lib/communityDb";
import { toPreviewText } from "@/lib/community";
import { OG_DEFAULT, OG_IMAGE } from "@/lib/seo";
import { buttonClass } from "@/components/ui/button";
import { badgeClass } from "@/components/ui/badge";
import { BottomCTABar } from "@/components/ui/bottom-cta-bar";
import { SectionHeader } from "@/components/ui/section-header";
import HomeChannels, { PROOF_CHANNELS } from "@/app/_components/home/HomeChannels";
import PostContent, { firstBodyImage, splitLeadImage } from "../community/_components/PostContent";
import TrackVisit from "@/app/_components/TrackVisit";

// 정적 프리렌더 + 60초 ISR. (revalidate 가 없으면 빌드 시점 내용에서 멈춰 글 수정이 반영되지 않는다)
export const revalidate = 60;

/** 원본 글: 커뮤니티 "유튜브 인큐베이팅 지원하세요!" 게시판 공지 */
const INCUBATING_POST_ID = "09605c8c-be44-4037-bcee-6a9c13337f95";

/**
 * 공개 페이지라 방문자마다 DB를 칠 이유가 없다.
 * 결과를 60초 캐시해 대부분의 요청이 DB 왕복 없이 그려진다 (글 수정은 60초 안에 반영).
 */
const getIncubatingPost = unstable_cache(
  () => getPost(INCUBATING_POST_ID),
  ["incubating-post"],
  { revalidate: 60, tags: ["incubating-post"] }
);

const DOT = "⁠·⁠";
const OPEN_CHAT_URL = "https://open.kakao.com/o/sM3RBKad";
const MAIL = "bibl.content.official@gmail.com";
const PAGE_TITLE = "유튜브 브랜드 인큐베이팅 지원하세요";
const FALLBACK_DESCRIPTION =
  "영어·수학 선생님을 위한 비블 브랜드 인큐베이팅. 채널 기획·제작·마케팅·상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.";

/**
 * 역할 분담(제안서 '레이블이 하는 일 vs 선생님이 하는 일'에서 그대로 옮긴 요약).
 * 주의: 이 블록과 아래 섹션 제목(h2)은 원문 커뮤니티 글(INCUBATING_POST_ID)의 레이블/선생님 표를 코드에 복사한 것이라
 * 글을 고쳐도 자동으로 바뀌지 않는다. 글의 그 표를 고치면 여기도 함께 고칠 것.
 */
const ROLES = [
  {
    title: "채널 기획",
    label: `포지셔닝${DOT}콘텐츠 구성${DOT}첫 라인업 기획`,
    teacher: "강점 인풋과 컨셉 합의",
  },
  {
    title: "제작",
    label: `기획${DOT}촬영${DOT}편집${DOT}썸네일${DOT}업로드${DOT}성과 트래킹`,
    teacher: `출연${DOT}대본`,
  },
  {
    title: "마케팅",
    label: `사전알림 → 얼리버드 → 본판매 퍼널${DOT}광고${DOT}랜딩`,
    teacher: "홍보와 출연",
  },
  {
    title: "상품화",
    label: `강의촬영${DOT}편집${DOT}상세페이지`,
    teacher: `커리큘럼 설계와 수업 제작${DOT}출연`,
  },
];

/** 영어 교육 카테고리 실적(채널 실적 부품에 이 채널 한 줄만 넘긴다) */
const EDU_CHANNELS = PROOF_CHANNELS.filter((c) => c.name === "영어 키위새");

/** 768 미만 본문 사진: 4:3 으로 잘라 세로 사진이 화면을 다 차지하지 않게. 768 이상은 기본(비율 유지 + 70vh 상한) */
const BODY_IMAGE_CLASS =
  "mx-auto block aspect-[4/3] w-full rounded-panel border border-line object-cover md:aspect-auto md:h-auto md:w-auto md:max-w-full md:max-h-[70vh]";

export async function generateMetadata(): Promise<Metadata> {
  const post = await getIncubatingPost();
  const title = post?.title || PAGE_TITLE;
  const description = post ? toPreviewText(post.content, 160) || FALLBACK_DESCRIPTION : FALLBACK_DESCRIPTION;
  const image = post ? firstBodyImage(post.content) : null;
  return {
    // 사이트 이름은 루트 레이아웃 title.template 이 붙인다.
    title: "브랜드 인큐베이팅",
    // 루트의 canonical(홈)이 상속되지 않도록 이 페이지 주소를 지정한다.
    alternates: { canonical: "https://bibllab.com/incubating" },
    description,
    // 공유 카드: 글 제목·요약·첫 본문 사진(없으면 사이트 기본 이미지)
    openGraph: {
      ...OG_DEFAULT,
      title,
      description,
      url: "/incubating",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image ?? OG_IMAGE.url],
    },
  };
}

export default async function IncubatingPage() {
  const post = await getIncubatingPost();
  // 본문 첫 줄의 사진은 배너로 올리고, 본문에서는 그 다음부터 그린다(글 원문은 그대로)
  const { image: banner, rest } = post ? splitLeadImage(post.content) : { image: null, rest: "" };

  return (
    <main id="main">
      <TrackVisit page="incubating" />

      {/* 배너 히어로 */}
      <section aria-labelledby="incubating-title" className="border-b border-line">
        <div className="mx-auto max-w-wide px-6 pb-12 pt-8 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-6">
            <div className="min-w-0 lg:col-span-7 lg:pr-6">
              <ul aria-label="모집 분야" className="flex flex-wrap gap-2">
                <li className={badgeClass()}>모집 분야 · 영어</li>
                <li className={badgeClass()}>모집 분야 · 수학</li>
              </ul>
              <h1 id="incubating-title" className="mt-4 text-h2 text-silver sm:text-[44px] lg:text-h1 xl:text-display">
                <span className="block">유튜브 브랜드 인큐베이팅</span>{" "}
                <span className="block text-accent">지원하세요</span>
              </h1>
              <p className="mt-3 max-w-[34em] text-body text-fg-2 sm:mt-4 lg:mt-5 lg:text-lead">
                {`채널 기획${DOT}제작${DOT}마케팅${DOT}상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.`}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-8">
                {/* 흰 면은 768 이상에서만(768 미만은 하단 지원 바가 흰 버튼) */}
                <div className="hidden md:block">
                  <a href="#apply" className={buttonClass({ size: "lg" })}>
                    지원하기
                  </a>
                </div>
                <div className="md:hidden">
                  <a href="#apply" className={buttonClass({ variant: "secondary", size: "lg" })}>
                    지원하기
                  </a>
                </div>
                <p className="text-caption text-fg-3">{`오픈채팅${DOT}메일로 지원`}</p>
              </div>
            </div>
            {banner && (
              <div className="overflow-hidden rounded-panel border border-line bg-surface-2 lg:col-span-5">
                {/* 본문 첫 사진(글 원문에서 형태를 검증한 주소) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner} alt="" className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 역할 분담 01~04 */}
      <section aria-labelledby="roles-title" className="border-b border-line">
        <div className="mx-auto max-w-wide px-6 py-16 md:py-24 lg:px-8">
          <SectionHeader caption="레이블이 하는 일 · 선생님이 하는 일" label="ROLES" />
          <h2 id="roles-title" className="text-h3 text-fg md:text-h1">
            <span className="block text-fg-3">선생님은 콘텐츠와 전문성에만 집중하십니다.</span>{" "}
            <span className="block">나머지는 저희 시스템이 합니다.</span>
          </h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:mt-12 lg:grid-cols-4">
            {ROLES.map((role, i) => (
              <li key={role.title} className="grid grid-cols-[2.25rem_1fr] border-t border-line pt-5 sm:block">
                <span aria-hidden="true" className="tnum pt-0.5 text-body-sm font-bold text-silver sm:block sm:pt-0">
                  {`0${i + 1}`}
                </span>
                <div>
                  <h3 className="text-lead font-bold leading-[1.4] sm:mt-2">{role.title}</h3>
                  <p className="mt-1 text-ui text-fg-2">{role.label}</p>
                  <p className="mt-2 text-caption text-fg-3">{`선생님 · ${role.teacher}`}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 제안서 본문 (커뮤니티 글과 동일한 내용) */}
      <section aria-labelledby="proposal-title" className="border-b border-line">
        <div className="mx-auto max-w-[720px] px-6 pt-16 md:pt-24">
          <SectionHeader caption="제안서" label="PROPOSAL" />
          <h2 id="proposal-title" className="sr-only">
            제안서
          </h2>
          {post ? (
            <PostContent
              content={rest}
              className="pb-16 text-body text-fg-1 break-words md:pb-24"
              imageClassName={BODY_IMAGE_CLASS}
            />
          ) : (
            <p className="pb-16 text-body-sm text-fg-3 md:pb-24">
              제안서를 불러오지 못했습니다. 아래 연락처로 문의해 주세요.
            </p>
          )}
        </div>
      </section>

      {/* 채널 실적(홈과 같은 부품) */}
      <HomeChannels channels={EDU_CHANNELS} showRevenue={false} />

      {/* 지원 */}
      <section id="apply" aria-labelledby="apply-title">
        <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
          <div className="rounded-panel border border-line bg-surface p-5 sm:p-6 md:p-8">
            <h2 id="apply-title" className="text-h4 font-extrabold text-fg">
              교육 콘텐츠 브랜딩 &amp; 유튜브 프로젝트 문의하기
            </h2>
            <p className="mt-3 text-ui text-fg-2">
              오픈채팅 또는 메일로 분야(영어·수학)와 선생님의 관련 커리어, 현재 운영하는 온라인 채널,
              학원, 선생님 소개를 함께 남겨주시면 빠른 시일 내로 연락드리겠습니다. 감사합니다.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                data-apply-cta
                href={OPEN_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({ size: "lg" })}
              >
                오픈채팅으로 지원하기
                <span className="sr-only"> (새 창)</span>
              </a>
              <a href={`mailto:${MAIL}`} className={buttonClass({ variant: "secondary", size: "lg" })}>
                {MAIL}
              </a>
            </div>
          </div>
          <Link
            href="/community"
            className="group mt-4 inline-flex h-11 items-center gap-1.5 text-ui font-semibold text-fg transition-colors hover:text-fg-2"
          >
            비블 커뮤니티
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* 768 미만 하단 지원 바: 지원 카드의 오픈채팅 버튼이 보이는 동안만 숨는다 */}
      <BottomCTABar hideFrom="md" hideWhenVisible="[data-apply-cta]">
        <a
          href={OPEN_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ size: "lg", block: true })}
        >
          오픈채팅으로 지원하기
          <span className="sr-only"> (새 창)</span>
        </a>
      </BottomCTABar>
    </main>
  );
}
