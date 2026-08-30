"use client";

/**
 * 게시판 관리 (운영진)
 * - 새 게시판 추가: POST /api/community/boards
 * - 인라인 수정 저장: PATCH /api/community/boards/[id]
 * - 비활성화: DELETE /api/community/boards/[id]
 * 네이버 카페 메뉴를 그대로 옮길 수 있도록 그룹명·정렬순서 편집이 중심이다.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, ReadRole, WriteRole } from "@/lib/community";

interface Props {
  boards: Board[];
}

interface Draft {
  slug: string;
  name: string;
  description: string;
  groupName: string;
  sortOrder: string;
  readRole: ReadRole;
  writeRole: WriteRole;
  allowFiles: boolean;
}

const INPUT =
  "w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400";
const INPUT_LG =
  "w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400";
const TH = "px-3 py-3 text-left text-xs font-semibold text-neutral-400 whitespace-nowrap";
const TD = "px-3 py-3 align-top";

const EMPTY_NEW: Draft = {
  slug: "",
  name: "",
  description: "",
  groupName: "",
  sortOrder: "0",
  readRole: "all",
  writeRole: "member",
  allowFiles: false,
};

/** 새 게시판 정렬순서 제안값 = 현재 최대 sort_order + 10 */
function suggestSortOrder(boards: Board[]): string {
  const max = boards.reduce((m, b) => Math.max(m, b.sort_order), 0);
  return String(max + 10);
}

function toDraft(b: Board): Draft {
  return {
    slug: b.slug,
    name: b.name,
    description: b.description ?? "",
    groupName: b.group_name,
    sortOrder: String(b.sort_order),
    readRole: b.read_role,
    writeRole: b.write_role,
    allowFiles: b.allow_files,
  };
}

function isDirty(b: Board, d: Draft): boolean {
  const o = toDraft(b);
  return (
    o.slug !== d.slug ||
    o.name !== d.name ||
    o.description !== d.description ||
    o.groupName !== d.groupName ||
    o.sortOrder !== d.sortOrder ||
    o.readRole !== d.readRole ||
    o.writeRole !== d.writeRole ||
    o.allowFiles !== d.allowFiles
  );
}

async function readMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function BoardManager({ boards }: Props) {
  const router = useRouter();

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(boards.map((b) => [b.id, toDraft(b)]))
  );
  const [orderIds, setOrderIds] = useState<string[]>(() => boards.map((b) => b.id));
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newBoard, setNewBoard] = useState<Draft>(() => ({
    ...EMPTY_NEW,
    sortOrder: suggestSortOrder(boards),
  }));
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  // 서버 데이터가 갱신되면(router.refresh) 드래프트를 다시 맞춘다
  useEffect(() => {
    setDrafts(Object.fromEntries(boards.map((b) => [b.id, toDraft(b)])));
    setOrderIds(boards.map((b) => b.id));
    setRowError({});
    // 추가 폼이 비어 있을 때만 정렬순서 제안값을 새로 맞춘다 (입력 중이면 건드리지 않는다)
    setNewBoard((prev) =>
      prev.slug || prev.name ? prev : { ...prev, sortOrder: suggestSortOrder(boards) }
    );
  }, [boards]);

  const byId = useMemo(() => new Map(boards.map((b) => [b.id, b])), [boards]);
  const rows = useMemo(
    () => orderIds.map((id) => byId.get(id)).filter((b): b is Board => !!b),
    [orderIds, byId]
  );
  const groupNames = useMemo(
    () => Array.from(new Set(boards.map((b) => b.group_name).filter(Boolean))),
    [boards]
  );
  const dirtyIds = useMemo(
    () => rows.filter((b) => drafts[b.id] && isDirty(b, drafts[b.id])).map((b) => b.id),
    [rows, drafts]
  );

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  /**
   * 위/아래 이동: 표시 순서를 바꾼 뒤 전체 행에 10, 20, 30 … 을 다시 부여한다.
   * 두 값을 맞바꾸기만 하면 sort_order 가 서로 같을 때(새 게시판 기본값 등)
   * 아무 변화도 생기지 않아 저장 버튼까지 비활성으로 남는다.
   */
  function moveRow(id: string, dir: -1 | 1) {
    const idx = orderIds.indexOf(id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= orderIds.length) return;

    const nextOrder = [...orderIds];
    [nextOrder[idx], nextOrder[target]] = [nextOrder[target], nextOrder[idx]];

    setDrafts((prev) => {
      const next = { ...prev };
      let n = 0;
      for (const rowId of nextOrder) {
        const d = next[rowId];
        if (!d) continue;
        n += 10;
        next[rowId] = { ...d, sortOrder: String(n) };
      }
      return next;
    });
    setOrderIds(nextOrder);
  }

  async function saveRow(id: string): Promise<boolean> {
    const d = drafts[id];
    if (!d) return false;
    if (!d.slug.trim() || !d.name.trim()) {
      setRowError((p) => ({ ...p, [id]: "slug와 이름은 비울 수 없습니다." }));
      return false;
    }

    setBusyId(id);
    setRowError((p) => ({ ...p, [id]: "" }));
    try {
      const res = await fetch(`/api/community/boards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: d.slug.trim(),
          name: d.name.trim(),
          description: d.description.trim(),
          groupName: d.groupName.trim() || "커뮤니티",
          sortOrder: Number(d.sortOrder) || 0,
          readRole: d.readRole,
          writeRole: d.writeRole,
          allowFiles: d.allowFiles,
        }),
      });
      if (!res.ok) {
        const msg = await readMessage(res, "저장에 실패했습니다.");
        setRowError((p) => ({ ...p, [id]: msg }));
        return false;
      }
      return true;
    } catch {
      setRowError((p) => ({ ...p, [id]: "네트워크 오류가 발생했습니다." }));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveRow(id: string) {
    const ok = await saveRow(id);
    if (ok) router.refresh();
  }

  async function handleSaveAll() {
    if (dirtyIds.length === 0 || savingAll) return;
    setSavingAll(true);
    let ok = true;
    for (const id of dirtyIds) {
      const done = await saveRow(id);
      if (!done) ok = false;
    }
    setSavingAll(false);
    if (ok) router.refresh();
  }

  async function handleToggleActive(b: Board) {
    const turningOff = b.is_active;
    if (turningOff && !confirm(`"${b.name}" 게시판을 비활성화할까요? 목록에서 숨겨집니다.`)) return;

    setBusyId(b.id);
    setRowError((p) => ({ ...p, [b.id]: "" }));
    try {
      const res = turningOff
        ? await fetch(`/api/community/boards/${b.id}`, { method: "DELETE" })
        : await fetch(`/api/community/boards/${b.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
          });
      if (!res.ok) {
        const msg = await readMessage(res, turningOff ? "비활성화에 실패했습니다." : "활성화에 실패했습니다.");
        setRowError((p) => ({ ...p, [b.id]: msg }));
        return;
      }
      router.refresh();
    } catch {
      setRowError((p) => ({ ...p, [b.id]: "네트워크 오류가 발생했습니다." }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const slug = newBoard.slug.trim();
    const name = newBoard.name.trim();
    if (!slug || !name) {
      setCreateError("slug와 이름은 필수입니다.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setCreateError("slug는 영문 소문자·숫자·하이픈만 사용할 수 있습니다.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/community/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          description: newBoard.description.trim(),
          groupName: newBoard.groupName.trim() || "커뮤니티",
          sortOrder: Number(newBoard.sortOrder) || 0,
          readRole: newBoard.readRole,
          writeRole: newBoard.writeRole,
          allowFiles: newBoard.allowFiles,
        }),
      });
      if (!res.ok) {
        setCreateError(await readMessage(res, "게시판 추가에 실패했습니다."));
        return;
      }
      // 다음 게시판은 방금 넣은 값보다 10 뒤로 제안한다 (새로고침되면 서버 값으로 다시 맞춰진다)
      setNewBoard({ ...EMPTY_NEW, sortOrder: String((Number(newBoard.sortOrder) || 0) + 10) });
      router.refresh();
    } catch {
      setCreateError("네트워크 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {/* ── 새 게시판 추가 ─────────────────────────────── */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 md:p-6">
        <h2 className="text-base font-bold tracking-tight text-white">새 게시판 추가</h2>
        <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-400">이름</label>
            <input
              value={newBoard.name}
              onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
              placeholder="자유게시판"
              className={`${INPUT_LG} mt-2`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400">slug (주소)</label>
            <input
              value={newBoard.slug}
              onChange={(e) => setNewBoard({ ...newBoard, slug: e.target.value })}
              placeholder="free"
              className={`${INPUT_LG} mt-2`}
            />
            <p className="mt-2 text-xs text-neutral-500">/community/{newBoard.slug || "slug"}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-400">설명</label>
            <input
              value={newBoard.description}
              onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
              placeholder="게시판 목록에 함께 보이는 한 줄 설명"
              className={`${INPUT_LG} mt-2`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400">그룹명</label>
            <input
              value={newBoard.groupName}
              onChange={(e) => setNewBoard({ ...newBoard, groupName: e.target.value })}
              placeholder="커뮤니티"
              list="community-group-names"
              className={`${INPUT_LG} mt-2`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400">정렬순서</label>
            <input
              type="number"
              value={newBoard.sortOrder}
              onChange={(e) => setNewBoard({ ...newBoard, sortOrder: e.target.value })}
              className={`${INPUT_LG} mt-2`}
            />
            <p className="mt-2 text-xs text-neutral-500">
              숫자가 작을수록 위에 표시됩니다. 기본값은 현재 마지막 게시판 다음 자리입니다.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400">읽기 권한</label>
            <select
              value={newBoard.readRole}
              onChange={(e) => setNewBoard({ ...newBoard, readRole: e.target.value as ReadRole })}
              className={`${INPUT_LG} mt-2`}
            >
              <option value="all">전체 공개</option>
              <option value="member">회원만</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400">쓰기 권한</label>
            <select
              value={newBoard.writeRole}
              onChange={(e) => setNewBoard({ ...newBoard, writeRole: e.target.value as WriteRole })}
              className={`${INPUT_LG} mt-2`}
            >
              <option value="all">새싹부터</option>
              <option value="member">크리에이터부터</option>
              <option value="teambibl">팀비블부터</option>
              <option value="staff">운영진만</option>
            </select>
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.05] md:col-span-2">
            <input
              type="checkbox"
              checked={newBoard.allowFiles}
              onChange={(e) => setNewBoard({ ...newBoard, allowFiles: e.target.checked })}
              className="h-4 w-4 accent-[#00E5A0]"
            />
            <span className="text-sm text-neutral-200">첨부파일 허용 (자료실)</span>
          </label>

          {createError && <p className="text-sm text-red-400 md:col-span-2">{createError}</p>}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
            >
              {creating ? "추가 중…" : "게시판 추가"}
            </button>
          </div>
        </form>
      </section>

      <datalist id="community-group-names">
        {groupNames.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      {/* ── 게시판 목록 ────────────────────────────────── */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-bold tracking-tight text-white">
            게시판 <span className="text-[#00E5A0]">{boards.length}</span>개
          </h2>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={dirtyIds.length === 0 || savingAll}
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-neutral-200 disabled:opacity-40"
          >
            {savingAll ? "저장 중…" : `변경사항 일괄 저장${dirtyIds.length > 0 ? ` (${dirtyIds.length})` : ""}`}
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-neutral-400">등록된 게시판이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className={TH}>순서</th>
                  <th className={TH}>이름</th>
                  <th className={TH}>slug</th>
                  <th className={TH}>그룹</th>
                  <th className={TH}>설명</th>
                  <th className={TH}>읽기</th>
                  <th className={TH}>쓰기</th>
                  <th className={TH}>첨부</th>
                  <th className={TH}>활성</th>
                  <th className={TH}>작업</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => {
                  const d = drafts[b.id];
                  if (!d) return null;
                  const dirty = isDirty(b, d);
                  const busy = busyId === b.id || savingAll;
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-white/[0.06] transition hover:bg-white/[0.02] ${
                        b.is_active ? "" : "opacity-50"
                      }`}
                    >
                      <td className={TD}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={d.sortOrder}
                            onChange={(e) => patchDraft(b.id, { sortOrder: e.target.value })}
                            className={`${INPUT} w-20`}
                          />
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveRow(b.id, -1)}
                              disabled={i === 0}
                              aria-label="위로"
                              className="rounded-md border border-neutral-700 bg-neutral-800 px-1.5 text-[10px] leading-4 text-white transition hover:bg-neutral-700 disabled:opacity-30"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveRow(b.id, 1)}
                              disabled={i === rows.length - 1}
                              aria-label="아래로"
                              className="rounded-md border border-neutral-700 bg-neutral-800 px-1.5 text-[10px] leading-4 text-white transition hover:bg-neutral-700 disabled:opacity-30"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className={TD}>
                        <input
                          value={d.name}
                          onChange={(e) => patchDraft(b.id, { name: e.target.value })}
                          className={`${INPUT} min-w-[130px]`}
                        />
                      </td>
                      <td className={TD}>
                        <input
                          value={d.slug}
                          onChange={(e) => patchDraft(b.id, { slug: e.target.value })}
                          className={`${INPUT} min-w-[110px]`}
                        />
                      </td>
                      <td className={TD}>
                        <input
                          value={d.groupName}
                          onChange={(e) => patchDraft(b.id, { groupName: e.target.value })}
                          list="community-group-names"
                          className={`${INPUT} min-w-[110px]`}
                        />
                      </td>
                      <td className={TD}>
                        <input
                          value={d.description}
                          onChange={(e) => patchDraft(b.id, { description: e.target.value })}
                          placeholder="—"
                          className={`${INPUT} min-w-[160px]`}
                        />
                      </td>
                      <td className={TD}>
                        <select
                          value={d.readRole}
                          onChange={(e) => patchDraft(b.id, { readRole: e.target.value as ReadRole })}
                          className={`${INPUT} w-28 min-w-[6.5rem]`}
                        >
                          <option value="all">전체</option>
                          <option value="member">회원</option>
                        </select>
                      </td>
                      <td className={TD}>
                        <select
                          value={d.writeRole}
                          onChange={(e) => patchDraft(b.id, { writeRole: e.target.value as WriteRole })}
                          className={`${INPUT} w-36 min-w-[8.5rem]`}
                        >
                          <option value="all">새싹부터</option>
                          <option value="member">크리에이터</option>
                          <option value="teambibl">팀비블</option>
                          <option value="staff">운영진</option>
                        </select>
                      </td>
                      <td className={`${TD} text-center`}>
                        <input
                          type="checkbox"
                          checked={d.allowFiles}
                          onChange={(e) => patchDraft(b.id, { allowFiles: e.target.checked })}
                          aria-label="첨부 허용"
                          className="mt-2.5 h-4 w-4 accent-[#00E5A0]"
                        />
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <span className={`text-xs ${b.is_active ? "text-[#00E5A0]" : "text-neutral-500"}`}>
                          {b.is_active ? "활성" : "숨김"}
                        </span>
                      </td>
                      <td className={TD}>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveRow(b.id)}
                              disabled={!dirty || busy}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-neutral-200 disabled:opacity-40"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(b)}
                              disabled={busy}
                              className="whitespace-nowrap rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-white transition hover:bg-neutral-700 disabled:opacity-40"
                            >
                              {b.is_active ? "비활성화" : "활성화"}
                            </button>
                          </div>
                          {rowError[b.id] && <p className="text-xs text-red-400">{rowError[b.id]}</p>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-neutral-500">
        순서 버튼으로 자리를 바꾼 뒤 일괄 저장하면 목록 정렬이 그대로 반영됩니다. 그룹명이 같은 게시판끼리 커뮤니티 홈에서 묶여 보입니다.
      </p>
    </div>
  );
}
