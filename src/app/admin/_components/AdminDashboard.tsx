"use client";

import { useEffect, useState } from "react";
import type { AdminUser } from "@/app/api/admin/users/route";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-700 text-gray-300",
  starter: "bg-blue-900 text-blue-300",
  pro: "bg-teal-900 text-teal-300",
  business: "bg-purple-900 text-purple-300",
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

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-500 text-sm mb-1">전체 사용자</p>
          <p className="text-3xl font-extrabold text-white">
            {loading ? "..." : totalUsers.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-500 text-sm mb-1">유료 사용자</p>
          <p className="text-3xl font-extrabold text-teal-400">
            {loading ? "..." : payingUsers.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-500 text-sm mb-1">오늘 수익 추정</p>
          <p className="text-3xl font-extrabold text-purple-400">
            {loading
              ? "..."
              : "집계 중"}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">사용자 목록</h2>
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
                {users.map((u) => (
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
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                      사용자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">최근 활동</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
              <span>활동 로그 준비 중...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
