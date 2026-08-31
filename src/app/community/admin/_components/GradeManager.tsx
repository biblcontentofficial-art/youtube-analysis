"use client";

/**
 * 회원 등급 관리 (운영진 전용)
 * 이메일로 팀비블(3단계)을 부여·해제한다.
 * 1 새싹 → 2 크리에이터는 활동 조건으로 자동 등업되므로 여기서 다루지 않는다.
 */
import { useCallback, useEffect, useState } from "react";
import { GRADE_EMOJI, GRADE_NAMES, GRADE_THRESHOLDS } from "@/lib/community";
import type { GradeMember } from "@/lib/communityDb";

const INPUT =
  "rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none";

export default function GradeManager() {
  const [members, setMembers] = useState<GradeMember[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/community/grades");
      if (!res.ok) return;
      const json = await res.json();
      setMembers(json.members ?? []);
    } catch {
      /* 조회 실패는 조용히 무시 */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setTeambibl = async (targetEmail: string, isTeambibl: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/community/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, isTeambibl }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.message ?? "저장에 실패했습니다.");
      } else {
        setMsg(
          isTeambibl
            ? `${json.email} 님을 팀비블 수강생으로 지정했습니다.`
            : `${json.email} 님의 팀비블 수강생 지정을 해제했습니다.`
        );
        setEmail("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="text-lg font-bold tracking-tight text-white">팀비블 수강생 관리</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">
        활동 등급({([1, 2, 3, 4, 5] as const)
          .map((g) => `${GRADE_EMOJI[g]} ${GRADE_NAMES[g]}`)
          .join(" · ")})은 활동 점수로 자동 승급합니다. 승급 기준은{" "}
        {([2, 3, 4, 5] as const).map((g) => `${GRADE_NAMES[g]} ${GRADE_THRESHOLDS[g]}점`).join(", ")}입니다.
        여기서는 등급과 별개인 팀비블 수강생 지정만 관리합니다 (팀비블 공간 글쓰기 권한).
      </p>

      {/* 팀비블 부여 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) setTeambibl(email, true);
        }}
        className="mt-5 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="회원 이메일 (예: student@gmail.com)"
          aria-label="팀비블 수강생으로 지정할 회원 이메일"
          className={`${INPUT} flex-1`}
        />
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
        >
          팀비블 수강생 지정
        </button>
      </form>

      {msg && <p className="mt-3 text-xs text-[#00E5A0]">{msg}</p>}

      {/* 팀비블 목록 */}
      <div className="mt-6">
        <p className="text-xs font-bold text-neutral-500">팀비블 수강생 ({members.length})</p>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">아직 팀비블 수강생으로 지정한 회원이 없습니다.</p>
        ) : (
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{m.email ?? m.user_id}</p>
                  {m.name && <p className="text-xs text-neutral-500">{m.name}</p>}
                </div>
                <button
                  type="button"
                  disabled={busy || !m.email}
                  onClick={() => m.email && setTeambibl(m.email, false)}
                  className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-white transition hover:bg-neutral-700 disabled:opacity-50"
                >
                  해제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
