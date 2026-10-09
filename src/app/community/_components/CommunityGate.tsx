"use client";

/**
 * 비로그인 방문자에게 보여주는 커뮤니티 입장 게이트.
 * 커뮤니티는 비블랩 회원 전용이라 글 제목·내용은 일절 노출하지 않고,
 * 어떤 공간인지와 가입 동선만 안내한다. 넘겨받는 것은 게시판 이름(그룹별)과 숫자뿐이다.
 *
 * '멤버 N명 · 글 N개' 는 레이아웃이 Suspense 안 작은 서버 컴포넌트로 스트리밍해 stats 로 넘긴다
 * (숫자를 기다리느라 게이트 첫 응답이 늦어지지 않게).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import {
  LIST_PANEL,
  LIST_PANEL_DESC,
  LIST_PANEL_HEAD,
  LIST_PANEL_HEAD_META,
  LIST_PANEL_ITEM,
  LIST_PANEL_LIST,
  LIST_PANEL_TITLE,
} from "@/components/ui/list-panel";

const HIGHLIGHTS = [
  { title: "유튜브 실전 Q&A", desc: "막히는 지점을 묻고, 먼저 겪은 회원들의 답을 받습니다." },
  { title: "자료실 다운로드", desc: "기획 템플릿·체크리스트·전자책 등 실무 자료를 받아갑니다." },
  { title: "매일 챌린지 · 스터디", desc: "혼자서는 못 지키는 업로드 루틴을 함께 만듭니다." },
  { title: "성과 공유 · 협업", desc: "채널 성장과 매출 사례, 구인구직과 협업 제안이 오갑니다." },
];

export interface GateGroup {
  group: string;
  /** 그룹의 대표 게시판 이름(2~3개) */
  boards: string[];
}

export default function CommunityGate({
  groups,
  stats,
}: {
  groups: GateGroup[];
  /** '멤버 N명 · 글 N개' 한 줄 (Suspense 경계째로 받는다) */
  stats?: ReactNode;
}) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/community");

  // 비회원 화면의 main(회원 화면은 community/layout.tsx 의 main). 게이트 분기·문구는 그대로
  return (
    <main className="mx-auto max-w-2xl">
      <section className="rounded-panel border border-line bg-surface p-6 md:p-10">
        <p lang="en" className="text-sm font-black leading-5 tracking-[0.25em] text-silver md:text-base md:leading-6">
          MEMBERS ONLY
        </p>
        <h1 className="mt-3 text-title text-fg md:text-h3">
          비블 커뮤니티는
          <br />
          비블랩 회원만 이용할 수 있습니다
        </h1>
        <p className="mt-4 text-body-sm text-fg-2 md:text-ui">
          회원가입은 무료이고 카카오·구글 계정으로 3초면 끝납니다.
          가입하면 게시판 열람부터 글쓰기, 자료 다운로드까지 모두 이용할 수 있습니다.
        </p>

        <div className="mt-6 min-h-[21px]">{stats}</div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href={`/sign-in?next=${next}`} className={buttonClass({ variant: "primary", size: "lg" })}>
            무료로 가입하고 입장하기
          </Link>
          <Link href={`/sign-in?next=${next}`} className={buttonClass({ variant: "secondary", size: "lg" })}>
            이미 회원이신가요? 로그인
          </Link>
        </div>
      </section>

      {groups.length > 0 && (
        <section aria-labelledby="gate-boards" className={`${LIST_PANEL.standalone} mt-6`}>
          <div className={LIST_PANEL_HEAD}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/community-wordmark.png"
              width={743}
              height={91}
              alt="Business Black"
              className="h-[18px] w-auto mix-blend-lighten"
              decoding="async"
            />
            <span id="gate-boards" className={LIST_PANEL_HEAD_META}>
              회원 전용 게시판
            </span>
          </div>
          <ul className={LIST_PANEL_LIST}>
            {groups.map((g) => (
              <li key={g.group} className={`${LIST_PANEL_ITEM} max-md:pr-8`}>
                <p className={LIST_PANEL_TITLE}>{g.group}</p>
                <p className={LIST_PANEL_DESC}>{g.boards.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="rounded-card border border-line bg-surface p-5">
            <p className="text-body-sm font-bold text-fg">{h.title}</p>
            <p className="mt-1.5 text-wrap text-caption text-fg-3">{h.desc}</p>
          </div>
        ))}
      </section>

      <p className="mt-6 text-center text-caption text-fg-3">
        가입 전에 먼저 둘러보고 싶다면{" "}
        <a
          href="https://open.kakao.com/o/gsMC55Jh"
          target="_blank"
          rel="noopener noreferrer"
          className="text-fg-2 underline decoration-fg-4 underline-offset-2 transition-colors hover:text-fg"
        >
          비블 오픈채팅방<span className="sr-only">(새 창)</span>
        </a>
        에서 이야기 나눠요 <span className="whitespace-nowrap">(참여코드 230000)</span>
      </p>
    </main>
  );
}
