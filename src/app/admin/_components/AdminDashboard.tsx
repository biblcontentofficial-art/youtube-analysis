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
    usageMap: Record<string, number>;
  };
  youtube: {
    estimatedUnitsToday: number;
    isActualUnits: boolean;     // true = 실측, false = 추정
    ytSearchCalls: number;
    ytVideosCalls: number;
    ytChannelsCalls: number;
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
    cacheHits: number;
    cacheMisses: number;
    cacheSets: number;
    cacheHitRate: number;
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
  admin: "bg-red-900 text-red-300 border border-red-700",
  team: "bg-orange-900 text-orange-300 border border-orange-700",
};

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  starter: 49000,
  pro: 199000,
  business: 490000,
  admin: 0,  // 매출 집계 제외
  team: 0,   // 팀비블 — 매출 집계 제외
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  admin: "Admin",
  team: "팀비블",
};

const PLAN_COLOR: Record<string, string> = {
  free: "#6b7280",
  starter: "#3b82f6",
  pro: "#14b8a6",
  business: "#a855f7",
  admin: "#ef4444",
  team: "#f97316",
};

type Tab = "overview" | "users" | "usage" | "costs" | "traffic";

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
  const [usageResetting, setUsageResetting] = useState<string | null>(null);

  // ── 환불 관리 상태 ──
  interface PaymentRecord {
    id: string;
    user_id: string;
    plan: string;
    amount: number;
    order_id: string;
    payment_key: string | null;
    status: "success" | "failed" | "cancelled";
    paid_at: string;
  }
  const [refundUser, setRefundUser] = useState<{ id: string; email: string } | null>(null);
  const [userPayments, setUserPayments] = useState<PaymentRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState<string | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<{ paymentKey: string; amount: number; orderId: string } | null>(null);
  const [refundReason, setRefundReason] = useState("");

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

  const handleResetUsage = async (userId: string, plan = "free") => {
    setUsageResetting(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error("Failed");
      // Optimistically update the stats usageMap
      setStats((prev) =>
        prev
          ? {
              ...prev,
              searches: {
                ...prev.searches,
                usageMap: { ...prev.searches.usageMap, [userId]: 0 },
              },
            }
          : prev
      );
    } catch {
      alert("초기화에 실패했습니다.");
    } finally {
      setUsageResetting(null);
    }
  };

  // ── 환불 관리 핸들러 ──
  const handleShowPayments = async (userId: string, email: string) => {
    setRefundUser({ id: userId, email });
    setPaymentsLoading(true);
    setUserPayments([]);
    try {
      const res = await fetch(`/api/admin/users/${userId}/payments`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUserPayments(data.payments ?? []);
    } catch {
      alert("결제 이력 조회에 실패했습니다.");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundUser || !refundConfirm || !refundReason.trim()) return;
    setRefundProcessing(refundConfirm.paymentKey);
    try {
      const res = await fetch(`/api/admin/users/${refundUser.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey: refundConfirm.paymentKey,
          cancelReason: refundReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`환불 실패: ${data.error || "알 수 없는 에러"}`);
        return;
      }
      alert(`환불 완료: ₩${(data.cancelData?.cancelAmount ?? refundConfirm.amount).toLocaleString()}`);
      // 결제 이력 새로고침
      handleShowPayments(refundUser.id, refundUser.email);
      // 사용자 목록 새로고침 (플랜 변경 반영)
      fetchUsers();
      setRefundConfirm(null);
      setRefundReason("");
    } catch {
      alert("환불 처리 중 오류가 발생했습니다.");
    } finally {
      setRefundProcessing(null);
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

  // admin·team 플랜은 매출 집계에서 제외
  const FREE_PLANS = new Set(["free", "admin", "team"]);
  const mrr = users.reduce((s, u) => s + (FREE_PLANS.has(u.plan) ? 0 : (PLAN_PRICE[u.plan] ?? 0)), 0);
  const payingUsers = users.filter((u) => !FREE_PLANS.has(u.plan)).length;
  const planCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.plan] = (acc[u.plan] ?? 0) + 1;
    return acc;
  }, {});

  const TAB_ICONS: Record<Tab, React.ReactNode> = {
    overview: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    users: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    usage: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    costs: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    traffic: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 12h4l3-9 4 18 3-9h4"/>
      </svg>
    ),
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "개요" },
    { id: "users", label: "사용자" },
    { id: "usage", label: "사용량" },
    { id: "costs", label: "비용 분석" },
    { id: "traffic", label: "트래픽 분석" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {TAB_ICONS[t.id]}
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
          usageMap={stats?.searches.usageMap ?? {}}
          usageResetting={usageResetting}
          onResetUsage={handleResetUsage}
          onShowPayments={handleShowPayments}
        />
      )}

      {/* ── 환불 관리 모달 ── */}
      {refundUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setRefundUser(null); setRefundConfirm(null); setRefundReason(""); }}>
          <div className="bg-[#161b27] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="text-white font-semibold">{refundUser.email} 결제 이력</h3>
              <button onClick={() => { setRefundUser(null); setRefundConfirm(null); setRefundReason(""); }} className="text-gray-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              {paymentsLoading ? (
                <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-gray-600 border-t-teal-400 rounded-full animate-spin" /></div>
              ) : userPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">결제 이력이 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800">
                      <th className="px-3 py-2 text-left">날짜</th>
                      <th className="px-3 py-2 text-left">플랜</th>
                      <th className="px-3 py-2 text-right">금액</th>
                      <th className="px-3 py-2 text-left">상태</th>
                      <th className="px-3 py-2 text-right">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPayments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-800/50">
                        <td className="px-3 py-3 text-gray-400">{new Date(p.paid_at).toLocaleDateString("ko-KR")}</td>
                        <td className="px-3 py-3 text-white">{p.plan}</td>
                        <td className="px-3 py-3 text-right text-white">₩{p.amount.toLocaleString()}</td>
                        <td className="px-3 py-3">
                          {p.status === "success" && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-700/50">결제 완료</span>}
                          {p.status === "cancelled" && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">환불 완료</span>}
                          {p.status === "failed" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-700/50">실패</span>}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {p.status === "success" && p.payment_key && (
                            <button
                              onClick={() => { setRefundConfirm({ paymentKey: p.payment_key!, amount: p.amount, orderId: p.order_id }); setRefundReason(""); }}
                              disabled={!!refundProcessing}
                              className="text-xs px-3 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-400 hover:text-red-300 rounded-lg transition disabled:opacity-50"
                            >
                              환불
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 환불 확인 다이얼로그 ── */}
      {refundConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setRefundConfirm(null)}>
          <div className="bg-[#1a2030] border border-gray-700 rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white font-semibold mb-2">환불 확인</h4>
            <p className="text-gray-400 text-sm mb-4">
              ₩{refundConfirm.amount.toLocaleString()}을 환불하시겠습니까?<br />
              <span className="text-xs text-gray-600">주문번호: {refundConfirm.orderId}</span>
            </p>
            <input
              type="text"
              placeholder="환불 사유 (필수)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRefundConfirm(null)}
                className="flex-1 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800 transition"
              >
                취소
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim() || !!refundProcessing}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1"
              >
                {refundProcessing ? (
                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />처리 중</>
                ) : "환불 처리"}
              </button>
            </div>
          </div>
        </div>
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

      {/* ── TRAFFIC TAB ──────────────────────────────────────── */}
      {activeTab === "traffic" && <TrafficTab />}
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
            {["free", "team", "starter", "pro", "business", "admin"].map((plan) => {
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
  usageMap,
  usageResetting,
  onResetUsage,
  onShowPayments,
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
  usageMap: Record<string, number>;
  usageResetting: string | null;
  onResetUsage: (id: string, plan?: string) => void;
  onShowPayments?: (id: string, email: string) => void;
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
            <option value="team">팀비블</option>
            <option value="admin">Admin</option>
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
                <th className="px-6 py-3 text-left">사용량</th>
                <th className="px-6 py-3 text-left">가입일</th>
                <th className="px-6 py-3 text-left">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((u) => {
                const usageCount = usageMap[u.id] ?? 0;
                const isMonthlyPlan = ["starter", "pro", "business", "admin", "team"].includes(u.plan);
                const usageLabel = isMonthlyPlan ? "이번달" : "오늘";
                const isResetting = usageResetting === u.id;
                return (
                  <tr key={u.id} className={`hover:bg-gray-800/50 transition ${u.migrated === false ? "opacity-60" : ""}`}>
                    <td className="px-6 py-4 font-medium">
                      <span className={u.migrated === false ? "text-gray-500" : "text-gray-200"}>
                        {u.email || "-"}
                      </span>
                      {u.migrated === false && (
                        <span className="ml-2 text-[10px] text-gray-600 border border-gray-700 rounded px-1 py-0.5">미전환</span>
                      )}
                    </td>
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
                            {["free", "team", "starter", "pro", "business", "admin"].map((p) => (
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
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${usageCount > 0 ? "text-yellow-400" : "text-gray-600"}`}>
                        {usageCount}회
                      </span>
                      <span className="ml-1 text-[10px] text-gray-600">{usageLabel}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingPlan({ id: u.id, plan: u.plan })}
                          className="text-xs text-gray-500 hover:text-teal-400 transition"
                        >
                          플랜 변경
                        </button>
                        {usageCount > 0 && (
                          <button
                            onClick={() => onResetUsage(u.id, u.plan)}
                            disabled={isResetting}
                            title={`${usageLabel} 검색 횟수 초기화`}
                            className="flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-900/50 hover:bg-orange-800/60 border border-orange-700/50 text-orange-400 hover:text-orange-300 rounded transition disabled:opacity-50"
                          >
                            {isResetting ? "..." : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                </svg>
                                초기화
                              </>
                            )}
                          </button>
                        )}
                        {["starter", "pro", "business"].includes(u.plan) && onShowPayments && (
                          <button
                            onClick={() => onShowPayments(u.id, u.email)}
                            className="text-xs text-gray-500 hover:text-red-400 transition"
                          >
                            환불 관리
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
        <h2 className="text-sm font-semibold text-white mb-4">오늘 검색 현황</h2>
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
        <h2 className="text-sm font-semibold text-white mb-1">YouTube Data API v3 쿼터</h2>
        <p className="text-xs text-gray-500 mb-4">Google Cloud Console 기준 하루 10,000 units/key</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">무료 API 키</p>
            <p className="text-xl font-bold text-white">{youtube.freeKeyCount}개</p>
            <p className="text-xs text-gray-600">= {(youtube.freeKeyCount * 10000).toLocaleString()} units/일</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">유료 전용 키</p>
            <p className="text-xl font-bold text-white">{youtube.paidKeyCount}개</p>
            <p className="text-xs text-gray-600">= {(youtube.paidKeyCount * 10000).toLocaleString()} units/일</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">오늘 API 호출</p>
            <p className="text-xl font-bold text-yellow-400">
              {(youtube.ytSearchCalls ?? 0) + (youtube.ytVideosCalls ?? 0) + (youtube.ytChannelsCalls ?? 0)}회
            </p>
            <p className="text-xs text-gray-600">
              search×{youtube.ytSearchCalls ?? 0} / vid×{youtube.ytVideosCalls ?? 0} / ch×{youtube.ytChannelsCalls ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">측정 방식</p>
            <p className={`text-sm font-bold ${youtube.isActualUnits ? "text-green-400" : "text-amber-400"}`}>
              {youtube.isActualUnits ? "실측" : "추정"}
            </p>
            <p className="text-xs text-gray-600">{youtube.isActualUnits ? "API 호출마다 기록" : "검색 수 × 102 추정"}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">
              오늘 {youtube.isActualUnits ? "실측" : "추정"} 사용량
            </span>
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
        <h2 className="text-sm font-semibold text-white mb-1">Upstash Redis</h2>
        <p className="text-xs text-gray-500 mb-4">무료 플랜: 10,000 commands/일, 256MB 저장</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">캐시 히트</p>
            <p className="text-xl font-bold text-green-400">{redis.cacheHits.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">캐시 미스</p>
            <p className="text-xl font-bold text-orange-400">{redis.cacheMisses.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">캐시 히트율</p>
            <p className={`text-xl font-bold ${redis.cacheHitRate >= 60 ? "text-green-400" : redis.cacheHitRate >= 30 ? "text-yellow-400" : "text-red-400"}`}>
              {(redis.cacheHits + redis.cacheMisses) > 0 ? `${redis.cacheHitRate}%` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">캐시 쓰기</p>
            <p className="text-xl font-bold text-blue-400">{redis.cacheSets.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">
              오늘 {(redis.cacheHits + redis.cacheMisses) > 0 ? "실측" : "추정"} 명령 수
            </span>
            <span className="text-sm font-bold text-white">
              {redis.estimatedCommandsToday.toLocaleString()} / {redis.freeLimit.toLocaleString()}
            </span>
          </div>
          <ProgressBar pct={redis.usedPct} />
          <p className="text-xs text-gray-600 mt-2">
            {(redis.cacheHits + redis.cacheMisses) > 0
              ? `캐시 히트/미스 기록 기반 실측 (히트율 ${redis.cacheHitRate}%)`
              : "검색 횟수 기반 추정 (실측 데이터 없음)"}
          </p>
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

  // 서비스 아이콘 SVG
  const SVC_ICONS: Record<string, React.ReactNode> = {
    youtube: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
      </svg>
    ),
    redis: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    clerk: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-400">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    ),
    vercel: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
        <path d="M12 2L2 19.7778h20L12 2z"/>
      </svg>
    ),
  };

  const services = [
    {
      name: "YouTube Data API v3",
      provider: "Google Cloud",
      iconKey: "youtube",
      plan: "무료 (10,000 units/key/일)",
      freeLimit: `${((stats?.youtube.freeKeyCount ?? 9) * 10000).toLocaleString()} units/일`,
      currentUsage: stats?.youtube.isActualUnits
        ? `${(stats.youtube.estimatedUnitsToday).toLocaleString()} units (실측 · search×${stats.youtube.ytSearchCalls} / videos×${stats.youtube.ytVideosCalls} / ch×${stats.youtube.ytChannelsCalls})`
        : `~${(stats?.youtube.estimatedUnitsToday ?? 0).toLocaleString()} units (추정 · ${stats?.youtube.quotaUsedPct ?? 0}%)`,
      monthlyProjection: `~${monthlyYouTubeUnits.toLocaleString()} units`,
      monthlyCost: monthlyYouTubeCostKRW,
      usedPct: stats?.youtube.quotaUsedPct ?? 0,
      note:
        monthlyOverageUnits > 0
          ? `초과 ${monthlyOverageUnits.toLocaleString()} units → ${formatKRW(monthlyYouTubeCostKRW)}`
          : "무료 쿼터 이내",
      noteColor: monthlyOverageUnits > 0 ? "text-red-400" : "text-green-400",
    },
    {
      name: "Upstash Redis",
      provider: "Upstash",
      iconKey: "redis",
      plan: "Free (10,000 req/일, 256MB)",
      freeLimit: "300,000 req/월",
      currentUsage: (stats?.redis.cacheHits ?? 0) + (stats?.redis.cacheMisses ?? 0) > 0
        ? `${(stats?.redis.estimatedCommandsToday ?? 0).toLocaleString()} req (실측 · 히트율 ${stats?.redis.cacheHitRate ?? 0}%)`
        : `~${(stats?.redis.estimatedCommandsToday ?? 0).toLocaleString()} req (추정 · ${stats?.redis.usedPct ?? 0}%)`,
      monthlyProjection: `~${monthlyRedisOps.toLocaleString()} req`,
      monthlyCost: monthlyRedisCostKRW,
      usedPct: stats?.redis.usedPct ?? 0,
      note: redisOverage > 0 ? `초과 ${redisOverage.toLocaleString()} req` : "무료 한도 이내",
      noteColor: redisOverage > 0 ? "text-red-400" : "text-green-400",
    },
    {
      name: "Clerk Auth",
      provider: "Clerk",
      iconKey: "clerk",
      plan: "Free (10,000 MAU)",
      freeLimit: "10,000 MAU",
      currentUsage: `${mau}명 (${stats?.clerk.usedPct ?? 0}%)`,
      monthlyProjection: `${mau}명 MAU`,
      monthlyCost: monthlyClerkCostKRW,
      usedPct: stats?.clerk.usedPct ?? 0,
      note: mau > clerkFreeLimit ? `한도 초과 → Pro $25/월` : "무료 한도 이내",
      noteColor: mau > clerkFreeLimit ? "text-red-400" : "text-green-400",
    },
    {
      name: "Vercel",
      provider: "Vercel",
      iconKey: "vercel",
      plan: "Hobby (무료)",
      freeLimit: "100GB BW, 100K func/일",
      currentUsage: "실시간 측정 불가",
      monthlyProjection: "-",
      monthlyCost: monthlyVercelCostKRW,
      usedPct: 0,
      note: "Hobby 플랜 사용 중",
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
                  <span className="shrink-0">{SVC_ICONS[s.iconKey]}</span>
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
              <p className="text-xs text-green-400 mt-0.5">모든 서비스 무료 한도 이내</p>
            )}
          </div>
        </div>
      </div>

      {/* 비용 절감 팁 */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-400">
            <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
          <h2 className="text-sm font-semibold text-white">비용 관리 가이드</h2>
        </div>
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

// ─────────────────────────────────────────────────────────
// Traffic Tab
// ─────────────────────────────────────────────────────────
interface TrafficData {
  totalByPage: Record<string, number>;
  sourceByPage: Record<string, Record<string, number>>;
  dailyChart: { date: string; tmkstudio: number; teambibl: number }[];
  recent: { page: string; source: string; referrer: string | null; visited_at: string }[];
  total: number;
}

const TRAFFIC_PAGE_LABELS: Record<string, string> = {
  tmkstudio: "TMK STUDIO (/tmkstudio)",
  teambibl: "팀비블 (/teambibl)",
};

const TRAFFIC_SOURCE_COLORS: Record<string, string> = {
  direct: "bg-gray-500",
  google: "bg-blue-500",
  instagram: "bg-pink-500",
  kakao: "bg-yellow-400",
  naver: "bg-green-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-700",
  twitter: "bg-sky-400",
  threads: "bg-purple-500",
  other: "bg-gray-400",
};

function TrafficSourceBar({ sources }: { sources: Record<string, number> }) {
  const total = Object.values(sources).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-gray-500 text-sm">데이터 없음</p>;
  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-2">
      {sorted.map(([source, count]) => (
        <div key={source} className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TRAFFIC_SOURCE_COLORS[source] ?? "bg-gray-400"}`} />
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-0.5">
              <span className="text-gray-300 capitalize">{source}</span>
              <span className="text-gray-400">{count}회 ({Math.round((count / total) * 100)}%)</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${TRAFFIC_SOURCE_COLORS[source] ?? "bg-gray-400"}`}
                style={{ width: `${(count / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrafficDailyChart({ data }: { data: TrafficData["dailyChart"] }) {
  const max = Math.max(...data.flatMap((d) => [d.tmkstudio, d.teambibl]), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 h-32 min-w-max px-1">
        {data.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-0.5 w-12">
            <div className="flex items-end gap-0.5 h-24 w-full">
              <div
                className="flex-1 bg-teal-500/70 rounded-t transition-all"
                style={{ height: `${(d.tmkstudio / max) * 100}%`, minHeight: d.tmkstudio > 0 ? "4px" : "0" }}
                title={`tmkstudio: ${d.tmkstudio}`}
              />
              <div
                className="flex-1 bg-purple-500/70 rounded-t transition-all"
                style={{ height: `${(d.teambibl / max) * 100}%`, minHeight: d.teambibl > 0 ? "4px" : "0" }}
                title={`teambibl: ${d.teambibl}`}
              />
            </div>
            <span className="text-[9px] text-gray-600 whitespace-nowrap">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-500/70 inline-block" />tmkstudio</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500/70 inline-block" />teambibl</span>
      </div>
    </div>
  );
}

function TrafficTab() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/traffic")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 py-8 text-center">로딩 중...</div>;
  if (error) return <div className="text-red-400 py-8 text-center">{error}</div>;
  if (!data) return null;

  const pages = ["tmkstudio", "teambibl"];

  return (
    <div className="space-y-6">
      <p className="text-gray-500 text-sm">최근 30일 · 총 {data.total}건</p>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pages.map((page) => (
          <div key={page} className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
            <p className="text-xs text-gray-500 mb-1">{page === "tmkstudio" ? "TMK STUDIO" : "팀비블"}</p>
            <p className="text-3xl font-black text-white">{data.totalByPage[page] ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">방문</p>
          </div>
        ))}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
          <p className="text-xs text-gray-500 mb-1">오늘</p>
          <p className="text-3xl font-black text-teal-400">
            {(data.dailyChart.at(-1)?.tmkstudio ?? 0) + (data.dailyChart.at(-1)?.teambibl ?? 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">총 방문</p>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
          <p className="text-xs text-gray-500 mb-1">어제</p>
          <p className="text-3xl font-black text-gray-300">
            {(data.dailyChart.at(-2)?.tmkstudio ?? 0) + (data.dailyChart.at(-2)?.teambibl ?? 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">총 방문</p>
        </div>
      </div>

      {/* 일별 차트 */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-base font-semibold mb-5">최근 14일 방문 추이</h2>
        <TrafficDailyChart data={data.dailyChart} />
      </div>

      {/* 트래픽 소스 (페이지별) */}
      <div className="grid md:grid-cols-2 gap-5">
        {pages.map((page) => (
          <div key={page} className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
            <h2 className="text-base font-semibold mb-1">{TRAFFIC_PAGE_LABELS[page]}</h2>
            <p className="text-xs text-gray-500 mb-5">총 {data.totalByPage[page] ?? 0}회 방문</p>
            <TrafficSourceBar sources={data.sourceByPage[page] ?? {}} />
          </div>
        ))}
      </div>

      {/* 최근 방문 목록 */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold">최근 방문 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="text-left px-6 py-3">페이지</th>
                <th className="text-left px-6 py-3">소스</th>
                <th className="text-left px-6 py-3">레퍼러</th>
                <th className="text-left px-6 py-3">시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {data.recent.map((r, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition">
                  <td className="px-6 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.page === "tmkstudio" ? "bg-teal-950 text-teal-400" : "bg-purple-950 text-purple-400"}`}>
                      {r.page}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${TRAFFIC_SOURCE_COLORS[r.source] ?? "bg-gray-400"}`} />
                      {r.source}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">{r.referrer ?? "-"}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.visited_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                  </td>
                </tr>
              ))}
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-600">아직 방문 데이터가 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
