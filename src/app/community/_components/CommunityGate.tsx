"use client";

/**
 * 비로그인 방문자에게 보여주는 커뮤니티 입장 게이트.
 * 커뮤니티는 비블랩 회원 전용이라 글 제목·내용은 일절 노출하지 않고,
 * 어떤 공간인지와 가입 동선만 안내한다.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIGHLIGHTS = [
  { title: "유튜브 실전 Q&A", desc: "막히는 지점을 묻고, 먼저 겪은 회원들의 답을 받습니다." },
  { title: "자료실 다운로드", desc: "기획 템플릿·체크리스트·전자책 등 실무 자료를 받아갑니다." },
  { title: "매일 챌린지 · 스터디", desc: "혼자서는 못 지키는 업로드 루틴을 함께 만듭니다." },
  { title: "성과 공유 · 협업", desc: "채널 성장과 매출 사례, 구인구직과 협업 제안이 오갑니다." },
];

export default function CommunityGate({ groups }: { groups: string[] }) {
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/community");

  return (
    <div className="mx-auto max-w-2xl">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 md:p-10">
        <p className="text-xs font-bold tracking-[0.2em] text-[#00E5A0]">MEMBERS ONLY</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
          비블 커뮤니티는
          <br />
          비블랩 회원만 이용할 수 있습니다
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-400">
          회원가입은 무료이고 카카오·구글 계정으로 3초면 끝납니다.
          가입하면 게시판 열람부터 글쓰기, 자료 다운로드까지 모두 이용할 수 있습니다.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/sign-in?next=${next}`}
            className="rounded-xl bg-white px-6 py-3 text-center text-sm font-bold text-black transition hover:bg-neutral-200"
          >
            무료로 가입하고 입장하기
          </Link>
          <Link
            href={`/sign-in?next=${next}`}
            className="rounded-xl border border-neutral-700 bg-neutral-800 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            이미 회원이신가요? 로그인
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm font-bold text-white">{h.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{h.desc}</p>
          </div>
        ))}
      </section>

      {groups.length > 0 && (
        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-xs font-bold text-neutral-500">운영 중인 공간</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {groups.map((g) => (
              <span
                key={g}
                className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-300"
              >
                {g}
              </span>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-neutral-600">
        가입 전에 먼저 둘러보고 싶다면{" "}
        <a
          href="https://open.kakao.com/o/gsMC55Jh"
          target="_blank"
          rel="noopener noreferrer"
          title="참여코드 230000"
          className="text-neutral-400 underline underline-offset-2 hover:text-white"
        >
          비블 오픈채팅방
        </a>
        에서 이야기 나눠요
      </p>
    </div>
  );
}
