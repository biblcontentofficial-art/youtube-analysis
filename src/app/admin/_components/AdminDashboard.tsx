"use client";

import { useEffect, useState } from "react";
import type { AdminUser } from "@/app/api/admin/users/route";

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

function formatDate(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setUsers(data.users ?? []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = users.length;
  const payingUsers = users.filter((u) => u.plan !== "free").length;
  const mrr = users.reduce((sum, u) => sum + (PLAN_PRICE[u.plan] ?? 0), 0);

  const planCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.plan] = (acc[u.plan] ?? 0) + 1;
    return acc;
  }, {});

  const filteredUsers = users.filter((u) => {
    const matchesPlan = planFilter === "all" || u.plan === planFilter;
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase());
    return matchesPlan && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">전체 사용자</p>
          <p className="text-3xl font-extrabold text-white">
            {loading ? "..." : totalUsers.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">유료 사용자</p>
          <p className="text-3xl font-extrabold text-teal-400">
            {loading ? "..." : payingUsers.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">월 예상 매출 (MRR)</p>
          <p className="text-2xl font-extrabold text-purple-400">
            {loading ? "..." : `₩${mrr.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-2">플랜별 분포</p>
          {loading ? (
            <p className="text-gray-500 text-sm">...</p>
          ) : (
            <div className="space-y-1 text-xs">
              {["starter", "pro", "business"].map((p) => (
                <div key={p} className="flex justify-between">
                  <span className="text-gray-400 capitalize">{p}</span>
                  <span className="text-white font-semibold">{planCounts[p] ?? 0}명</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg font-bold text-white shrink-0">
            사용자 목록 {!loading && <span className="text-sm text-gray-500 font-normal">({filteredUsers.length}/{totalUsers}명)</span>}
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
          </div>
        </div>

        {loading && (
          <div className="px-6 py-12 text-center text-gray-500">불러오는 중...</div>
        )}
        {error && (
          <div className="px-6 py-12 text-center text-red-400">오류: {error}</div>
        )}
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
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          PLAN_BADGE[u.plan] ?? "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(u.lastActiveAt)}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                      {search || planFilter !== "all" ? "검색 결과가 없습니다." : "사용자가 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
