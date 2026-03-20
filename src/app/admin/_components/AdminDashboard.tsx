"use client";

import { useEffect, useState, useCallback } from "react";
import type { AdminUser } from "@/app/api/admin/users/route";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface StatsData {
  users: {
    total: number;
    paying: number;
    newToday: number;
    newThisWeek: number;
    activeToday: number;
    activeThisWeek: number;
    planCounts: Record<string, number>;
    mrr: number;
  };
  searches: {
    today: number;
    yesterday: number;
    activeUsersToday: number;
    byPlan: Record<string, number>;
    daily: { date: string; count: number }[];
  };
  youtube: {
    estimatedUnitsToday: number;
    freeQuota: number;
    paidQuota: number;
    quotaUsedPct: number;
    freeKeyCount: number;
    paidKeyCount: number;
    unitsPerSearch: number;
    capacitySearches: number;
    overageCostKRW: number;
  };
  redis: {
    estimatedCommandsToday: number;
    freeLimit: number;
    usedPct: number;
  };
  clerk: {
    totalUsers: number;
    freeLimit: number;
    usedPct: number;
  };
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-700 text-gray-300",
  starter: "bg-blue-900 text-blue-300",
  pro: "bg-teal-900 text-teal-300",
  business: "bg-purple-900 text-purple-300",
};

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  starter: 49000,
  pro: 199000,
  business: 490000,
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

const PLAN_COLOR: Record<string, string> = {
  free: "#6b7280",
  starter: "#3b82f6",
  pro: "#14b8a6",
  business: "#a855f7",
};

type Tab = "overview" | "users" | "usage" | "costs";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatDate(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatKRW(n: number): string {
  return `₩${n.toLocaleString()}`;
}

function ProgressBar({ pct, color = "bg-teal-500" }: { pct: number; color?: string }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const barColor =
    clampedPct >= 90 ? "bg-red-500" : clampedPct >= 70 ? "bg-yellow-500" : color;
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 mt-1.5">
      <div
        className={`h-2 rounded-full transition-all ${barColor}`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [editingPlan, setEditingPlan] = useState<{ id: string; plan: string } | null>(null);
  const [planSaving, setPlanSaving] = useState(false);

  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setUsers(d.users ?? []))
      .catch((e) => setUsersError(e.message))
      .finally(() => setUsersLoading(false));
  }, []);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setStats(d))
      .catch((e) => setStatsError(e.message))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handlePlanSave = async (userId: string, newPlan: string) => {
    setPlanSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) throw new Error("Failed");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
      setEditingPlan(null);
    } catch {
      alert("플랜 변경에 실패했습니다.");
    } finally {
      setPlanSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesPlan = planFilter === "all" || u.plan === planFilter;
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  const mrr = users.reduce((s, u) => s + (PLAN_PRICE[u.plan] ?? 0), 0);
  const payingUsers = users.filter((u) => u.plan !== "free").length;
  const planCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.plan] = (acc[u.plan] ?? 0) + 1;
    return acc;
  }, {});

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "개요", icon: "📊" },
    { id: "users", label: "사용자", icon: "👥" },
    { id: "usage", label: "사용량", icon: "📡" },
    { id: "costs", label: "비용 분석", icon: "💰" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {activeTab === "overview" && (
        <OverviewTab
          users={users}
          stats={stats}
          usersLoading={usersLoading}
          statsLoading={statsLoading}
          statsError={statsError}
          mrr={mrr}
          payingUsers={payingUsers}
          planCounts={planCounts}
        />
      )}

      {/* ── USERS TAB ────────────────────────────────────────── */}
      {activeTab === "users" && (
        <UsersTab
          users={users}
          filteredUsers={filteredUsers}
          loading={usersLoading}
          error={usersError}
          search={search}
          setSearch={setSearch}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          editingPlan={editingPlan}
          setEditingPlan={setEditingPlan}
          planSaving={planSaving}
          onPlanSave={handlePlanSave}
          onRefresh={fetchUsers}
        />
      )}

      {/* ── USAGE TAB ────────────────────────────────────────── */}
      {activeTab === "usage" && (
        <UsageTab stats={stats} loading={statsLoading} error={statsError} onRefresh={fetchStats} />
      )}

      {/* ── COSTS TAB ────────────────────────────────────────── */}
      {activeTab === "costs" && (
        <CostsTab
          stats={stats}
          users={users}
          loading={statsLoading || usersLoading}
          mrr={mrr}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────
function OverviewTab({
  users,
  stats,
  usersLoading,
  statsLoading,
  statsError,
  mrr,
  payingUsers,
  planCounts,
}: {
  users: AdminUser[];
  stats: StatsData | null;
  usersLoading: boolean;
  statsLoading: boolean;
  statsError: string | null;
  mrr: number;
  payingUsers: number;
  planCounts: Record<string, number>;
}) {
  const loading = usersLoading || statsLoading;
  const todaySearches = stats?.searches.today ?? 0;
  const yesterdaySearches = stats?.searches.yesterday ?? 0;
  const searchChange =
    yesterdaySearches > 0
      ? Math.round(((todaySearches - yesterdaySearches) / yesterdaySearches) * 100)
      : null;

  return (
    <div className="space-y-6">
      {/* Row 1 - 수익 */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">수익 현황</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="월 예상 매출 (MRR)"
            value={loading ? "..." : formatKRW(mrr)}
            color="text-purple-400"
          />
          <KpiCard
            label="유료 사용자"
            value={loading ? "..." : `${payingUsers}명`}
            sub={loading ? "" : `전체의 ${users.length > 0 ? Math.round((payingUsers / users.length) * 100) : 0}%`}
            color="text-teal-400"
          />
          <KpiCard
            label="전체 사용자"
            value={loading ? "..." : `${users.length}명`}
            sub={loading ? "" : `오늘 신규 +${stats?.users.newToday ?? 0}명`}
          />
          <KpiCard
            label="이번 주 신규 가입"
            value={loading ? "..." : `${stats?.users.newThisWeek ?? 0}명`}
            color="text-blue-400"
          />
        </div>
      </div>

      {/* Row 2 - 사용 활성도 */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">활성도</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            label="오늘 총 검색"
            value={loading ? "..." : `${todaySearches}회`}
            sub={
              searchChange !== null
                ? `어제 대비 ${searchChange >= 0 ? "+" : ""}${searchChange}%`
                : "어제 데이터 없음"
            }
            color="text-yellow-400"
          />
          <KpiCard
            label="오늘 활성 유저"
            value={loading ? "..." : `${stats?.searches.activeUsersToday ?? 0}명`}
            sub={loading ? "" : `전체의 ${users.length > 0 ? Math.round(((stats?.searches.activeUsersToday ?? 0) / users.length) * 100) : 0}%`}
          />
          <KpiCard
            label="이번 주 활성 유저"
            value={loading ? "..." : `${stats?.users.activeThisWeek ?? 0}명`}
          />
          <KpiCard
            label="YouTube API 쿼터"
            value={loading ? "..." : `${stats?.youtube.quotaUsedPct ?? 0}%`}
            sub={loading ? "" : `${(stats?.youtube.estimatedUnitsToday ?? 0).toLocaleString()} / 90,000 units`}
            color={
              (stats?.youtube.quotaUsedPct ?? 0) >= 90
                ? "text-red-400"
                : (stats?.youtube.quotaUsedPct ?? 0) >= 70
                ? "text-yellow-400"
                : "text-green-400"
            }
          />
        </div>
      </div>

      {/* 플랜 분포 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">플랜별 사용자 분포</h2>
        {usersLoading ? (
          <div className="text-gray-500 text-sm">로딩 중...</div>
        ) : (
          <div className="space-y-3">
            {["free", "starter", "pro", "business"].map((plan) => {
              const count = planCounts[plan] ?? 0;
              const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ background: PLAN_COLOR[plan] }}
                      />
                      <span className="text-sm text-gray-300 font-medium">{PLAN_LABEL[plan]}</span>
                      {PLAN_PRICE[plan] > 0 && (
                        <span className="text-xs text-gray-600">{formatKRW(PLAN_PRICE[plan])}/월</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{pct}%</span>
                      <span className="text-sm font-bold text-white w-12 text-right">{count}명</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: PLAN_COLOR[plan] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7일 검색 트렌드 */}
      {!statsLoading && stats?.searches.daily && stats.searches.daily.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">최근 7일 검색량</h2>
          <MiniBarChart data={stats.searches.daily} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mini Bar Chart (no external dep)
// ─────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const heightPct = Math.max((d.count / max) * 100, 2);
        const isToday = i === data.length - 1;
        const label = d.date.slice(5); // MM-DD
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500">{d.count}</span>
            <div className="w-full flex items-end" style={{ height: 72 }}>
              <div
                className={`w-full rounded-t-sm transition-all ${isToday ? "bg-teal-500" : "bg-gray-700"}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Users Tab
// ─────────────────────────────────────────────────────────
function UsersTab({
  users,
  filteredUsers,
  loading,
  error,
  search,
  setSearch,
  planFilter,
  setPlanFilter,
  editingPlan,
  setEditingPlan,
  planSaving,
  onPlanSave,
  onRefresh,
}: {
  users: AdminUser[];
  filteredUsers: AdminUser[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (v: string) => void;
  planFilter: string;
  setPlanFilter: (v: string) => void;
  editingPlan: { id: string; plan: string } | null;
  setEditingPlan: (v: { id: string; plan: string } | null) => void;
  planSaving: boolean;
  onPlanSave: (id: string, plan: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-lg font-bold text-white shrink-0">
          사용자 목록{" "}
          {!loading && (
            <span className="text-sm text-gray-500 font-normal">
              ({filteredUsers.length}/{users.length}명)
            </span>
          )}
        </h2>
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="이메일 또는 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">전체 플랜</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
          </select>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition"
          >
            ↻
          </button>
        </div>
      </div>

      {loading && <div className="px-6 py-12 text-center text-gray-500">불러오는 중...</div>}
      {error && <div className="px-6 py-12 text-center text-red-400">오류: {error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="px-6 py-3 text-left">이메일</th>
                <th className="px-6 py-3 text-left">이름</th>
                <th className="px-6 py-3 text-left">플랜</th>
                <th className="px-6 py-3 text-left">가입일</th>
                <th className="px-6 py-3 text-left">마지막 활동</th>
                <th className="px-6 py-3 text-left">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4 text-gray-200 font-medium">{u.email || "-"}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {editingPlan?.id === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingPlan.plan}
                          onChange={(e) => setEditingPlan({ id: u.id, plan: e.target.value })}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        >
                          {["free", "starter", "pro", "business"].map((p) => (
                            <option key={p} value={p}>{PLAN_LABEL[p]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => onPlanSave(u.id, editingPlan.plan)}
                          disabled={planSaving}
                          className="text-xs px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded transition disabled:opacity-50"
                        >
                          {planSaving ? "..." : "저장"}
                        </button>
                        <button
                          onClick={() => setEditingPlan(null)}
                          className="text-xs text-gray-500 hover:text-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          PLAN_BADGE[u.plan] ?? "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {PLAN_LABEL[u.plan] ?? u.plan}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(u.lastActiveAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setEditingPlan({ id: u.id, plan: u.plan })}
                      className="text-xs text-gray-500 hover:text-teal-400 transition"
                    >
                      플랜 변경
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                    {search || planFilter !== "all" ? "검색 결과가 없습니다." : "사용자가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Usage Tab
// ─────────────────────────────────────────────────────────
function UsageTab({
  stats,
  loading,
  error,
  onRefresh,
}: {
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  if (loading) return <div className="text-gray-500 text-sm py-10 text-center">데이터 로딩 중...</div>;
  if (error) return <div className="text-red-400 text-sm py-10 text-center">오류: {error}</div>;
  if (!stats) return null;

  const { searches, youtube, redis } = stats;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 transition"
        >
          ↻ 새로고침
        </button>
      </div>

      {/* 오늘 검색 현황 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">📊 오늘 검색 현황</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-teal-400">{searches.today}</p>
            <p className="text-xs text-gray-500 mt-1">총 검색 횟수</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white">{searches.yesterday}</p>
            <p className="text-xs text-gray-500 mt-1">어제 검색 횟수</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-blue-400">{searches.activeUsersToday}</p>
            <p className="text-xs text-gray-500 mt-1">오늘 활성 유저</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-purple-400">
              {searches.today > 0 && searches.activeUsersToday > 0
                ? (searches.today / searches.activeUsersToday).toFixed(1)
                : "0"}회
            </p>
            <p className="text-xs text-gray-500 mt-1">유저당 평균 검색</p>
          </div>
        </div>

        {/* 플랜별 검색 분포 */}
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">플랜별 검색 분포</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["free", "starter", "pro", "business"].map((plan) => (
            <div key={plan} className="bg-gray-800 rounded-xl p-3 text-center">
              <p
                className="text-lg font-bold"
                style={{ color: PLAN_COLOR[plan] }}
              >
                {searches.byPlan[plan] ?? 0}회
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{PLAN_LABEL[plan]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* YouTube API 쿼터 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">🎬 YouTube Data API v3 쿼터</h2>
        <p className="text-xs text-gray-500 mb-4">Google Cloud Console 기준 하루 10,000 units/key</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">무료 API 키</p>
            <p className="text-xl font-bold text-white">{youtube.freeKeyCount}개</p>
            <p className="text-xs text-gray-600">= {(youtube.freeKeyCount * 10000).toLocaleString()} units/일</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">유료 전용 키</p>
            <p className="text-xl font-bold text-white">{youtube.paidKeyCount}개</p>
            <p className="text-xs text-gray-600">= {(youtube.paidKeyCount * 10000).toLocaleString()} units/일 (유료 유저용)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">검색당 소모 units</p>
            <p className="text-xl font-bold text-white">~{youtube.unitsPerSearch}</p>
            <p className="text-xs text-gray-600">search(100) + videos(1) + channels(4)</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">오늘 예상 사용량</span>
            <span className="text-sm font-bold text-white">
              {youtube.estimatedUnitsToday.toLocaleString()} / {youtube.freeQuota.toLocaleString()} units
            </span>
          </div>
          <ProgressBar pct={youtube.quotaUsedPct} />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">
              일일 처리 가능 검색 수: ~{youtube.capacitySearches.toLocaleString()}회
            </span>
            <span className={`text-xs font-semibold ${youtube.quotaUsedPct >= 90 ? "text-red-400" : youtube.quotaUsedPct >= 70 ? "text-yellow-400" : "text-green-400"}`}>
              {youtube.quotaUsedPct}% 사용
            </span>
          </div>
        </div>

        {youtube.overageCostKRW > 0 && (
          <div className="mt-3 bg-red-900/30 border border-red-800 rounded-xl p-3">
            <p className="text-xs text-red-400">
              ⚠️ 오늘 쿼터 초과 예상 — 추가 과금 예상: {formatKRW(youtube.overageCostKRW)}
            </p>
          </div>
        )}
      </div>

      {/* Redis */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">⚡ Upstash Redis</h2>
        <p className="text-xs text-gray-500 mb-4">무료 플랜: 10,000 commands/일, 256MB 저장</p>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">오늘 추정 명령 수</span>
            <span className="text-sm font-bold text-white">
              ~{redis.estimatedCommandsToday.toLocaleString()} / {redis.freeLimit.toLocaleString()}
            </span>
          </div>
          <ProgressBar pct={redis.usedPct} />
          <p className="text-xs text-gray-600 mt-2">검색 1회당 ~4 Redis ops (INCR, GET, EXPIRE, TTL)</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Costs Tab
// ─────────────────────────────────────────────────────────
function CostsTab({
  stats,
  users,
  loading,
  mrr,
}: {
  stats: StatsData | null;
  users: AdminUser[];
  loading: boolean;
  mrr: number;
}) {
  if (loading) return <div className="text-gray-500 text-sm py-10 text-center">데이터 로딩 중...</div>;

  // 월별 비용 추정 (일별 검색량 기반)
  const dailySearches = stats?.searches.today ?? 0;
  const monthlySearchesEst = dailySearches * 30;

  // YouTube API 월 비용
  const monthlyYouTubeUnits = monthlySearchesEst * (stats?.youtube.unitsPerSearch ?? 105);
  const monthlyFreeQuota = (stats?.youtube.freeKeyCount ?? 9) * 10000 * 30;
  const monthlyOverageUnits = Math.max(0, monthlyYouTubeUnits - monthlyFreeQuota);
  const monthlyYouTubeCostKRW = Math.round((monthlyOverageUnits / 1000) * 5 * 1400);

  // Upstash Redis 월 비용 (무료: 10,000 req/day → 300,000/month)
  const monthlyRedisOps = dailySearches * 4 * 30;
  const monthlyRedisFree = 10000 * 30; // 300,000
  const redisOverage = Math.max(0, monthlyRedisOps - monthlyRedisFree);
  const monthlyRedisCostKRW = Math.round((redisOverage / 100000) * 0.2 * 1400);

  // Clerk 비용 (MAU 기준)
  const mau = users.length;
  const clerkFreeLimit = 10000;
  const monthlyClerkCostKRW = mau > clerkFreeLimit ? 25 * 1400 : 0; // Pro plan $25

  // Vercel 비용 (Hobby = 무료, 하지만 제한 있음)
  const monthlyVercelCostKRW = 0; // 현재 무료

  // 총 비용
  const totalMonthlyCostKRW =
    monthlyYouTubeCostKRW + monthlyRedisCostKRW + monthlyClerkCostKRW + monthlyVercelCostKRW;

  // 순이익
  const netProfit = mrr - totalMonthlyCostKRW;

  const services = [
    {
      name: "YouTube Data API v3",
      provider: "Google Cloud",
      icon: "🎬",
      plan: "무료 (10,000 units/key/일)",
      freeLimit: `${((stats?.youtube.freeKeyCount ?? 9) * 10000).toLocaleString()} units/일`,
      currentUsage: `~${(stats?.youtube.estimatedUnitsToday ?? 0).toLocaleString()} units/일 (${stats?.youtube.quotaUsedPct ?? 0}%)`,
      monthlyProjection: `~${monthlyYouTubeUnits.toLocaleString()} units`,
      monthlyCost: monthlyYouTubeCostKRW,
      usedPct: stats?.youtube.quotaUsedPct ?? 0,
      note:
        monthlyOverageUnits > 0
          ? `초과 ${monthlyOverageUnits.toLocaleString()} units → ${formatKRW(monthlyYouTubeCostKRW)}`
          : "무료 쿼터 이내 ✓",
      noteColor: monthlyOverageUnits > 0 ? "text-red-400" : "text-green-400",
    },
    {
      name: "Upstash Redis",
      provider: "Upstash",
      icon: "⚡",
      plan: "Free (10,000 req/일, 256MB)",
      freeLimit: "300,000 req/월",
      currentUsage: `~${(stats?.redis.estimatedCommandsToday ?? 0).toLocaleString()} req/일 (${stats?.redis.usedPct ?? 0}%)`,
      monthlyProjection: `~${monthlyRedisOps.toLocaleString()} req`,
      monthlyCost: monthlyRedisCostKRW,
      usedPct: stats?.redis.usedPct ?? 0,
      note: redisOverage > 0 ? `초과 ${redisOverage.toLocaleString()} req` : "무료 한도 이내 ✓",
      noteColor: redisOverage > 0 ? "text-red-400" : "text-green-400",
    },
    {
      name: "Clerk Auth",
      provider: "Clerk",
      icon: "🔑",
      plan: "Free (10,000 MAU)",
      freeLimit: "10,000 MAU",
      currentUsage: `${mau}명 (${stats?.clerk.usedPct ?? 0}%)`,
      monthlyProjection: `${mau}명 MAU`,
      monthlyCost: monthlyClerkCostKRW,
      usedPct: stats?.clerk.usedPct ?? 0,
      note: mau > clerkFreeLimit ? `한도 초과 → Pro $25/월` : "무료 한도 이내 ✓",
      noteColor: mau > clerkFreeLimit ? "text-red-400" : "text-green-400",
    },
    {
      name: "Vercel",
      provider: "Vercel",
      icon: "▲",
      plan: "Hobby (무료)",
      freeLimit: "100GB BW, 100K func/일",
      currentUsage: "실시간 측정 불가",
      monthlyProjection: "-",
      monthlyCost: monthlyVercelCostKRW,
      usedPct: 0,
      note: "Hobby 플랜 사용 중 ✓",
      noteColor: "text-green-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 수익성 요약 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">월 매출 (MRR)</p>
          <p className="text-2xl font-extrabold text-teal-400">{formatKRW(mrr)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">월 서비스 비용 (추정)</p>
          <p className="text-2xl font-extrabold text-red-400">
            {totalMonthlyCostKRW === 0 ? "₩0 (전액 무료)" : formatKRW(totalMonthlyCostKRW)}
          </p>
        </div>
        <div className={`bg-gray-900 border rounded-2xl p-5 ${netProfit >= 0 ? "border-teal-800" : "border-red-800"}`}>
          <p className="text-xs text-gray-500 mb-1">월 순이익 (추정)</p>
          <p className={`text-2xl font-extrabold ${netProfit >= 0 ? "text-purple-400" : "text-red-400"}`}>
            {formatKRW(netProfit)}
          </p>
          {mrr > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              마진율 {Math.round((netProfit / mrr) * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* 서비스별 비용 상세 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">서비스별 비용 현황</h2>
          <p className="text-xs text-gray-500 mt-0.5">오늘 사용량 기준 월별 추정 비용</p>
        </div>
        <div className="divide-y divide-gray-800">
          {services.map((s) => (
            <div key={s.name} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{s.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{s.name}</p>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                        {s.provider}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.plan}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${s.monthlyCost === 0 ? "text-green-400" : "text-red-400"}`}>
                    {s.monthlyCost === 0 ? "₩0 / 월" : formatKRW(s.monthlyCost) + " / 월"}
                  </p>
                  <p className={`text-xs mt-0.5 ${s.noteColor}`}>{s.note}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-600">무료 한도</p>
                  <p className="text-gray-300 mt-0.5">{s.freeLimit}</p>
                </div>
                <div>
                  <p className="text-gray-600">오늘 사용량</p>
                  <p className="text-gray-300 mt-0.5">{s.currentUsage}</p>
                </div>
                <div>
                  <p className="text-gray-600">월 예상 사용량</p>
                  <p className="text-gray-300 mt-0.5">{s.monthlyProjection}</p>
                </div>
              </div>

              {s.usedPct > 0 && (
                <div className="mt-2">
                  <ProgressBar pct={s.usedPct} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 합계 */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-white">월 총 서비스 비용</p>
            <p className="text-xs text-gray-500 mt-0.5">오늘 사용량 기준 30일 추정</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-extrabold text-white">
              {totalMonthlyCostKRW === 0 ? "₩0" : formatKRW(totalMonthlyCostKRW)}
            </p>
            {totalMonthlyCostKRW === 0 && (
              <p className="text-xs text-green-400 mt-0.5">모든 서비스 무료 한도 이내 🎉</p>
            )}
          </div>
        </div>
      </div>

      {/* 비용 절감 팁 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-3">💡 비용 관리 가이드</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex gap-2">
            <span className="text-yellow-400 shrink-0">•</span>
            <span>
              <strong className="text-white">YouTube API:</strong> 현재 {stats?.youtube.freeKeyCount ?? 9}개 키 운용 중.
              일 {stats?.youtube.capacitySearches ?? 0}회 이상 검색 시 추가 키가 필요합니다.
              키 1개 추가 시 {Math.floor(10000 / (stats?.youtube.unitsPerSearch ?? 105))}회 더 처리 가능.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-400 shrink-0">•</span>
            <span>
              <strong className="text-white">Redis:</strong> 현재 무료 10,000 req/일 한도.
              일 검색 2,500회 이상 시 Upstash Pay-As-You-Go로 전환 권장.
              100,000 req당 약 ₩280.
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-teal-400 shrink-0">•</span>
            <span>
              <strong className="text-white">Clerk:</strong> MAU {mau}명 / 10,000명.
              {mau < 8000
                ? ` 여유 ${(10000 - mau).toLocaleString()}명. 한동안 무료로 사용 가능.`
                : " 한도 근접! Pro 플랜 전환 준비 필요 ($25/월)."}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-400 shrink-0">•</span>
            <span>
              <strong className="text-white">Vercel:</strong> Hobby 플랜 무료.
              트래픽 증가 시 Pro ($20/월)로 전환하면 무제한 대역폭 + 팀 기능 지원.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
