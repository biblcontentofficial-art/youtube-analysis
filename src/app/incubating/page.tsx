/**
 * /incubating — 브랜드 인큐베이팅 (영어·수학) 공개 페이지
 *
 * 본문은 커뮤니티 글(INCUBATING_POST_ID)을 그대로 가져와 렌더한다.
 * 글 하나만 고치면 커뮤니티와 이 페이지가 함께 바뀐다.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getPost } from "@/lib/communityDb";
import { excerpt } from "@/lib/community";
import PostContent from "../community/_components/PostContent";
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

export async function generateMetadata(): Promise<Metadata> {
  const post = await getIncubatingPost();
  return {
    title: "브랜드 인큐베이팅 | 비블랩 (bibl lab)",
    description: post
      ? excerpt(post.content, 160)
      : "영어·수학 선생님을 위한 비블 브랜드 인큐베이팅. 채널 기획·제작·마케팅·상품화는 레이블이, 선생님은 가르치는 일에만 집중합니다.",
  };
}

export default async function IncubatingPage() {
  const post = await getIncubatingPost();

  return (
    <div className="min-h-screen bg-black">
      <TrackVisit page="incubating" />
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
        {/* 헤더 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#00E5A0]/40 bg-[#00E5A0]/10 px-3 py-1 text-xs font-bold text-[#00E5A0]">
            모집 분야 · 영어
          </span>
          <span className="rounded-full border border-[#00E5A0]/40 bg-[#00E5A0]/10 px-3 py-1 text-xs font-bold text-[#00E5A0]">
            모집 분야 · 수학
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-white lg:text-3xl">
          유튜브 브랜드 인큐베이팅 지원하세요
        </h1>

        {/* 본문 (커뮤니티 글과 동일한 내용) */}
        {post ? (
          <PostContent
            content={post.content}
            className="py-8 text-[15px] leading-[1.85] text-neutral-200 md:text-base"
          />
        ) : (
          <p className="py-10 text-sm text-neutral-400">
            제안서를 불러오지 못했습니다. 아래 연락처로 문의해 주세요.
          </p>
        )}

        {/* 문의 CTA */}
        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-bold tracking-tight text-white">
            교육 콘텐츠 브랜딩 &amp; 유튜브 프로젝트 문의하기
          </h2>
          <p className="text-sm leading-relaxed text-neutral-300">
            오픈채팅 또는 메일로 분야(영어·수학)와 선생님의 관련 커리어, 현재 운영하는 온라인 채널,
            학원, 선생님 소개를 함께 남겨주시면 빠른 시일 내로 연락드리겠습니다. 감사합니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://open.kakao.com/o/sM3RBKad"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-6 py-3 text-center text-sm font-bold text-black transition hover:bg-neutral-200"
            >
              오픈채팅으로 지원하기
            </a>
            <a
              href="mailto:bibl.content.official@gmail.com"
              className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              bibl.content.official@gmail.com
            </a>
            <Link
              href="/community"
              className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              비블 커뮤니티
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
