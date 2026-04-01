"use client";

import ThreadsLogo from "./ThreadsLogo";

interface Props {
  username?: string;
}

export default function ConnectMetaButton({ username }: Props) {
  async function handleDisconnect() {
    if (!confirm(`@${username} 연결을 해제할까요?`)) return;
    await fetch("/api/threads/disconnect", { method: "DELETE" });
    window.location.reload();
  }

  if (username) {
    return (
      <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
          <ThreadsLogo className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">연결된 계정</p>
          <p className="text-sm text-white font-medium">@{username}</p>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-500 hover:text-red-400 transition px-2 py-1"
        >
          연결 해제
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-black border border-gray-700 flex items-center justify-center mx-auto mb-3">
        <ThreadsLogo className="w-7 h-7 text-white" />
      </div>
      <p className="text-sm text-white font-medium mb-1">Meta 계정 연결 필요</p>
      <p className="text-xs text-gray-400 mb-4">
        Threads 데이터를 분석하려면 본인의 Meta(Threads) 계정을 연결해야 합니다.
      </p>
      <a
        href="/api/threads/auth"
        className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-black text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        <ThreadsLogo className="w-4 h-4 text-black" />
        Threads로 연결하기
      </a>
    </div>
  );
}
